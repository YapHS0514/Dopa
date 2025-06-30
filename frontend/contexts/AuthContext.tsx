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
  signUp: (email: string, password: string, username: string) => Promise<void>;
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
  const [onboardingCompleted, setOnboardingCompleted] = useState<
    boolean | null
  >(null);

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

  const signUp = async (email: string, password: string, username: string) => {
    try {
      console.log('Attempting to sign up through API...');
      const response = await apiClient.signUp(email, password, username);
      console.log('API signup response:', response);

      Alert.alert(
        'Success!',
        'Please check your email to verify your account, then sign in.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error: any) {
      console.error('Signup error:', error);

      // If API signup fails but account might exist, try to sign in
      if (
        error.message?.includes('already registered') ||
        error.message?.includes('User already registered')
      ) {
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
      console.log(
        'Onboarding status from API:',
        response.profile.onboarding_completed
      );

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
    console.log('🚪 Starting signout process...');

    try {
      // Only call backend signout if we have a valid session
      if (session?.access_token) {
        try {
          console.log('🔐 Calling backend signout...');
          await apiClient.signOut();
          console.log('✅ Backend signout successful');
        } catch (apiError) {
          console.warn('❌ API signout failed, but continuing:', apiError);
        }
      } else {
        console.log(
          '⚠️ No valid session for backend signout, skipping API call'
        );
      }

      // Always attempt Supabase signout for complete cleanup
      console.log('🔒 Calling Supabase signout...');
      try {
        const { error: supabaseError } = await supabase.auth.signOut();
        if (supabaseError) {
          console.warn('⚠️ Supabase signout error:', supabaseError.message);

          // Check if it's just a missing session (which is actually good)
          if (supabaseError.message.includes('Auth session missing')) {
            console.log('✅ Session was already cleared - this is expected');
          } else {
            console.error(
              '🚨 Unexpected Supabase signout error:',
              supabaseError.message
            );
          }
        } else {
          console.log('✅ Supabase signout successful');
        }
      } catch (supabaseError: any) {
        console.warn('❌ Supabase signout exception:', supabaseError.message);
      }

      // Force clear ALL authentication state
      console.log('🧹 Clearing all authentication state...');
      setUser(null);
      setSession(null);
      setOnboardingCompleted(null);

      // Clear API token
      apiClient.setToken(null);

      // Additional cleanup: Clear any potential cached session data
      try {
        await supabase.auth.getSession(); // This helps ensure local storage is cleared
      } catch (e) {
        // Ignore errors here
      }

      console.log('✅ Signout complete, redirecting to login...');
      router.replace('/(auth)/login');
    } catch (error: any) {
      console.error('🚨 Critical signout error:', error);

      // Even if there's an error, force complete cleanup
      console.log('🧹 Force clearing all state due to error...');
      setUser(null);
      setSession(null);
      setOnboardingCompleted(null);
      apiClient.setToken(null);

      // Try to clear any remaining session data
      try {
        await supabase.auth.getSession();
      } catch (e) {
        // Ignore
      }

      router.replace('/(auth)/login');
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
