export type DownloadStatus = 
  | 'queued' 
  | 'downloading' 
  | 'downloaded' 
  | 'installing' 
  | 'installed' 
  | 'paused' 
  | 'archived';

export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  nickname?: string;
  aboutMe?: string;
  email: string;
  avatarUrl: string;
  role: UserRole;
  linkedDrivePath: string;
  password?: string;
  createdAt: string;
}

export interface MirrorLink {
  id: string;
  name: string; // e.g. "Buzzheavier", "MegaDB", "GoFile", "Qiwi", "Torrent"
  type: 'Direct' | 'P2P' | 'Cloud';
  speedLabel: 'Ultra' | 'Fast' | 'Medium' | 'Varies';
  url: string;
  isWorking?: boolean;
}

export interface SystemRequirements {
  minimum: string;
  recommended: string;
}

export interface DownloadProgress {
  downloadedBytes: number;
  totalBytes: number;
  downloadSpeedMBps: number; // e.g., 24.5 MB/s
  etaSeconds: number; // estimated time remaining
  progressPercent: number; // 0 to 100
  activeMirrorId?: string;
  targetFolder?: string;
}

export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string;
  downloadUrl: string;
  storageType?: 'server' | 'indexeddb';
}

export interface Game {
  id: string;
  title: string;
  version: string;
  fileSize: string;
  fileSizeBytes: number;
  steamripUrl: string;
  developer: string;
  publisher?: string;
  releaseYear?: string;
  genres: string[];
  overview: string;
  coverImage: string;
  extractionPassword?: string;
  systemRequirements: SystemRequirements;
  mirrors: MirrorLink[];
  status: DownloadStatus;
  progress: DownloadProgress;
  rating?: number; // 1-5
  favorite?: boolean;
  userNotes?: string;
  targetFolder?: string; // e.g. "D:\Games\Cyberpunk2077"
  dateAdded: string;
  lastUpdated: string;
  tags?: string[];
  dlcIncluded?: string[];
  uploadedFiles?: UploadedFile[];
}

export interface LibraryStats {
  totalGames: number;
  activeDownloads: number;
  completedDownloads: number;
  installedGames: number;
  totalStorageBytes: number;
  installedStorageBytes?: number;
  currentBandwidthMBps: number;
}

export type ViewMode = 'grid' | 'list' | 'compact';

export interface FilterOptions {
  search: string;
  status: DownloadStatus | 'all';
  genre: string | 'all';
  sortBy: 'dateAdded' | 'title' | 'fileSize' | 'progress';
  sortOrder: 'asc' | 'desc';
  favoritesOnly: boolean;
}
