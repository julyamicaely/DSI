import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './src/context/AuthContext'; // Importe o provedor

// Importe as duas telas
import { LoginScreen } from './src/pages/teladelogin';
import { RegisterScreen } from './src/pages/cadastro';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider> {/* Envolve toda a navegação com o provedor */}
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}