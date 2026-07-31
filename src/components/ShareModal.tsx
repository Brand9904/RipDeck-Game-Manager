import React, { useState } from 'react';
import { X, Share2, Copy, Check, Download, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { Game } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: Game[];
  onImportGames: (imported: Game[]) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  games,
  onImportGames,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importMessage, setImportMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const exportData = JSON.stringify(games, null, 2);
  const shareableUrl = `${window.location.origin}${window.location.pathname}#library=${btoa(
    encodeURIComponent(JSON.stringify(games.map((g) => ({ title: g.title, url: g.steamripUrl, size: g.fileSize }))))
  )}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(exportData);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleImport = () => {
    try {
      if (!importJsonText.trim()) return;
      const parsed = JSON.parse(importJsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('Import data must be a valid JSON array of games.');
      }
      onImportGames(parsed);
      setImportMessage(`Successfully imported ${parsed.length} games into your library!`);
      setTimeout(() => setImportMessage(null), 3000);
    } catch (e: any) {
      setImportMessage(`Import error: ${e.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-base">Share SteamRIP Library</h2>
              <p className="text-xs text-slate-400">Export or import game collections with friends</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-300">
          {/* Share Link */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Shareable Web Link ({games.length} games)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer whitespace-nowrap"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Export JSON */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-200">Full JSON Backup Export</label>
              <button
                onClick={handleCopyJson}
                className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedJson ? 'Copied JSON' : 'Copy Raw JSON'}</span>
              </button>
            </div>
            <textarea
              readOnly
              rows={3}
              value={exportData}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-slate-400 outline-none"
            />
          </div>

          {/* Import Section */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <label className="block text-xs font-semibold text-slate-200">Import Collection from JSON</label>
            <textarea
              rows={3}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Paste JSON array of games here to import..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-slate-200 outline-none focus:border-cyan-500"
            />

            {importMessage && (
              <div className="p-2.5 rounded-lg bg-slate-950 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>{importMessage}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleImport}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-slate-800 bg-slate-950/40">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
