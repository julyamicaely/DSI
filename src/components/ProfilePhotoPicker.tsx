import React, { useState } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { uploadProfilePhoto, updateUserPhoto } from "../services/firebase.service";
import { useAuth } from "../context/AuthContext";
import { toast } from "../utils/toast";

interface ProfilePhotoPickerProps {
  userId: string;
  currentPhotoUrl?: string;
  onPhotoUpdated?: (newUrl: string) => void;
  size?: number;
}

export default function ProfilePhotoPicker({
  userId,
  currentPhotoUrl,
  onPhotoUpdated,
  size = 100,
}: ProfilePhotoPickerProps) {
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl);
  const [uploading, setUploading] = useState(false);
  const { refreshUser, triggerDataUpdate } = useAuth();

  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const pickImage = async () => {
    try {
      // Solicitar permissão
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permissão negada",
          "Precisamos de acesso à galeria para você escolher uma foto."
        );
        return;
      }

      // Abrir seletor de imagem
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        await handleImageUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Erro ao selecionar imagem:", error);
      toast.error("Erro", "Não foi possível selecionar a imagem.");
    }
  };

  const handleImageUpload = async (imageUri: string) => {
    setUploading(true);
    try {
      // Upload para o Storage
      const downloadURL = await uploadProfilePhoto(userId, imageUri);

      // Atualizar no Auth e Firestore
      await updateUserPhoto(downloadURL);

      // Atualizar estado local
      setPhotoUrl(downloadURL);

      // Recarregar dados do usuário no contexto
      await refreshUser();
      
      // Notificar outras telas sobre a atualização
      triggerDataUpdate();

      // Callback para componente pai
      if (onPhotoUpdated) {
        onPhotoUpdated(downloadURL);
      }

      toast.success("Sucesso", "Foto de perfil atualizada!");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro", "Não foi possível atualizar a foto de perfil.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.avatarContainer, { width: size, height: size }]}>
        <Image
          source={{ uri: photoUrl || defaultAvatar }}
          style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
        />

        {uploading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}

        <TouchableOpacity
          style={[styles.editButton, { bottom: 0, right: 0 }]}
          onPress={pickImage}
          disabled={uploading}
        >
          <Ionicons name="camera" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    backgroundColor: "#f0f0f0",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
  },
  editButton: {
    position: "absolute",
    backgroundColor: "#E53935",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
});
