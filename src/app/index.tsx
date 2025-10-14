import React, { useState } from 'react';
import { StyleSheet, Text, View, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import CustomButton from '../com/CustomButton';
import CustomTextInput from '../com/CustomTextInput';

export default function IndexScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !senha) {
      Alert.alert("Erro", "Preencha todos os campos!");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      router.replace('/home');
    } catch (error) {
      console.error(error);
      Alert.alert("Erro no login", "E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      
      <Text style={styles.subtitle}>E-mail</Text>
      <CustomTextInput
        placeholder="Insira seu e-mail"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      
      <Text style={styles.subtitle}>Senha</Text>
      <CustomTextInput
        placeholder="Insira sua senha"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
      />
      
      <View style={styles.buttonContainer}>
        <CustomButton
          title="Esqueci minha senha"
          onPress={() => { /* Lógica para recuperar senha */ }}
          backgroundColor="#FFE6E6"
          textColor="#000000"
          borderColor="#E94040"
          width={326}
        />
        <CustomButton
          title={loading ? "Entrando..." : "Entrar"}
          onPress={handleLogin}
          backgroundColor="#E94040"
          textColor="#FFE6E6"
          width={326}
        />
      </View>
      
      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text style={styles.registerText}>
          Ainda não tem uma conta? <Text style={styles.registerLink}>Cadastre-se aqui</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: 390,
    alignItems: 'center',
    paddingTop: 50,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
    alignSelf: 'flex-start',
    marginLeft: 40,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 10,
    gap: 8,
  },
  registerText: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    color: '#000000',
    lineHeight: 19,
    marginTop: 20,
  },
  registerLink: {
    color: '#2664E5',
    fontWeight: 'bold',
  },
});