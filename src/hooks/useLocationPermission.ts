/**
 * @file hooks/useLocationPermission.ts
 * @description Hook para gerenciar permissões de localização com recuperação
 */

import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { ERROR_MESSAGES } from '../config/constants';
import logger from '../utils/logger';

export type PermissionStatus = 'initial' | 'granted' | 'denied' | 'restricted' | 'undetermined';

interface UseLocationPermissionResult {
  status: PermissionStatus;
  requesting: boolean;
  requestPermission: () => Promise<boolean>;
  openSettings: () => void;
  canOpenSettings: boolean;
  errorMessage: string | null;
}

export function useLocationPermission(): UseLocationPermissionResult {
  const [status, setStatus] = useState<PermissionStatus>('initial');
  const [requesting, setRequesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Solicita permissão de localização
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setRequesting(true);
      setErrorMessage(null);

      logger.debug('[useLocationPermission] Solicitando permissão...');

      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();

      logger.debug('[useLocationPermission] Status recebido:', permStatus);

      switch (permStatus) {
        case Location.PermissionStatus.GRANTED:
          setStatus('granted');
          return true;

        case Location.PermissionStatus.DENIED:
          setStatus('denied');
          setErrorMessage(ERROR_MESSAGES.NO_PERMISSION_DENIED);
          return false;

        case Location.PermissionStatus.UNDETERMINED:
          setStatus('undetermined');
          return false;

        default:
          setStatus('denied');
          setErrorMessage(ERROR_MESSAGES.NO_PERMISSION);
          return false;
      }
    } catch (error) {
      logger.error('[useLocationPermission] Erro ao solicitar permissão:', error);
      setStatus('denied');
      setErrorMessage(ERROR_MESSAGES.NO_PERMISSION);
      return false;
    } finally {
      setRequesting(false);
    }
  }, []);

  /**
   * Abre as configurações do sistema
   */
  const openSettings = useCallback(() => {
    logger.debug('[useLocationPermission] Abrindo configurações...');
    Linking.openSettings();
  }, []);

  /**
   * Verifica se pode abrir configurações (iOS sempre pode, Android depende)
   */
  const canOpenSettings = Platform.OS === 'ios' || 
    (Platform.OS === 'android' && typeof Platform.Version === 'number' && Platform.Version >= 23);

  return {
    status,
    requesting,
    requestPermission,
    openSettings,
    canOpenSettings,
    errorMessage,
  };
}

export default useLocationPermission;
