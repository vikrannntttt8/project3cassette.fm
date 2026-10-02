import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export default function AnimatedEqualizer({ isPlaying = true, color = '#FFFFFF', barWidth = 2.5, maxHeight = 14 }) {
  const bar1 = useSharedValue(0.3);
  const bar2 = useSharedValue(0.7);
  const bar3 = useSharedValue(0.4);
  const bar4 = useSharedValue(0.9);

  useEffect(() => {
    if (isPlaying) {
      bar1.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 380, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: 420, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.7, { duration: 310, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 350, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      bar2.value = withRepeat(
        withSequence(
          withTiming(0.2, { duration: 320, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.9, { duration: 460, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 330, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 390, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      bar3.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 440, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 310, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 360, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      bar4.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 350, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 410, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: 300, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.8, { duration: 450, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      bar1.value = withTiming(0.25, { duration: 200 });
      bar2.value = withTiming(0.25, { duration: 200 });
      bar3.value = withTiming(0.25, { duration: 200 });
      bar4.value = withTiming(0.25, { duration: 200 });
    }
  }, [isPlaying]);

  const style1 = useAnimatedStyle(() => ({ height: maxHeight * bar1.value }));
  const style2 = useAnimatedStyle(() => ({ height: maxHeight * bar2.value }));
  const style3 = useAnimatedStyle(() => ({ height: maxHeight * bar3.value }));
  const style4 = useAnimatedStyle(() => ({ height: maxHeight * bar4.value }));

  return (
    <View style={[styles.container, { height: maxHeight }]}>
      <Animated.View style={[styles.bar, { width: barWidth, backgroundColor: color }, style1]} />
      <Animated.View style={[styles.bar, { width: barWidth, backgroundColor: color }, style2]} />
      <Animated.View style={[styles.bar, { width: barWidth, backgroundColor: color }, style3]} />
      <Animated.View style={[styles.bar, { width: barWidth, backgroundColor: color }, style4]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
  },
  bar: {
    borderRadius: 2,
    minHeight: 2,
  },
});
