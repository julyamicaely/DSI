import React, { Component } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

// O componente agora é uma CLASSE que herda de Component
export default class HomeScreen extends Component {
  
  // O código da interface deve ir dentro do método render()
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Bem-vindo!</Text>
        <Text style={styles.subtitle}>Sua jornada de saúde começa aqui.</Text>

        {/* O acesso à navegação é feito com 'this.props' */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => this.props.navigation.navigate('Profile')}
        >
          <Text style={styles.buttonText}>Ir para o Perfil</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});