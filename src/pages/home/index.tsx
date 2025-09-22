import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity, Alert, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../../types/navigation'; 

const logo = require('../../assets/lifebeat.png');
const exitLogo = require('../../assets/exitLogo.png');
const questionLogo = require('../../assets/questionLogo.png');
const profileLogo = require('../../assets/profileLogo.png');
const goalsLogo = require('../../assets/goalsLogo.png');
const habitsLogo = require('../../assets/habitsLogo.png');
const estetoscopio = require('../../assets/estetoscopio.png');
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
      
        <TouchableOpacity style={styles.homeButton} onPress={undefined}>
          <Text style={styles.buttonText}>Metas diárias</Text>
          <Image source={goalsLogo} style={styles.goalsLogo} /> 
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeButton} onPress={undefined}>
          <Text style={styles.buttonText}>Hábitos</Text>
          <Image source={habitsLogo} style={styles.habitsLogo} /> 
        </TouchableOpacity>

      </View>

      <View style={styles.lowerButtons}>

        <TouchableOpacity style={styles.homeButton} onPress={undefined}>
          <Text style={styles.buttonText}>Dados clínicos</Text>
          <Image source={estetoscopio} style={styles.clinicalData} /> 
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeButton} onPress={undefined}>
          <Text style={styles.hospitalButton}>Hospitais próximos</Text>
          <Image source={mapLogo} style={styles.mapLogo} /> 
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
  homeButton: {
    width: '50%',
    height: '90%',
    backgroundColor: '#A42020',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 15,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 50
  },
  goalsLogo: {
    height: '71%',
    width: '63%',
    margin: 15
  },
  habitsLogo: {
    height: '55%',
    width: '110%',
    margin: 15
  },
  clinicalData: {
    height: '75%',
    width: '95%',
    margin: 10,
  },
  mapLogo: {
    height: '60%',
    width: '75%',
    margin: 15,
    borderRadius: 15
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    margin: 5
  },
  hospitalButton: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    margin: 5,
  },
  rectangle: {
    flexDirection: 'row',
    backgroundColor: '#A42020',
    width: 10000,
    height: 100,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginTop: '10%'
  },
  exitButton: {
    alignSelf: 'center',
    height: 50,
    width: 45,
    marginHorizontal: 60,
    marginTop: 10
  },
  questionButton: {
    alignSelf: 'center',
    height: 42,
    width: 25,
    marginHorizontal: 60,
    marginTop: 10

  },
  profileButton: {
    alignSelf: 'center',
    height: 45,
    width: 30,
    marginHorizontal: 60,
    marginTop: 10
  }
  
});