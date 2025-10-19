import React from 'react';
import { Slot } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import * as React from 'react';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Text,  TouchableOpacity, View, StyleSheet } from 'react-native';
import colors from '../com/Colors'

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{headerShown: false}}
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
                <TouchableOpacity style={styles.headerButtonsRight} onPress={() => {}} >
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
                  <TouchableOpacity style={styles.headerButtonsRight} onPress={() => {}} >
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
                <TouchableOpacity style={styles.headerButtonsRight} onPress={() => {}} >
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
    </Stack>
  </AuthProvider>
  );
}
