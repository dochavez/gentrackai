import { useEffect, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Font, Palette } from '@/constants/design';

const GOLD = Palette.gold;
const MARK = 196; // logo mark size on the splash
const GLOW = 320; // soft gold aura behind the mark

/** How long the branded splash holds before it fades away to reveal the app. */
const HOLD = 2200;
const FADE = 480;

/**
 * Branded launch splash. Reproduces the GenTrack design: a dark radial backdrop,
 * the glowing gold mark that pops in while its rings rotate, the wordmark, and a
 * row of pulsing dots. Mounted once in the root layout; it fades out and unmounts
 * itself, handing off from the native (static) splash to the running app.
 */
export function AnimatedSplashOverlay() {
  const { width, height } = useWindowDimensions();
  const [visible, setVisible] = useState(true);

  const markScale = useSharedValue(0.62);
  const markOpacity = useSharedValue(0);
  const ring = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(12);
  const subtitleOpacity = useSharedValue(0);
  const dotsOpacity = useSharedValue(0);
  const dot1 = useSharedValue(0.4);
  const dot2 = useSharedValue(0.4);
  const dot3 = useSharedValue(0.4);
  const overlayOpacity = useSharedValue(1);

  useEffect(() => {
    markScale.value = withDelay(60, withSpring(1, { damping: 11, stiffness: 140, mass: 0.9 }));
    markOpacity.value = withDelay(60, withTiming(1, { duration: 420 }));
    ring.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.linear }), -1, false);
    titleOpacity.value = withDelay(220, withTiming(1, { duration: 420 }));
    titleY.value = withDelay(220, withTiming(0, { duration: 480, easing: Easing.out(Easing.cubic) }));
    subtitleOpacity.value = withDelay(340, withTiming(1, { duration: 420 }));
    dotsOpacity.value = withDelay(460, withTiming(1, { duration: 300 }));

    const pulse = (delay: number) =>
      withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 520, easing: Easing.inOut(Easing.quad) }),
            withTiming(0.4, { duration: 520, easing: Easing.inOut(Easing.quad) }),
          ),
          -1,
          false,
        ),
      );
    dot1.value = pulse(0);
    dot2.value = pulse(180);
    dot3.value = pulse(360);

    const fadeTimer = setTimeout(() => {
      overlayOpacity.value = withTiming(0, { duration: FADE, easing: Easing.in(Easing.cubic) });
    }, HOLD);
    const doneTimer = setTimeout(() => setVisible(false), HOLD + FADE + 40);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const markStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [{ scale: markScale.value }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ring.value * 360}deg` }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const subtitleStyle = useAnimatedStyle(() => ({ opacity: subtitleOpacity.value }));
  const dotsStyle = useAnimatedStyle(() => ({ opacity: dotsOpacity.value }));
  const dot1Style = useAnimatedStyle(() => ({ opacity: dot1.value, transform: [{ scale: 0.85 + dot1.value * 0.25 }] }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: dot2.value, transform: [{ scale: 0.85 + dot2.value * 0.25 }] }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: dot3.value, transform: [{ scale: 0.85 + dot3.value * 0.25 }] }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="none">
      {/* Dark radial backdrop + soft gold glow */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="bg" cx="50%" cy="28%" r="92%">
            <Stop offset="0" stopColor="#33373D" />
            <Stop offset="0.6" stopColor="#23262B" />
            <Stop offset="1" stopColor="#171A1D" />
          </RadialGradient>
          <RadialGradient id="halo" cx="50%" cy="42%" r="34%">
            <Stop offset="0" stopColor={GOLD} stopOpacity="0.16" />
            <Stop offset="0.7" stopColor={GOLD} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#bg)" />
        <Rect width={width} height={height} fill="url(#halo)" />
      </Svg>

      <View style={styles.center}>
        <Animated.View style={[styles.markWrap, markStyle]}>
          <View style={styles.layer}>
            <Svg width={GLOW} height={GLOW}>
              <Defs>
                <RadialGradient id="markGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor={GOLD} stopOpacity="0.34" />
                  <Stop offset="0.55" stopColor={GOLD} stopOpacity="0.07" />
                  <Stop offset="1" stopColor={GOLD} stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Circle cx={GLOW / 2} cy={GLOW / 2} r={GLOW / 2} fill="url(#markGlow)" />
            </Svg>
          </View>

          <Animated.View style={[styles.layer, ringStyle]}>
            <Svg width={MARK} height={MARK} viewBox="0 0 240 240">
              <Circle
                cx="120"
                cy="120"
                r="104"
                stroke={GOLD}
                strokeWidth={3}
                fill="none"
                strokeDasharray="250 70 180 90"
                opacity={0.55}
              />
              <Circle
                cx="120"
                cy="120"
                r="78"
                stroke={GOLD}
                strokeWidth={2.5}
                fill="none"
                strokeDasharray="150 70 120 50"
                opacity={0.38}
              />
              <G stroke={GOLD} strokeWidth={2.5} strokeLinecap="round" opacity={0.7}>
                <Path d="M150 92 L188 84" />
                <Path d="M156 148 L188 164" />
                <Path d="M84 150 L58 172" />
              </G>
              <G fill={GOLD}>
                <Circle cx="188" cy="84" r="5" />
                <Circle cx="188" cy="164" r="5" />
                <Circle cx="58" cy="172" r="5" />
              </G>
            </Svg>
          </Animated.View>

          <View style={styles.layer}>
            <Svg width={MARK} height={MARK} viewBox="0 0 240 240">
              <Path d="M128 58 L92 126 L116 126 L104 182 L156 108 L128 108 L146 58 Z" fill={GOLD} />
            </Svg>
          </View>
        </Animated.View>

        <Animated.Text style={[styles.title, titleStyle]}>
          GenTrack <Text style={styles.titleAccent}>AI</Text>
        </Animated.Text>
        <Animated.Text style={[styles.subtitle, subtitleStyle]}>
          AI-powered generator care
        </Animated.Text>
      </View>

      <Animated.View style={[styles.dots, dotsStyle]}>
        <Animated.View style={[styles.dot, dot1Style]} />
        <Animated.View style={[styles.dot, dot2Style]} />
        <Animated.View style={[styles.dot, dot3Style]} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#171A1D',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markWrap: {
    width: MARK,
    height: MARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 34,
    fontFamily: Font.displayExtra,
    fontSize: 36,
    letterSpacing: -0.6,
    color: '#FBF3E0',
  },
  titleAccent: {
    color: GOLD,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: Font.semibold,
    fontSize: 14.5,
    color: '#B9AC90',
  },
  dots: {
    position: 'absolute',
    bottom: 56,
    flexDirection: 'row',
    gap: 7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: GOLD,
  },
});
