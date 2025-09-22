import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity, Alert, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../../types/navigation'; 

const logo = require('../../assets/lifebeat.png');
const exitLogo = require('../../assets/exitLogo.png');
const questionLogo = require('../../assets/questionLogo.png');
const profileLogo = require('../../assets/profileLogo.png');
const goalsLogo = require('../../assets/goalsLogo.png');
const habitsLogo = require('../../assets/habitsLogo.png');
const clinicalData = require('../../assets/clinicalData.png');
const mapLogo = require('../../assets/mapLogo.png');

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
          <Text style={styles.buttonText}>Metas diárias</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button2} onPress={undefined}>
          <Text style={styles.buttonText}>Hábitos</Text>
        </TouchableOpacity>

      </View>

      <View style={styles.lowerButtons}>

        <TouchableOpacity style={styles.button3} onPress={undefined}>
          <Text style={styles.buttonText}>Dados clínicos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button4} onPress={undefined}>
          <Text style={styles.buttonText}>Hospitais perto</Text>
        </TouchableOpacity>
    
      </View>
      
      <View style={styles.rectangle}>

        <TouchableOpacity style={styles.exitButton} onPress={handleGoToLogin}>
          <Image source={exitLogo} style={styles.exitButton}></Image>
        </TouchableOpacity>

        <TouchableOpacity style={styles.questionButton} onPress={undefined}>
          <Image source={questionLogo} style={styles.questionButton}></Image>
        </TouchableOpacity>

        <TouchableOpacity style={styles.profileButton} onPress={undefined}>
          <Image source={profileLogo} style={styles.profileButton}></Image>
        </TouchableOpacity>

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
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  rectangle: {
    flexDirection: 'row',
    backgroundColor: '#A42020',
    width: 100000,
    height: 100,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginTop: '10%'
  },
  exitButton: {
    alignContent: 'center',
    height: 50,
    width: 50
  },
  questionButton: {
    alignContent: 'center',
    height: 50,
    width: 50
  },
  profileButton: {
    alignContent: 'center',
    height: 50,
    width: 50
  }
  
});