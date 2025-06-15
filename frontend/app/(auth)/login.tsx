import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const [logoScale] = useState(new Animated.Value(0.8));
  const [glowOpacity] = useState(new Animated.Value(0.5));

  React.useEffect(() => {
    // Logo animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 0.8,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  const checkOnboardingStatus = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error checking onboarding status:', error);
      return true; // Default to true if there's an error
    }

    return data?.onboarding_completed ?? true;
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: signInError,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message === 'Email not confirmed') {
          Alert.alert(
            'Email Not Confirmed',
            'Please check your email for a confirmation link to complete your registration.',
            [
              {
                text: 'Resend Confirmation',
                onPress: async () => {
                  try {
                    const { error: resendError } = await supabase.auth.resend({
                      type: 'signup',
                      email,
                    });
                    if (resendError) throw resendError;
                    Alert.alert(
                      'Success',
                      'Confirmation email has been resent'
                    );
                  } catch (error: any) {
                    Alert.alert('Error', error.message);
                  }
                },
              },
              {
                text: 'OK',
                style: 'cancel',
              },
            ]
          );
        } else {
          throw signInError;
        }
        return;
      }

      if (user) {
        const onboardingCompleted = await checkOnboardingStatus(user.id);
        if (!onboardingCompleted) {
          router.replace('/(auth)/onboarding');
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0a0a0a', '#1a1a2e', '#16213e']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.logoGlow,
                {
                  opacity: glowOpacity,
                },
              ]}
            />
            <Text style={styles.logoText}>Dopa</Text>
          </Animated.View>
          
          <Text style={styles.tagline}>Doomscroll smarter.</Text>
          <Text style={styles.subtitle}>
            Turn your mindless scrolling into mindful learning 🧠
          </Text>
        </View>


        {/* Login Section */}
        <View style={styles.loginSection}>
          <TouchableOpacity
            style={[styles.googleButton, loading && styles.buttonDisabled]}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <LinearGradient
              colors={['#00d4ff', '#090979']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Ionicons name="logo-google" size={24} color="white" />
              <Text style={styles.buttonText}>
                {loading ? 'Getting you in...' : 'Continue with Google'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            By continuing, you agree to feed your brain instead of your anxiety ✨
          </Text>
        </View>
      </View>

      {/* Floating Elements */}
      <View style={styles.floatingElements}>
        <View style={[styles.floatingDot, styles.dot1]} />
        <View style={[styles.floatingDot, styles.dot2]} />
        <View style={[styles.floatingDot, styles.dot3]} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingTop: height * 0.15,
    paddingBottom: 50,
  },
  logoSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  logoGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#00d4ff',
    opacity: 0.3,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 50,
    elevation: 20,
  },
  logoText: {
    fontSize: 72,
    fontWeight: '900',
    color: 'white',
    textShadowColor: '#00d4ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    letterSpacing: -2,
  },
  tagline: {
    fontSize: 24,
    fontWeight: '600',
    color: '#00d4ff',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  loginSection: {
    alignItems: 'center',
  },
  googleButton: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 20,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  disclaimer: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 30,
  },
  floatingElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  floatingDot: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(0, 212, 255, 0.3)',
  },
  dot1: {
    width: 20,
    height: 20,
    top: '20%',
    left: '10%',
  },
  dot2: {
    width: 15,
    height: 15,
    top: '60%',
    right: '15%',
    backgroundColor: 'rgba(255, 0, 150, 0.3)',
  },
  dot3: {
    width: 25,
    height: 25,
    bottom: '30%',
    left: '20%',
    backgroundColor: 'rgba(0, 255, 100, 0.3)',
  },
});
