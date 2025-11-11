/**
 * @file components/ErrorMessage.tsx
 * @description Componente para exibir mensagens de erro
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  type?: 'error' | 'warning' | 'info';
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  onDismiss,
  type = 'error',
}) => {
  const iconName = {
    error: 'alert-circle',
    warning: 'warning',
    info: 'information-circle',
  }[type];

  const iconColor = {
    error: COLORS.error,
    warning: COLORS.warning,
    info: COLORS.secondary,
  }[type];

  const backgroundColor = {
    error: COLORS.error + '15',
    warning: COLORS.warning + '15',
    info: COLORS.secondary + '15',
  }[type];

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Ionicons name={iconName as any} size={24} color={iconColor} />

      <Text style={styles.message}>{message}</Text>

      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity style={styles.button} onPress={onRetry}>
            <Text style={[styles.buttonText, { color: iconColor }]}>
              Tentar novamente
            </Text>
          </TouchableOpacity>
        )}

        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
            <Ionicons name="close" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.white,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
});
