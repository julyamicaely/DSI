import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../../types/navigation'; 

const logo = require('../../assets/lifebeat.png');
const goals_logo = null;
const habits_logo = null;
const clinical_data = null;
const map_logo = null;

export function HomeScreen() {

    const navigation = useNavigation<AppNavigationProp>(); 
    const handleGoToLogin = () => {
    navigation.navigate('Login'); 
  };

 return (
    <View style={styles.container}>
      <Image source={logo} style={styles.logo} />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText1}>Metas diárias</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText2}>Hábitos</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText3}>Dados clínicos</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText4}>Hospitais próximos</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 300,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 20
  },
  buttonText1: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonText2: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonText3: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonText4: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});