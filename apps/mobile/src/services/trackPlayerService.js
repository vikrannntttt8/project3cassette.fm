import { NativeModules } from 'react-native';
import { playerActions } from '@cassette/core';

let TrackPlayer = null;
let AppKilledPlaybackBehavior = {};
let Capability = {};
let Event = {};
let RepeatMode = {};
let isNativeAvailable = false;

try {
  const rntp = require('react-native-track-player');
  TrackPlayer = rntp.default || rntp;
  AppKilledPlaybackBehavior = rntp.AppKilledPlaybackBehavior || {};
  Capability = rntp.Capability || {};
  Event = rntp.Event || {};
  RepeatMode = rntp.RepeatMode || {};
  if (TrackPlayer && typeof TrackPlayer.setupPlayer === 'function') {
    isNativeAvailable = true;
  }
} catch (err) {
  console.log('[TrackPlayer] Native module initializing in simulated mode');
}

let simulatedTimer = null;
let currentPosition = 0;
let trackDuration = 210;

function startSimulatedProgress() {
  if (simulatedTimer) clearInterval(simulatedTimer);
  simulatedTimer = setInterval(() => {
    currentPosition += 1;
    if (currentPosition > trackDuration) {
      currentPosition = 0;
    }
    playerActions.setProgress(currentPosition, trackDuration);
  }, 1000);
}

function stopSimulatedProgress() {
  if (simulatedTimer) {
    clearInterval(simulatedTimer);
    simulatedTimer = null;
  }
}

export async function setupTrackPlayer() {
  if (!isNativeAvailable || !TrackPlayer) {
    return true;
  }

  try {
    await TrackPlayer.getActiveTrack();
    return true;
  } catch {
    try {
      await TrackPlayer.setupPlayer({
        autoHandleInterruptions: true,
      });

      if (TrackPlayer.updateOptions) {
        await TrackPlayer.updateOptions({
          android: {
            appKilledPlaybackBehavior:
              AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification ||
              'StopPlaybackAndRemoveNotification',
          },
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.SeekTo,
          ].filter(Boolean),
          compactCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
          ].filter(Boolean),
          progressUpdateEventInterval: 1,
        });
      }

      // Attach progress and state listeners
      if (TrackPlayer.addEventListener && Event.PlaybackProgressUpdated) {
        TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (data) => {
          if (data?.position != null && data?.duration != null) {
            playerActions.setProgress(Math.floor(data.position), Math.floor(data.duration));
          }
        });
      }

      return true;
    } catch (setupErr) {
      console.warn('[TrackPlayer] Setup notice:', setupErr?.message || setupErr);
      return false;
    }
  }
}

export async function playTrack(track, streamUrl = null) {
  if (!track) return;
  trackDuration = track.duration || 210;
  currentPosition = 0;

  playerActions.setCurrentSong(track);
  playerActions.setIsPlaying(true);
  playerActions.setProgress(0, trackDuration);

  let activeUrl = streamUrl;
  let activeHeaders = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    Range: 'bytes=0-',
  };
  if (!activeUrl && (track.videoId || track.id)) {
    try {
      const { resolveDirectAudioStream } = require('@cassette/core');
      const res = await resolveDirectAudioStream(track.videoId || track.id);
      if (res?.streamUrl) {
        activeUrl = res.streamUrl;
        if (res.meta?.headers) {
          activeHeaders = { ...activeHeaders, ...res.meta.headers };
        }
      }
    } catch (resolveErr) {
      console.warn('[TrackPlayer] Inline stream resolve notice:', resolveErr.message);
    }
  }

  if (isNativeAvailable && TrackPlayer?.reset && TrackPlayer?.add && TrackPlayer?.play && activeUrl) {
    try {
      await TrackPlayer.reset();
      const trackPayload = {
        id: String(track.id || track.videoId || 'track-seed'),
        url: activeUrl,
        title: track.title || 'Untitled Track',
        artist: track.artist || track.artists?.[0]?.name || 'Unknown Artist',
        artwork: track.thumbnail || track.cover || undefined,
        duration: trackDuration,
        headers: activeHeaders,
      };
      await TrackPlayer.add(trackPayload);
      await TrackPlayer.play();
      return true;
    } catch (err) {
      console.warn('[TrackPlayer] Native play notice:', err.message);
    }
  }

  // Simulated timer fallback
  startSimulatedProgress();
  return true;
}

export async function pauseTrack() {
  playerActions.setIsPlaying(false);
  stopSimulatedProgress();
  if (isNativeAvailable && TrackPlayer?.pause) {
    try {
      await TrackPlayer.pause();
    } catch {}
  }
}

export async function resumeTrack() {
  playerActions.setIsPlaying(true);
  startSimulatedProgress();
  if (isNativeAvailable && TrackPlayer?.play) {
    try {
      await TrackPlayer.play();
    } catch {}
  }
}

export async function seekTrack(seconds) {
  currentPosition = seconds;
  playerActions.setProgress(seconds, trackDuration);
  if (isNativeAvailable && TrackPlayer?.seekTo) {
    try {
      await TrackPlayer.seekTo(seconds);
    } catch {}
  }
}

export async function playbackService() {
  if (!isNativeAvailable || !TrackPlayer || !TrackPlayer.addEventListener || !Event?.RemotePlay) return;
  try {
    TrackPlayer.addEventListener(Event.RemotePlay, () => resumeTrack());
    TrackPlayer.addEventListener(Event.RemotePause, () => pauseTrack());
    TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
    TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
    TrackPlayer.addEventListener(Event.RemoteSeek, (event) => seekTrack(event.position));
  } catch (err) {
    console.warn('[TrackPlayer] playbackService notice:', err);
  }
}

if (TrackPlayer && typeof TrackPlayer.registerPlaybackService === 'function') {
  TrackPlayer.registerPlaybackService(() => playbackService);
}

