import { StyleSheet, Text, View, ImageBackground, Image } from 'react-native';
import { useRouter } from 'expo-router';
import CustomButton from '../../src/components/CustomButton';
import colors from '../components/Colors'

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
          backgroundColor={colors.red}
          textColor={colors.lightRed}
          width={326}
          borderColor={colors.red}
          borderWidth={6}
        />
        <CustomButton
          title="Cadastre-se"
          onPress={() => routerButton.push('/register')}
          backgroundColor={colors.lightRed}
          textColor="#000000"
          borderColor={colors.red}
          width={326}
        />
        <CustomButton
          title="Sobre o LifeBeat"
          onPress={() => routerButton.push('/about')}
          backgroundColor={colors.lightRed}
          textColor="#000000"
          borderColor={colors.red}
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