// Expo configuration. Secrets come from a local .env file (see .env.example).
const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export default {
  expo: {
    name: 'Mishwar UJ',
    slug: 'student-rides',
    scheme: 'studentrides',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    // Arabic is the default language, so the layout must be allowed to flip to RTL.
    extra: {
      supportsRTL: true,
    },
    ios: {
      bundleIdentifier: 'jo.studentrides.app',
      supportsTablet: false,
      config: { googleMapsApiKey: GOOGLE_MAPS_KEY },
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'نستخدم موقعك لتحديد مكان منزلك بدقة حتى يصل إليك الكابتن. / We use your location to set your home pickup point.',
      },
    },
    android: {
      package: 'jo.studentrides.app',
      permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
      config: { googleMaps: { apiKey: GOOGLE_MAPS_KEY } },
    },
    plugins: [
      'expo-router',
      'expo-localization',
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'نستخدم موقعك لتحديد مكان منزلك بدقة. / We use your location to set your home pickup point.',
        },
      ],
      '@react-native-community/datetimepicker',
    ],
  },
};
