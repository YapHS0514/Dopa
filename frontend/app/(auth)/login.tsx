import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Link, router } from 'expo-router';
import * as Animatable from 'react-native-animatable';
import { useStore } from '../../lib/store';
import { Colors } from '../../constants/Colors';
import { AppIcon } from '../../components/AppIcon';
import { AuthContext } from '../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'dark';
  const { signIn } = React.useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={isDark ? 
        ['#000000', '#1a1a1a'] : 
        ['#ffffff', '#f0f0f0']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animatable.View 
          animation="fadeIn" 
          duration={1000} 
          style={styles.logoContainer}
        >
          <Animatable.View 
            animation="bounceIn" 
            duration={1500}
            style={styles.iconContainer}
          >
            <AppIcon color={Colors[isDark ? 'dark' : 'light'].tint} />
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0)']}
              style={styles.iconGlow}
            />
          </Animatable.View>
          <Animatable.Text
            animation="fadeInUp"
            delay={500}
            style={[styles.title, { color: Colors[isDark ? 'dark' : 'light'].text }]}
          >
            Welcome Back
          </Animatable.Text>
        </Animatable.View>

        <Animatable.View
          animation="fadeInUp"
          delay={1000}
          style={styles.formContainer}
        >
          <BlurView
            intensity={100}
            tint={isDark ? 'dark' : 'light'}
            style={styles.formBlur}
          >
            <View style={styles.inputContainer}>
              <Feather 
                name="mail" 
                size={20} 
                color={Colors[isDark ? 'dark' : 'light'].textSecondary} 
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[isDark ? 'dark' : 'light'].text }
                ]}
                placeholder="Email"
                placeholderTextColor={Colors[isDark ? 'dark' : 'light'].textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Feather 
                name="lock" 
                size={20} 
                color={Colors[isDark ? 'dark' : 'light'].textSecondary} 
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[isDark ? 'dark' : 'light'].text }
                ]}
                placeholder="Password"
                placeholderTextColor={Colors[isDark ? 'dark' : 'light'].textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.buttonDisabled
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={[Colors[isDark ? 'dark' : 'light'].tint, Colors[isDark ? 'dark' : 'light'].success]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'Logging in...' : 'Login'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: Colors[isDark ? 'dark' : 'light'].textSecondary }]}>
                Don't have an account?{' '}
              </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={[styles.link, { color: Colors[isDark ? 'dark' : 'light'].tint }]}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </BlurView>
        </Animatable.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 80,
    opacity: 0.5,
  },
  title: {
    fontSize: 32,
    fontFamily: 'SpaceMono',
    marginTop: 20,
  },
  formContainer: {
    width: '100%',
  },
  formBlur: {
    padding: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'SpaceMono',
  },
  loginButton: {
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 16,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'SpaceMono',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
  },
  link: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
  },
});
