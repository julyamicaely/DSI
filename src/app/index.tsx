import { StyleSheet, Text, View, ImageBackground, Image } from 'react-native';
import { useRouter } from 'expo-router';
import CustomButton from '../../src/com/CustomButton';

export default function IndexScreen() {

  const routerButton = useRouter();

  return (
    <View style={styles.container}>


      <View style={styles.titleContainer}>
        <Text style={styles.title} >Lifebeat</Text>
        <Text style={styles.subtitle} >Seu Cardioguia pessoal pra um coração mais forte.</Text>

      </View>

      <View style={styles.buttonContainer}>

        <CustomButton
          title="Login"
          onPress={() => routerButton.push('/login')}
          backgroundColor="#E94040"
          textColor="#FFE6E6"
          width={326}
        />
        <CustomButton
          title="Cadastre-se"
          onPress={() => routerButton.push('/register')}
          backgroundColor="#FFE6E6"
          textColor="#000000"
          borderColor="#E94040"
          width={326}
        />
        <CustomButton
          title="Sobre o LifeBeat"
          onPress={() => { /* Página do LifeBeat */ }}
          backgroundColor="#FFE6E6"
          textColor="#000000"
          borderColor="#E94040"
          width={326}
        />
      </View>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 50,
    backgroundColor: '#FFFFFF',
  },
  titleContainer: {
    margin: 50,
    width: 333,
    height: 140,
  },
  title: {
    width: '75%',
    height: '65%',
    fontSize: 60,
    alignSelf: 'center',
    fontWeight: '500',
    color: '#5B79FF',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#5B79FF',
    alignSelf: 'flex-end',
    marginLeft: 40,
  },
  buttonContainer: {
    gap: 8,
  },
});