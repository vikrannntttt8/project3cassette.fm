import { useState, useRef, useEffect } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ImportPlaylistModal({ isOpen, onClose, defaultTab = 'youtube' }) {
  const { importPlaylistFromUrl, importSpotifyPlaylistFromUrl, liked, playlists, history } = usePlayer();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState(defaultTab); // 'youtube' | 'spotify' | 'backup'

  // ── YouTube state ──
  const [ytUrl, setYtUrl] = useState('');
  const [ytLoading, setYtLoading] = useState(false);
  const [ytStatus, setYtStatus] = useState(null);

  // ── Spotify state ──
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [spotifyImporting, setSpotifyImporting] = useState(false);
  const [spotifyProgress, setSpotifyProgress] = useState(null); // { current, total, percent, currentTrack, matchedCount }
  const [spotifyStatus, setSpotifyStatus] = useState(null);
  const abortControllerRef = useRef(null);

  // ── JSON Backup state ──
  const [jsonStatus, setJsonStatus] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setYtStatus(null);
      setSpotifyStatus(null);
      setSpotifyProgress(null);
      setJsonStatus(null);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  // ── YouTube Handler ──
  const handleImportYouTube = async (targetType = 'playlist') => {
    if (!ytUrl.trim()) return;
    setYtLoading(true);
    setYtStatus(null);
    try {
      const res = await importPlaylistFromUrl(ytUrl.trim(), targetType);
      setYtStatus({
        type: 'success',
        text: targetType === 'liked'
          ? `Successfully imported ${res.count} tracks directly into Liked Songs!`
          : `Successfully imported "${res.playlist.title}" with ${res.count} tracks!`,
      });
      setYtUrl('');
      setTimeout(() => {
        if (targetType === 'playlist') {
          onClose();
        }
      }, 2500);
    } catch (err) {
      setYtStatus({
        type: 'error',
        text: err.message || 'Failed to import YouTube playlist. Ensure the playlist is Public or Unlisted.',
      });
    } finally {
      setYtLoading(false);
    }
  };

  // ── Spotify Handler ──
  const handleImportSpotify = async () => {
    if (!spotifyUrl.trim()) return;
    setSpotifyImporting(true);
    setSpotifyStatus(null);
    setSpotifyProgress({ current: 0, total: 0, percent: 0, currentTrack: null, matchedCount: 0 });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await importSpotifyPlaylistFromUrl(
        spotifyUrl.trim(),
        (progress) => {
          setSpotifyProgress(progress);
        },
        { signal: controller.signal }
      );

      setSpotifyStatus({
        type: 'success',
        text: `Imported "${res.playlist.title}"! Successfully matched ${res.matchedCount} of ${res.count} tracks on YouTube Music.`,
      });
      setSpotifyUrl('');
    } catch (err) {
      if (err.name === 'AbortError' || err.message?.includes('cancelled')) {
        setSpotifyStatus({ type: 'info', text: 'Import stopped by user.' });
      } else {
        setSpotifyStatus({
          type: 'error',
          text: err.message || 'Failed to import Spotify playlist. Check that the link is public.',
        });
      }
    } finally {
      setSpotifyImporting(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelSpotify = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // ── JSON Backup Handlers ──
  const handleExportBackup = () => {
    const backupData = {
      version: 'cassette-2.4',
      date: new Date().toISOString(),
      liked: liked || [],
      playlists: playlists || [],
      history: history || [],
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cassette_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setJsonStatus({ type: 'success', text: 'Library exported to JSON successfully.' });
    setTimeout(() => setJsonStatus(null), 4000);
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.liked && Array.isArray(data.liked)) {
          localStorage.setItem('pulse_liked_songs', JSON.stringify(data.liked));
        }
        if (data.playlists && Array.isArray(data.playlists)) {
          localStorage.setItem('pulse_playlists', JSON.stringify(data.playlists));
        }
        setJsonStatus({ type: 'success', text: 'Backup imported! Refresh page to see restored library.' });
      } catch {
        setJsonStatus({ type: 'error', text: 'Invalid JSON backup file.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in select-none">
      <div
        className="w-full max-w-lg bg-[#121214] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#161618]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[18px]">cloud_sync</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Import & Sync Playlist</h3>
              <p className="text-[11px] text-neutral-400">YouTube Music & Spotify Library Sync</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-white/5 bg-[#0e0e0e] px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('youtube')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 transition-all relative cursor-pointer ${
              activeTab === 'youtube'
                ? 'text-white border-b-2 border-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-red-400">play_circle</span>
            YouTube Playlist
          </button>
          <button
            onClick={() => setActiveTab('spotify')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 transition-all relative cursor-pointer ${
              activeTab === 'spotify'
                ? 'text-white border-b-2 border-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-emerald-400">graphic_eq</span>
            Spotify Matcher
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 transition-all relative cursor-pointer ${
              activeTab === 'backup'
                ? 'text-white border-b-2 border-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-indigo-400">folder_zip</span>
            JSON Backup
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 overflow-y-auto space-y-4 no-scrollbar">
          {/* ── 1. YouTube Import Tab ── */}
          {activeTab === 'youtube' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <p className="text-sm font-medium text-white">YouTube & YouTube Music Playlist URL</p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Paste any public or unlisted YouTube playlist link to instantly extract full high-res audio tracks.
                </p>
              </div>

              {ytStatus && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    ytStatus.type === 'success'
                      ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300'
                      : 'bg-red-950/40 border border-red-800/60 text-red-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] flex-shrink-0">
                    {ytStatus.type === 'success' ? 'check_circle' : 'error'}
                  </span>
                  <span className="flex-1">{ytStatus.text}</span>
                </div>
              )}

              <div className="space-y-2">
                <input
                  type="text"
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleImportYouTube('playlist')}
                  placeholder="https://music.youtube.com/playlist?list=PL..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181a] border border-white/10 text-white font-mono text-xs focus:border-white focus:outline-none placeholder:text-neutral-500"
                />
                <p className="text-[11px] text-neutral-500 font-mono">
                  Example: https://music.youtube.com/playlist?list=RDCLAK5uy...
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleImportYouTube('playlist')}
                  disabled={ytLoading || !ytUrl.trim()}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {ytLoading && <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>}
                  {ytLoading ? 'Fetching Tracks...' : 'Import as Playlist'}
                </button>
                <button
                  type="button"
                  onClick={() => handleImportYouTube('liked')}
                  disabled={ytLoading || !ytUrl.trim()}
                  className="px-4 py-2 rounded-xl bg-[#222225] hover:bg-[#2c2c30] text-neutral-200 text-xs font-semibold transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer border border-white/5"
                >
                  <span className="material-symbols-outlined text-[14px] text-rose-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                    favorite
                  </span>
                  Merge into Liked Songs
                </button>
              </div>
            </div>
          )}

          {/* ── 2. Spotify Matcher Tab ── */}
          {activeTab === 'spotify' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <p className="text-sm font-medium text-white">Spotify Playlist Sync & Fuzzy Matcher</p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Paste any public Spotify playlist URL. The matcher extracts track metadata and sequentially discovers high-bitrate YouTube streams.
                </p>
              </div>

              {spotifyStatus && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    spotifyStatus.type === 'success'
                      ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300'
                      : spotifyStatus.type === 'info'
                      ? 'bg-amber-950/40 border border-amber-800/60 text-amber-300'
                      : 'bg-red-950/40 border border-red-800/60 text-red-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] flex-shrink-0">
                    {spotifyStatus.type === 'success' ? 'check_circle' : 'info'}
                  </span>
                  <span className="flex-1">{spotifyStatus.text}</span>
                </div>
              )}

              <div className="space-y-2">
                <input
                  type="text"
                  value={spotifyUrl}
                  disabled={spotifyImporting}
                  onChange={(e) => setSpotifyUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !spotifyImporting && handleImportSpotify()}
                  placeholder="https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181a] border border-white/10 text-white font-mono text-xs focus:border-white focus:outline-none placeholder:text-neutral-500 disabled:opacity-50"
                />
                <p className="text-[11px] text-neutral-500 font-mono">
                  Supports Spotify playlist links (`open.spotify.com/playlist/...`) & albums
                </p>
              </div>

              {/* Progress Indicator */}
              {spotifyImporting && spotifyProgress && (
                <div className="p-3.5 rounded-2xl bg-[#18181a] border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-white flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-emerald-400 animate-spin">sync</span>
                      Matching Tracks: {spotifyProgress.current} of {spotifyProgress.total}
                    </span>
                    <span className="font-mono text-emerald-400">{spotifyProgress.percent}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-300 rounded-full"
                      style={{ width: `${spotifyProgress.percent}%` }}
                    />
                  </div>

                  {spotifyProgress.currentTrack && (
                    <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-400">
                      <p className="truncate max-w-[280px]">
                        <span className="text-neutral-300 font-medium">{spotifyProgress.currentTrack.title}</span> — {spotifyProgress.currentTrack.artist}
                      </p>
                      <span className="font-mono text-white/70">
                        {spotifyProgress.matchedCount} resolved
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                {!spotifyImporting ? (
                  <button
                    type="button"
                    onClick={handleImportSpotify}
                    disabled={!spotifyUrl.trim()}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span className="material-symbols-outlined text-[15px] text-emerald-600">sync_alt</span>
                    Start Spotify Sync & Match
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCancelSpotify}
                    className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">stop</span>
                    Stop / Cancel
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── 3. JSON Backup Tab ── */}
          {activeTab === 'backup' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <p className="text-sm font-medium text-white">JSON Library Backup & Restore</p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Export or restore your full cassette.fm library including playlists, liked tracks, and history without any external login.
                </p>
              </div>

              {jsonStatus && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    jsonStatus.type === 'success'
                      ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300'
                      : 'bg-red-950/40 border border-red-800/60 text-red-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] flex-shrink-0">
                    {jsonStatus.type === 'success' ? 'check_circle' : 'error'}
                  </span>
                  <span className="flex-1">{jsonStatus.text}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Export Backup JSON
                </button>

                <label className="px-4 py-2 rounded-xl bg-[#222225] hover:bg-[#2c2c30] text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-white/10">
                  <span className="material-symbols-outlined text-[16px]">upload</span>
                  Restore from JSON
                  <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
