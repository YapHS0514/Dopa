import React, { createContext, useState, useEffect, useContext } from 'react';
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
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    // Initial session fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.access_token) {
        apiClient.setToken(session.access_token);
      }
      setLoading(false);
    });

    // Subscribe to auth state changes
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
      console.log('Attempting to sign up through API...');
      const response = await apiClient.signUp(email, password);
      console.log('API signup response:', response);

      Alert.alert(
        'Success!',
        'Please check your email to verify your account, then sign in.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // If API signup fails but account might exist, try to sign in
      if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
        Alert.alert(
          'Account Exists',
          'This email is already registered. Please sign in instead.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
      } else {
        throw new Error(error.message);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in through API...');
      const response = await apiClient.signIn(email, password);
      console.log('API signin response:', response);

      // Store the onboarding status from the signin response
      setOnboardingCompleted(response.profile.onboarding_completed);
      console.log('Onboarding status from API:', response.profile.onboarding_completed);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      console.log('Supabase session established');
      
      // Don't manually route here - let the auth layout handle routing based on onboarding status
      // The auth layout will check onboarding status and route to /onboarding or /(tabs) accordingly
    } catch (error: any) {
      console.error('Signin error:', error);
      throw new Error(error.message);
    }
  };

  const signOut = async () => {
    try {
      const { error: supabaseError } = await supabase.auth.signOut();
      if (supabaseError) throw supabaseError;

      try {
        await apiClient.signOut();
      } catch (apiError) {
        console.warn('API signout failed, but continuing:', apiError);
      }

      apiClient.setToken(null);
      router.replace('/(auth)/login');
    } catch (error: any) {
      console.error('Signout error:', error);
      throw new Error(error.message);
    }
  };

  const checkOnboardingStatus = async () => {
    try {
      // If we already have the onboarding status from signin, use it
      if (onboardingCompleted !== null) {
        console.log('Using cached onboarding status:', onboardingCompleted);
        return onboardingCompleted;
      }

      // If we have a user, try to get their profile
      if (user) {
        console.log('Fetching onboarding status from API...');
        const profile = await apiClient.getProfile();
        setOnboardingCompleted(profile.onboarding_completed);
        return profile.onboarding_completed;
      }
      return false;
    } catch (error: any) {
      console.error('Check onboarding error:', error);
      // If there's an error getting the profile, assume they need onboarding
      return false;
    }
  };

  const completeOnboarding = async () => {
    try {
      await apiClient.completeOnboarding();
      // Update the cached onboarding status
      setOnboardingCompleted(true);
      console.log('Onboarding completed, updated cached status');
    } catch (error: any) {
      console.error('Complete onboarding error:', error);
      throw new Error(error.message);
    }
  };

  const value: AuthContextType = {
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
