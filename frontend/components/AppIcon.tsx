import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AppIconProps {
  source?: string;
  size?: number;
  animated?: boolean;
  onAnimationComplete?: () => void;
  isEntryAnimation?: boolean;
}

export function AppIcon({
  source,
  size = 60,
  animated = false,
  onAnimationComplete,
  isEntryAnimation = false,
}: AppIconProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const letterAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    if (animated) {
      if (isEntryAnimation) {
        // Entry animation: letters appear one by one
        const letterSequence = letterAnimations.map((letterAnim, index) =>
          Animated.timing(letterAnim, {
            toValue: 1,
            duration: 300,
            delay: index * 200,
            useNativeDriver: true,
          })
        );

        Animated.sequence([
          Animated.parallel(letterSequence),
          Animated.delay(500),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          if (onAnimationComplete) {
            onAnimationComplete();
          }
        });
      } else {
        // Regular animation
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (onAnimationComplete) {
            onAnimationComplete();
          }
        });
      }
    } else {
      // No animation
      scale.setValue(1);
      opacity.setValue(1);
      letterAnimations.forEach((anim) => anim.setValue(1));
    }
  }, [animated, isEntryAnimation]);

  if (isEntryAnimation) {
    return (
      <View style={styles.entryContainer}>
        <Animated.View
          style={[
            styles.letterContainer,
            {
              transform: [
                { scale: scale },
                {
                  translateY: letterAnimations[0].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
              opacity: letterAnimations[0],
            },
          ]}
        >
          <Text style={[styles.letter, { fontSize: size * 0.8 }]}>D</Text>
        </Animated.View>
        <Animated.View
          style={[
            styles.letterContainer,
            {
              transform: [
                { scale: scale },
                {
                  translateY: letterAnimations[1].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
              opacity: letterAnimations[1],
            },
          ]}
        >
          <Text style={[styles.letter, { fontSize: size * 0.8 }]}>O</Text>
        </Animated.View>
        <Animated.View
          style={[
            styles.letterContainer,
            {
              transform: [
                { scale: scale },
                {
                  translateY: letterAnimations[2].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
              opacity: letterAnimations[2],
            },
          ]}
        >
          <Text style={[styles.letter, { fontSize: size * 0.8 }]}>P</Text>
        </Animated.View>
        <Animated.View
          style={[
            styles.letterContainer,
            {
              transform: [
                { scale: scale },
                {
                  translateY: letterAnimations[3].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
              opacity: letterAnimations[3],
            },
          ]}
        >
          <Text style={[styles.letter, { fontSize: size * 0.8 }]}>A</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          transform: [{ scale }],
          opacity,
        },
      ]}
    >
      <LinearGradient
        colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']}
        style={[styles.gradient, { borderRadius: size / 2 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[styles.text, { fontSize: size * 0.4 }]}>DOPA</Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  letterContainer: {
    marginHorizontal: 2,
  },
  letter: {
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  gradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#ffffff',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
