import { Image } from 'expo-image';
import { Tabs, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';
import React, { useEffect } from 'react';

export default function TabLayout() {
  const router = useRouter();
  const { user, setUser } = useAuth();

  // Proteção de rota — redireciona se não estiver logado
  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    router.replace('/login');
  };

  if (!user) return null; // Evita piscar conteúdo ao deslogar

  return (
    <Tabs
      screenOptions={{
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <Image source={require('../../assets/buttonBack.svg')} style={styles.headerButtonsLeft} />
          </TouchableOpacity>
        ),
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          width: 360,
          height: 48,
          paddingBottom: 10,
          paddingTop: 10
        },
        tabBarActiveTintColor: '#5B79FF',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Início',
          tabBarIcon: () => (
            <Image source={require('../../assets/tabHome.svg')} style={styles.tabIcons} />
          ),
          headerShown: true,
          headerTitle: () => (
            <View style={{ flexDirection: 'row' }}>
              <Image style={styles.image} source={require('../../assets/Lifebeat-Logo.svg')} />
              <Text style={styles.title}>Lifebeat</Text>
            </View>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity style={styles.headerButtonsRight} onPress={() => {}}>
                <Image source={require('../../assets/buttonHelp.svg')} style={styles.headerButtonsRight} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButtonsRight} onPress={handleLogout}>
                <Image source={require('../../assets/buttonLogOut.svg')} style={styles.headerButtonsRight} />
              </TouchableOpacity>
            </View>
          ),
          headerStyle: {
            backgroundColor: '#E53935',
          },
        }}
      />
      <Tabs.Screen
        name="management"
        options={{
          title: 'Gerenciamento',
          tabBarIcon: () => (
            <Image source={require('../../assets/tabManagement.svg')} style={styles.tabIcons} />
          ),
        }}
      />
      <Tabs.Screen
        name="profiles"
        options={{
          title: 'Conta',
          tabBarIcon: () => (
            <Image source={require('../../assets/tabProfiles.svg')} style={styles.tabIcons} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcons: {
    width: 24,
    height: 24,
  },
  headerButtonsRight: {
    marginRight: 20,
    marginLeft: 10,
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
});
