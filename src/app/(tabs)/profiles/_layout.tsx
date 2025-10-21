import { Stack } from "expo-router";
import React from "react";

export default function ProfilesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#E53935" },
        headerTintColor: "#fff",
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Conta" }} />
      <Stack.Screen name="myinfo" options={{ title: "Minhas Informações" }} />
      <Stack.Screen name="dadoscli" options={{ title: "Dados Clínicos" }} />
      <Stack.Screen name="permissions" options={{ title: "Permissões" }} />
      <Stack.Screen name="logout" options={{ title: "Sair" }} />
    </Stack>
  );
}
