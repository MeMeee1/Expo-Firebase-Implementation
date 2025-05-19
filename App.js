import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import React, { useEffect } from 'react';

// Handle background messages (must be outside component)
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Message handled in the background:', remoteMessage);
});

export default function App() {
  // Request notification permission (Android 13+ and iOS)
  const requestUserPermission = async () => {
    // Android 13+ requires POST_NOTIFICATIONS permission
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('POST_NOTIFICATIONS permission denied');
        return false;
      }
    }

    // iOS and Android FCM permission
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
      return true;
    } else {
      console.log('Permission not granted:', authStatus);
      return false;
    }
  };

  useEffect(() => {
    const setupMessaging = async () => {
      const permissionGranted = await requestUserPermission();

      if (permissionGranted) {
        const token = await messaging().getToken();
        console.log('FCM Token:', token);
      }

      // Handle notification that opened app from quit state
      const initialNotification = await messaging().getInitialNotification();
      if (initialNotification) {
        console.log(
          'Notification caused app to open from quit state:',
          initialNotification.notification
        );
      }

      // Handle notification that opened app from background
      messaging().onNotificationOpenedApp((remoteMessage) => {
        console.log(
          'Notification caused app to open from background state:',
          remoteMessage.notification
        );
      });

      // Handle foreground messages
      const unsubscribe = messaging().onMessage(async (remoteMessage) => {
        Alert.alert(
          remoteMessage.notification?.title ?? 'Notification',
          remoteMessage.notification?.body ?? ''
        );
      });

      return unsubscribe;
    };

    const unsubscribePromise = setupMessaging();

    // ✅ Clean up foreground message listener
    return () => {
      unsubscribePromise.then((unsubscribe) => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text>Welcome to Firebase Messaging!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
