import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useStore } from '../../lib/store';
import { Colors } from '../../constants/Colors';
import { AuthContext } from '../../contexts/AuthContext';
import { GlobalStyles } from '../../constants/GlobalStyles';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = React.useContext(AuthContext);
  const [showForm, setShowForm] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isMounted = useRef(true);
  const letterAnimations = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  const shrinkAnim = useRef(new Animated.Value(1)).current;
  const moveAnim = useRef(new Animated.Value(0)).current;
  const formFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    isMounted.current = true;
    const animation = Animated.sequence([
      Animated.timing(letterAnimations[0], {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(letterAnimations[1], {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(letterAnimations[2], {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(letterAnimations[3], {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(shrinkAnim, {
          toValue: 0.7,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(moveAnim, {
          toValue: -SCREEN_HEIGHT * 0.12,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(formFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]);

    animation.start(() => {
      if (isMounted.current) {
        setShowForm(true);
      }
    });

    return () => {
      isMounted.current = false;
      animation.stop();
      letterAnimations.forEach((anim) => anim.setValue(0));
      shrinkAnim.setValue(1);
      moveAnim.setValue(0);
      formFade.setValue(0);
    };
  }, []);

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
        <Animated.View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 0,
            transform: [{ scale: shrinkAnim }, { translateY: moveAnim }],
          }}
        >
          {['D', 'O', 'P', 'A'].map((letter, i) => (
            <Animated.Text
              key={letter}
              style={[
                GlobalStyles.logoText,
                {
                  opacity: letterAnimations[i],
                  transform: [
                    {
                      translateY: letterAnimations[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [40, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {letter}
            </Animated.Text>
          ))}
        </Animated.View>
        <Animated.View
          style={{
            width: '100%',
            opacity: formFade,
            transform: [{ translateY: -80 }],
          }}
        >
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: '#fff', color: '#000', marginTop: 0 },
                ]}
                placeholder="Email"
                placeholderTextColor={Colors.muted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: '#fff', color: '#000', marginTop: 16 },
                ]}
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
            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>
            <View style={styles.footer}>
              <Text style={GlobalStyles.text}>Don't have an account? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text
                    style={[
                      GlobalStyles.buttonText,
                      { textDecorationLine: 'underline' },
                    ]}
                  >
                    Sign Up
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
    marginBottom: 0,
    justifyContent: 'center',
  },
  inputLabel: {
    ...GlobalStyles.textMedium,
    marginBottom: 6,
  },
  input: {
    ...GlobalStyles.text,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 17,
    color: Colors.text,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 0,
    marginBottom: 2,
    paddingRight: 50,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 14,
  },
  button: {
    backgroundColor: Colors.text,
    height: 54,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 17,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 0,
    bottom: -18,
    justifyContent: 'center',
  },
});
