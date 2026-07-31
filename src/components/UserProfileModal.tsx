import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  User, 
  Upload, 
  Link as LinkIcon, 
  HardDrive, 
  Check, 
  Sparkles, 
  Crown, 
  Calendar, 
  AtSign, 
  FileText, 
  Smile, 
  CloudCheck,
  ShieldAlert,
  Image as ImageIcon
} from 'lucide-react';
import { UserProfile } from '../types';
import { updateUserProfile } from '../utils/userAuth';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserUpdated: (updatedUser: UserProfile | null) => void;
  onOpenAuthModal?: () => void;
}

const GAMER_AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300',
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300',
  'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=300',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
  onOpenAuthModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [nickname, setNickname] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [linkedDrivePath, setLinkedDrivePath] = useState('');
  const [avatarTab, setAvatarTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const [customUrlInput, setCustomUrlInput] = useState('');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setNickname(currentUser.nickname || '');
      setAboutMe(currentUser.aboutMe || '');
      setAvatarUrl(currentUser.avatarUrl || GAMER_AVATAR_PRESETS[0]);
      setLinkedDrivePath(currentUser.linkedDrivePath || 'D:\\Games\\SteamRIP');
      setSavedSuccess(false);
      setErrorMsg('');
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-zinc-100">Sign In Required</h2>
          <p className="text-xs text-zinc-400">
            Please sign in or create an account to view and edit your profile.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs"
            >
              Cancel
            </button>
            {onOpenAuthModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAuthModal();
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20"
              >
                Sign In Now
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Handle File Upload from computer
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WEBP, GIF).');
      return;
    }

    // Limit file size to ~3MB for clean storage
    if (file.size > 4 * 1024 * 1024) {
      setErrorMsg('Image size should be under 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        setErrorMsg('');
        setSavedSuccess(false);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    setAvatarUrl(customUrlInput.trim());
    setCustomUrlInput('');
    setErrorMsg('');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSavedSuccess(false);

    try {
      if (!displayName.trim()) {
        setErrorMsg('Display Name cannot be empty.');
        return;
      }

      const updated = updateUserProfile(currentUser.id, {
        displayName: displayName.trim(),
        nickname: nickname.trim(),
        aboutMe: aboutMe.trim(),
        avatarUrl,
        linkedDrivePath: linkedDrivePath.trim() || 'D:\\Games\\SteamRIP',
      });

      onUserUpdated(updated);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update user profile.');
    }
  };

  const formattedJoinDate = new Date(currentUser.createdAt || Date.now()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header Banner */}
        <div className="relative h-28 bg-gradient-to-r from-indigo-900 via-purple-900 to-zinc-900 border-b border-zinc-800 p-6 flex items-end justify-between">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-950/60 hover:bg-zinc-950 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs bg-zinc-950/50 backdrop-blur-md px-3 py-1 rounded-full border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>RipDeck Gamer Profile</span>
          </div>
        </div>

        {/* Profile Header Bar with Avatar Overlay */}
        <div className="px-6 pb-4 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12">
          <div className="flex items-end gap-4">
            <div className="relative group">
              <img
                src={avatarUrl || currentUser.avatarUrl}
                alt={displayName}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-zinc-900 bg-zinc-800 shadow-xl"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-bold text-[10px] gap-1"
                title="Click to upload profile picture"
              >
                <Upload className="w-4 h-4" /> Change
              </button>
            </div>

            <div className="space-y-1 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white">{displayName || currentUser.displayName}</h2>
                {nickname && (
                  <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    "{nickname}"
                  </span>
                )}
                {currentUser.role === 'admin' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> ADMIN
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                    USER
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                <span className="flex items-center gap-1">
                  <AtSign className="w-3 h-3 text-zinc-500" /> {currentUser.username}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-zinc-500" /> Joined {formattedJoinDate}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <CloudCheck className="w-3.5 h-3.5" />
              <span>Cloud Synced</span>
            </span>
          </div>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSaveProfile} className="p-6 pt-2 space-y-6 max-h-[65vh] overflow-y-auto text-xs">
          {/* Avatar Customization Section */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-zinc-200 text-xs flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span>Profile Picture Customization</span>
              </label>

              {/* Avatar Option Tabs */}
              <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setAvatarTab('presets')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    avatarTab === 'presets' ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Presets
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarTab('upload')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    avatarTab === 'upload' ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarTab('url')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    avatarTab === 'url' ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Image URL
                </button>
              </div>
            </div>

            {avatarTab === 'presets' && (
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-1">
                {GAMER_AVATAR_PRESETS.map((preset, idx) => {
                  const isSelected = avatarUrl === preset;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(preset)}
                      className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 scale-105 shadow-md shadow-indigo-500/30 ring-2 ring-indigo-500/50'
                          : 'border-zinc-800 hover:border-zinc-600 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white font-bold" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {avatarTab === 'upload' && (
              <div className="pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-800 hover:border-indigo-500/60 rounded-xl p-5 text-center cursor-pointer transition-colors bg-zinc-900/40 hover:bg-zinc-900/80 space-y-2"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-200 text-xs">Click to upload custom picture from device</p>
                    <p className="text-[10px] text-zinc-500">Supports PNG, JPG, WEBP or GIF (Max 4MB)</p>
                  </div>
                </div>
              </div>
            )}

            {avatarTab === 'url' && (
              <div className="flex gap-2 pt-1">
                <div className="relative flex-1">
                  <LinkIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://example.com/my-avatar.jpg"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCustomUrl}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Profile Name & Nickname Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Display Name *</span>
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Mercer"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                <Smile className="w-3.5 h-3.5 text-indigo-400" />
                <span>Gamer Nickname / Alias</span>
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. ShadowRider, CyberViper"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* About Me Section */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>About Me / Bio</span>
              </span>
              <span className="text-[10px] text-zinc-500">{aboutMe.length}/300 chars</span>
            </label>
            <textarea
              rows={3}
              maxLength={300}
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value)}
              placeholder="Tell other RipDeck gamers about your favorite titles, gaming PC specs, SteamRIP collection, or gaming achievements..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 outline-none focus:border-indigo-500 resize-none leading-relaxed"
            />
          </div>

          {/* Linked Drive Path Section */}
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2">
            <label className="block text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              <span>Personal Linked SteamRIP Target Drive Path</span>
            </label>
            <input
              type="text"
              value={linkedDrivePath}
              onChange={(e) => setLinkedDrivePath(e.target.value)}
              placeholder="e.g. D:\Games\SteamRIP"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono outline-none focus:border-indigo-500"
            />
            <p className="text-[10px] text-zinc-500">
              Games downloaded under your account will be extracted to this drive directory path.
            </p>
          </div>

          {/* Notifications / Errors */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Profile updated successfully & synced to Cloud Firestore!</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            {onOpenAuthModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuthModal();
                }}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Switch Account
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
