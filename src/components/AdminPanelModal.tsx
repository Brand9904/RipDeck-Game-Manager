import React, { useState } from 'react';
import { 
  Crown, 
  HardDrive, 
  Edit3, 
  Save, 
  X, 
  UserPlus, 
  CheckCircle2, 
  Search,
  User,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { UserProfile } from '../types';
import { 
  getAllUsers, 
  updateUserDrivePath, 
  registerUser, 
  deleteUser 
} from '../utils/userAuth';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUsersUpdated: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUsersUpdated,
}) => {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editDrivePath, setEditDrivePath] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Add user state inside admin panel
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDrivePath, setNewDrivePath] = useState('D:\\Games\\SteamRIP');
  const [addError, setAddError] = useState('');

  if (!isOpen) return null;

  const users = getAllUsers();
  const filteredUsers = users.filter((u) => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.linkedDrivePath.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartEditingDrive = (u: UserProfile) => {
    setEditingUserId(u.id);
    setEditDrivePath(u.linkedDrivePath);
  };

  const handleSaveDrivePath = (userId: string) => {
    if (!editDrivePath.trim()) return;
    try {
      updateUserDrivePath(userId, editDrivePath.trim());
      setEditingUserId(null);
      setSuccessMsg('Updated drive path successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      onUsersUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update drive path.');
    }
  };

  const handleDeleteUserAccount = (targetUser: UserProfile) => {
    if (targetUser.role === 'admin') {
      setErrorMsg('Cannot delete the master Admin account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user account "${targetUser.displayName}" (@${targetUser.username})?`)) {
      return;
    }
    try {
      deleteUser(currentUser, targetUser.id);
      setSuccessMsg(`Deleted account "${targetUser.displayName}".`);
      setTimeout(() => setSuccessMsg(''), 3000);
      onUsersUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete account.');
    }
  };

  const handleCreateNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    try {
      if (!newUsername.trim() || !newEmail.trim()) {
        setAddError('Username and email are required.');
        return;
      }

      registerUser(
        newUsername.trim(),
        newDisplayName.trim() || newUsername.trim(),
        newEmail.trim(),
        newPassword,
        'user', // Always register as standard user
        newDrivePath.trim() || 'D:\\Games\\SteamRIP',
        currentUser
      );

      setIsAddingUser(false);
      setNewUsername('');
      setNewDisplayName('');
      setNewEmail('');
      setNewPassword('');
      setSuccessMsg('Successfully created new Standard User account!');
      setTimeout(() => setSuccessMsg(''), 3000);
      onUsersUpdated();
    } catch (err: any) {
      setAddError(err.message || 'Error creating user.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-zinc-100 flex items-center gap-2">
                <span>RipDeck Admin Control Center</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Master Admin Console
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Manage registered user accounts and configure user drive paths
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

        {/* Action & Search Bar */}
        <div className="p-4 bg-zinc-950/40 border-b border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users or drive paths..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={() => setIsAddingUser(!isAddingUser)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isAddingUser ? 'Cancel New Account' : 'Create Standard User Account'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-zinc-300 max-h-[70vh] overflow-y-auto">
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Add User Form Drawer */}
          {isAddingUser && (
            <form onSubmit={handleCreateNewUser} className="p-4 rounded-xl bg-zinc-950 border border-amber-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" />
                  <span>Register Standard User Account</span>
                </span>
                <span className="text-[10px] text-zinc-400">Admin Authorized</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. gamer_alex"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. alex@ripdeck.org"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Password (Optional)</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Optional password for user"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Linked Drive Location</label>
                  <input
                    type="text"
                    value={newDrivePath}
                    onChange={(e) => setNewDrivePath(e.target.value)}
                    placeholder="e.g. D:\Games\SteamRIP"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {addError && <div className="text-red-400 text-[11px]">{addError}</div>}

              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer shadow-sm"
              >
                Create Account
              </button>
            </form>
          )}

          {/* Users List Table */}
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-bold">User</th>
                  <th className="py-3 px-4 font-bold">Role</th>
                  <th className="py-3 px-4 font-bold">User Linked Drive Location</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 bg-zinc-900/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-400">
                      No matching user accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isCurrent = currentUser?.id === u.id;
                    const isEditingThisDrive = editingUserId === u.id;
                    const isAdmin = u.role === 'admin';

                    return (
                      <tr key={u.id} className="hover:bg-zinc-800/40 transition-colors">
                        {/* User Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatarUrl}
                              alt={u.displayName}
                              className="w-9 h-9 rounded-full object-cover border border-zinc-700"
                            />
                            <div>
                              <div className="font-bold text-zinc-100 flex items-center gap-1.5">
                                <span>{u.displayName}</span>
                                {isCurrent && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-400 font-mono">
                                @{u.username} • {u.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role Pill */}
                        <td className="py-3.5 px-4">
                          {isAdmin ? (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <Crown className="w-3 h-3 text-amber-400" />
                              <span>ADMIN</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase inline-flex items-center gap-1 bg-zinc-800 text-zinc-400 border border-zinc-700">
                              <User className="w-3 h-3 text-zinc-400" />
                              <span>USER</span>
                            </span>
                          )}
                        </td>

                        {/* Linked Drive Path */}
                        <td className="py-3.5 px-4 font-mono text-xs">
                          {isEditingThisDrive ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editDrivePath}
                                onChange={(e) => setEditDrivePath(e.target.value)}
                                className="bg-zinc-950 border border-indigo-500 rounded px-2 py-1 text-xs text-zinc-100 outline-none font-mono"
                              />
                              <button
                                onClick={() => handleSaveDrivePath(u.id)}
                                className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                                title="Save Drive Path"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 cursor-pointer"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-zinc-200">
                              <HardDrive className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                              <span className="truncate max-w-[200px]" title={u.linkedDrivePath}>
                                {u.linkedDrivePath}
                              </span>
                              <button
                                onClick={() => handleStartEditingDrive(u)}
                                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-indigo-300 transition-colors cursor-pointer"
                                title="Edit user drive location"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleStartEditingDrive(u)}
                            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <HardDrive className="w-3 h-3 text-indigo-400" />
                            <span>Edit Drive</span>
                          </button>

                          {!isAdmin && (
                            <button
                              onClick={() => handleDeleteUserAccount(u)}
                              className="px-2 py-1 rounded bg-red-950/40 border border-red-500/30 hover:bg-red-900/50 text-red-300 text-[11px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Delete user account"
                            >
                              <Trash2 className="w-3 h-3 text-red-400" />
                              <span>Delete</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
