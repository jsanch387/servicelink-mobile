import 'react-native-gesture-handler';
import 'react-native-get-random-values';

import './global.css';

import * as Notifications from 'expo-notifications';
import { registerRootComponent } from 'expo';

import App from './App';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
