import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    // Project ID is sometimes required in bare workflow but usually auto-detected in Managed. 
    // If errors occur, we might need Constants.expoConfig.extra.eas.projectId
    try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: "e-commerce-template", // This might be needed if not inferred
          vapidKey: "BCxTrz57nZBo95ZGDKxyyuMn3lHsE7qg0GJFQ3xAwCP6Rh2rQL0InCogIHtm7cJhK6ITRKeAxKO4jD1FWtgu6SU"
        } as any);
        token = tokenData.data;
    } catch(e) {
        console.log("Error getting token:", e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export const usePushNotifications = () => {
    const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');
    const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
    const notificationListener = useRef<any>(null);
    const responseListener = useRef<any>(null);

    useEffect(() => {
        registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
           console.log("Notification Clicked:", response);
        });

        return () => {
            if(notificationListener.current) {
                notificationListener.current.remove();
            }
            if(responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, []);

    return {
        expoPushToken,
        notification
    };
};
