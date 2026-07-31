import React, { useState } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  Star, 
  ShieldCheck, 
  HardDrive, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Cpu, 
  FolderOpen,
  Edit3,
  Save,
  Globe,
  Trash2,
  UploadCloud,
  FileArchive,
  Server,
  AlertCircle
} from 'lucide-react';
import { Game, DownloadStatus, UploadedFile } from '../types';
import { formatBytes, formatSpeed, formatEta } from '../utils/storage';
import { downloadGameToLocalDrive, triggerMirrorDownload } from '../utils/localDrive';
import { storeGameFileInIndexedDB, triggerDirectDownload } from '../utils/indexedDBStorage';

interface GameDetailModalProps {
  game: Game | null;
  onClose: () => void;
  onUpdateGame: (updatedGame: Game) => void;
  onDeleteGame: (id: string) => void;
  directoryHandle?: any;
  linkedDrivePath?: string;
}

export const GameDetailModal: React.FC<GameDetailModalProps> = ({
  game,
  onClose,
  onUpdateGame,
  onDeleteGame,
  directoryHandle,
  linkedDrivePath,
}) => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'mirrors' | 'sysreq' | 'notes' | 'storage'>('overview');
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);

  // File Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<'server' | 'indexeddb'>('server');
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');
  const [uploadErrorMsg, setUploadErrorMsg] = useState('');

  // Editing state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(game?.userNotes || '');
  const [userRating, setUserRating] = useState(game?.rating || 5);
  const [targetFolderInput, setTargetFolderInput] = useState(game?.targetFolder || linkedDrivePath || 'D:\\Games');

  if (!game) return null;

  const handleDownloadToDrive = async () => {
    // If the game has uploaded binary files attached, download the first uploaded file directly!
    if (game.uploadedFiles && game.uploadedFiles.length > 0) {
      triggerDirectDownload(game.uploadedFiles[0], game.mirrors[0]?.url || game.steamripUrl);
      setDownloadSuccessToast(true);
      setTimeout(() => setDownloadSuccessToast(false), 3500);
      return;
    }
    const success = await downloadGameToLocalDrive(game, directoryHandle);
    if (success) {
      setDownloadSuccessToast(true);
      setTimeout(() => setDownloadSuccessToast(false), 3500);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setUploadStatusMsg(`Uploading "${file.name}" (${formatBytes(file.size)})...`);
    setUploadErrorMsg('');

    try {
      let newUploadedFile: UploadedFile;

      if (uploadTarget === 'server') {
        const formData = new FormData();
        formData.append('gameFile', file);
        formData.append('gameId', game.id);

        const res = await fetch('/api/upload-game-file', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Server upload failed, falling back to local database.');
        }

        newUploadedFile = data.file;
      } else {
        // Fallback to client-side IndexedDB database storage
        newUploadedFile = await storeGameFileInIndexedDB(game.id, file);
      }

      const existingFiles = game.uploadedFiles || [];
      const updatedFiles = [newUploadedFile, ...existingFiles];

      onUpdateGame({
        ...game,
        uploadedFiles: updatedFiles,
        lastUpdated: new Date().toISOString(),
      });

      setUploadStatusMsg(`Successfully uploaded "${file.name}"!`);
      setTimeout(() => setUploadStatusMsg(''), 4000);
    } catch (err: any) {
      console.warn('Server upload issue, storing in local browser database instead:', err);
      try {
        const idbFile = await storeGameFileInIndexedDB(game.id, file);
        const existingFiles = game.uploadedFiles || [];
        onUpdateGame({
          ...game,
          uploadedFiles: [idbFile, ...existingFiles],
          lastUpdated: new Date().toISOString(),
        });
        setUploadStatusMsg(`Stored "${file.name}" in Local IndexedDB Database!`);
        setTimeout(() => setUploadStatusMsg(''), 4000);
      } catch (idbErr: any) {
        setUploadErrorMsg(idbErr.message || 'Upload failed.');
      }
    } finally {
      setIsUploading(false);
      // Reset input value
      e.target.value = '';
    }
  };

  const handleCopyMirrorUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleToggleStatus = (newStatus: DownloadStatus) => {
    const isFinished = newStatus === 'installed' || newStatus === 'downloaded';
    const total = game.fileSizeBytes || 50000000000;

    const updated: Game = {
      ...game,
      status: newStatus,
      progress: {
        ...game.progress,
        progressPercent: isFinished ? 100 : newStatus === 'downloading' ? (game.progress.progressPercent || 10) : game.progress.progressPercent,
        downloadedBytes: isFinished ? total : Math.round(total * ((game.progress.progressPercent || 10) / 100)),
        downloadSpeedMBps: newStatus === 'downloading' ? 28.5 : 0,
      },
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    onUpdateGame(updated);
  };

  const handleSimulateDownloadStep = (increment: number) => {
    const total = game.fileSizeBytes || 50000000000;
    let nextPercent = Math.min(100, (game.progress.progressPercent || 0) + increment);
    const isFinished = nextPercent >= 100;

    const updated: Game = {
      ...game,
      status: isFinished ? 'downloaded' : 'downloading',
      progress: {
        ...game.progress,
        progressPercent: nextPercent,
        downloadedBytes: Math.round(total * (nextPercent / 100)),
        downloadSpeedMBps: isFinished ? 0 : 32.4,
        etaSeconds: isFinished ? 0 : Math.round((total * (1 - nextPercent / 100)) / (32.4 * 1024 * 1024)),
      },
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    onUpdateGame(updated);
  };

  const handleSaveNotes = () => {
    onUpdateGame({
      ...game,
      userNotes: notesText,
      rating: userRating,
      targetFolder: targetFolderInput,
      lastUpdated: new Date().toISOString().split('T')[0],
    });
    setIsEditingNotes(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Banner Hero */}
        <div className="relative h-48 sm:h-64 overflow-hidden bg-zinc-950">
          <img
            src={game.coverImage}
            alt={game.title}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent"></div>

          {/* Top Header Buttons */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <a
              href={game.steamripUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950/70 hover:bg-zinc-950 text-indigo-300 text-xs font-semibold backdrop-blur-md border border-indigo-500/30 transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>SteamRIP Page</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-950/70 hover:bg-zinc-950 text-zinc-300 backdrop-blur-md border border-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom Title Overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 backdrop-blur-md">
                  {game.version}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-zinc-950/80 text-zinc-300 border border-zinc-800 backdrop-blur-md">
                  {game.fileSize}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {game.title}
              </h2>
              <p className="text-xs text-zinc-300">
                {game.developer} {game.publisher ? `• ${game.publisher}` : ''}
              </p>
            </div>

            {/* Quick Rating Stars */}
            <div className="flex items-center gap-1 bg-zinc-950/70 p-2 rounded-xl backdrop-blur-md border border-zinc-800">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => {
                    setUserRating(star);
                    onUpdateGame({ ...game, rating: star });
                  }}
                  className="cursor-pointer"
                >
                  <Star
                    className={`w-4 h-4 ${
                      star <= (game.rating || userRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-zinc-600 hover:text-amber-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Status Control Panel Bar */}
        <div className="bg-zinc-950/80 p-4 border-b border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Download Control Progress */}
          <div className="flex-1 w-full space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Status & Download State:</span>
              <span className="font-semibold text-indigo-300">{game.progress.progressPercent}% Completed</span>
            </div>

            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                style={{ width: `${game.progress.progressPercent}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <span>{formatBytes(game.progress.downloadedBytes)} / {formatBytes(game.progress.totalBytes)}</span>
              {game.status === 'downloading' && (
                <span className="text-indigo-400">{formatSpeed(game.progress.downloadSpeedMBps)} • ETA {formatEta(game.progress.etaSeconds)}</span>
              )}
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={handleDownloadToDrive}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-indigo-300 font-semibold text-xs border border-indigo-500/40 flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              title={`Download game files/manifest to ${linkedDrivePath || 'Local Drive'}`}
            >
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              <span>Save to Linked Drive</span>
            </button>

            {game.status === 'downloading' ? (
              <>
                <button
                  onClick={() => handleSimulateDownloadStep(25)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-semibold hover:bg-indigo-500/30 transition-colors cursor-pointer"
                >
                  +25% Progress
                </button>
                <button
                  onClick={() => handleToggleStatus('paused')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" /> Pause
                </button>
              </>
            ) : game.status === 'paused' || game.status === 'queued' ? (
              <button
                onClick={() => handleToggleStatus('downloading')}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Start Download
              </button>
            ) : game.status === 'downloaded' ? (
              <button
                onClick={() => handleToggleStatus('installed')}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Installed
              </button>
            ) : (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Installed & Ready
              </span>
            )}
          </div>
        </div>

        {downloadSuccessToast && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/40 text-emerald-300 px-6 py-2 text-xs flex items-center justify-between font-medium animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Target game package written to <strong>{linkedDrivePath || 'Local Drive'}</strong>!</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">Password: steamrip.com</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-900 px-6 text-xs font-medium text-zinc-400">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview' ? 'border-indigo-500 text-indigo-300 font-semibold' : 'border-transparent hover:text-zinc-200'
            }`}
          >
            Overview & Release Info
          </button>
          <button
            onClick={() => setActiveTab('mirrors')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'mirrors' ? 'border-indigo-500 text-indigo-300 font-semibold' : 'border-transparent hover:text-zinc-200'
            }`}
          >
            Download Mirrors ({game.mirrors.length})
          </button>
          <button
            onClick={() => setActiveTab('sysreq')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'sysreq' ? 'border-indigo-500 text-indigo-300 font-semibold' : 'border-transparent hover:text-zinc-200'
            }`}
          >
            System Requirements
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'notes' ? 'border-indigo-500 text-indigo-300 font-semibold' : 'border-transparent hover:text-zinc-200'
            }`}
          >
            Notes & Location
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'storage' ? 'border-indigo-500 text-indigo-300 font-semibold' : 'border-transparent hover:text-zinc-200'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
            <span>Hosted Files ({game.uploadedFiles?.length || 0})</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="p-6 space-y-5 max-h-[50vh] overflow-y-auto text-xs text-zinc-300">
          {activeTab === 'storage' && (
            <div className="space-y-5">
              {/* Storage Upload Container */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <UploadCloud className="w-4 h-4 text-indigo-400" />
                      <span>Upload Game Package File</span>
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      Upload full game archives (.zip, .rar, .7z, .exe, .iso) to store directly in the database for single-click in-page downloading.
                    </p>
                  </div>

                  {/* Storage Location Selector */}
                  <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setUploadTarget('server')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        uploadTarget === 'server' ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Server Disk
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadTarget('indexeddb')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        uploadTarget === 'indexeddb' ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      IndexedDB
                    </button>
                  </div>
                </div>

                {/* Upload Input Area */}
                <label className="border-2 border-dashed border-zinc-700/80 hover:border-indigo-500/80 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors bg-zinc-950/50 group">
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    accept=".zip,.rar,.7z,.iso,.exe,.bin,.torrent,.tar,.gz"
                  />
                  <UploadCloud className="w-7 h-7 text-indigo-400 group-hover:scale-110 transition-transform mb-2" />
                  <span className="text-xs font-semibold text-zinc-200 group-hover:text-indigo-300">
                    {isUploading ? 'Uploading file...' : 'Click or Drag & Drop Game Archive File Here'}
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-1 font-mono">
                    Supports .ZIP, .RAR, .7Z, .ISO, .EXE, .TORRENT (Unlimited size)
                  </span>
                </label>

                {uploadStatusMsg && (
                  <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span>{uploadStatusMsg}</span>
                  </div>
                )}

                {uploadErrorMsg && (
                  <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span>{uploadErrorMsg}</span>
                  </div>
                )}
              </div>

              {/* Uploaded Files List */}
              <div>
                <h4 className="text-xs font-bold text-zinc-300 mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
                  <FileArchive className="w-4 h-4 text-indigo-400" />
                  <span>Hosted Game Files ({game.uploadedFiles?.length || 0})</span>
                </h4>

                {!game.uploadedFiles || game.uploadedFiles.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-zinc-950 border border-zinc-800/60 text-zinc-500 text-xs">
                    No custom game archive files uploaded yet. Use the area above to attach full game files directly!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {game.uploadedFiles.map((f) => (
                      <div
                        key={f.id}
                        className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3 hover:border-zinc-700 transition-all"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                            <FileArchive className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div className="overflow-hidden">
                            <div className="font-semibold text-zinc-200 truncate text-xs">{f.originalName}</div>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono mt-0.5">
                              <span>{formatBytes(f.sizeBytes)}</span>
                              <span>•</span>
                              <span className="capitalize">{new Date(f.uploadedAt).toLocaleDateString()}</span>
                              <span>•</span>
                              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-indigo-300 text-[9px] border border-zinc-700">
                                {f.storageType === 'indexeddb' ? 'IndexedDB Local' : 'Server Storage'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Direct Download Button (No new tab) */}
                        <button
                          onClick={() => triggerDirectDownload(f, game.steamripUrl)}
                          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 transition-all flex-shrink-0"
                          title="Direct Download File without opening a new tab"
                        >
                          <Download className="w-3.5 h-3.5 fill-white" />
                          <span>Direct Download</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Game Genres Tags */}
              <div>
                <span className="text-zinc-400 font-medium block mb-1.5">Genres / Categories:</span>
                <div className="flex flex-wrap gap-1.5">
                  {game.genres.map((g) => (
                    <span key={g} className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              {/* Overview Description */}
              <div>
                <span className="text-zinc-400 font-medium block mb-1">About this Release:</span>
                <p className="leading-relaxed text-zinc-300 bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
                  {game.overview}
                </p>
              </div>

              {/* DLC Included */}
              {game.dlcIncluded && game.dlcIncluded.length > 0 && (
                <div>
                  <span className="text-zinc-400 font-medium block mb-1.5">Included DLCs & Bonus Content:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {game.dlcIncluded.map((dlc) => (
                      <div key={dlc} className="flex items-center gap-2 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 text-zinc-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                        <span>{dlc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'mirrors' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-zinc-400">Direct Download Host Links from SteamRIP:</p>
                <span className="text-[11px] text-zinc-500">Fast CDN Mirrors</span>
              </div>

              <div className="space-y-2">
                {game.mirrors.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Download className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-200 flex items-center gap-2">
                          <span>{m.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-indigo-300 border border-zinc-700">
                            {m.type} • {m.speedLabel}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono truncate max-w-xs sm:max-w-md">
                          {m.url}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyMirrorUrl(m.url)}
                        className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                        title="Copy direct mirror URL"
                      >
                        {copiedUrl === m.url ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          const urlFileName = m.url.split('/').pop()?.split('?')[0];
                          const filename = urlFileName && (urlFileName.endsWith('.zip') || urlFileName.endsWith('.rar') || urlFileName.endsWith('.7z') || urlFileName.endsWith('.iso') || urlFileName.endsWith('.exe')) ? urlFileName : `${game.title}_${m.name}.zip`;
                          triggerMirrorDownload(m.url, filename);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-sm shadow-indigo-600/20"
                        title="Download directly from mirror without opening a new tab"
                      >
                        <Download className="w-3.5 h-3.5 fill-white" />
                        <span>Download</span>
                      </button>
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                        title="Open mirror webpage in external tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sysreq' && (
            <div className="space-y-4">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                  <Cpu className="w-4 h-4" />
                  <span>Minimum System Requirements</span>
                </div>
                <p className="text-zinc-300 leading-relaxed font-mono text-[11px]">
                  {game.systemRequirements?.minimum || 'OS: Windows 10 | CPU: Quad-Core 2.5 GHz | RAM: 8 GB | GPU: GTX 1060'}
                </p>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <Cpu className="w-4 h-4" />
                  <span>Recommended System Requirements</span>
                </div>
                <p className="text-zinc-300 leading-relaxed font-mono text-[11px]">
                  {game.systemRequirements?.recommended || 'OS: Windows 11 | CPU: Hexa-Core 3.5 GHz | RAM: 16 GB | GPU: RTX 3060'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              {/* Target Installation Directory */}
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Target Storage Path / Game Folder:</label>
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-indigo-400" />
                  <input
                    type="text"
                    value={targetFolderInput}
                    onChange={(e) => setTargetFolderInput(e.target.value)}
                    placeholder="e.g. D:\Games\Cyberpunk2077"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Personal Notes */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-400 font-medium">Personal Notes / Setup Instructions:</label>
                </div>
                <textarea
                  rows={4}
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Add setup notes, extract locations, controller configs, or DLC notes..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveNotes}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Notes & Location</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/40">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to remove this game from your personal library?')) {
                onDeleteGame(game.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 text-xs font-medium cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Remove Game</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
