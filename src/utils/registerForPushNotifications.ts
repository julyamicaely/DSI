import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
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
            throw new Error('Failed to get push token for push notification!');
        }
        const ProjectId = 
            Constants?.expoConfig?.extra?.eas?.projectId ??
            Constants?.easConfig?.projectId;
        if (!ProjectId) {
            throw new Error('EAS Project ID is not defined in app config');
        }
        try {
            const pushTokenString = (
                await Notifications.getExpoPushTokenAsync({
                projectId: ProjectId,
            })
        ).data;
        console.log('Push Notification Token:', pushTokenString);
        return pushTokenString;
    } catch (e: unknown) {
        throw new Error(`Error getting push token: ${e instanceof Error ? e.message : String(e)}`);
    }
    } else {
        throw new Error('Must use physical device for Push Notifications');
    }
}
        
