import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Share2, 
  Sparkles, 
  LayoutGrid, 
  List, 
  HardDrive,
  Crown,
  ChevronDown,
  User,
  LogIn,
  LogOut,
  Settings,
  Smile,
  Flame,
  Zap
} from 'lucide-react';
import { ViewMode, UserProfile } from '../types';

interface NavbarProps {
  onOpenAddModal: () => void;
  onOpenShareModal: () => void;
  onOpenLocalDriveModal: () => void;
  linkedDrivePath: string;
  activeDownloadsCount: number;
  totalBandwidthMBps: number;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onOpenActiveDownloads: () => void;
  currentUser: UserProfile | null;
  onOpenAuthModal: () => void;
  onOpenProfileModal: () => void;
  onOpenAdminModal?: () => void;
  onOpenAutoFeedModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddModal,
  onOpenShareModal,
  onOpenLocalDriveModal,
  linkedDrivePath,
  activeDownloadsCount,
  totalBandwidthMBps,
  viewMode,
  setViewMode,
  onOpenActiveDownloads,
  currentUser,
  onOpenAuthModal,
  onOpenProfileModal,
  onOpenAdminModal,
  onOpenAutoFeedModal,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-violet-600 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center font-black text-white text-lg tracking-wider">
              R
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                RipDeck
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Library & Manager
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              SteamRIP Game Management Hub
            </p>
          </div>
        </div>

        {/* Middle: Active Download Ticker Badge */}
        {activeDownloadsCount > 0 ? (
          <button
            onClick={onOpenActiveDownloads}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/50 transition-all text-xs font-medium cursor-pointer group shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="font-semibold">{activeDownloadsCount} Active Download{activeDownloadsCount > 1 ? 's' : ''}</span>
            <span className="text-zinc-400 font-mono text-[11px] hidden md:inline">
              ({totalBandwidthMBps.toFixed(1)} MB/s)
            </span>
          </button>
        ) : (
          <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-400 bg-zinc-800/40 px-3 py-1.5 rounded-lg border border-zinc-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-zinc-300 font-medium">RipDeck Ready</span>
          </div>
        )}

        {/* Right Action Bar */}
        <div className="flex items-center gap-2">
          {/* Admin Control Center Button (Only for Admin role) */}
          {currentUser?.role === 'admin' && onOpenAdminModal && (
            <button
              onClick={onOpenAdminModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="Open Admin User & Drive Control Panel"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Admin Panel</span>
            </button>
          )}

          {/* User Profile / Dropdown Menu */}
          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group"
                title={`Signed in as ${currentUser.displayName}`}
              >
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-7 h-7 rounded-full object-cover border border-indigo-500/40"
                />
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-bold text-zinc-200 leading-tight flex items-center gap-1.5">
                    <span>{currentUser.displayName}</span>
                    {currentUser.nickname && (
                      <span className="text-[10px] text-indigo-400 font-normal">({currentUser.nickname})</span>
                    )}
                    {currentUser.role === 'admin' ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        ADMIN
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-zinc-800 text-zinc-400">
                        USER
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono truncate max-w-[120px]">
                    {currentUser.linkedDrivePath}
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Menu Dropdown */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                  <div className="px-3.5 py-2 border-b border-zinc-800 bg-zinc-950/50">
                    <p className="font-bold text-zinc-200 truncate">{currentUser.displayName}</p>
                    <p className="text-[10px] text-zinc-400 font-mono truncate">@{currentUser.username}</p>
                    {currentUser.nickname && (
                      <p className="text-[10px] text-indigo-400 font-medium italic mt-0.5">"{currentUser.nickname}"</p>
                    )}
                  </div>

                  <div className="p-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenProfileModal();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-200 hover:bg-indigo-600/20 hover:text-indigo-300 transition-colors text-left cursor-pointer font-medium"
                    >
                      <User className="w-4 h-4 text-indigo-400" />
                      <span>Edit Gamer Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenAuthModal();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-200 hover:bg-zinc-800 transition-colors text-left cursor-pointer font-medium"
                    >
                      <Settings className="w-4 h-4 text-zinc-400" />
                      <span>Switch Account / Auth Portal</span>
                    </button>

                    {currentUser.role === 'admin' && onOpenAdminModal && (
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenAdminModal();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-300 hover:bg-amber-500/15 transition-colors text-left cursor-pointer font-bold"
                      >
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span>Admin Control Panel</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 font-bold text-xs transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Create Account</span>
            </button>
          )}

          {/* View Mode Switcher */}
          <div className="hidden sm:flex items-center bg-zinc-950/80 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-zinc-800 text-indigo-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-zinc-800 text-indigo-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Link Local Drive Button */}
          <button
            onClick={onOpenLocalDriveModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 text-xs font-medium border border-zinc-700/60 transition-colors cursor-pointer group"
            title={`Connected Local Target: ${linkedDrivePath}`}
          >
            <HardDrive className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300" />
            <span className="hidden sm:inline text-zinc-300 font-mono text-[11px] truncate max-w-[110px]">
              {linkedDrivePath ? linkedDrivePath.split('\\')[0] || linkedDrivePath.split('/')[0] || 'Drive' : 'Link Drive'}
            </span>
          </button>

          {/* Share Collection */}
          <button
            onClick={onOpenShareModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 text-xs font-medium border border-zinc-700/60 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden md:inline">Share</span>
          </button>

          {/* SteamRIP Live Feed Auto-Add Button */}
          <button
            onClick={onOpenAutoFeedModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-indigo-500/15 hover:from-amber-500/25 hover:to-indigo-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm relative group"
            title="Auto-fetch and sync latest releases posted to SteamRIP.com"
          >
            <Flame className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">SteamRIP Feed</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400 text-zinc-950 uppercase tracking-tight">
              AUTO
            </span>
          </button>

          {/* Add SteamRIP Link Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Link</span>
            <Sparkles className="w-3.5 h-3.5 text-indigo-200 hidden sm:inline" />
          </button>
        </div>
      </div>
    </header>
  );
};
