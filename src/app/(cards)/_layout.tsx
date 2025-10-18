import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function StackLayout() {

    const routerButton = useRouter();
    return (
      <Stack
        screenOptions={{
          headerLeft: () => (
            <TouchableOpacity onPress={() => routerButton.back()}>
              <Image source={require('../../assets/buttonBack.svg')} style={styles.headerButtonsLeft} />
            </TouchableOpacity>
          ),
        }}
        >
        <Stack.Screen 
          name="goals" 
          options={{ 
            headerShown: true,
            headerTitle: () => (
              <View style={{ flexDirection: 'row' }}>
                <Image style={styles.image} source={require('../../assets/Lifebeat-Logo.svg')} />
                <Text style={styles.title} >Lifebeat</Text>
              </View>
              ),
            headerRight: () => {
              return (
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity style={styles.headerButtonsRight} onPress={() => {}} >
                    <Image source={require('../../assets/buttonHelp.svg')} style={styles.headerButtonsRight} />
                  </TouchableOpacity>
                </View>
              )
            },
            headerStyle: {
              backgroundColor: '#E53935',
            },
           }} 
        />
      </Stack>
    );
}

const styles = StyleSheet.create({
  tabIcons: {
    width: 24,  
    height: 24,
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

