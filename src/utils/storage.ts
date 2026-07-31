import { Game } from '../types';
import { INITIAL_GAMES } from '../data/initialGames';

const STORAGE_KEY = 'steamrip_tracker_games_v1';

export function loadGames(): Game[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_GAMES));
      return INITIAL_GAMES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_GAMES;
  } catch (e) {
    console.error('Failed to load games from localStorage:', e);
    return INITIAL_GAMES;
  }
}

export function saveGames(games: Game[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  } catch (e) {
    console.error('Failed to save games to localStorage:', e);
  }
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatSpeed(mbps: number): string {
  if (mbps <= 0) return '0 MB/s';
  if (mbps >= 1000) return `${(mbps / 1000).toFixed(1)} GB/s`;
  return `${mbps.toFixed(1)} MB/s`;
}

export function formatEta(seconds: number): string {
  if (seconds <= 0 || !isFinite(seconds)) return 'Done / Paused';
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  }
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs}h ${mins}m`;
}
