import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../../types/navigation'; 
import { useAuth } from '../../context/AuthContext'; // Importe o hook de autenticação

const logo = require('../../assets/lifebeat.png');

export function LoginScreen() {
  const navigation = useNavigation<AppNavigationProp>();
  const { credentials } = useAuth(); // Use o hook para obter as credenciais salvas

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleLogin = () => {
    // Validação de login
    if (credentials && email === credentials.email && password === credentials.password) {
      Alert.alert('Sucesso', 'Login realizado!');
      // Ação para navegar para a próxima tela do aplicativo
    } else {
      Alert.alert('Erro', 'Credenciais inválidas. Verifique seu e-mail e senha.');
    }
  };

  const handleGoToRegister = () => {
    navigation.navigate('Register'); 
  };

  return (
    <View style={styles.container}>
      <Image source={logo} style={styles.logo} />

      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        placeholderTextColor="#fff"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor="#fff"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleGoToRegister}>
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
  logo: {
    width: 300,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 20
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