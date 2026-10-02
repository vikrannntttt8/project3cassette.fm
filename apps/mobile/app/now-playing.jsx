import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import LyricsView from '../src/components/LyricsView/LyricsView.jsx';
import { usePlayerStore, playerActions, resolveDirectAudioStream } from '@cassette/core';
import { playTrack, pauseTrack, resumeTrack, seekTrack } from '../src/services/trackPlayerService.js';
import { FALLBACK_HOME_FEED } from '../src/data/fallbackFeed.js';

export default function MobileNowPlayingRoute() {
  const router = useRouter();
  const [playerState, setPlayerState] = useState(usePlayerStore.getState());

  useEffect(() => {
    const unsubscribe = usePlayerStore.subscribe(setPlayerState);
    return () => unsubscribe();
  }, []);

  const currentSong = playerState.currentSong || FALLBACK_HOME_FEED.quickPicks[0];

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
    const currentList = FALLBACK_HOME_FEED.quickPicks;
    const currentId = currentSong.id || currentSong.videoId;
    const idx = currentList.findIndex((s) => (s.id || s.videoId) === currentId);
    const nextSong = currentList[(idx + 1) % currentList.length];
    playerActions.setCurrentSong(nextSong);
    playerActions.setIsPlaying(true);
    try {
      const res = await resolveDirectAudioStream(nextSong.videoId || nextSong.id);
      await playTrack(nextSong, res?.streamUrl);
    } catch {
      await playTrack(nextSong);
    }
  };

  const handleSkipPrev = async () => {
    const currentList = FALLBACK_HOME_FEED.quickPicks;
    const currentId = currentSong.id || currentSong.videoId;
    const idx = currentList.findIndex((s) => (s.id || s.videoId) === currentId);
    const prevSong = currentList[(idx - 1 + currentList.length) % currentList.length];
    playerActions.setCurrentSong(prevSong);
    playerActions.setIsPlaying(true);
    try {
      const res = await resolveDirectAudioStream(prevSong.videoId || prevSong.id);
      await playTrack(prevSong, res?.streamUrl);
    } catch {
      await playTrack(prevSong);
    }
  };

  return (
    <LyricsView
      currentSong={currentSong}
      isPlaying={playerState.isPlaying}
      currentTime={playerState.currentTime || 35}
      duration={playerState.duration || 215}
      lyrics={[
        { time: 0, text: "I'm tryna put you in the worst mood, ah" },
        { time: 10, text: 'P1 cleaner than your church shoes, ah' },
        { time: 20, text: 'Milli point two just to hurt you, ah' },
        { time: 30, text: 'All red Lamb’ just to tease you, ah' },
        { time: 40, text: 'None of these toys on lease too, ah' },
        { time: 50, text: 'Made your whole year in a week too, yah' },
        { time: 60, text: 'Main bitch out your league too, ah' },
        { time: 70, text: 'Side bitch out of your league too, ah' },
        { time: 80, text: "Look what you've done" },
        { time: 90, text: "I'm a motherfuckin' starboy" },
      ]}
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
