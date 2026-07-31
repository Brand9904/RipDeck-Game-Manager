import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  Globe, 
  Link as LinkIcon, 
  HardDrive, 
  Zap, 
  Layers, 
  ShieldCheck, 
  Download, 
  Eye, 
  Clock, 
  AlertCircle,
  Flame,
  Key
} from 'lucide-react';
import { Game } from '../types';
import { 
  AutoSyncConfig, 
  getAutoSyncConfig, 
  saveAutoSyncConfig, 
  fetchLatestSteamRIPReleases, 
  filterNewSteamRIPReleases 
} from '../utils/steamripFeed';

interface AutoFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingGames: Game[];
  onAddGames: (gamesToAdd: Game[]) => void;
  onOpenGameDetail?: (game: Game) => void;
}

export const AutoFeedModal: React.FC<AutoFeedModalProps> = ({
  isOpen,
  onClose,
  existingGames,
  onAddGames,
  onOpenGameDetail,
}) => {
  const [config, setConfig] = useState<AutoSyncConfig>(() => getAutoSyncConfig());
  const [feedGames, setFeedGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');

  // Fetch feed when modal opens
  useEffect(() => {
    if (isOpen) {
      handleCheckForNewReleases();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckForNewReleases = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setSyncSuccessMsg('');

    try {
      const fetched = await fetchLatestSteamRIPReleases();
      setFeedGames(fetched);
      
      const newItems = filterNewSteamRIPReleases(fetched, existingGames);
      const updatedConfig = {
        ...config,
        lastSyncedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setConfig(updatedConfig);
      saveAutoSyncConfig(updatedConfig);

      if (newItems.length > 0) {
        setSyncSuccessMsg(`Found ${newItems.length} new SteamRIP release${newItems.length > 1 ? 's' : ''} with mirror links & metadata!`);
      } else {
        setSyncSuccessMsg('Your games library is already up to date with the latest SteamRIP releases.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sync with SteamRIP releases feed.');
    } finally {
      setIsLoading(false);
    }
  };

  const newReleasesToImport = filterNewSteamRIPReleases(feedGames, existingGames);

  const handleImportAllNew = () => {
    if (newReleasesToImport.length === 0) return;
    onAddGames(newReleasesToImport);
    setSyncSuccessMsg(`Successfully imported ${newReleasesToImport.length} new SteamRIP game${newReleasesToImport.length > 1 ? 's' : ''} to your games page!`);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleToggleAutoSync = () => {
    const next = { ...config, autoSyncEnabled: !config.autoSyncEnabled };
    setConfig(next);
    saveAutoSyncConfig(next);
  };

  const handleImportSingle = (game: Game) => {
    onAddGames([game]);
    setSyncSuccessMsg(`Added "${game.title}" to your games page!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95">
        {/* Header Banner */}
        <div className="relative bg-gradient-to-r from-indigo-950 via-purple-950 to-zinc-900 border-b border-zinc-800 p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-950/60 hover:bg-zinc-950 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Close feed modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center text-amber-400 font-black">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white">SteamRIP Updated Games Live Feed</h2>
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Auto-Add Engine
                </span>
                <a
                  href="https://steamrip.com/updated-games/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-0.5 text-[10px] font-mono font-semibold text-indigo-300 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/30 rounded-full flex items-center gap-1 transition-colors"
                >
                  <Globe className="w-2.5 h-2.5 text-indigo-400" />
                  steamrip.com/updated-games
                  <LinkIcon className="w-2.5 h-2.5 text-indigo-400" />
                </a>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Automatically sync and import recently updated PC game releases from <code className="text-amber-300 bg-zinc-950 px-1 py-0.5 rounded border border-zinc-800">https://steamrip.com/updated-games/</code> with direct mirror download links & complete metadata.
              </p>
            </div>
          </div>
        </div>

        {/* Control Bar: Auto Sync Toggle & Sync Action */}
        <div className="p-4 bg-zinc-950/60 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            {/* Toggle Switch */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                onClick={handleToggleAutoSync}
                className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                  config.autoSyncEnabled ? 'bg-indigo-600 justify-end' : 'bg-zinc-800 justify-start'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
              </div>
              <span className="font-bold text-zinc-200">
                Auto-Add SteamRIP Releases: {config.autoSyncEnabled ? <span className="text-emerald-400">ENABLED</span> : <span className="text-zinc-500">DISABLED</span>}
              </span>
            </label>

            {config.lastSyncedAt && (
              <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-zinc-500" /> Last checked: {config.lastSyncedAt}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCheckForNewReleases}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Scanning Feed...' : 'Check Now'}</span>
            </button>

            {newReleasesToImport.length > 0 && (
              <button
                onClick={handleImportAllNew}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all transform active:scale-95 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Auto-Add {newReleasesToImport.length} New Game{newReleasesToImport.length > 1 ? 's' : ''}</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Content Feed Area */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {syncSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{syncSuccessMsg}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-zinc-400 font-medium">
                Fetching latest releases feed from SteamRIP.com & extracting mirror links...
              </p>
            </div>
          ) : feedGames.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-xs">
              No releases found in the stream. Click "Check Now" to force fetch.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                <span>Discovered Releases Stream ({feedGames.length})</span>
                <span className="text-[11px] text-zinc-500">Includes Buzzheavier, GoFile, MegaDB & Torrent mirrors</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {feedGames.map((game) => {
                  const isAlreadyInLibrary = existingGames.some(
                    (g) => g.title.toLowerCase().trim() === game.title.toLowerCase().trim() || g.steamripUrl.toLowerCase() === game.steamripUrl.toLowerCase()
                  );

                  return (
                    <div
                      key={game.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between ${
                        isAlreadyInLibrary
                          ? 'bg-zinc-950/40 border-zinc-800/60 opacity-80'
                          : 'bg-zinc-900 border-zinc-700/80 hover:border-indigo-500/50 shadow-md'
                      }`}
                    >
                      {/* Game Image & Info */}
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <img
                          src={game.coverImage}
                          alt={game.title}
                          className="w-16 h-16 rounded-xl object-cover border border-zinc-800 bg-zinc-950 flex-shrink-0"
                        />
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-zinc-100 text-sm truncate">{game.title}</h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-800 text-indigo-300 border border-zinc-700">
                              {game.version}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              {game.fileSize}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-zinc-400 flex-wrap">
                            <span className="text-zinc-300 font-medium">{game.developer}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-zinc-500">
                              <Key className="w-3 h-3 text-amber-400" /> Pass: <code className="text-zinc-300 bg-zinc-950 px-1 rounded font-mono">steamrip.com</code>
                            </span>
                          </div>

                          {/* Mirrors Badge List */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            <span className="text-[10px] text-zinc-500 font-semibold uppercase">Mirrors:</span>
                            {game.mirrors?.map((m, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-950 text-emerald-400 border border-emerald-500/20 flex items-center gap-1"
                              >
                                <Globe className="w-2.5 h-2.5 text-emerald-500" />
                                {m.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Action */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                        {isAlreadyInLibrary ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>In Library</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleImportSingle(game)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Auto-Add</span>
                          </button>
                        )}

                        {onOpenGameDetail && (
                          <button
                            onClick={() => {
                              onClose();
                              onOpenGameDetail(game);
                            }}
                            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                            title="Preview game metadata and mirror links"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950/80 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>All metadata & direct mirrors auto-verified for SteamRIP format compliance</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
