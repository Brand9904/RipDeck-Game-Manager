import React, { useState, useEffect, useMemo } from 'react';
import { Game, DownloadStatus, FilterOptions, ViewMode, LibraryStats, UserProfile } from './types';
import { loadGames, saveGames } from './utils/storage';
import { Navbar } from './components/Navbar';
import { DashboardStats } from './components/DashboardStats';
import { FilterBar } from './components/FilterBar';
import { GameCard } from './components/GameCard';
import { GameTableRow } from './components/GameTableRow';
import { AddGameModal } from './components/AddGameModal';
import { GameDetailModal } from './components/GameDetailModal';
import { ActiveDownloadsBar } from './components/ActiveDownloadsBar';
import { ShareModal } from './components/ShareModal';
import { LocalDriveModal } from './components/LocalDriveModal';
import { AuthModal } from './components/AuthModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AutoFeedModal } from './components/AutoFeedModal';
import { getLinkedDrivePath } from './utils/localDrive';
import { getCurrentUser } from './utils/userAuth';
import { 
  getAutoSyncConfig, 
  fetchLatestSteamRIPReleases, 
  filterNewSteamRIPReleases 
} from './utils/steamripFeed';
import { 
  subscribeUserGames, 
  saveGameToCloud, 
  deleteGameFromCloud, 
  saveAllGamesToCloud,
  seedInitialGamesForUser,
  subscribeCloudUsers
} from './utils/firebaseSync';
import { Sparkles, Gamepad2, CloudCheck, Flame, CheckCircle2, X } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCurrentUser());
  const [games, setGames] = useState<Game[]>(() => loadGames());
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  // Modal visibility states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLocalDriveModalOpen, setIsLocalDriveModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAutoFeedModalOpen, setIsAutoFeedModalOpen] = useState(false);

  // Auto-Add notification toast
  const [autoAddToast, setAutoAddToast] = useState<string | null>(null);

  // Drive state linked per-user
  const [linkedDrivePath, setLinkedDrivePath] = useState<string>(() => currentUser?.linkedDrivePath || getLinkedDrivePath());
  const [directoryHandle, setDirectoryHandle] = useState<any>(null);
  const [showActiveDownloadsBar, setShowActiveDownloadsBar] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    status: 'all',
    genre: 'all',
    sortBy: 'dateAdded',
    sortOrder: 'desc',
    favoritesOnly: false,
  });

  // Real-time Cloud User Sync (Syncs linked drive paths & profile details across browsers/devices)
  useEffect(() => {
    const unsubscribeUsers = subscribeCloudUsers((cloudUsers) => {
      if (currentUser) {
        const fresh = cloudUsers.find((u) => u.id === currentUser.id);
        if (fresh) {
          if (
            fresh.linkedDrivePath !== linkedDrivePath ||
            fresh.displayName !== currentUser.displayName ||
            fresh.nickname !== currentUser.nickname ||
            fresh.aboutMe !== currentUser.aboutMe ||
            fresh.avatarUrl !== currentUser.avatarUrl
          ) {
            setLinkedDrivePath(fresh.linkedDrivePath);
            setCurrentUser(fresh);
          }
        }
      }
    });
    return () => unsubscribeUsers();
  }, [currentUser?.id, linkedDrivePath]);

  // Real-time Cloud Games Sync (Syncs added games per user across browsers/devices)
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeGames = subscribeUserGames(currentUser.id, async (cloudGames) => {
      if (cloudGames.length === 0) {
        // Seed initial default games in cloud database for new account
        const seeded = await seedInitialGamesForUser(currentUser.id);
        setGames(seeded);
      } else {
        setGames(cloudGames);
      }
    });

    return () => unsubscribeGames();
  }, [currentUser?.id]);

  // Sync drive path whenever current user changes
  useEffect(() => {
    if (currentUser && currentUser.linkedDrivePath) {
      setLinkedDrivePath(currentUser.linkedDrivePath);
    }
  }, [currentUser]);

  // Open Auth Modal on boot if no user is signed in
  useEffect(() => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
    }
  }, []);

  // Save to localStorage fallback on games change
  useEffect(() => {
    saveGames(games);
  }, [games]);

  // SteamRIP Live Feed Auto-Sync Effect
  useEffect(() => {
    const config = getAutoSyncConfig();
    if (!config.autoSyncEnabled) return;

    let isMounted = true;
    const checkFeed = async () => {
      try {
        const fetched = await fetchLatestSteamRIPReleases();
        if (!isMounted) return;

        setGames((currentGames) => {
          const missing = filterNewSteamRIPReleases(fetched, currentGames);
          if (missing.length > 0) {
            if (currentUser) {
              saveAllGamesToCloud(currentUser.id, missing);
            }
            setAutoAddToast(
              `⚡ ${missing.length} new SteamRIP game release${missing.length > 1 ? 's' : ''} with mirror links auto-added to your games page!`
            );
            setTimeout(() => setAutoAddToast(null), 7000);
            return [...missing, ...currentGames];
          }
          return currentGames;
        });
      } catch (err) {
        console.warn('Auto-sync feed error:', err);
      }
    };

    checkFeed();
    const intervalMs = Math.max(1, config.syncIntervalMinutes || 15) * 60 * 1000;
    const timer = setInterval(checkFeed, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [currentUser?.id]);

  // Live Download Simulation Ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setGames((prevGames) => {
        let hasChanges = false;
        const updated = prevGames.map((game) => {
          if (game.status === 'downloading') {
            hasChanges = true;
            const total = game.fileSizeBytes || 50000000000;
            // Simulated chunk: 30MB to 60MB per tick
            const speedMBps = 25 + Math.random() * 20; // 25-45 MB/s
            const chunkBytes = speedMBps * 1024 * 1024 * 2; // 2 sec tick
            const newDownloaded = Math.min(total, game.progress.downloadedBytes + chunkBytes);
            const newPercent = Math.min(100, Math.round((newDownloaded / total) * 100));
            const remainingBytes = total - newDownloaded;
            const eta = speedMBps > 0 ? Math.round(remainingBytes / (speedMBps * 1024 * 1024)) : 0;

            const isDone = newPercent >= 100;

            const updatedGame: Game = {
              ...game,
              status: isDone ? ('downloaded' as DownloadStatus) : ('downloading' as DownloadStatus),
              progress: {
                ...game.progress,
                downloadedBytes: newDownloaded,
                totalBytes: total,
                downloadSpeedMBps: isDone ? 0 : Math.round(speedMBps * 10) / 10,
                etaSeconds: isDone ? 0 : eta,
                progressPercent: newPercent,
              },
            };

            // Sync to cloud only when download completes to prevent quota exhaustion
            if (currentUser && isDone) {
              saveGameToCloud(currentUser.id, updatedGame);
            }

            return updatedGame;
          }
          return game;
        });
        return hasChanges ? updated : prevGames;
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [currentUser]);

  // Compute unique genres
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    games.forEach((g) => g.genres?.forEach((genre) => set.add(genre)));
    return Array.from(set).sort();
  }, [games]);

  // Calculate library statistics
  const stats: LibraryStats = useMemo(() => {
    let activeDL = 0;
    let completedDL = 0;
    let installed = 0;
    let storageBytes = 0;
    let installedStorageBytes = 0;
    let bandwidth = 0;

    games.forEach((g) => {
      if (g.status === 'downloading') {
        activeDL++;
        bandwidth += g.progress.downloadSpeedMBps || 0;
      }
      if (g.status === 'downloaded') completedDL++;
      if (g.status === 'installed') {
        installed++;
        installedStorageBytes += g.fileSizeBytes || 0;
      }
      storageBytes += g.fileSizeBytes || 0;
    });

    return {
      totalGames: games.length,
      activeDownloads: activeDL,
      completedDownloads: completedDL,
      installedGames: installed,
      totalStorageBytes: storageBytes,
      installedStorageBytes,
      currentBandwidthMBps: bandwidth,
    };
  }, [games]);

  // Filter & Sort Logic
  const filteredGames = useMemo(() => {
    return games
      .filter((game) => {
        // Search text
        if (filters.search) {
          const q = filters.search.toLowerCase();
          const matchTitle = game.title.toLowerCase().includes(q);
          const matchDev = game.developer?.toLowerCase().includes(q);
          const matchGenre = game.genres?.some((g) => g.toLowerCase().includes(q));
          const matchTags = game.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchDev && !matchGenre && !matchTags) return false;
        }

        // Status filter
        if (filters.status !== 'all' && game.status !== filters.status) {
          return false;
        }

        // Genre filter
        if (filters.genre !== 'all' && !game.genres?.includes(filters.genre)) {
          return false;
        }

        // Favorites filter
        if (filters.favoritesOnly && !game.favorite) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (filters.sortBy === 'title') {
          cmp = a.title.localeCompare(b.title);
        } else if (filters.sortBy === 'fileSize') {
          cmp = (a.fileSizeBytes || 0) - (b.fileSizeBytes || 0);
        } else if (filters.sortBy === 'progress') {
          cmp = (a.progress.progressPercent || 0) - (b.progress.progressPercent || 0);
        } else {
          // dateAdded
          cmp = new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
        }
        return filters.sortOrder === 'asc' ? cmp : -cmp;
      });
  }, [games, filters]);

  // Handlers
  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGames((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const updated = { ...g, favorite: !g.favorite };
          if (currentUser) saveGameToCloud(currentUser.id, updated);
          return updated;
        }
        return g;
      })
    );
  };

  const handleUpdateStatus = (id: string, newStatus: DownloadStatus, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setGames((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const isDone = newStatus === 'installed' || newStatus === 'downloaded';
          const total = g.fileSizeBytes || 40000000000;
          const updated: Game = {
            ...g,
            status: newStatus,
            progress: {
              ...g.progress,
              progressPercent: isDone ? 100 : newStatus === 'downloading' ? 10 : g.progress.progressPercent,
              downloadedBytes: isDone ? total : Math.round(total * 0.1),
              downloadSpeedMBps: newStatus === 'downloading' ? 24.5 : 0,
            },
          };
          if (currentUser) saveGameToCloud(currentUser.id, updated);
          return updated;
        }
        return g;
      })
    );
  };

  const handleDeleteGame = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setGames((prev) => prev.filter((g) => g.id !== id));
    if (currentUser) deleteGameFromCloud(currentUser.id, id);
    if (selectedGame?.id === id) setSelectedGame(null);
  };

  const handleAddGame = (newGame: Game) => {
    setGames((prev) => [newGame, ...prev]);
    if (currentUser) saveGameToCloud(currentUser.id, newGame);
  };

  const handleImportGames = (imported: Game[]) => {
    setGames((prev) => {
      const existingIds = new Set(prev.map((g) => g.id));
      const fresh = imported.filter((g) => !existingIds.has(g.id));
      if (currentUser) saveAllGamesToCloud(currentUser.id, fresh);
      return [...fresh, ...prev];
    });
  };

  const handleUserChanged = (updatedUser: UserProfile | null) => {
    setCurrentUser(updatedUser);
    if (updatedUser) {
      setLinkedDrivePath(updatedUser.linkedDrivePath);
    }
  };

  const handleAutoAddGames = (gamesToAdd: Game[]) => {
    setGames((prev) => {
      const existingIds = new Set(prev.map((g) => g.id));
      const fresh = gamesToAdd.filter((g) => !existingIds.has(g.id));
      if (currentUser) saveAllGamesToCloud(currentUser.id, fresh);
      return [...fresh, ...prev];
    });
    setAutoAddToast(`⚡ Added ${gamesToAdd.length} SteamRIP release${gamesToAdd.length > 1 ? 's' : ''} to your games page!`);
    setTimeout(() => setAutoAddToast(null), 5000);
  };

  const activeDownloadingGames = games.filter((g) => g.status === 'downloading');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white relative">
      {/* Toast Notification for Auto-Added SteamRIP releases */}
      {autoAddToast && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-gradient-to-r from-amber-950 via-zinc-900 to-indigo-950 border border-amber-500/40 text-amber-200 text-xs p-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="font-semibold">{autoAddToast}</span>
          </div>
          <button
            onClick={() => setAutoAddToast(null)}
            className="p-1 hover:bg-amber-500/20 rounded-lg text-amber-400 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Navbar */}
      <Navbar
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenLocalDriveModal={() => setIsLocalDriveModalOpen(true)}
        linkedDrivePath={linkedDrivePath}
        activeDownloadsCount={stats.activeDownloads}
        totalBandwidthMBps={stats.currentBandwidthMBps}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenActiveDownloads={() => setShowActiveDownloadsBar(true)}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        onOpenAutoFeedModal={() => setIsAutoFeedModalOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
        {/* Metric Cards Banner */}
        <DashboardStats
          stats={stats}
          linkedDrivePath={linkedDrivePath}
          onOpenLocalDriveModal={() => setIsLocalDriveModalOpen(true)}
          onFilterStatus={(st) => setFilters((prev) => ({ ...prev, status: st }))}
        />

        {/* Filter & Search Bar */}
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          allGenres={allGenres}
          totalResults={filteredGames.length}
        />

        {/* Game Grid or Table View */}
        {filteredGames.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-zinc-200 text-lg">No games found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              No games match your active search filter. Try adjusting your search query or add a new SteamRIP game link.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 cursor-pointer mt-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Add SteamRIP Link</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onSelect={setSelectedGame}
                onToggleFavorite={handleToggleFavorite}
                onUpdateStatus={handleUpdateStatus}
                onDeleteGame={handleDeleteGame}
              />
            ))}
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider bg-zinc-950/60">
                  <th className="py-3 px-3 w-10"></th>
                  <th className="py-3 px-3">Game Title & Build</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Size</th>
                  <th className="py-3 px-3">Progress</th>
                  <th className="py-3 px-3">Direct Release</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGames.map((game) => (
                  <GameTableRow
                    key={game.id}
                    game={game}
                    onSelect={setSelectedGame}
                    onToggleFavorite={handleToggleFavorite}
                    onUpdateStatus={handleUpdateStatus}
                    onDeleteGame={handleDeleteGame}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Floating Active Downloads Bar */}
      {showActiveDownloadsBar && activeDownloadingGames.length > 0 && (
        <ActiveDownloadsBar
          activeGames={activeDownloadingGames}
          onOpenGame={(game) => setSelectedGame(game)}
          onTogglePause={(id) => handleUpdateStatus(id, 'paused')}
          onCloseBar={() => setShowActiveDownloadsBar(false)}
        />
      )}

      {/* Modals */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUserUpdated={handleUserChanged}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChanged={handleUserChanged}
      />

      {currentUser?.role === 'admin' && (
        <AdminPanelModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          currentUser={currentUser}
          onUsersUpdated={() => {
            const freshCurrent = getCurrentUser();
            handleUserChanged(freshCurrent);
          }}
        />
      )}

      <AddGameModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddGame={handleAddGame}
      />

      <GameDetailModal
        game={selectedGame}
        onClose={() => setSelectedGame(null)}
        onUpdateGame={(updated) => {
          setGames((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
          if (currentUser) saveGameToCloud(currentUser.id, updated);
          setSelectedGame(updated);
        }}
        onDeleteGame={handleDeleteGame}
        directoryHandle={directoryHandle}
        linkedDrivePath={linkedDrivePath}
      />

      <LocalDriveModal
        isOpen={isLocalDriveModalOpen}
        onClose={() => setIsLocalDriveModalOpen(false)}
        linkedDrivePath={linkedDrivePath}
        setLinkedDrivePath={setLinkedDrivePath}
        directoryHandle={directoryHandle}
        setDirectoryHandle={setDirectoryHandle}
        currentUser={currentUser}
        onDriveUpdated={handleUserChanged}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        games={games}
        onImportGames={handleImportGames}
      />

      <AutoFeedModal
        isOpen={isAutoFeedModalOpen}
        onClose={() => setIsAutoFeedModalOpen(false)}
        existingGames={games}
        onAddGames={handleAutoAddGames}
        onOpenGameDetail={(game) => setSelectedGame(game)}
      />
    </div>
  );
}
