let TrackPlayer = null;
let AppKilledPlaybackBehavior = {};
let Capability = {};
let Event = {};
let RepeatMode = {};

try {
  const rntp = require('react-native-track-player');
  TrackPlayer = rntp.default || rntp;
  AppKilledPlaybackBehavior = rntp.AppKilledPlaybackBehavior || {};
  Capability = rntp.Capability || {};
  Event = rntp.Event || {};
  RepeatMode = rntp.RepeatMode || {};
} catch (err) {
  console.warn('[TrackPlayer] Native module not present in Expo Go. Running in simulated player mode.');
}

export async function setupTrackPlayer() {
  if (!TrackPlayer || !TrackPlayer.setupPlayer) {
    console.log('[TrackPlayer] Expo Go environment: native player setup bypassed.');
    return true;
  }

  let isSetup = false;
  try {
    await TrackPlayer.getActiveTrack();
    isSetup = true;
  } catch {
    try {
      await TrackPlayer.setupPlayer({
        autoHandleInterruptions: true,
      });
      if (TrackPlayer.updateOptions) {
        await TrackPlayer.updateOptions({
          android: {
            appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
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
      isSetup = true;
    } catch (setupErr) {
      console.warn('[TrackPlayer] Setup error handled:', setupErr?.message || setupErr);
      isSetup = false;
    }
  }
  return isSetup;
}

export async function playbackService() {
  if (!TrackPlayer || !TrackPlayer.addEventListener || !Event?.RemotePlay) return;
  try {
    TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
    TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
    TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
    TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
    TrackPlayer.addEventListener(Event.RemoteSeek, (event) => TrackPlayer.seekTo(event.position));
  } catch (err) {
    console.warn('[TrackPlayer] playbackService error:', err);
  }
}
