// import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { use } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity} from 'react-native';

export default function IndexScreen() {

  const routerButton = useRouter();                                                                                  

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        placeholderTextColor="#fff"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor="#fff"
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={() => routerButton.navigate('/home')}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => routerButton.navigate('/Register')}>
        <Text style={styles.registerText}>
          Ainda não tem uma conta? <Text style={styles.registerLink}>Cadastre-se.</Text>
        </Text>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#A42020',
    marginBottom: 40,
  },
  input: {
    width: 350,
    height: 50,
    backgroundColor: '#A42020',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    color: '#fff',
  },
  button: {
    width: 350,
    height: 50,
    backgroundColor: '#A42020',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerText: {
    marginTop: 20,
    color: '#333',
    fontSize: 14,
  },
  registerLink: {
    color: '#A42020',
    fontWeight: 'bold',
  },
});