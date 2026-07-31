import React, { useState } from 'react';
import { 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  Star, 
  CheckCircle2, 
  Clock, 
  MoreHorizontal,
  Trash2,
  HardDrive
} from 'lucide-react';
import { Game, DownloadStatus } from '../types';
import { formatBytes, formatSpeed } from '../utils/storage';
import { downloadGameToLocalDrive } from '../utils/localDrive';
import { triggerDirectDownload } from '../utils/indexedDBStorage';

interface GameTableRowProps {
  game: Game;
  onSelect: (game: Game) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onUpdateStatus: (id: string, newStatus: DownloadStatus, e: React.MouseEvent) => void;
  onDeleteGame: (id: string, e: React.MouseEvent) => void;
}

export const GameTableRow: React.FC<GameTableRowProps> = ({
  game,
  onSelect,
  onToggleFavorite,
  onUpdateStatus,
  onDeleteGame,
}) => {
  return (
    <tr 
      onClick={() => onSelect(game)}
      className="border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors cursor-pointer text-xs sm:text-sm text-zinc-200 group"
    >
      {/* Favorite Star */}
      <td className="py-3 px-3 w-10 text-center" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => onToggleFavorite(game.id, e)}
          className="text-zinc-500 hover:text-amber-400 cursor-pointer"
        >
          <Star className={`w-4 h-4 ${game.favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
        </button>
      </td>

      {/* Game Title & Cover thumbnail */}
      <td className="py-3 px-3">
        <div className="flex items-center gap-3">
          <img
            src={game.coverImage}
            alt={game.title}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover bg-zinc-950 border border-zinc-800"
          />
          <div>
            <div className="font-semibold text-zinc-100 group-hover:text-indigo-300 transition-colors">
              {game.title}
            </div>
            <div className="text-xs text-zinc-400 flex items-center gap-2">
              <span>{game.developer}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400 truncate max-w-[200px]">{game.version}</span>
            </div>
          </div>
        </div>
      </td>

      {/* Status Selector */}
      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
        <select
          value={game.status}
          onChange={(e) => onUpdateStatus(game.id, e.target.value as DownloadStatus, e)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium outline-none cursor-pointer border ${
            game.status === 'downloading'
              ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
              : game.status === 'installed'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : game.status === 'downloaded'
              ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
              : 'bg-zinc-950/60 text-zinc-400 border-zinc-800'
          }`}
        >
          <option value="queued" className="bg-zinc-900 text-zinc-200">Queued</option>
          <option value="downloading" className="bg-zinc-900 text-indigo-300">Downloading</option>
          <option value="downloaded" className="bg-zinc-900 text-blue-300">Downloaded</option>
          <option value="installed" className="bg-zinc-900 text-emerald-300">Installed</option>
          <option value="paused" className="bg-zinc-900 text-amber-300">Paused</option>
          <option value="archived" className="bg-zinc-900 text-zinc-400">Archived</option>
        </select>
      </td>

      {/* File Size */}
      <td className="py-3 px-3 font-mono text-xs text-zinc-300 whitespace-nowrap">
        {game.fileSize}
      </td>

      {/* Download Progress */}
      <td className="py-3 px-3 min-w-[140px]">
        {game.status === 'downloading' || game.status === 'paused' ? (
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="font-semibold text-indigo-300">{game.progress.progressPercent}%</span>
              <span className="font-mono text-zinc-400">{formatSpeed(game.progress.downloadSpeedMBps)}</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${game.progress.progressPercent}%` }}
              ></div>
            </div>
          </div>
        ) : game.status === 'installed' ? (
          <div className="text-emerald-400 text-xs flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ready
          </div>
        ) : (
          <span className="text-zinc-500 text-xs">—</span>
        )}
      </td>

      {/* Direct Download & SteamRIP Link */}
      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateStatus(game.id, 'downloading', e);
              if (game.uploadedFiles && game.uploadedFiles.length > 0) {
                triggerDirectDownload(game.uploadedFiles[0], game.mirrors[0]?.url || game.steamripUrl);
              } else {
                downloadGameToLocalDrive(game);
              }
            }}
            className="px-2.5 py-1 inline-flex items-center gap-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer text-xs shadow-sm"
            title="Download directly to linked drive"
          >
            <Download className="w-3.5 h-3.5 fill-white" />
            <span>Download</span>
          </button>

          <a
            href={game.steamripUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 inline-flex items-center rounded bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer text-xs"
            title="Open SteamRIP game page"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </td>

      {/* Actions */}
      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => onDeleteGame(game.id, e)}
          className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
          title="Remove from library"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};
