import React from 'react';
import { Search, Filter, Star, ArrowUpDown, X } from 'lucide-react';
import { DownloadStatus, FilterOptions } from '../types';

interface FilterBarProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  allGenres: string[];
  totalResults: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  allGenres,
  totalResults,
}) => {
  const statusTabs: { label: string; value: DownloadStatus | 'all' }[] = [
    { label: 'All Games', value: 'all' },
    { label: 'Downloading', value: 'downloading' },
    { label: 'Downloaded', value: 'downloaded' },
    { label: 'Installed', value: 'installed' },
    { label: 'Queued', value: 'queued' },
    { label: 'Archived', value: 'archived' },
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800 p-3.5 sm:p-4 rounded-xl mb-6 space-y-3.5">
      {/* Top Row: Search input & Status Pill Tabs */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Search game title, developer, or tag..."
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500/60 rounded-lg pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {statusTabs.map((tab) => {
            const isActive = filters.status === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setFilters((prev) => ({ ...prev, status: tab.value }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Row: Genre filter, Favorites, Sort dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Genre Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.genre}
              onChange={(e) => setFilters((prev) => ({ ...prev, genre: e.target.value }))}
              className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Genres</option>
              {allGenres.map((g) => (
                <option key={g} value={g} className="bg-slate-900">{g}</option>
              ))}
            </select>
          </div>

          {/* Favorites Filter */}
          <button
            onClick={() => setFilters((prev) => ({ ...prev, favoritesOnly: !prev.favoritesOnly }))}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
              filters.favoritesOnly
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 font-medium'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filters.favoritesOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>Favorites</span>
          </button>

          <span className="text-slate-500 text-[11px] hidden sm:inline">
            Showing {totalResults} game{totalResults !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 hidden sm:inline">Sort:</span>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }))}
              className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
            >
              <option value="dateAdded" className="bg-slate-900">Recently Added</option>
              <option value="title" className="bg-slate-900">Title (A-Z)</option>
              <option value="fileSize" className="bg-slate-900">File Size</option>
              <option value="progress" className="bg-slate-900">Download Progress</option>
            </select>
          </div>

          <button
            onClick={() => setFilters((prev) => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))}
            className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono"
            title={`Toggle ${filters.sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            {filters.sortOrder.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
};
