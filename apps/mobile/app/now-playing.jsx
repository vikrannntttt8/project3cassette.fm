import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import LyricsView from '../src/components/LyricsView/LyricsView.jsx';
import TrackOptionsMenuSheet from '../src/components/shared/TrackOptionsMenuSheet.jsx';
import CreditsModal from '../src/components/shared/CreditsModal.jsx';
import { usePlayerStore, playerActions, resolveDirectAudioStream } from '@cassette/core';
import { playTrack, pauseTrack, resumeTrack, seekTrack } from '../src/services/trackPlayerService.js';
import { youtubeMusicApiService } from '../src/services/youtubeMusicApiService.js';

export default function MobileNowPlayingRoute() {
  const router = useRouter();
  const [playerState, setPlayerState] = useState(usePlayerStore.getState());
  const [isTrackOptionsOpen, setIsTrackOptionsOpen] = useState(false);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = usePlayerStore.subscribe(setPlayerState);
    return () => unsubscribe();
  }, []);

  const currentSong = playerState.currentSong;

  const handleTogglePlay = () => {
    const nextPlayState = !playerState.isPlaying;
    playerActions.setIsPlaying(nextPlayState);
    if (nextPlayState) {
      resumeTrack();
    } else {
      pauseTrack();
    }
  };

  const handleSeek = (time) => {
    playerActions.setProgress(time, playerState.duration || 210);
    seekTrack(time);
  };

  const handleSkipNext = async () => {
    const queue = playerState.queue || [];
    if (!currentSong) return;

    const currentId = currentSong.id || currentSong.videoId;
    const idx = queue.findIndex((s) => (s.id || s.videoId) === currentId);

    if (idx !== -1 && idx < queue.length - 1) {
      const nextSong = queue[idx + 1];
      playerActions.setCurrentSong(nextSong);
      playerActions.setIsPlaying(true);
      try {
        const res = await resolveDirectAudioStream(nextSong.videoId || nextSong.id);
        await playTrack(nextSong, res?.streamUrl);
      } catch {
        await playTrack(nextSong);
      }
    } else {
      // Dynamic Radio Generation
      const radioTracks = await youtubeMusicApiService.getRadioQueue(currentSong);
      if (radioTracks && radioTracks.length > 1) {
        const nextSong = radioTracks[1];
        playerActions.setCurrentSong(nextSong);
        playerActions.setIsPlaying(true);
        try {
          const res = await resolveDirectAudioStream(nextSong.videoId || nextSong.id);
          await playTrack(nextSong, res?.streamUrl);
        } catch {
          await playTrack(nextSong);
        }
      }
    }
  };

  const handleSkipPrev = async () => {
    const queue = playerState.queue || [];
    if (!currentSong || queue.length === 0) return;

    const currentId = currentSong.id || currentSong.videoId;
    const idx = queue.findIndex((s) => (s.id || s.videoId) === currentId);

    if (idx > 0) {
      const prevSong = queue[idx - 1];
      playerActions.setCurrentSong(prevSong);
      playerActions.setIsPlaying(true);
      try {
        const res = await resolveDirectAudioStream(prevSong.videoId || prevSong.id);
        await playTrack(prevSong, res?.streamUrl);
      } catch {
        await playTrack(prevSong);
      }
    }
  };

  const handleStartRadio = async (song) => {
    const radioTracks = await youtubeMusicApiService.getRadioQueue(song || currentSong);
    if (radioTracks && radioTracks.length > 0) {
      playerActions.setQueue?.(radioTracks);
      playerActions.setCurrentSong(radioTracks[0]);
      playerActions.setIsPlaying(true);
      try {
        const res = await resolveDirectAudioStream(radioTracks[0].videoId || radioTracks[0].id);
        await playTrack(radioTracks[0], res?.streamUrl);
      } catch {
        await playTrack(radioTracks[0]);
      }
    }
  };

  const handlePlayNext = (song) => {
    const queue = playerState.queue || [];
    const currentId = currentSong?.id || currentSong?.videoId;
    const idx = queue.findIndex((s) => (s.id || s.videoId) === currentId);
    let nextQueue;
    if (idx !== -1) {
      nextQueue = [...queue.slice(0, idx + 1), song, ...queue.slice(idx + 1)];
    } else {
      nextQueue = [song, ...queue];
    }
    playerActions.setQueue?.(nextQueue);
  };

  const handleAddToQueue = (song) => {
    const queue = playerState.queue || [];
    const nextQueue = [...queue, song];
    playerActions.setQueue?.(nextQueue);
  };

  if (!currentSong) {
    router.back();
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <LyricsView
        currentSong={currentSong}
        isPlaying={playerState.isPlaying}
        currentTime={playerState.currentTime || 0}
        duration={playerState.duration || 210}
        lyrics={currentSong.lyrics || []}
        queue={playerState.queue || []}
        isLiked={false}
        isShuffled={playerState.isShuffled}
        isRepeat={playerState.isRepeat}
        onClose={() => router.back()}
        onTogglePlay={handleTogglePlay}
        onSkipNext={handleSkipNext}
        onSkipPrev={handleSkipPrev}
        onSeek={handleSeek}
        onToggleLike={() => playerActions.toggleLike(currentSong)}
        onToggleShuffle={() => playerActions.toggleShuffle()}
        onToggleRepeat={() => playerActions.toggleRepeat()}
        onOpenTrackOptions={() => setIsTrackOptionsOpen(true)}
        onOpenArtist={() => {
          router.back();
        }}
      />

      {/* Track Options Context Menu (Start Radio, Add to Queue, Credits, etc.) */}
      <TrackOptionsMenuSheet
        isOpen={isTrackOptionsOpen}
        onClose={() => setIsTrackOptionsOpen(false)}
        song={currentSong}
        onStartRadio={handleStartRadio}
        onPlayNext={handlePlayNext}
        onAddToQueue={handleAddToQueue}
        onAddToPlaylist={() => {}}
        onAddToAlbums={() => {}}
        onGoToArtist={() => {
          setIsTrackOptionsOpen(false);
          router.back();
        }}
        onViewCredits={() => {
          setIsTrackOptionsOpen(false);
          setTimeout(() => {
            setIsCreditsOpen(true);
          }, 150);
        }}
        onToggleLike={() => playerActions.toggleLike(currentSong)}
      />

      {/* Song Credits Sheet */}
      <CreditsModal
        isOpen={isCreditsOpen}
        onClose={() => setIsCreditsOpen(false)}
        song={currentSong}
      />
    </View>
  );
}

