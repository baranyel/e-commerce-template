import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Image, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing, 
  runOnJS,
  withDelay,
  interpolate
} from 'react-native-reanimated';
import { useLoading } from '../../context/LoadingContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const LOGO_SIZE = 120;
const ANIMATION_DURATION = 800;

export const CurtainLoader = () => {
  const { isLoading } = useLoading();
  const progress = useSharedValue(0); // 0 = Closed (Loading), 1 = Open (Finished)
  const zIndex = useSharedValue(-1);
  const opacity = useSharedValue(0);
  
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (isLoading) {
      // Close the curtain instantly (or fast)
      zIndex.value = 9999;
      opacity.value = 1;
      progress.value = withTiming(0, { duration: 0 }); // Instant close
    } else {
      // Open the curtain
      progress.value = withTiming(1, {
        duration: ANIMATION_DURATION,
        easing: Easing.bezier(0.25, 1, 0.5, 1),
      }, (finished) => {
        if (finished) {
           zIndex.value = -1; // Hide completely
           opacity.value = 0;
        }
      });
    }
  }, [isLoading]);

  // Left Panel Animation (Moves Left)
  const leftPanelStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 1], [0, -width / 2]);
    return {
      transform: [{ translateX }],
    };
  });

  // Right Panel Animation (Moves Right)
  const rightPanelStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 1], [0, width / 2]);
    return {
      transform: [{ translateX }],
    };
  });

  // Container Style to manage zIndex
  const containerStyle = useAnimatedStyle(() => {
    return {
      zIndex: zIndex.value,
      opacity: opacity.value, // Fade out logic can be added if needed, but we rely on split
    };
  });

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents={isLoading ? 'auto' : 'none'}>
      {/* Left Curtain */}
      <Animated.View style={[styles.panel, styles.leftPanel, leftPanelStyle]}>
         <View style={[styles.logoContainer, { right: -LOGO_SIZE / 2 }]}>
            <Image 
                source={require('../../assets/images/icon.png')} 
                style={styles.logo}
                resizeMode="contain"
            />
         </View>
      </Animated.View>

      {/* Right Curtain */}
      <Animated.View style={[styles.panel, styles.rightPanel, rightPanelStyle]}>
         <View style={[styles.logoContainer, { left: -LOGO_SIZE / 2 }]}>
            <Image 
                source={require('../../assets/images/icon.png')} 
                style={styles.logo}
                resizeMode="contain"
            />
         </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  panel: {
    width: width / 2,
    height: height,
    backgroundColor: '#1f2937', // Dark Gray / Slate 800 - Adjust for theme
    overflow: 'hidden',
    justifyContent: 'center',
    position: 'relative',
  },
  leftPanel: {
    alignItems: 'flex-end', // Push content to right edge
    borderRightWidth: 0,
  },
  rightPanel: {
    alignItems: 'flex-start', // Push content to left edge
    borderLeftWidth: 0, 
  },
  logoContainer: {
    position: 'absolute',
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    top: height / 2 - LOGO_SIZE / 2, // Centered vertically
    justifyContent: 'center',
    alignItems: 'center',
    // We don't clip the logo here, the panel overflow:hidden clips it!
  },
  logo: {
    width: '100%',
    height: '100%',
  }
});
