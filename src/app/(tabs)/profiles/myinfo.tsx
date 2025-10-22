import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { auth } from "../../../../firebaseConfig"; // ajuste o caminho conforme sua estrutura

export default function MyInfoScreen() {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserName(user.displayName || "");
      setEmail(user.email || "");
    }
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Usuário</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome completo"
        value={userName}
        onChangeText={setUserName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        editable={false} // email não deve ser editável
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Informação adicional"
        multiline
        numberOfLines={3}
        value={info}
        onChangeText={setInfo}
      />

      <TouchableOpacity style={styles.editButton}>
        <Text style={styles.editButtonText}>Editar informações</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  editButton: {
    backgroundColor: "#E53935",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
