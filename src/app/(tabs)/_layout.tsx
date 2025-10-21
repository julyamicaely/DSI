import { Image } from 'expo-image';
import { Tabs, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TabLayout() {
  const routerButton = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerLeft: () => (
          <TouchableOpacity onPress={() => routerButton.back()}>
            <Image
              source={require('../../assets/buttonBack.svg')}
              style={styles.headerButtonsLeft}
            />
          </TouchableOpacity>
        ),
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          height: 70, // 🔹 Aumenta um pouco para centralizar
          paddingBottom: 10,
          paddingTop: 5,
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          justifyContent: 'center', // 🔹 Centraliza verticalmente
          alignItems: 'center', // 🔹 Centraliza horizontalmente
        },
        tabBarActiveTintColor: '#E53935',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      {/* 🏠 Aba Início */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Início',
          tabBarIcon: () => (
            <Image
              source={require('../../assets/tabHome.svg')}
              style={styles.tabIcons}
            />
          ),
          headerShown: true,
          headerTitle: () => (
            <View style={{ flexDirection: 'row' }}>
              <Image
                style={styles.image}
                source={require('../../assets/Lifebeat-Logo.svg')}
              />
              <Text style={styles.title}>Lifebeat</Text>
            </View>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                style={styles.headerButtonsRight}
                onPress={() => {}}
              >
                <Image
                  source={require('../../assets/buttonHelp.svg')}
                  style={styles.headerButtonsRight}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButtonsRight}
                onPress={() => {}}
              >
                <Image
                  source={require('../../assets/buttonLogOut.svg')}
                  style={styles.headerButtonsRight}
                />
              </TouchableOpacity>
            </View>
          ),
          headerStyle: { backgroundColor: '#E53935' },
        }}
      />

      {/* 📊 Aba Gerenciamento */}
      <Tabs.Screen
        name="management"
        options={{
          title: 'Gerenciamento',
          tabBarIcon: () => (
            <Image
              source={require('../../assets/tabManagement.svg')}
              style={styles.tabIcons}
            />
          ),
        }}
      />

      {/* 👤 Aba Conta */}
      <Tabs.Screen
        name="profiles"
        options={{
          title: 'Conta',
          tabBarIcon: () => (
            <Image
              source={require('../../assets/tabProfiles.svg')}
              style={styles.tabIcons}
            />
          ),
        }}
      />

      {/* 🚫 Esconde rotas que não devem aparecer na barra */}
      <Tabs.Screen name="DadosClinicos" options={{ href: null }} />
      <Tabs.Screen name="profiles_backup" options={{ href: null }} />
      <Tabs.Screen name="services" options={{ href: null }} />
      <Tabs.Screen name="services/ConsultasService" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcons: {
    width: 26,
    height: 26,
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
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 8,
  },
});
