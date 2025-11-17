/**
 * @file components/LocationPermissionDialog.tsx
 * @description Diálogo para solicitar permissão de localização com opção de abrir configurações
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';
import type { PermissionStatus } from '../hooks/useLocationPermission';

interface LocationPermissionDialogProps {
  visible: boolean;
  status: PermissionStatus;
  onRequestPermission: () => void;
  onOpenSettings: () => void;
  onDismiss: () => void;
  requesting?: boolean;
  canOpenSettings?: boolean;
}

export default function LocationPermissionDialog({
  visible,
  status,
  onRequestPermission,
  onOpenSettings,
  onDismiss,
  requesting = false,
  canOpenSettings = true,
}: LocationPermissionDialogProps) {
  
  const isDenied = status === 'denied' || status === 'restricted';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Ícone */}
          <View style={styles.iconContainer}>
            <Ionicons 
              name={isDenied ? 'location-outline' : 'navigate-circle-outline'} 
              size={64} 
              color={isDenied ? COLORS.error : COLORS.primary} 
            />
          </View>

          {/* Título */}
          <Text style={styles.title}>
            {isDenied ? 'Permissão Negada' : 'Localização Necessária'}
          </Text>

          {/* Descrição */}
          <Text style={styles.description}>
            {isDenied
              ? 'Você negou a permissão de localização. Para usar este recurso, é necessário habilitar a localização nas configurações do dispositivo.'
              : 'Para encontrar hospitais próximos, precisamos acessar sua localização. Seus dados nunca são compartilhados.'}
          </Text>

          {/* Botões */}
          <View style={styles.buttonsContainer}>
            {isDenied ? (
              <>
                {canOpenSettings && (
                  <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={onOpenSettings}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="settings-outline" size={20} color={COLORS.white} />
                    <Text style={styles.primaryButtonText}>Abrir Configurações</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={onDismiss}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={onRequestPermission}
                  disabled={requesting}
                  activeOpacity={0.8}
                >
                  {requesting ? (
                    <Text style={styles.primaryButtonText}>Aguarde...</Text>
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
                      <Text style={styles.primaryButtonText}>Permitir Localização</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={onDismiss}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>Agora Não</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Nota de privacidade */}
          <Text style={styles.privacyNote}>
            🔒 Sua localização é usada apenas para buscar hospitais próximos
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.lightRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.lightGray,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray,
  },
  privacyNote: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});
