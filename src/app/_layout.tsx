import { AuthProvider } from '../context/AuthContext';
import * as React from 'react';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import colors from '../components/Colors'
import { registerForPushNotificationsAsync } from '../utils/registerForPushNotifications';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function RootLayout() {

  const routerButton = useRouter();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PaperProvider>
          <Stack
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen
              name="index"
              options={{
                headerShown: true,
                headerTitle: () => (
                  <View style={{ flexDirection: 'row' }}>
                    <Image style={styles.image} source={require('../assets/Lifebeat-Logo.svg')} />
                    <Text style={styles.title} >Lifebeat</Text>
                  </View>
                ),
                headerRight: () => {
                  return (
                    <View style={{ flexDirection: 'row' }}>
                      <TouchableOpacity style={styles.headerButtonsRight} onPress={() => routerButton.push('/about')} >
                        <Image source={require('../assets/buttonHelp.svg')} style={styles.headerButtonsRight} />
                      </TouchableOpacity>
                    </View>
                  )
                },
                headerStyle: {
                  backgroundColor: colors.red,
                },
              }}

            />
            <Stack.Screen
              name="login"
              options={{
                headerShown: true,
                headerTitle: () => (
                  <View style={{ flexDirection: 'row' }}>
                    <Image style={styles.image} source={require('../assets/Lifebeat-Logo.svg')} />
                    <Text style={styles.title} >Lifebeat</Text>
                  </View>
                ),
                headerRight: () => {
                  return (
                    <View style={{ flexDirection: 'row' }}>
                      <TouchableOpacity style={styles.headerButtonsRight} onPress={() => routerButton.push('/about')} >
                        <Image source={require('../assets/buttonHelp.svg')} style={styles.headerButtonsRight} />
                      </TouchableOpacity>
                    </View>
                  )
                },
                headerStyle: {
                  backgroundColor: colors.red,
                },
              }}

            />
            <Stack.Screen
              name="register"
              options={{
                headerShown: true,
                headerTitle: () => (
                  <View style={{ flexDirection: 'row' }}>
                    <Image style={styles.image} source={require('../assets/Lifebeat-Logo.svg')} />
                    <Text style={styles.title} >Lifebeat</Text>
                  </View>
                ),
                headerRight: () => {
                  return (
                    <View style={{ flexDirection: 'row' }}>
                      <TouchableOpacity style={styles.headerButtonsRight} onPress={() => routerButton.push('/about')} >
                        <Image source={require('../assets/buttonHelp.svg')} style={styles.headerButtonsRight} />
                      </TouchableOpacity>
                    </View>
                  )
                },
                headerLeft: () => (
                  <TouchableOpacity onPress={() => routerButton.back()}>
                    <Image source={require('../assets/buttonBack.svg')} style={styles.headerButtonsLeft} />
                  </TouchableOpacity>
                ),
                headerStyle: {
                  backgroundColor: colors.red,
                },
              }}
            />
            <Stack.Screen
              name="about"
              options={{
                headerShown: true,
                headerTitle: () => (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {/* Using the standard Logo + Text as "LifeBeat with heart icon" (Logo usually contains the heart/brand mark) */}
                    <Image style={styles.image} source={require('../assets/Lifebeat-Logo.svg')} />
                    <Text style={styles.title} >Lifebeat</Text>
                  </View>
                ),
                headerLeft: () => (
                  <TouchableOpacity onPress={() => routerButton.back()}>
                    <Image source={require('../assets/buttonBack.svg')} style={styles.headerButtonsLeft} />
                  </TouchableOpacity>
                ),
                headerStyle: {
                  backgroundColor: colors.red,
                },
              }}
            />
          </Stack>
          <Toast />
        </PaperProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  image: {
    width: 21.26,
    height: 22,
    paddingLeft: 12,
    marginLeft: 12,
  },
  title: {
    color: '#FFFFFF',
    width: 221,
    height: 24,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
    marginLeft: 8,
  },
  headerButtonsRight: {
    width: 21.26,
    height: 22,
  },
  headerButtonsLeft: {
    marginLeft: 10,
    width: 21.26,
    height: 22,
  },
});