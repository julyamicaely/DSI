import { View, Text, Alert, StyleSheet } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../../firebaseConfig";

// Componentes customizados
import CustomTextInput from "../com/CustomTextInput";
import CustomButton from "../com/CustomButton";

import { useAuth } from "../context/AuthContext";

export default function RegisterScreen() {
  const { setUser } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");

  async function handleRegister() {
    if (!email || !senha || !nomeUsuario) {
      Alert.alert("Erro", "Preencha todos os campos!");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      await updateProfile(userCredential.user, { displayName: nomeUsuario });
      setUser(userCredential.user); // Salva o usuário no contexto
      Alert.alert("Sucesso", "Conta criada com sucesso!");
      router.replace("/home");
    } catch (error: any) {
      // --- CORREÇÃO DE SEGURANÇA APLICADA ---
      let errorMessage = "Ocorreu um erro ao criar sua conta. Por favor, revise os dados ou tente novamente.";

      // 1. Loga o erro no console para fins de depuração
      console.log("Erro de Cadastro do Firebase:", error.code, error.message);

      // 2. Trata os erros de validação que o usuário DEVE resolver
      if (error.code === 'auth/weak-password') {
          // Senha deve ter pelo menos 6 caracteres
          errorMessage = "A senha deve ter pelo menos 6 caracteres. Por favor, insira uma senha mais forte.";
      } 
      // 3. Trata o erro de enumeração de conta (Email já existe)
      else if (error.code === 'auth/email-already-in-use') {
          // MENSAGEM GENÉRICA: Não avisa o usuário que o e-mail JÁ está em uso.
          errorMessage = "Não foi possível cadastrar. Verifique seu e-mail ou tente Entrar.";
      }
      // 4. Trata erros de formato de e-mail (email inválido)
      else if (error.code === 'auth/invalid-email') {
          errorMessage = "O formato do e-mail é inválido. Por favor, verifique seu e-mail.";
      }
      
      // Exibe a mensagem de erro tratada (genérica ou específica de validação)
      Alert.alert("Erro no Cadastro", errorMessage);
    }
  }

  return (

    <View style={styles.container}>
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
    </View>
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
