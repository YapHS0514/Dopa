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
  Animated,
  Dimensions,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { AuthContext } from '../../contexts/AuthContext';
import { GlobalStyles } from '../../constants/GlobalStyles';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = React.useContext(AuthContext);

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

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
        'Please check your email for a confirmation link.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        GlobalStyles.container,
        { justifyContent: 'center', alignItems: 'center', height: '100%' },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{
          width: '100%',
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* DOPA Logo (static position to match login.tsx) */}
        <Animated.View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 0,
            transform: [{ scale: 0.7 }, { translateY: -SCREEN_HEIGHT * 0.12 }],
          }}
        >
          {['D', 'O', 'P', 'A'].map((letter) => (
            <Text key={letter} style={GlobalStyles.logoText}>
              {letter}
            </Text>
          ))}
        </Animated.View>

        {/* Form Area */}
        <Animated.View
          style={{
            width: '100%',
            transform: [{ translateY: -80 }],
          }}
        >
          <View style={styles.formContainer}>
            {/* Email */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { color: '#000', marginTop: 0 }]}
                placeholder="Email"
                placeholderTextColor={Colors.muted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { color: '#000', marginTop: 16 }]}
                placeholder="Password"
                placeholderTextColor={Colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                <Ionicons
                  name={isPasswordVisible ? 'eye-off' : 'eye'}
                  size={24}
                  color={Colors.muted}
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { color: '#000', marginTop: 16 }]}
                placeholder="Confirm Password"
                placeholderTextColor={Colors.muted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!isConfirmPasswordVisible}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() =>
                  setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
                }
              >
                <Ionicons
                  name={isConfirmPasswordVisible ? 'eye-off' : 'eye'}
                  size={24}
                  color={Colors.muted}
                />
              </TouchableOpacity>
            </View>

            {/* Create Account Button */}
            <TouchableOpacity
              style={[styles.registerButton, { marginTop: 16 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.registerButtonText}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text
                    style={[
                      styles.link,
                      { color: Colors.text, textDecorationLine: 'underline' },
                    ]}
                  >
                    Login
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    padding: 24,
    marginTop: 16,
  },
  inputContainer: {
    justifyContent: 'center',
  },
  input: {
    height: 54,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 17,
    fontFamily: 'SF-Pro-Display',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    paddingRight: 50,
  },
  registerButton: {
    backgroundColor: Colors.text,
    height: 54,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 17,
    fontFamily: 'SF-Pro-Display',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display',
    color: Colors.text,
  },
  link: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display',
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 0,
    bottom: -18,
    justifyContent: 'center',
  },
});
