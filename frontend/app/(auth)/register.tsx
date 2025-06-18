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
} from 'react-native';
import { Link, router } from 'expo-router';
import * as Animatable from 'react-native-animatable';
import { useStore } from '../../lib/store';
import { Colors } from '../../constants/Colors';
import { AppIcon } from '../../components/AppIcon';
import { AuthContext } from '../../contexts/AuthContext';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'dark';
  const { signUp } = React.useContext(AuthContext);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password);
      Alert.alert(
        'Registration Successful',
        'Please check your email for a confirmation link to complete your registration.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: Colors[isDark ? 'dark' : 'light'].background }]}
    >
      <Animatable.View 
        animation="fadeIn" 
        duration={1000} 
        style={styles.logoContainer}
      >
        <Animatable.View animation="bounceIn" duration={1500}>
          <AppIcon color={Colors[isDark ? 'dark' : 'light'].tint} />
        </Animatable.View>
        <Animatable.Text
          animation="fadeInUp"
          delay={500}
          style={[styles.title, { color: Colors[isDark ? 'dark' : 'light'].text }]}
        >
          Create Account
        </Animatable.Text>
      </Animatable.View>

      <Animatable.View
        animation="fadeInUp"
        delay={1000}
        style={styles.formContainer}
      >
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: Colors[isDark ? 'dark' : 'light'].cardBackground,
              color: Colors[isDark ? 'dark' : 'light'].text,
              borderColor: Colors[isDark ? 'dark' : 'light'].border,
            }
          ]}
          placeholder="Email"
          placeholderTextColor={Colors[isDark ? 'dark' : 'light'].textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: Colors[isDark ? 'dark' : 'light'].cardBackground,
              color: Colors[isDark ? 'dark' : 'light'].text,
              borderColor: Colors[isDark ? 'dark' : 'light'].border,
            }
          ]}
          placeholder="Password"
          placeholderTextColor={Colors[isDark ? 'dark' : 'light'].textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: Colors[isDark ? 'dark' : 'light'].cardBackground,
              color: Colors[isDark ? 'dark' : 'light'].text,
              borderColor: Colors[isDark ? 'dark' : 'light'].border,
            }
          ]}
          placeholder="Confirm Password"
          placeholderTextColor={Colors[isDark ? 'dark' : 'light'].textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[
            styles.registerButton,
            { backgroundColor: Colors[isDark ? 'dark' : 'light'].tint },
            loading && styles.buttonDisabled
          ]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.registerButtonText}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: Colors[isDark ? 'dark' : 'light'].textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={[styles.link, { color: Colors[isDark ? 'dark' : 'light'].tint }]}>
                Login
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </Animatable.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontFamily: 'SpaceMono',
    marginTop: 20,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'SpaceMono',
  },
  registerButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
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
