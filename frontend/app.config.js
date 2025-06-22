module.exports = {
  expo: {
    name: 'DOPA',
    slug: 'dopa',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'myapp',
    userInterfaceStyle: 'dark',
    splash: {
      backgroundColor: '#000000'
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.dopa.app'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/icon.png',
        backgroundColor: '#000000'
      },
      package: 'com.dopa.app'
    },
    web: {
      bundler: 'metro',
      favicon: './assets/images/favicon.png'
    },
    plugins: [
      'expo-router'
    ],
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    }
  }
}; 