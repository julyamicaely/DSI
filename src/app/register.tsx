import { View, Text, Alert, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../../firebaseConfig";

// Componentes customizados
import CustomTextInput from "../components/CustomTextInput";
import CustomButton from "../components/CustomButton";
import TemporaryMessage from "../components/TemporaryMessage";

import { useAuth } from "../context/AuthContext";

export default function RegisterScreen() {
  const { setUser } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleRegister() {
    if (!email || !senha || !nomeUsuario) {
      setErrorMessage("Preencha todos os campos!");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      await updateProfile(userCredential.user, { displayName: nomeUsuario });
      setUser(userCredential.user); // Salva o usuário no contexto
      Alert.alert("Sucesso", "Conta criada com sucesso!");
      router.replace("/home");
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage("Este e-mail já está cadastrado.");

      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage("O e-mail fornecido é inválido.");

      } else if (error.code === 'auth/weak-password') {
        setErrorMessage("A senha deve ter pelo menos 6 caracteres.");
      }
      
      else {
        const message = error instanceof Error ? error.message : String(error);
        Alert.alert("Erro", message);
      }
      console.log(error);
    }
  }

  return (

    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {errorMessage && <TemporaryMessage message={errorMessage} onHide={() => setErrorMessage(null)} />}
      {/* Cabeçalho simples */}
      <Text style={styles.appTitle}>LifeBeat</Text>

      <Text style={styles.title}>Cadastro</Text>

      <Text style={styles.label}>Nome de usuário</Text>
      <CustomTextInput
        placeholder="Insira seu nome"
        value={nomeUsuario}
        onChangeText={setNomeUsuario}
      />

      <Text style={styles.label}>E-mail</Text>
      <CustomTextInput
        placeholder="Insira seu e-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <Text style={styles.label}>Senha</Text>
      <CustomTextInput
        placeholder="Insira sua senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />

      <CustomButton title="Criar conta" onPress={handleRegister} backgroundColor="#EF4444" />

      <Text style={styles.linkText} onPress={() => router.push("/")}>
        Já tem uma conta? Entrar
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    paddingTop: 48,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 24,
  },
  label: {
    alignSelf: "flex-start",
    marginLeft: 16,
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  linkText: {
    color: "#1E90FF",
    textAlign: "center",
    marginTop: 24,
    fontWeight: "500",
  },
});
