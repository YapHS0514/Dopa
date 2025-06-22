import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { apiClient } from '../lib/api';
import { Alert } from 'react-native';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkOnboardingStatus: () => Promise<boolean>;
  completeOnboarding: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  checkOnboardingStatus: async () => false,
  completeOnboarding: async () => {},
});

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.access_token) {
        apiClient.setToken(session.access_token);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.access_token) {
        apiClient.setToken(session.access_token);
      } else {
        apiClient.setToken(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      // Just create the user through our API
      await apiClient.signUp(email, password);

      // Show success message and redirect to login
      Alert.alert(
        'Success',
        'Please check your email to verify your account before signing in.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // First sign in through our API
      console.log('Attempting to sign in through API...');
      const response = await apiClient.signIn(email, password);
      console.log('API signin response:', response);

      // Then establish a Supabase session
      console.log('Establishing Supabase session...');
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      console.log('Supabase session established');

      // Check onboarding status and redirect accordingly
      console.log(
        'Checking onboarding status:',
        response.profile.onboarding_completed
      );
      if (!response.profile.onboarding_completed) {
        console.log('User not onboarded, redirecting to onboarding...');
        router.replace('/onboarding');
      } else {
        console.log('User onboarded, redirecting to tabs...');
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Signin error:', error);
      throw new Error(error.message);
    }
  };

  const signOut = async () => {
    try {
      // First sign out from Supabase to clear the session
      const { error: supabaseError } = await supabase.auth.signOut();
      if (supabaseError) throw supabaseError;

      // Then sign out from our API
      try {
        await apiClient.signOut();
      } catch (apiError) {
        // If API signout fails, it's not critical since we've already cleared the Supabase session
        console.warn('API signout failed, but continuing:', apiError);
      }

      // Clear the API client token
      apiClient.setToken(null);

      // Navigate to login
      router.replace('/(auth)/login');
    } catch (error: any) {
      console.error('Signout error:', error);
      throw new Error(error.message);
    }
  };

  const checkOnboardingStatus = async () => {
    try {
      const profile = await apiClient.getProfile();
      return profile.onboarding_completed;
    } catch (error: any) {
      console.error('Check onboarding error:', error);
      throw new Error(error.message);
    }
  };

  const completeOnboarding = async () => {
    try {
      await apiClient.completeOnboarding();
    } catch (error: any) {
      console.error('Complete onboarding error:', error);
      throw new Error(error.message);
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    checkOnboardingStatus,
    completeOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
