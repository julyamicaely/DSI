import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";

export default function DadosCliRedirect() {
  const router = useRouter();

  useEffect(() => {
    // O caminho deve respeitar o nome e a capitalização do arquivo original
    router.replace("/DadosClinicos");
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#E53935" />
    </View>
  );
}
