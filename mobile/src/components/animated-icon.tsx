import { Image } from 'expo-image';
import { useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const INITIAL_SCALE_FACTOR = Dimensions.get('screen').height / 90;
const DURATION = 900;

const keyframe = new Keyframe({
  0: {
    transform: [{ scale: INITIAL_SCALE_FACTOR }],
  },
  100: {
    transform: [{ scale: 1 }],
    easing: Easing.out(Easing.exp),
  },
});

const logoKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 0.8 }],
    opacity: 0,
  },
  45: {
    transform: [{ scale: 0.92 }],
    opacity: 0.55,
    easing: Easing.out(Easing.cubic),
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.out(Easing.exp),
  },
});

const glowKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 0.92 }],
    opacity: 0.25,
  },
  100: {
    transform: [{ scale: 1.06 }],
    opacity: 1,
  },
});

const wordmarkKeyframe = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ translateY: 12 }],
  },
  55: {
    opacity: 0,
    transform: [{ translateY: 12 }],
    easing: Easing.out(Easing.cubic),
  },
  100: {
    opacity: 1,
    transform: [{ translateY: 0 }],
    easing: Easing.out(Easing.exp),
  },
});

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: {
      transform: [{ scale: INITIAL_SCALE_FACTOR }],
      opacity: 1,
    },
    20: {
      opacity: 1,
    },
    70: {
      opacity: 0,
      easing: Easing.out(Easing.cubic),
    },
    100: {
      opacity: 0,
      transform: [{ scale: 1 }],
      easing: Easing.out(Easing.cubic),
    },
  });

  return (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.backgroundSolidColor}
    >
      <View style={styles.overlayBackdrop}>
        <Animated.View entering={glowKeyframe.duration(2400)} style={styles.glow}>
          <Image style={styles.glow} source={require('@/assets/images/logo-glow.png')} />
        </Animated.View>

        <View style={styles.brandStack}>
          <Animated.View entering={keyframe.duration(DURATION)} style={styles.background} />
          <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
            <Image
              style={styles.image}
              source={require('@/assets/images/android-icon-foreground.png')}
              contentFit="contain"
            />
          </Animated.View>
          <Animated.View entering={wordmarkKeyframe.duration(1100)} style={styles.wordmarkWrap}>
            <Text style={styles.wordmarkTitle}>ANT PRESS</Text>
            <Text style={styles.wordmarkSubtitle}>Grace In Motion</Text>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View entering={glowKeyframe.duration(2400)} style={styles.glow}>
        <Image style={styles.glow} source={require('@/assets/images/logo-glow.png')} />
      </Animated.View>

      <Animated.View entering={keyframe.duration(DURATION)} style={styles.background} />
      <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
        <Image
          style={styles.image}
          source={require('@/assets/images/android-icon-foreground.png')}
          contentFit="contain"
        />
      </Animated.View>
      <Animated.View entering={wordmarkKeyframe.duration(1100)} style={styles.wordmarkWrapInline}>
        <Text style={styles.wordmarkTitle}>ANT PRESS</Text>
        <Text style={styles.wordmarkSubtitle}>Grace In Motion</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 240,
    height: 240,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 168,
    height: 238,
    zIndex: 100,
  },
  image: {
    width: 110,
    height: 110,
  },
  background: {
    borderRadius: 52,
    backgroundColor: '#16213a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    width: 168,
    height: 168,
    position: 'absolute',
    shadowColor: '#208AEF',
    shadowOpacity: 0.28,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 18 },
    elevation: 14,
  },
  backgroundSolidColor: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f172a',
    zIndex: 1000,
  },
  overlayBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkWrap: {
    marginTop: 28,
    alignItems: 'center',
  },
  wordmarkWrapInline: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  wordmarkTitle: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  wordmarkSubtitle: {
    marginTop: 6,
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3.2,
    textTransform: 'uppercase',
  },
});
