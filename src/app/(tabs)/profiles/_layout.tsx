import { Stack, useRouter } from "expo-router";
import React from "react";
import { Image } from 'expo-image';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import colors from '../../../components/Colors'

export default function ProfilesLayout() {
  const routerButton = useRouter();
  return (
    <Stack
    >
      <Stack.Screen 
        name="index" 
        options={{
            title: "Perfis",
            headerShown: true,
            headerTitle: () => (
              <View style={{ flexDirection: 'row' }}>
                <Image style={styles.image} source={require('../../../assets/Lifebeat-Logo.svg')} />
                <Text style={styles.title} >Lifebeat</Text>
              </View>
              ),
            headerRight: () => {
              return (
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity style={styles.headerButtonsRight} onPress={() => {}} >
                    <Image source={require('../../../assets/buttonHelp.svg')} style={styles.headerButtonsRight} />
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
        name="myinfo" 
        options={{ 
          title: "Minhas Informações",
          headerShown: true,
          headerTitle: () => (
              <View style={{ flexDirection: 'row' }}>
                <Image style={styles.image} source={require('../../../assets/Lifebeat-Logo.svg')} />
                <Text style={styles.title} >Lifebeat</Text>
              </View>
              ),
            headerRight: () => {
              return (
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity style={styles.headerButtonsRight} onPress={() => {}} >
                    <Image source={require('../../../assets/buttonHelp.svg')} style={styles.headerButtonsRight} />
                  </TouchableOpacity>
                </View>
              )
            },
            headerLeft: () => (
              <TouchableOpacity onPress={() => routerButton.back()}>
                <Image source={require('../../../assets/buttonBack.svg')} style={styles.headerButtonsLeft} />
              </TouchableOpacity>
            ),
            headerStyle: {
              backgroundColor: colors.red,
            },
          }} 
        />
      <Stack.Screen 
        name="dadoscli" 
        options={{ 
          title: "Dados Clínicos",
          headerShown: true,
            headerTitle: () => (
              <View style={{ flexDirection: 'row' }}>
                <Image style={styles.image} source={require('../../../assets/Lifebeat-Logo.svg')} />
                <Text style={styles.title} >Lifebeat</Text>
              </View>
              ),
            headerRight: () => {
              return (
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity style={styles.headerButtonsRight} onPress={() => {}} >
                    <Image source={require('../../../assets/buttonHelp.svg')} style={styles.headerButtonsRight} />
                  </TouchableOpacity>
                </View>
              )
            },
            headerLeft: () => (
              <TouchableOpacity onPress={() => routerButton.back()}>
                <Image source={require('../../../assets/buttonBack.svg')} style={styles.headerButtonsLeft} />
              </TouchableOpacity>
            ),
            headerStyle: {
              backgroundColor: colors.red,
            },
          }} 
        />
      <Stack.Screen 
        name="permissions" 
        options={{ 
          title: "Permissões",
          headerShown: true,
            headerTitle: () => (
              <View style={{ flexDirection: 'row' }}>
                <Image style={styles.image} source={require('../../../assets/Lifebeat-Logo.svg')} />
                <Text style={styles.title} >Lifebeat</Text>
              </View>
              ),
            headerRight: () => {
              return (
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity style={styles.headerButtonsRight} onPress={() => {}} >
                    <Image source={require('../../../assets/buttonHelp.svg')} style={styles.headerButtonsRight} />
                  </TouchableOpacity>
                </View>
              )
            },
            headerLeft: () => (
              <TouchableOpacity onPress={() => routerButton.back()}>
                <Image source={require('../../../assets/buttonBack.svg')} style={styles.headerButtonsLeft} />
              </TouchableOpacity>
            ),
            headerStyle: {
              backgroundColor: colors.red,
            },
          }} 
        />
      <Stack.Screen 
        name="logout" 
        options={{ 
          title: "Sair",
          headerShown: true,
            headerTitle: () => (
              <View style={{ flexDirection: 'row' }}>
                <Image style={styles.image} source={require('../../../assets/Lifebeat-Logo.svg')} />
                <Text style={styles.title} >Lifebeat</Text>
              </View>
              ),
            headerRight: () => {
              return (
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity style={styles.headerButtonsRight} onPress={() => {}} >
                    <Image source={require('../../../assets/buttonHelp.svg')} style={styles.headerButtonsRight} />
                  </TouchableOpacity>
                </View>
              )
            },
            headerLeft: () => (
              <TouchableOpacity onPress={() => routerButton.back()}>
                <Image source={require('../../../assets/buttonBack.svg')} style={styles.headerButtonsLeft} />
              </TouchableOpacity>
            ),
            headerStyle: {
              backgroundColor: colors.red,
            },
          }} 
        />
    </Stack>
  );
}
const styles = StyleSheet.create({
headerButtonsRight: {
    width: 21.26,
    height: 22,
},
headerButtonsLeft: {
    marginLeft: 10,
    width: 21.26,
    height: 22,
},
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
})

