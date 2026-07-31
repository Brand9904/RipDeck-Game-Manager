import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Link as LinkIcon, 
  Check, 
  AlertCircle, 
  Download, 
  Folder, 
  HardDrive,
  ShieldCheck,
  Plus,
  Trash2
} from 'lucide-react';
import { Game, DownloadStatus, MirrorLink } from '../types';

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGame: (newGame: Game) => void;
}

export const AddGameModal: React.FC<AddGameModalProps> = ({
  isOpen,
  onClose,
  onAddGame,
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Form State for parsed or manual entry
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [steamripUrl, setSteamripUrl] = useState('');
  const [developer, setDeveloper] = useState('');
  const [genres, setGenres] = useState<string[]>(['Action', 'RPG']);
  const [overview, setOverview] = useState('');
  const [status, setStatus] = useState<DownloadStatus>('downloading');
  const [targetFolder, setTargetFolder] = useState('D:\\Games');
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80');
  const [mirrors, setMirrors] = useState<MirrorLink[]>([
    { id: '1', name: 'Buzzheavier', type: 'Direct', speedLabel: 'Ultra', url: 'https://buzzheavier.com/f/game_dl', isWorking: true },
    { id: '2', name: 'GoFile', type: 'Direct', speedLabel: 'Fast', url: 'https://gofile.io/d/steamrip_dl', isWorking: true },
    { id: '3', name: 'Torrent (P2P)', type: 'P2P', speedLabel: 'Varies', url: 'https://steamrip.com/torrents/game.torrent', isWorking: true },
  ]);

  const [hasParsed, setHasParsed] = useState(false);

  if (!isOpen) return null;

  const handleParseLink = async (overrideInput?: string) => {
    const query = overrideInput || inputUrl;
    if (!query.trim()) {
      setParseError('Please enter a SteamRIP link or game title.');
      return;
    }

    setIsParsing(true);
    setParseError(null);

    try {
      const res = await fetch('/api/parse-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: query.startsWith('http') ? query : undefined,
          gameTitle: !query.startsWith('http') ? query : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to parse SteamRIP details.');
      }

      const data = json.data;
      setTitle(data.title || 'Unknown Game');
      setVersion(data.version || 'v1.0');
      setFileSize(data.fileSize || '25.0 GB');
      setSteamripUrl(data.steamripUrl || query);
      setDeveloper(data.developer || 'Game Studio');
      setGenres(data.genres || ['Action']);
      setOverview(data.overview || 'SteamRIP PC release.');
      
      if (data.mirrors && data.mirrors.length > 0) {
        setMirrors(data.mirrors.map((m: any, idx: number) => ({ ...m, id: String(idx + 1) })));
      }

      // Pick a relevant cover unsplash image
      const randomCovers = [
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80',
      ];
      setCoverImage(randomCovers[Math.floor(Math.random() * randomCovers.length)]);
      setHasParsed(true);
    } catch (err: any) {
      console.error(err);
      setParseError(err.message || 'Error communicating with AI parser service.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleAddMirror = () => {
    setMirrors([
      ...mirrors,
      { id: String(Date.now()), name: 'MegaDB', type: 'Direct', speedLabel: 'Fast', url: 'https://megadb.net/v/download', isWorking: true }
    ]);
  };

  const handleRemoveMirror = (id: string) => {
    setMirrors(mirrors.filter(m => m.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Parse estimated bytes
    const match = fileSize.match(/([\d.]+)\s*(GB|MB|TB)/i);
    let sizeBytes = 25000000000;
    if (match) {
      const val = parseFloat(match[1]);
      const unit = match[2].toUpperCase();
      if (unit === 'GB') sizeBytes = val * 1024 * 1024 * 1024;
      else if (unit === 'TB') sizeBytes = val * 1024 * 1024 * 1024 * 1024;
      else if (unit === 'MB') sizeBytes = val * 1024 * 1024;
    }

    const newGame: Game = {
      id: `game-${Date.now()}`,
      title: title.trim(),
      version: version.trim() || 'v1.0',
      fileSize: fileSize.trim() || '20.0 GB',
      fileSizeBytes: Math.round(sizeBytes),
      steamripUrl: steamripUrl.trim() || 'https://steamrip.com/',
      developer: developer.trim() || 'Game Studio',
      genres: genres.length > 0 ? genres : ['Action'],
      overview: overview.trim() || 'Added from SteamRIP link parser.',
      coverImage,
      systemRequirements: {
        minimum: 'OS: Windows 10 64-bit | CPU: Quad-Core 2.5 GHz | RAM: 8 GB | GPU: GTX 1060 / RX 580',
        recommended: 'OS: Windows 11 64-bit | CPU: Hexa-Core 3.5 GHz | RAM: 16 GB | GPU: RTX 3060 / RX 6700',
      },
      mirrors,
      status,
      progress: {
        downloadedBytes: status === 'installed' || status === 'downloaded' ? Math.round(sizeBytes) : status === 'downloading' ? Math.round(sizeBytes * 0.25) : 0,
        totalBytes: Math.round(sizeBytes),
        downloadSpeedMBps: status === 'downloading' ? 24.5 : 0,
        etaSeconds: status === 'downloading' ? 850 : 0,
        progressPercent: status === 'installed' || status === 'downloaded' ? 100 : status === 'downloading' ? 25 : 0,
        targetFolder,
      },
      targetFolder,
      dateAdded: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      favorite: false,
    };

    onAddGame(newGame);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-base">Add SteamRIP Game Link</h2>
              <p className="text-xs text-slate-400">Paste SteamRIP URL or game title for automatic parsing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* URL / Prompt Input Box */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              SteamRIP Game URL or Title
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="e.g. https://steamrip.com/cyberpunk-2077-free-download-2/ or 'Space Marine 2'"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
                />
              </div>

              <button
                type="button"
                disabled={isParsing}
                onClick={() => handleParseLink()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-cyan-500/20 whitespace-nowrap"
              >
                <Sparkles className={`w-4 h-4 ${isParsing ? 'animate-spin' : ''}`} />
                <span>{isParsing ? 'Parsing...' : 'AI Auto-Parse'}</span>
              </button>
            </div>

            {/* Quick Sample Presets */}
            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
              <span className="text-slate-500">Quick Test:</span>
              <button
                type="button"
                onClick={() => {
                  setInputUrl('https://steamrip.com/red-dead-redemption-2-free-download/');
                  handleParseLink('https://steamrip.com/red-dead-redemption-2-free-download/');
                }}
                className="text-cyan-400 hover:underline cursor-pointer"
              >
                Red Dead Redemption 2
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setInputUrl('https://steamrip.com/ghost-of-tsushima-free-download/');
                  handleParseLink('https://steamrip.com/ghost-of-tsushima-free-download/');
                }}
                className="text-cyan-400 hover:underline cursor-pointer"
              >
                Ghost of Tsushima
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {parseError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Parsed Output / Game Fields */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Game Title */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Game Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cyberpunk 2077"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>

              {/* Version */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Version / Build Tag</label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g. v2.12 + Phantom Liberty"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* File Size */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">File Size</label>
                <input
                  type="text"
                  value={fileSize}
                  onChange={(e) => setFileSize(e.target.value)}
                  placeholder="e.g. 65.4 GB"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Initial Status */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Initial Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DownloadStatus)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="downloading">Downloading (Active)</option>
                  <option value="queued">Queued for later</option>
                  <option value="downloaded">Downloaded (Ready to Extract)</option>
                  <option value="installed">Installed & Playing</option>
                </select>
              </div>
            </div>

            {/* Target Folder Path */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Target Storage Path</label>
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={targetFolder}
                  onChange={(e) => setTargetFolder(e.target.value)}
                  placeholder="e.g. D:\Games\Cyberpunk2077"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Overview / Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Game Description / Overview</label>
              <textarea
                rows={2}
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>

            {/* Mirror Hosts List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300">SteamRIP Download Mirror Hosts</label>
                <button
                  type="button"
                  onClick={handleAddMirror}
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Host Mirror
                </button>
              </div>

              <div className="space-y-2">
                {mirrors.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs">
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMirrors(mirrors.map(item => item.id === m.id ? { ...item, name: val } : item));
                      }}
                      className="w-28 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                      placeholder="Host Name"
                    />
                    <input
                      type="text"
                      value={m.url}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMirrors(mirrors.map(item => item.id === m.id ? { ...item, url: val } : item));
                      }}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono"
                      placeholder="Mirror Download URL"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveMirror(m.id)}
                      className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              Save to Library
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
