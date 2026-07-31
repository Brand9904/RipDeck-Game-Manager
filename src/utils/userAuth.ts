import { UserProfile, UserRole } from '../types';
import { syncUserToCloud } from './firebaseSync';

const ALL_USERS_KEY = 'ripdeck_all_users_v2';
const CURRENT_USER_KEY = 'ripdeck_current_user_v2';

// Legacy keys to purge premade accounts
const LEGACY_USERS_KEY = 'ripdeck_all_users_v1';
const LEGACY_CURRENT_KEY = 'ripdeck_current_user_v1';

// Purge legacy premade accounts from older storage
try {
  localStorage.removeItem(LEGACY_USERS_KEY);
  localStorage.removeItem(LEGACY_CURRENT_KEY);
} catch (e) {
  // ignore
}

// Dedicated Admin Account Specification
const DEDICATED_ADMIN: UserProfile = {
  id: 'usr_admin_brandon',
  username: 'brandonshaunwilliams',
  displayName: 'Brandon',
  nickname: 'Master Admin',
  aboutMe: 'Chief System Administrator & RipDeck Developer.',
  email: 'brandonshaunwilliams@proton.me',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  role: 'admin',
  linkedDrivePath: 'D:\\Games\\SteamRIP',
  password: 'Forgetmenot4#!',
  createdAt: '2026-07-31T00:00:00.000Z',
};

export function getAllUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(ALL_USERS_KEY);
    let users: UserProfile[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        users = parsed;
      }
    }

    // Filter out legacy dummy users if present
    users = users.filter(
      (u: UserProfile) => u.id !== 'usr_admin' && u.id !== 'usr_gamer1' && u.id !== 'usr_gamer2'
    );

    // Ensure dedicated admin account exists and is synced with correct credentials
    const adminIndex = users.findIndex(
      (u) => u.email.toLowerCase() === DEDICATED_ADMIN.email.toLowerCase() || u.id === DEDICATED_ADMIN.id
    );

    if (adminIndex === -1) {
      // Add dedicated admin at beginning
      users.unshift(DEDICATED_ADMIN);
    } else {
      // Enforce dedicated admin credentials & role
      users[adminIndex] = {
        ...users[adminIndex],
        id: DEDICATED_ADMIN.id,
        email: DEDICATED_ADMIN.email,
        role: 'admin',
        password: DEDICATED_ADMIN.password,
        displayName: users[adminIndex].displayName || DEDICATED_ADMIN.displayName,
      };
    }

    // Ensure NO OTHER user has role === 'admin'
    users = users.map((u) => {
      if (u.email.toLowerCase() !== DEDICATED_ADMIN.email.toLowerCase() && u.role === 'admin') {
        return { ...u, role: 'user' as UserRole };
      }
      return u;
    });

    saveAllUsers(users);
    return users;
  } catch (e) {
    console.error('Error loading users:', e);
    return [DEDICATED_ADMIN];
  }
}

export function saveAllUsers(users: UserProfile[]): void {
  try {
    localStorage.setItem(ALL_USERS_KEY, JSON.stringify(users));
    // Sync each user to Firestore Cloud Database
    users.forEach((u) => {
      syncUserToCloud(u);
    });
  } catch (e) {
    console.error('Error saving users:', e);
  }
}

export function hasAdminAccount(): boolean {
  return true; // The dedicated admin account always exists
}

export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    const users = getAllUsers();
    if (raw) {
      const parsed = JSON.parse(raw) as UserProfile;
      const fresh = users.find((u) => u.id === parsed.id || u.email.toLowerCase() === parsed.email?.toLowerCase());
      if (fresh) return fresh;
    }
    // Default to the dedicated admin user if no current user logged in
    if (users.length > 0) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(users[0]));
      return users[0];
    }
    return null;
  } catch (e) {
    return null;
  }
}

export function setCurrentUser(user: UserProfile | null): void {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      localStorage.setItem('steamrip_linked_drive_path', user.linkedDrivePath);
      syncUserToCloud(user);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (e) {
    console.error('Error setting current user:', e);
  }
}

export function updateUserDrivePath(userId: string, newPath: string): UserProfile {
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index !== -1) {
    const updated: UserProfile = {
      ...users[index],
      linkedDrivePath: newPath,
    };
    users[index] = updated;
    saveAllUsers(users);
    syncUserToCloud(updated);
    
    const currentUser = getCurrentUser();
    if (currentUser?.id === userId) {
      setCurrentUser(updated);
    }
    return updated;
  }
  throw new Error('User not found');
}

export function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'displayName' | 'nickname' | 'aboutMe' | 'avatarUrl' | 'linkedDrivePath'>>
): UserProfile {
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index !== -1) {
    const updated: UserProfile = {
      ...users[index],
      ...updates,
    };
    users[index] = updated;
    saveAllUsers(users);
    syncUserToCloud(updated);

    const currentUser = getCurrentUser();
    if (currentUser?.id === userId) {
      setCurrentUser(updated);
    }
    return updated;
  }
  throw new Error('User not found');
}

export function deleteUser(executorUser: UserProfile | null, targetUserId: string): void {
  if (!executorUser || executorUser.role !== 'admin') {
    throw new Error('Unauthorized: Only an authenticated Admin can delete accounts.');
  }

  const users = getAllUsers();
  const target = users.find((u) => u.id === targetUserId);

  if (target?.email.toLowerCase() === DEDICATED_ADMIN.email.toLowerCase()) {
    throw new Error('Cannot delete the master Admin account.');
  }

  const filtered = users.filter((u) => u.id !== targetUserId);
  saveAllUsers(filtered);

  const currentUser = getCurrentUser();
  if (currentUser?.id === targetUserId) {
    setCurrentUser(filtered.length > 0 ? filtered[0] : null);
  }
}

export function registerUser(
  username: string,
  displayName: string,
  email: string,
  password?: string,
  role: UserRole = 'user',
  linkedDrivePath: string = 'D:\\Games\\SteamRIP',
  creatorUser?: UserProfile | null
): UserProfile {
  const users = getAllUsers();

  // Enforce restriction: Admin account creation disabled
  if (role === 'admin') {
    throw new Error('Security Restricted: Creating additional Admin accounts is disabled.');
  }

  // Check duplicate username or email
  const existing = users.find(
    (u) =>
      u.username.toLowerCase() === username.toLowerCase() ||
      u.email.toLowerCase() === email.toLowerCase()
  );
  if (existing) {
    throw new Error('Username or email already exists.');
  }

  const avatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  ];
  const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

  const newUser: UserProfile = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    username,
    displayName: displayName || username,
    email,
    avatarUrl: randomAvatar,
    role: 'user',
    linkedDrivePath,
    password: password ? password.trim() : undefined,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveAllUsers(newUser ? [...users] : users);
  syncUserToCloud(newUser);

  // Auto sign-in new user if no one logged in or if created by self
  if (!creatorUser || creatorUser.id === newUser.id) {
    setCurrentUser(newUser);
  }

  return newUser;
}

export function loginWithCredentials(
  usernameOrEmail: string,
  inputPassword?: string
): UserProfile {
  const users = getAllUsers();
  const found = users.find(
    (u) =>
      u.username.toLowerCase() === usernameOrEmail.toLowerCase() ||
      u.email.toLowerCase() === usernameOrEmail.toLowerCase()
  );

  if (!found) {
    throw new Error('No account found with those credentials.');
  }

  // Admin Account Password Protection
  if (found.role === 'admin' || found.password) {
    if (!inputPassword || inputPassword.trim() !== (found.password || '')) {
      throw new Error('Access Denied: Incorrect password for this account.');
    }
  }

  setCurrentUser(found);
  return found;
}

export function authenticateAdminAction(adminUser: UserProfile | null, passwordInput: string): boolean {
  if (!adminUser || adminUser.role !== 'admin') return false;
  if (!adminUser.password) return true; // no password configured
  return adminUser.password === passwordInput.trim();
}
