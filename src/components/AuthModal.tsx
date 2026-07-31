import React, { useState } from 'react';
import { 
  X, 
  User, 
  Key, 
  HardDrive, 
  UserPlus, 
  LogIn, 
  AlertCircle,
  Sparkles,
  Crown,
  Lock,
  ShieldAlert,
  LogOut
} from 'lucide-react';
import { UserProfile } from '../types';
import { 
  getAllUsers, 
  loginWithCredentials, 
  registerUser, 
  setCurrentUser 
} from '../utils/userAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserChanged: (user: UserProfile | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
}) => {
  const users = getAllUsers();

  const [activeTab, setActiveTab] = useState<'quick' | 'login' | 'register'>(
    users.length === 0 ? 'register' : 'quick'
  );

  // Sign in form state
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Quick switch password check state
  const [switchingUser, setSwitchingUser] = useState<UserProfile | null>(null);
  const [switchPassword, setSwitchPassword] = useState('');

  // Register Form state
  const [regUsername, setRegUsername] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDrivePath, setRegDrivePath] = useState('D:\\Games\\SteamRIP');

  if (!isOpen) return null;

  const handleSelectPresetUser = (user: UserProfile) => {
    // If selecting an admin account or account with password, require password input
    if (user.role === 'admin' || user.password) {
      setSwitchingUser(user);
      setSwitchPassword('');
      setErrorMessage('');
      return;
    }
    setCurrentUser(user);
    onUserChanged(user);
    onClose();
  };

  const handleConfirmSwitchPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!switchingUser) return;
    setErrorMessage('');
    try {
      if (switchingUser.password && switchPassword.trim() !== switchingUser.password) {
        setErrorMessage('Incorrect password for account.');
        return;
      }
      setCurrentUser(switchingUser);
      onUserChanged(switchingUser);
      setSwitchingUser(null);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed.');
    }
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      if (!usernameInput.trim()) {
        setErrorMessage('Please enter a username or email.');
        return;
      }
      const user = loginWithCredentials(usernameInput.trim(), passwordInput);
      onUserChanged(user);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      if (!regUsername.trim() || !regEmail.trim()) {
        setErrorMessage('Username and Email are required.');
        return;
      }

      const newUser = registerUser(
        regUsername.trim(),
        regDisplayName.trim() || regUsername.trim(),
        regEmail.trim(),
        regPassword,
        'user', // Always register as standard user
        regDrivePath.trim() || 'D:\\Games\\SteamRIP',
        currentUser
      );

      onUserChanged(newUser);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    onUserChanged(null);
    setActiveTab('login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-zinc-100 flex items-center gap-2">
                <span>RipDeck Account Portal</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Protected Accounts
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Each signed-in user links their custom local drive path for game downloads
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 text-xs font-semibold text-zinc-400">
          {users.length > 0 && (
            <button
              onClick={() => {
                setActiveTab('quick');
                setErrorMessage('');
                setSwitchingUser(null);
              }}
              className={`flex-1 py-3 border-b-2 text-center transition-colors cursor-pointer ${
                activeTab === 'quick' ? 'border-indigo-500 text-indigo-300 font-bold bg-zinc-900/50' : 'border-transparent hover:text-zinc-200'
              }`}
            >
              Registered Users ({users.length})
            </button>
          )}
          <button
            onClick={() => {
              setActiveTab('login');
              setErrorMessage('');
              setSwitchingUser(null);
            }}
            className={`flex-1 py-3 border-b-2 text-center transition-colors cursor-pointer ${
              activeTab === 'login' ? 'border-indigo-500 text-indigo-300 font-bold bg-zinc-900/50' : 'border-transparent hover:text-zinc-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setActiveTab('register');
              setErrorMessage('');
              setSwitchingUser(null);
            }}
            className={`flex-1 py-3 border-b-2 text-center transition-colors cursor-pointer ${
              activeTab === 'register' ? 'border-indigo-500 text-indigo-300 font-bold bg-zinc-900/50' : 'border-transparent hover:text-zinc-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-zinc-300 max-h-[70vh] overflow-y-auto">
          {/* Currently Logged In Profile Banner */}
          {currentUser ? (
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-10 h-10 rounded-full border border-indigo-500/30 object-cover"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-100 text-xs">{currentUser.displayName}</span>
                    {currentUser.role === 'admin' ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Crown className="w-2.5 h-2.5" /> ADMIN
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-zinc-800 text-zinc-400 border border-zinc-700">
                        USER
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono mt-0.5">
                    <HardDrive className="w-3 h-3 text-indigo-400" />
                    <span>{currentUser.linkedDrivePath}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="px-2.5 py-1 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 hover:bg-red-900/40 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Sign out current user"
              >
                <LogOut className="w-3 h-3" /> Sign Out
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>No user signed in. Please sign in or create an account.</span>
              </div>
            </div>
          )}

          {/* Quick Profile Switch Password Verification Prompt */}
          {switchingUser && (
            <form onSubmit={handleConfirmSwitchPassword} className="p-4 rounded-xl bg-zinc-950 border border-amber-500/40 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <Lock className="w-4 h-4" />
                <span>Password Required for @{switchingUser.username}</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                This is a password-protected account. Enter the password to log in.
              </p>

              <div>
                <input
                  type="password"
                  autoFocus
                  required
                  value={switchPassword}
                  onChange={(e) => setSwitchPassword(e.target.value)}
                  placeholder="Enter account password..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSwitchingUser(null)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  Authenticate & Sign In
                </button>
              </div>
            </form>
          )}

          {/* Registered Users Tab */}
          {activeTab === 'quick' && !switchingUser && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Select Account to Switch Profile</span>
              </div>

              {users.length === 0 ? (
                <div className="text-center py-6 text-zinc-400 space-y-2">
                  <p>No registered accounts found.</p>
                  <button
                    onClick={() => setActiveTab('register')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                  >
                    Create First Account
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {users.map((u) => {
                    const isActive = currentUser?.id === u.id;
                    const isAdmin = u.role === 'admin';

                    return (
                      <div
                        key={u.id}
                        onClick={() => handleSelectPresetUser(u)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isActive
                            ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md'
                            : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatarUrl}
                            alt={u.displayName}
                            className="w-9 h-9 rounded-full object-cover border border-zinc-700"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-200 text-xs">{u.displayName}</span>
                              <span className="text-[10px] text-zinc-400">(@{u.username})</span>
                              {isAdmin && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                  <Crown className="w-2.5 h-2.5" /> ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                              <HardDrive className="w-3 h-3 text-indigo-400" />
                              <span>Linked Drive: {u.linkedDrivePath}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                            isActive
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : isAdmin
                              ? 'bg-amber-600/30 text-amber-200 hover:bg-amber-600 hover:text-white border border-amber-500/40'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                          }`}
                        >
                          {isActive ? 'Current' : isAdmin ? <><Lock className="w-3 h-3" /> Admin Sign In</> : 'Sign In'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Sign In Tab */}
          {activeTab === 'login' && !switchingUser && (
            <form onSubmit={handleCustomLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Username or Email Address
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Enter your username or email"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-zinc-100 outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Password (Required for Admin account)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter account password..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-zinc-100 outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to RipDeck</span>
              </button>
            </form>
          )}

          {/* Create Account Tab */}
          {activeTab === 'register' && !switchingUser && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. gamer_alex"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={regDisplayName}
                    onChange={(e) => setRegDisplayName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. alex@ripdeck.org"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Account Password (Optional)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Optional password for standard accounts"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Linked Drive Path */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  User Personal Linked Drive Path
                </label>
                <div className="relative">
                  <HardDrive className="w-4 h-4 text-indigo-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={regDrivePath}
                    onChange={(e) => setRegDrivePath(e.target.value)}
                    placeholder="e.g. D:\Games\SteamRIP"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  All new accounts are created as Standard Users. Dedicated Admin access is restricted.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Standard User Account</span>
              </button>
            </form>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
