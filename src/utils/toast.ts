import Toast from 'react-native-toast-message';

/**
 * Utilitário para exibir toasts de forma consistente no app
 * Substituindo Alert.alert() para feedbacks não-críticos
 * 
 * Tipos suportados pelo react-native-toast-message:
 * - success: Feedback positivo (verde)
 * - error: Erros e falhas (vermelho)
 * - info: Avisos e informações (azul/cinza)
 */

type ToastType = 'success' | 'error' | 'info';

interface ShowToastParams {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export const showToast = ({ type, title, message, duration = 3000 }: ShowToastParams) => {
  Toast.show({
    type,
    text1: title,
    text2: message,
    visibilityTime: duration,
    position: 'top',
    topOffset: 60,
  });
};

// Atalhos para tipos específicos
export const toast = {
  success: (title: string, message?: string, duration?: number) =>
    showToast({ type: 'success', title, message, duration }),
  
  error: (title: string, message?: string, duration?: number) =>
    showToast({ type: 'error', title, message, duration }),
  
  info: (title: string, message?: string, duration?: number) =>
    showToast({ type: 'info', title, message, duration }),
  
  // Alias para warning (usa info internamente)
  warning: (title: string, message?: string, duration?: number) =>
    showToast({ type: 'info', title, message, duration }),
};
