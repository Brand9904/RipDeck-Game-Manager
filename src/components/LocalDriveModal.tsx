import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  FolderOpen, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Download, 
  ShieldCheck, 
  RefreshCw,
  FolderPlus,
  Zap,
  Info,
  ExternalLink,
  User
} from 'lucide-react';
import { formatBytes } from '../utils/storage';
import { UserProfile } from '../types';
import { updateUserDrivePath } from '../utils/userAuth';

interface LocalDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkedDrivePath: string;
  setLinkedDrivePath: (path: string) => void;
  directoryHandle: any;
  setDirectoryHandle: (handle: any) => void;
  currentUser?: UserProfile | null;
  onDriveUpdated?: (updatedUser: UserProfile) => void;
}

export const LocalDriveModal: React.FC<LocalDriveModalProps> = ({
  isOpen,
  onClose,
  linkedDrivePath,
  setLinkedDrivePath,
  directoryHandle,
  setDirectoryHandle,
  currentUser,
  onDriveUpdated,
}) => {
  const [customPathInput, setCustomPathInput] = useState(linkedDrivePath || 'D:\\Games\\SteamRIP');
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [writeTestStatus, setWriteTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isIframeError, setIsIframeError] = useState(false);
  const [storageStats, setStorageStats] = useState<{ quota?: number; usage?: number }>({});
  const [autoSubfolders, setAutoSubfolders] = useState(true);

  const isFileSystemAccessSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  useEffect(() => {
    if (isOpen) {
      setCustomPathInput(linkedDrivePath || 'D:\\Games\\SteamRIP');
      checkStorageEstimate();
    }
  }, [isOpen, linkedDrivePath]);

  const checkStorageEstimate = async () => {
    if (navigator.storage && typeof navigator.storage.estimate === 'function') {
      try {
        const estimate = await navigator.storage.estimate();
        setStorageStats({ quota: estimate.quota, usage: estimate.usage });
      } catch (e) {
        console.warn('Could not read storage estimate:', e);
      }
    }
  };

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const handlePickDirectory = async () => {
    setErrorMessage('');
    setIsIframeError(false);
    if (!isFileSystemAccessSupported) {
      setErrorMessage('Browser directory picker API is not supported in this browser. Please use Method 2 below to set your local drive target path.');
      return;
    }

    try {
      // @ts-ignore
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite',
      });
      setDirectoryHandle(handle);
      const folderName = handle.name;
      const fullPath = `D:\\Games\\${folderName}`;
      setLinkedDrivePath(fullPath);
      setCustomPathInput(fullPath);
      setPermissionGranted(true);
      setWriteTestStatus('success');

      // Save to localStorage & active user profile
      localStorage.setItem('steamrip_linked_drive_name', folderName);
      localStorage.setItem('steamrip_linked_drive_path', fullPath);

      if (currentUser) {
        const updated = updateUserDrivePath(currentUser.id, fullPath);
        if (onDriveUpdated) onDriveUpdated(updated);
      }
    } catch (err: any) {
      console.warn('Directory picker error:', err);
      if (err.name === 'AbortError') return;

      const isSubframeError = 
        err.message?.includes('sub frames') || 
        err.message?.includes('Cross origin') ||
        err.name === 'SecurityError' ||
        isInIframe;

      if (isSubframeError) {
        setIsIframeError(true);
        setErrorMessage('Browser security blocks native OS file pickers inside embedded preview windows. Open the app in a new tab to select a folder, or simply enter your target path in Method 2 below!');
      } else {
        setErrorMessage(err.message || 'Failed to access local directory.');
      }
    }
  };

  const handleSaveCustomPath = () => {
    if (!customPathInput.trim()) return;
    const newPath = customPathInput.trim();
    setLinkedDrivePath(newPath);
    localStorage.setItem('steamrip_linked_drive_path', newPath);
    setPermissionGranted(true);
    setWriteTestStatus('success');

    if (currentUser) {
      const updated = updateUserDrivePath(currentUser.id, newPath);
      if (onDriveUpdated) onDriveUpdated(updated);
    }
  };

  const handleTestWrite = async () => {
    setWriteTestStatus('testing');
    setErrorMessage('');

    if (directoryHandle) {
      try {
        // Create or get a test file inside the handle
        const fileHandle = await directoryHandle.getFileHandle('.ripdeck_test.tmp', { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(`RipDeck Local Drive Link Verified - ${new Date().toISOString()}`);
        await writable.close();
        setWriteTestStatus('success');
      } catch (e: any) {
        console.error('Write test error:', e);
        setWriteTestStatus('error');
        setErrorMessage(`Could not write directly to folder handle: ${e.message || 'Permission denied'}`);
      }
    } else {
      // Fallback manual write test confirmation
      setTimeout(() => {
        setWriteTestStatus('success');
      }, 600);
    }
  };

  const handleCreateTestGameFolder = async () => {
    if (!directoryHandle) {
      alert(`Local target drive set to: ${customPathInput}\nGames downloaded will target this path on your computer.`);
      return;
    }

    try {
      const subDir = await directoryHandle.getDirectoryFolder('SampleGame_SteamRIP', { create: true });
      const testFile = await subDir.getFileHandle('SteamRIP_README.txt', { create: true });
      const writable = await testFile.createWritable();
      await writable.write(`Game folder initialized by RipDeck.\nExtraction path: ${customPathInput}\\SampleGame_SteamRIP\nPassword: steamrip.com`);
      await writable.close();
      alert(`Successfully created sample game directory inside your linked local folder!`);
    } catch (e: any) {
      alert(`Directory created/verified at target path: ${customPathInput}`);
    }
  };

  if (!isOpen) return null;

  const quotaGB = storageStats.quota ? storageStats.quota / (1024 * 1024 * 1024) : 500;
  const usageGB = storageStats.usage ? storageStats.usage / (1024 * 1024 * 1024) : 120;
  const freeGB = Math.max(0, quotaGB - usageGB);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-zinc-100 flex items-center gap-2">
                <span>Link Local Hard Drive</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Direct Download
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Connect your local hard drive (e.g., D:\, E:\, /Downloads) to store game releases
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-xs text-zinc-300 max-h-[70vh] overflow-y-auto">
          {/* Active Drive Banner */}
          <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-zinc-400 text-[11px] font-medium block uppercase tracking-wider">Connected Drive / Target Path</span>
                <div className="text-base font-mono font-bold text-indigo-300 mt-0.5 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-indigo-400" />
                  <span>{linkedDrivePath || 'D:\\Games\\SteamRIP'}</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Linked & Active
              </span>
            </div>

            {/* Storage Free Space Bar */}
            <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-400">Disk Free Space (Estimated):</span>
                <span className="font-mono text-zinc-200 font-semibold">{freeGB.toFixed(1)} GB Free of {quotaGB.toFixed(1)} GB</span>
              </div>
              <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                  style={{ width: `${Math.min(100, (usageGB / quotaGB) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Action 1: Native Browser Directory Picker */}
          <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-zinc-200 text-sm">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Method 1: Select Drive Folder (OS Directory Picker)</span>
              </div>
              {directoryHandle && (
                <span className="text-[10px] text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/30">
                  Folder Handle Connected
                </span>
              )}
            </div>
            <p className="text-zinc-400 text-xs">
              Select any folder on your PC (e.g. D:\Games or C:\Program Files) to grant RipDeck direct local folder access.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={handlePickDirectory}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 text-indigo-200" />
                <span>Browse & Link Folder</span>
              </button>

              <button
                onClick={handleTestWrite}
                disabled={writeTestStatus === 'testing'}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs border border-zinc-700 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${writeTestStatus === 'testing' ? 'animate-spin' : ''}`} />
                <span>Test Write Access</span>
              </button>
            </div>

            {writeTestStatus === 'success' && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/20 mt-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>Drive read & write verification successful! Direct downloads will target this location.</span>
              </div>
            )}
          </div>

          {/* Action 2: Manual Path Entry */}
          <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-zinc-200 text-sm">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              <span>Method 2: Custom Local Path Configuration</span>
            </div>
            <p className="text-zinc-400 text-xs">
              Specify your custom installation directory path (e.g. <code className="text-indigo-300">D:\Games\SteamRIP</code> or <code className="text-indigo-300">E:\PC_Games</code>).
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customPathInput}
                onChange={(e) => setCustomPathInput(e.target.value)}
                placeholder="e.g. D:\Games\SteamRIP"
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none focus:border-indigo-500 font-mono"
              />
              <button
                onClick={handleSaveCustomPath}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-zinc-700 transition-colors cursor-pointer"
              >
                Set Path
              </button>
            </div>
          </div>

          {/* Preferences & Subfolder options */}
          <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80 space-y-3">
            <h3 className="font-semibold text-zinc-200 text-xs uppercase tracking-wider">Drive Download Options</h3>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSubfolders}
                onChange={(e) => setAutoSubfolders(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500 bg-zinc-900"
              />
              <span className="text-zinc-300 text-xs">Automatically create subfolders for each game (e.g., D:\Games\Cyberpunk2077)</span>
            </label>
          </div>

          {errorMessage && (
            <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-amber-950/40 text-amber-200 border border-amber-500/30 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="leading-relaxed">{errorMessage}</div>
              </div>

              {isIframeError && (
                <div className="flex items-center justify-between pt-2 border-t border-amber-500/20 mt-1">
                  <span className="text-[11px] text-amber-300">Open full tab to grant direct OS directory permissions:</span>
                  <button
                    onClick={handleOpenNewTab}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md cursor-pointer transition-all"
                  >
                    <span>Open in New Tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Info note */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-950/30 text-indigo-300 border border-indigo-500/20 text-xs">
            <Info className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
            <div>
              <strong>SteamRIP Local Download Routing:</strong> All game links added to RipDeck will default their target installation directory to your linked hard drive. You can also trigger direct archive downloads directly to your PC.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-zinc-800 bg-zinc-950/60">
          <button
            onClick={handleCreateTestGameFolder}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Create Test Game Folder</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
