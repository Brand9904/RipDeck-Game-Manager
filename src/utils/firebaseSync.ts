import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  deleteDoc, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, Game } from '../types';
import { INITIAL_GAMES } from '../data/initialGames';

const USERS_COLLECTION = 'users';
const GAMES_COLLECTION = 'games';

/**
 * Save or update a user profile in Firestore
 */
export async function syncUserToCloud(user: UserProfile): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, user.id);
    // Sanitize undefined fields
    const dataToSave = JSON.parse(JSON.stringify(user));
    await setDoc(userRef, dataToSave, { merge: true });
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      // Quietly fall back to local persistence when quota limit is reached
      return;
    }
    console.warn('Firestore user sync notice:', err?.message || err);
  }
}

/**
 * Real-time listener for all user profiles across devices
 */
export function subscribeCloudUsers(onUpdate: (users: UserProfile[]) => void): () => void {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    return onSnapshot(
      usersRef,
      (snapshot) => {
        const usersList: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          usersList.push(docSnap.data() as UserProfile);
        });
        if (usersList.length > 0) {
          onUpdate(usersList);
        }
      },
      (err: any) => {
        if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
          // Gracefully handle Firestore daily write/read quota exhaustion
          return;
        }
        console.warn('Users Firestore snapshot warning:', err?.message || err);
      }
    );
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      return () => {};
    }
    console.warn('Setting up users snapshot warning:', err?.message || err);
    return () => {};
  }
}

/**
 * Fetch all cloud users once
 */
export async function fetchCloudUsers(): Promise<UserProfile[]> {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const snapshot = await getDocs(usersRef);
    const users: UserProfile[] = [];
    snapshot.forEach((docSnap) => {
      users.push(docSnap.data() as UserProfile);
    });
    return users;
  } catch (err) {
    console.error('Error fetching users from Firestore:', err);
    return [];
  }
}

/**
 * Real-time listener for games belonging to a specific user
 */
export function subscribeUserGames(
  userId: string,
  onUpdate: (games: Game[]) => void
): () => void {
  if (!userId) return () => {};

  try {
    const gamesRef = collection(db, GAMES_COLLECTION);
    const q = query(gamesRef, where('userId', '==', userId));

    return onSnapshot(
      q,
      (snapshot) => {
        const gamesList: Game[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // Remove userId helper field before mapping to Game interface
          const { userId: _, ...gameData } = data;
          gamesList.push(gameData as Game);
        });

        onUpdate(gamesList);
      },
      (err: any) => {
        if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
          // Gracefully fallback to local state when Firestore free quota is exhausted
          return;
        }
        console.warn('Games Firestore snapshot warning:', err?.message || err);
      }
    );
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      return () => {};
    }
    console.warn('Setting up games snapshot warning:', err?.message || err);
    return () => {};
  }
}

/**
 * Save or update a single game in Firestore for a user
 */
export async function saveGameToCloud(userId: string, game: Game): Promise<void> {
  if (!userId || !game.id) return;
  try {
    const gameRef = doc(db, GAMES_COLLECTION, `${userId}_${game.id}`);
    const dataToSave = JSON.parse(
      JSON.stringify({
        ...game,
        userId,
      })
    );
    await setDoc(gameRef, dataToSave, { merge: true });
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      return;
    }
    console.warn(`Firestore game sync notice (${game.id}):`, err?.message || err);
  }
}

/**
 * Seed initial games for a user if they have no games in Firestore
 */
export async function seedInitialGamesForUser(userId: string): Promise<Game[]> {
  if (!userId) return INITIAL_GAMES;
  try {
    const initialWithUser = INITIAL_GAMES;
    for (const g of initialWithUser) {
      await saveGameToCloud(userId, g);
    }
    return initialWithUser;
  } catch (err) {
    console.error('Error seeding initial games to cloud:', err);
    return INITIAL_GAMES;
  }
}

/**
 * Save all games array to Firestore for a user
 */
export async function saveAllGamesToCloud(userId: string, games: Game[]): Promise<void> {
  if (!userId) return;
  try {
    for (const g of games) {
      await saveGameToCloud(userId, g);
    }
  } catch (err) {
    console.error('Error saving all games to cloud:', err);
  }
}

/**
 * Delete a game from Firestore
 */
export async function deleteGameFromCloud(userId: string, gameId: string): Promise<void> {
  if (!userId || !gameId) return;
  try {
    const gameRef = doc(db, GAMES_COLLECTION, `${userId}_${gameId}`);
    await deleteDoc(gameRef);
  } catch (err) {
    console.error(`Error deleting game ${gameId} from Firestore:`, err);
  }
}
