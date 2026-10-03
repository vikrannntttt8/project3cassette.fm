import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import LyricsView from '../src/components/LyricsView/LyricsView.jsx';
import { usePlayerStore, playerActions, resolveDirectAudioStream } from '@cassette/core';
import { playTrack, pauseTrack, resumeTrack, seekTrack } from '../src/services/trackPlayerService.js';
import { youtubeMusicApiService } from '../src/services/youtubeMusicApiService.js';

export default function MobileNowPlayingRoute() {
  const router = useRouter();
  const [playerState, setPlayerState] = useState(usePlayerStore.getState());

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

  if (!currentSong) {
    router.back();
    return null;
  }

  return (
    <LyricsView
      currentSong={currentSong}
      isPlaying={playerState.isPlaying}
      currentTime={playerState.currentTime || 0}
      duration={playerState.duration || 210}
      lyrics={currentSong.lyrics || []}
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
    />
  );
}
