import React, { useState } from 'react';
import { 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  Star, 
  HardDrive, 
  Play, 
  Pause, 
  CheckCircle2, 
  Clock, 
  Layers,
  MoreVertical,
  Trash2,
  Folder
} from 'lucide-react';
import { Game, DownloadStatus } from '../types';
import { formatBytes, formatSpeed, formatEta } from '../utils/storage';
import { downloadGameToLocalDrive } from '../utils/localDrive';
import { triggerDirectDownload } from '../utils/indexedDBStorage';

interface GameCardProps {
  game: Game;
  onSelect: (game: Game) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onUpdateStatus: (id: string, newStatus: DownloadStatus, e: React.MouseEvent) => void;
  onDeleteGame: (id: string, e: React.MouseEvent) => void;
  onSimulateProgressToggle?: (id: string, e: React.MouseEvent) => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  onSelect,
  onToggleFavorite,
  onUpdateStatus,
  onDeleteGame,
  onSimulateProgressToggle,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const getStatusBadge = (status: DownloadStatus) => {
    switch (status) {
      case 'downloading':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            Downloading
          </span>
        );
      case 'downloaded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/40 backdrop-blur-md">
            <Download className="w-3 h-3 text-blue-400" />
            Downloaded
          </span>
        );
      case 'installed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Installed
          </span>
        );
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-zinc-800/80 text-zinc-300 border border-zinc-700 backdrop-blur-md">
            <Clock className="w-3 h-3 text-zinc-400" />
            Queued
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md">
            <Pause className="w-3 h-3 text-amber-400" />
            Paused
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40 backdrop-blur-md">
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      onClick={() => onSelect(game)}
      className="group relative bg-zinc-900 hover:bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-xl overflow-hidden shadow-lg transition-all duration-200 flex flex-col justify-between cursor-pointer"
    >
      {/* Upper Poster Image Banner */}
      <div className="relative aspect-[16/9] sm:aspect-[16/10] overflow-hidden bg-zinc-950">
        <img
          src={game.coverImage}
          alt={game.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent"></div>

        {/* Top Badges overlay */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 z-10">
          <div>{getStatusBadge(game.status)}</div>

          <div className="flex items-center gap-1.5">
            {/* Favorite Star */}
            <button
              onClick={(e) => onToggleFavorite(game.id, e)}
              className={`p-1.5 rounded-lg backdrop-blur-md border transition-all cursor-pointer ${
                game.favorite
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
              title={game.favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={`w-3.5 h-3.5 ${game.favorite ? 'fill-amber-400' : ''}`} />
            </button>

            {/* Quick Context Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 rounded-lg bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800 backdrop-blur-md cursor-pointer"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {showMenu && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-8 w-44 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 z-30 text-xs text-zinc-200"
                >
                  <div className="px-3 py-1 text-[10px] text-zinc-500 uppercase font-semibold">Change Status</div>
                  <button
                    onClick={(e) => {
                      onUpdateStatus(game.id, 'downloading', e);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" /> Set Downloading
                  </button>
                  <button
                    onClick={(e) => {
                      onUpdateStatus(game.id, 'installed', e);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Set Installed
                  </button>
                  <button
                    onClick={(e) => {
                      onUpdateStatus(game.id, 'queued', e);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <Clock className="w-3.5 h-3.5 text-zinc-400" /> Set Queued
                  </button>
                  <div className="border-t border-zinc-800 my-1"></div>
                  <button
                    onClick={(e) => {
                      onDeleteGame(game.id, e);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-red-500/10 text-red-400 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove from Library
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Size & Version at bottom of image */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-zinc-300 font-medium">
          <span className="truncate max-w-[60%] bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800 text-zinc-300">
            {game.version}
          </span>
          <span className="bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800 text-indigo-300 font-mono">
            {game.fileSize}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="font-bold text-zinc-100 text-sm sm:text-base group-hover:text-indigo-300 transition-colors line-clamp-1">
            {game.title}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
            {game.developer} {game.releaseYear ? `• ${game.releaseYear}` : ''}
          </p>

          {/* Genres Tags */}
          <div className="flex flex-wrap gap-1 mt-2">
            {game.genres.slice(0, 3).map((g) => (
              <span key={g} className="px-2 py-0.5 rounded bg-zinc-800/80 text-[10px] text-zinc-400 border border-zinc-700/50">
                {g}
              </span>
            ))}
          </div>
        </div>

        {/* Active Download Progress Bar (If downloading or paused) */}
        {(game.status === 'downloading' || game.status === 'paused') && (
          <div className="space-y-1.5 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-300 font-semibold">{game.progress.progressPercent}%</span>
              <span className="text-indigo-400 font-mono">
                {game.status === 'downloading' ? formatSpeed(game.progress.downloadSpeedMBps) : 'Paused'}
              </span>
            </div>
            
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  game.status === 'paused' ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                }`}
                style={{ width: `${game.progress.progressPercent}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-400">
              <span>{formatBytes(game.progress.downloadedBytes)} / {formatBytes(game.progress.totalBytes)}</span>
              <span>ETA: {formatEta(game.progress.etaSeconds)}</span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs gap-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5">
            {/* Primary Direct Download Button (Triggers direct download without leaving page) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onUpdateStatus && game.status !== 'installed') {
                  onUpdateStatus(game.id, 'downloading', e);
                }
                if (game.uploadedFiles && game.uploadedFiles.length > 0) {
                  triggerDirectDownload(game.uploadedFiles[0], game.mirrors[0]?.url || game.steamripUrl);
                } else {
                  downloadGameToLocalDrive(game);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              title="Start direct download without leaving page"
            >
              <Download className="w-3.5 h-3.5 fill-white" />
              <span>Download</span>
            </button>
          </div>

          {/* Open SteamRIP Page link */}
          <a
            href={game.steamripUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors cursor-pointer text-[11px] font-medium"
            title="Open SteamRIP Release Page"
          >
            <span>SteamRIP</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
