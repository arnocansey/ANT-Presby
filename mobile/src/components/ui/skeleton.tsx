import React from 'react';
import { AccessibilityInfo, Animated, type DimensionValue } from 'react-native';

import { Corner } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

export function Skeleton({ height, width = '100%', radius = Corner.control }: { height: number; width?: DimensionValue; radius?: number }) {
  const { colors } = useAppTheme();
  const opacity = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      loop.start();
    });
    return () => loop?.stop();
  }, [opacity]);

  return <Animated.View accessible={false} style={{ height, width, borderRadius: radius, backgroundColor: colors.surface, opacity }} />;
}

export default Skeleton;
