import * as React from 'react';
import { Stack } from 'expo-router';
import { Image } from 'expo-image';
import { Text,  TouchableOpacity, View, StyleSheet } from 'react-native';

export default function RootLayout() {

  return (
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
              <TouchableOpacity style={styles.buttonHelp} onPress={() => {}} >
                <Image source={require('../assets/buttonHelp.svg')} style={styles.buttonHelp} />
              </TouchableOpacity>
            </View>
          )
        },
        headerStyle: {
          backgroundColor: '#E53935',
        },
      }}
      />
      <Stack.Screen name="Register" />
    </Stack>
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
  buttonHelp: {
    marginLeft: 12,
    marginRight: 24,
    width: 21.26,
    height: 22,
  },
});