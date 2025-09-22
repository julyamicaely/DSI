// src/types/navigation.ts
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Defina os tipos para cada tela e seus parâmetros
// 'undefined' é usado quando a tela não recebe nenhum parâmetro
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
};

// Crie um tipo customizado para o hook de navegação
export type AppNavigationProp = NativeStackNavigationProp<RootStackParamList>;