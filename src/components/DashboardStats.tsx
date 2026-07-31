import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, 
  DownloadCloud, 
  CheckCircle2, 
  HardDrive, 
  Zap,
  FolderOpen,
  AlertTriangle,
} from 'lucide-react';
import { LibraryStats } from '../types';
import { formatBytes, formatSpeed } from '../utils/storage';

interface DashboardStatsProps {
  stats: LibraryStats;
  linkedDrivePath?: string;
  onFilterStatus?: (status: any) => void;
  onOpenLocalDriveModal?: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ 
  stats, 
  linkedDrivePath = 'D:\\Games\\SteamRIP',
  onFilterStatus,
  onOpenLocalDriveModal
}) => {
  const [deviceQuotaBytes, setDeviceQuotaBytes] = useState<number | null>(null);

  // Fetch storage estimate from navigator.storage if supported
  useEffect(() => {
    if (navigator.storage && typeof navigator.storage.estimate === 'function') {
      navigator.storage.estimate().then((est) => {
        if (est.quota && est.quota > 0) {
          setDeviceQuotaBytes(est.quota);
        }
      }).catch(() => {});
    }
  }, []);

  // Compute storage measurements
  // Standard disk drive capacity default: 1 TB (1000 GB) or navigator quota if larger
  const baseCapacity = deviceQuotaBytes && deviceQuotaBytes > 50 * 1024 * 1024 * 1024 
    ? deviceQuotaBytes 
    : 1000 * 1024 * 1024 * 1024; // 1 TB default

  // Scale capacity up if library total bytes exceed base capacity so chart remains valid
  const totalDriveCapacityBytes = Math.max(baseCapacity, Math.ceil(stats.totalStorageBytes * 1.25));

  const installedBytes = stats.installedStorageBytes || 0;
  const uninstalledLibraryBytes = Math.max(0, stats.totalStorageBytes - installedBytes);
  const totalLibraryBytes = stats.totalStorageBytes;

  const remainingFreeBytes = Math.max(0, totalDriveCapacityBytes - totalLibraryBytes);

  // Percentage calculations
  const installedPercent = (installedBytes / totalDriveCapacityBytes) * 100;
  const uninstalledPercent = (uninstalledLibraryBytes / totalDriveCapacityBytes) * 100;
  const freePercent = (remainingFreeBytes / totalDriveCapacityBytes) * 100;
  const usedPercent = (totalLibraryBytes / totalDriveCapacityBytes) * 100;

  const isLowSpace = freePercent < 15;

  return (
    <div className="space-y-4 mb-6">
      {/* 4 Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Library Games */}
        <div 
          onClick={() => onFilterStatus && onFilterStatus('all')}
          className="bg-zinc-900/70 border border-zinc-800/90 hover:border-indigo-500/50 p-4 rounded-xl transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200">Total Games</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Gamepad2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-100">{stats.totalGames}</span>
            <span className="text-xs text-zinc-400">in library</span>
          </div>
        </div>

        {/* Active Downloads */}
        <div 
          onClick={() => onFilterStatus && onFilterStatus('downloading')}
          className="bg-zinc-900/70 border border-zinc-800/90 hover:border-cyan-500/50 p-4 rounded-xl transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 group-hover:text-cyan-300">Active Downloads</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <DownloadCloud className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-cyan-400">{stats.activeDownloads}</span>
              <span className="text-xs text-zinc-400">downloading</span>
            </div>
            {stats.currentBandwidthMBps > 0 && (
              <div className="flex items-center gap-1 text-xs font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                <Zap className="w-3 h-3 text-cyan-400" />
                {formatSpeed(stats.currentBandwidthMBps)}
              </div>
            )}
          </div>
        </div>

        {/* Installed Games */}
        <div 
          onClick={() => onFilterStatus && onFilterStatus('installed')}
          className="bg-zinc-900/70 border border-zinc-800/90 hover:border-emerald-500/50 p-4 rounded-xl transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 group-hover:text-emerald-300">Installed Games</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">{stats.installedGames}</span>
            <span className="text-xs text-zinc-400">ready to play</span>
          </div>
        </div>

        {/* Total Storage Used Tile */}
        <div 
          onClick={onOpenLocalDriveModal}
          className="bg-zinc-900/70 border border-zinc-800/90 hover:border-violet-500/50 p-4 rounded-xl transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 group-hover:text-violet-300">Storage Allocated</span>
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-zinc-100">{formatBytes(stats.totalStorageBytes)}</span>
              <span className="text-xs text-zinc-400">total games</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
              {formatBytes(remainingFreeBytes)} Free
            </span>
          </div>
        </div>
      </div>

      {/* Local Drive Storage Progress Chart Panel */}
      <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        {/* Drive Header Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 text-indigo-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-zinc-100">Linked Local Drive Storage</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-indigo-300 border border-zinc-700/80">
                  {linkedDrivePath}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Remaining drive space vs total library game file allocation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {onOpenLocalDriveModal && (
              <button
                onClick={onOpenLocalDriveModal}
                className="px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>Configure Drive</span>
              </button>
            )}
          </div>
        </div>

        {/* Visual Progress Bar Section */}
        <div className="space-y-2">
          {/* Metrics summary line */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-zinc-200">Drive Capacity Usage</span>
              <span className="text-zinc-500">•</span>
              <span className="font-mono text-emerald-400 font-bold">
                {formatBytes(remainingFreeBytes)} Remaining
              </span>
              <span className="text-zinc-400 text-[11px]">({freePercent.toFixed(1)}% Free)</span>
            </div>
            <div className="text-zinc-400 font-mono text-[11px]">
              <span className="text-zinc-200 font-bold">{formatBytes(totalLibraryBytes)}</span> / {formatBytes(totalDriveCapacityBytes)} Total
            </div>
          </div>

          {/* Multi-segment Stacked Progress Bar */}
          <div className="w-full h-4 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800 flex relative group cursor-pointer" title={`Drive Usage: ${usedPercent.toFixed(1)}% used, ${freePercent.toFixed(1)}% free`}>
            {/* Installed games segment */}
            <div
              style={{ width: `${installedPercent}%` }}
              className="h-full bg-emerald-500 rounded-l-full transition-all duration-500 hover:brightness-110 relative"
              title={`Installed Games: ${formatBytes(installedBytes)} (${installedPercent.toFixed(1)}% of drive)`}
            />
            {/* Uninstalled / In-Library games segment */}
            <div
              style={{ width: `${uninstalledPercent}%` }}
              className="h-full bg-indigo-500 transition-all duration-500 hover:brightness-110 relative"
              title={`In-Library Games: ${formatBytes(uninstalledLibraryBytes)} (${uninstalledPercent.toFixed(1)}% of drive)`}
            />
            {/* Free Space segment */}
            <div
              style={{ width: `${freePercent}%` }}
              className="h-full bg-zinc-800/90 rounded-r-full transition-all duration-500 hover:bg-zinc-750 relative"
              title={`Remaining Free Drive Space: ${formatBytes(remainingFreeBytes)} (${freePercent.toFixed(1)}% of drive)`}
            />
          </div>

          {/* Interactive Legend & Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
            {/* Installed games legend */}
            <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                <div className="text-xs">
                  <div className="font-semibold text-zinc-200">Installed Games</div>
                  <div className="text-[10px] text-zinc-400 font-mono">{formatBytes(installedBytes)}</div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {installedPercent.toFixed(1)}%
              </span>
            </div>

            {/* Uninstalled / In-Library legend */}
            <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500 flex-shrink-0" />
                <div className="text-xs">
                  <div className="font-semibold text-zinc-200">Library Archives</div>
                  <div className="text-[10px] text-zinc-400 font-mono">{formatBytes(uninstalledLibraryBytes)}</div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-400">
                {uninstalledPercent.toFixed(1)}%
              </span>
            </div>

            {/* Remaining Free Space legend */}
            <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-zinc-700 flex-shrink-0" />
                <div className="text-xs">
                  <div className="font-semibold text-zinc-200">Remaining Free Space</div>
                  <div className="text-[10px] text-zinc-400 font-mono">{formatBytes(remainingFreeBytes)}</div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-zinc-300">
                {freePercent.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Low space warning banner */}
          {isLowSpace && (
            <div className="mt-2 p-3 rounded-xl bg-amber-950/50 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                <strong>Low Storage Warning:</strong> Less than 15% free space remaining on linked drive ({formatBytes(remainingFreeBytes)} free). Consider cleaning installed games or configuring a secondary local drive folder.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
