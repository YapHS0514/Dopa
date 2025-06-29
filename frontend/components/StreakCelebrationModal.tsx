import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface StreakCelebrationModalProps {
  visible: boolean;
  currentStreak: number;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

const StreakCelebrationModal: React.FC<StreakCelebrationModalProps> = ({
  visible,
  currentStreak,
  onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      // Start confetti
      setTimeout(() => {
        confettiRef.current?.start();
      }, 300);

      // Animate modal entrance
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <StatusBar backgroundColor="transparent" barStyle="light-content" />
      
      {/* Background with gradient */}
      <LinearGradient
        colors={['#FF6B35', '#F7931E', '#FFD23F']}
        style={styles.background}
      >
        {/* Fire particles background effect */}
        <View style={styles.fireContainer}>
          {[...Array(20)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.fireParticle,
                {
                  left: Math.random() * width,
                  animationDelay: Math.random() * 2000,
                },
              ]}
            />
          ))}
        </View>

        {/* Confetti */}
        <ConfettiCannon
          ref={confettiRef}
          count={200}
          origin={{ x: width / 2, y: -10 }}
          autoStart={false}
          fadeOut
        />

        {/* Modal content */}
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Fire emoji with glow effect */}
          <View style={styles.emojiContainer}>
            <View style={styles.glowEffect} />
            <Text style={styles.fireEmoji}>🔥</Text>
          </View>

          {/* Main message */}
          <Text style={styles.title}>Streak Complete!</Text>
          <Text style={styles.subtitle}>
            You completed today's learning goal!
          </Text>

          {/* Streak counter */}
          <View style={styles.streakContainer}>
            <Text style={styles.streakNumber}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>
              day{currentStreak !== 1 ? 's' : ''} in a row
            </Text>
          </View>

          {/* Motivational message */}
          <Text style={styles.motivationText}>
            {currentStreak >= 7
              ? "You're absolutely crushing it! 🚀"
              : currentStreak >= 3
              ? "Keep the momentum going! 💪"
              : "Great start! Keep it up! ⭐"}
          </Text>

          {/* Continue button */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF4757', '#FF3742']}
              style={styles.buttonGradient}
            >
              <Ionicons name="chevron-forward" size={24} color="white" />
              <Text style={styles.buttonText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fireContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fireParticle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#FFD23F',
    borderRadius: 2,
    opacity: 0.7,
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emojiContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  glowEffect: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFD23F',
    opacity: 0.3,
    top: -10,
    left: -10,
  },
  fireEmoji: {
    fontSize: 100,
    textAlign: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  streakContainer: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  streakLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 5,
  },
  motivationText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 40,
    fontStyle: 'italic',
  },
  continueButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default StreakCelebrationModal; 