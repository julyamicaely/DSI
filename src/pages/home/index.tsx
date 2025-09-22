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

      <View style={styles.upperButtons}>
      
        <TouchableOpacity style={styles.button1} onPress={undefined}>
          <Text style={styles.buttonText1}>Metas diárias</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button2} onPress={undefined}>
          <Text style={styles.buttonText2}>Hábitos</Text>
        </TouchableOpacity>

      </View>

      <View style={styles.lowerButtons}>

        <TouchableOpacity style={styles.button3} onPress={undefined}>
          <Text style={styles.buttonText3}>Dados clínicos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button4} onPress={undefined}>
          <Text style={styles.buttonText4}>Hospitais perto</Text>
        </TouchableOpacity>
    
      </View>

      <View style={styles.pseudoTabs}>


      </View>

    </View>
  );
}

const styles = StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: '#BBBBBB',
    alignItems: 'center',
    justifyContent: 'center',
  },
    logo: {
    width: 150,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 50
  },
  upperButtons: {
    flexDirection: "row",
    width: 300,
    height: 200,
    maxWidth: '80%',
    maxHeight: '80%',
    backgroundColor: '#BBBBBB',
    paddingHorizontal: 5,
    gap: 5
  },
    lowerButtons: {
    flexDirection: "row",
    width: 300,
    height: 200,
    maxWidth: '80%',
    maxHeight: '80%',
    backgroundColor: '#BBBBBB',
    paddingHorizontal: 5,
    gap: 5
  },
  button1: {
    width: '50%',
    height: '90%',
    backgroundColor: '#A42020',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 15,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 50
  },
  button2: {
    width: '50%',
    height: '90%',
    backgroundColor: '#A42020',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 15,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 50
  },
  button3: {
    width: '50%',
    height: '90%',
    backgroundColor: '#A42020',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 15,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 50
  },
    button4: {
    width: '50%',
    height: '90%',
    backgroundColor: '#A42020',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 15,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 50
  },
  buttonText1: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  buttonText2: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  buttonText3: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  buttonText4: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  pseudoTabs: {

  },
  
});