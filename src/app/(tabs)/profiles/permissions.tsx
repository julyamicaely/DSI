import { View, Text, StyleSheet, Switch, Alert, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Location from "expo-location";
import { auth } from "../../../../firebaseConfig";
import {
  getUserPermissions,
  saveUserPermissions,
  UserPermissions,
} from "../../../services/firebase.service";

export default function Permissions() {
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<UserPermissions>({
    notifications: false,
    location: false,
    autoReminders: false,
    dataSharing: false,
  });

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Carregar preferências salvas
      const savedPermissions = await getUserPermissions(user.uid);

      // Verificar permissões reais do sistema
      const notificationStatus = await Notifications.getPermissionsAsync();
      const locationStatus = await Location.getForegroundPermissionsAsync();

      setPermissions({
        ...savedPermissions,
        notifications: notificationStatus.granted,
        location: locationStatus.granted,
      });
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    try {
      if (value) {
        // Solicitar permissão
        const { status } = await Notifications.requestPermissionsAsync();

        if (status === "granted") {
          const updatedPermissions = { ...permissions, notifications: true };
          setPermissions(updatedPermissions);
          await saveUserPermissions(updatedPermissions);
        } else {
          Alert.alert(
            "Permissão negada",
            "Você precisa permitir notificações nas configurações do dispositivo."
          );
        }
      } else {
        // Apenas salvar preferência de desativar
        const updatedPermissions = { ...permissions, notifications: false };
        setPermissions(updatedPermissions);
        await saveUserPermissions(updatedPermissions);

        Alert.alert(
          "Notificações desativadas",
          "Para desativar completamente, vá em Configurações do dispositivo."
        );
      }
    } catch (error) {
      console.error("Erro ao alterar permissão de notificações:", error);
      Alert.alert("Erro", "Não foi possível alterar a permissão de notificações.");
    }
  };

  const handleLocationToggle = async (value: boolean) => {
    try {
      if (value) {
        // Solicitar permissão
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status === "granted") {
          const updatedPermissions = { ...permissions, location: true };
          setPermissions(updatedPermissions);
          await saveUserPermissions(updatedPermissions);
        } else {
          Alert.alert(
            "Permissão negada",
            "Você precisa permitir localização nas configurações do dispositivo."
          );
        }
      } else {
        // Apenas salvar preferência de desativar
        const updatedPermissions = { ...permissions, location: false };
        setPermissions(updatedPermissions);
        await saveUserPermissions(updatedPermissions);

        Alert.alert(
          "Localização desativada",
          "Para desativar completamente, vá em Configurações do dispositivo."
        );
      }
    } catch (error) {
      console.error("Erro ao alterar permissão de localização:", error);
      Alert.alert("Erro", "Não foi possível alterar a permissão de localização.");
    }
  };

  const handleGenericToggle = async (key: keyof UserPermissions, value: boolean) => {
    try {
      const updatedPermissions = { ...permissions, [key]: value };
      setPermissions(updatedPermissions);
      await saveUserPermissions(updatedPermissions);
    } catch (error) {
      console.error("Erro ao salvar preferência:", error);
      Alert.alert("Erro", "Não foi possível salvar a preferência.");
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
    <View style={styles.container}>
      <Text style={styles.title}>Permissões</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Notificações</Text>
        <Switch
          value={permissions.notifications}
          onValueChange={handleNotificationToggle}
          trackColor={{ false: "#ccc", true: "#E53935" }}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Localização</Text>
        <Switch
          value={permissions.location}
          onValueChange={handleLocationToggle}
          trackColor={{ false: "#ccc", true: "#E53935" }}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Lembretes automáticos</Text>
        <Switch
          value={permissions.autoReminders}
          onValueChange={(val) => handleGenericToggle("autoReminders", val)}
          trackColor={{ false: "#ccc", true: "#E53935" }}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Compartilhar dados</Text>
        <Switch
          value={permissions.dataSharing}
          onValueChange={(val) => handleGenericToggle("dataSharing", val)}
          trackColor={{ false: "#ccc", true: "#E53935" }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  label: { fontSize: 16 },
});
