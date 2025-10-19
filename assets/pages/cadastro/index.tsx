// @ts-nocheck
import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../../types/navigation'; 
// useAuth removido nesta versão antiga da tela para evitar erros de import.

const logoBranco = require('../../assets/lifebeatbranco.png');

export function RegisterScreen() {
  const navigation = useNavigation<AppNavigationProp>();
  // versão antiga: use um no-op local para armazenar credenciais
  const setCredentials = (_: { email: string; password: string } | null) => {};

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const handleRegister = () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Erro no cadastro', 'Por favor, preencha todos os campos.');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Erro no cadastro', 'Por favor, insira um email válido.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro no cadastro', 'As senhas não coincidem!');
      return;
    }
    
    // Armazena as credenciais no contexto global
    setCredentials({ email, password });
    
    console.log('Conta criada com sucesso!');
    navigation.navigate('Login'); 
  };

  const handleGoToLogin = () => {
    navigation.navigate('Login'); 
  };

  return (
    <View style={styles.container}>
      <Image source={logoBranco} style={styles.logo} />
      
      <View style={styles.contentBox}>
        <Text style={styles.title}>Cadastro</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#777"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#777"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirmar senha"
          placeholderTextColor="#777"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Criar conta</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleGoToLogin}>
        <Text style={styles.loginLink}>
          Já tem uma conta? <Text style={styles.loginLinkBold}>Entrar</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#A42020',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  logo: {
    width: 200,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  contentBox: {
    width: 350,
    maxWidth: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 30,
    paddingVertical: 40,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#A42020',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 20,
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 0,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderColor: '#A42020',
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  buttonText: {
    color: '#A42020',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 20,
    color: '#fff',
    fontSize: 14,
  },
  loginLinkBold: {
    fontWeight: 'bold',
  }
});