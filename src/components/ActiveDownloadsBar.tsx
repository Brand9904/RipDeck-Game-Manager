import React from 'react';
import { DownloadCloud, Play, Pause, Zap, CheckCircle2, X } from 'lucide-react';
import { Game } from '../types';
import { formatSpeed, formatBytes, formatEta } from '../utils/storage';

interface ActiveDownloadsBarProps {
  activeGames: Game[];
  onOpenGame: (game: Game) => void;
  onTogglePause: (id: string) => void;
  onCloseBar: () => void;
}

export const ActiveDownloadsBar: React.FC<ActiveDownloadsBarProps> = ({
  activeGames,
  onOpenGame,
  onTogglePause,
  onCloseBar,
}) => {
  if (activeGames.length === 0) return null;

  const totalSpeed = activeGames.reduce(
    (acc, g) => acc + (g.status === 'downloading' ? g.progress.downloadSpeedMBps || 0 : 0),
    0
  );

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto z-40 bg-slate-900/95 border border-cyan-500/40 rounded-2xl shadow-2xl backdrop-blur-lg p-3 sm:p-4 text-slate-100">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <span className="font-bold text-xs sm:text-sm text-cyan-300">
            Active Download Manager ({activeGames.length})
          </span>
          {totalSpeed > 0 && (
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 flex items-center gap-1">
              <Zap className="w-3 h-3" /> {formatSpeed(totalSpeed)}
            </span>
          )}
        </div>

        <button
          onClick={onCloseBar}
          className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
        {activeGames.map((game) => (
          <div
            key={game.id}
            onClick={() => onOpenGame(game)}
            className="flex items-center justify-between gap-3 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 hover:border-cyan-500/30 transition-colors cursor-pointer text-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <img
                src={game.coverImage}
                alt={game.title}
                className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-100 truncate">{game.title}</div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span>{formatBytes(game.progress.downloadedBytes)} / {formatBytes(game.progress.totalBytes)}</span>
                  <span>•</span>
                  <span>ETA {formatEta(game.progress.etaSeconds)}</span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-24 sm:w-36 space-y-1">
              <div className="flex justify-between text-[10px] text-slate-300">
                <span>{game.progress.progressPercent}%</span>
                <span className="font-mono text-cyan-400">{formatSpeed(game.progress.downloadSpeedMBps)}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full"
                  style={{ width: `${game.progress.progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Pause / Resume button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePause(game.id);
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer flex-shrink-0"
            >
              {game.status === 'downloading' ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-cyan-400" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
