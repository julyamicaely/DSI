import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { auth } from "../../../../firebaseConfig";
import { getUserData, updateUserInfo } from "../../../services/firebase.service";
import { useAuth } from "../../../context/AuthContext";
import { toast } from "../../../utils/toast";

export default function MyInfoScreen() {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { triggerDataUpdate } = useAuth();
  const [tempMessage, setTempMessage] = useState<string>('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      setEmail(user.email || "");
      setUserName(user.displayName || "");

      // Buscar dados adicionais do Firestore
      const userData = await getUserData(user.uid);
      if (userData) {
        setPhone(userData.phone || "");
        setAddress(userData.address || "");
        setAdditionalInfo(userData.additionalInfo || "");
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro", "Não foi possível carregar suas informações.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validações básicas
    if (!userName.trim()) {
      toast.warning("Atenção", "O nome não pode estar vazio.");
      return;
    }

    setSaving(true);
    try {
      await updateUserInfo({
        displayName: userName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        additionalInfo: additionalInfo.trim(),
      });

      toast.success("Sucesso", "Informações atualizadas com sucesso!");

      // Notificar outras telas sobre a atualização
      triggerDataUpdate();

      // Recarregar dados para garantir sincronia
      await loadUserData();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro", "Não foi possível salvar as informações.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E53935" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Minhas Informações</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome completo *"
        value={userName}
        onChangeText={setUserName}
        editable={!saving}
      />

      <TextInput
        style={[styles.input, styles.disabledInput]}
        placeholder="Email"
        value={email}
        editable={false}
      />

      <TextInput
        style={styles.input}
        placeholder="Telefone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        editable={!saving}
      />

      <TextInput
        style={styles.input}
        placeholder="Endereço"
        value={address}
        onChangeText={setAddress}
        editable={!saving}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Informação adicional"
        multiline
        numberOfLines={3}
        value={additionalInfo}
        onChangeText={setAdditionalInfo}
        editable={!saving}
      />

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.disabledButton]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Salvar informações</Text>
        )}
      </TouchableOpacity>
      <TemporaryMessage message={tempMessage} onHide={() => setTempMessage('')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
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
    backgroundColor: "#fff",
  },
  disabledInput: {
    backgroundColor: "#f5f5f5",
    color: "#999",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: "#E53935",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
