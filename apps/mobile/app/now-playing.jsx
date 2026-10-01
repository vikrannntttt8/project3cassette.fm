import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import LyricsView from '../src/components/LyricsView/LyricsView.jsx';
import { usePlayerStore, playerActions } from '@cassette/core';

export default function MobileNowPlayingRoute() {
  const router = useRouter();
  const [playerState, setPlayerState] = useState(usePlayerStore.getState());

  useEffect(() => {
    const unsubscribe = usePlayerStore.subscribe(setPlayerState);
    return () => unsubscribe();
  }, []);

  const handleTogglePlay = () => {
    playerActions.setIsPlaying(!playerState.isPlaying);
  };

  const handleSeek = (time) => {
    playerActions.setProgress(time, playerState.duration || 210);
  };

  return (
    <LyricsView
      currentSong={playerState.currentSong}
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
      onSkipNext={() => console.log('Skip next')}
      onSkipPrev={() => console.log('Skip prev')}
      onSeek={handleSeek}
      onToggleLike={() => console.log('Toggle like')}
      onToggleShuffle={() => console.log('Toggle shuffle')}
      onToggleRepeat={() => console.log('Toggle repeat')}
    />
  );
}
