import { StyleSheet, Text, View, Image, TouchableOpacity, Alert, Pressable } from 'react-native';
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
          <Text style={styles.buttonText}>Metas de atividade física</Text>
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

        <TouchableOpacity onPress={handleGoToLogin}>
          <Image source={exitLogo} style={styles.exitButton}></Image>
        </TouchableOpacity>

        <TouchableOpacity onPress={undefined}>
          <Image source={questionLogo} style={styles.questionButton}></Image>
        </TouchableOpacity>

        <TouchableOpacity onPress={undefined}>
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
    paddingTop: 50, // Afasta a logo do topo
    // Remova 'justifyContent: center' para permitir que o conteúdo se alinhe no topo
  },
  logo: {
    width: 200,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 50
  },
  upperButtons: {
    flexDirection: "row",
    width: '90%', 
    maxWidth: 400,
    justifyContent: 'center',
    paddingHorizontal: 5,
    gap: 10
  },
  lowerButtons: {
    flexDirection: "row",
    width: '90%', 
    maxWidth: 400,
    justifyContent: 'center',
    paddingHorizontal: 5,
    gap: 10,
    marginTop: 10,
  },
  homeButton: {
    flex: 1, 
    aspectRatio: 1, 
    backgroundColor: '#A42020',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 50
  },
  goalsLogo: {
    height: '60%', 
    width: '60%',
    resizeMode: 'contain',
  },
  habitsLogo: {
    height: '60%',
    width: '100%',
    resizeMode: 'contain',
  },
  clinicalData: {
    height: '60%',
    width: '90%',
    resizeMode: 'contain',
  },
  mapLogo: {
    height: '60%',
    width: '75%',
    resizeMode: 'contain',
    borderRadius: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  hospitalButton: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  rectangle: {
    flexDirection: 'row',
    backgroundColor: '#A42020',
    width: '100%',
    height: 100,
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
  },
  exitButton: {
    height: 50,
    width: 45,
  },
  questionButton: {
    height: 42,
    width: 25,
  },
  profileButton: {
    height: 45,
    width: 30,
  }
});