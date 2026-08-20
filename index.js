import 'react-native-gesture-handler';
import 'react-native-get-random-values';

import './global.css';

import * as Notifications from 'expo-notifications';
import { isRunningInExpoGo, registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';

import App from './App';
import { ensureAndroidDefaultNotificationChannel } from './src/features/notifications/utils/ensureAndroidDefaultNotificationChannel';

// Expo Go does not support splash control; preventAutoHide without a working hide leaves you stuck.
if (!isRunningInExpoGo()) {
  SplashScreen.setOptions({ duration: 0, fade: false });
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

if (Platform.OS === 'android') {
  void ensureAndroidDefaultNotificationChannel();
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
