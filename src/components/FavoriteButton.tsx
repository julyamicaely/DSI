/**
 * @file components/FavoriteButton.tsx
 * @description Botão para adicionar/remover favoritos
 */

import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Ionicons from "@react-native-vector-icons/ionicons";
import { COLORS } from '../config/constants';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onPress: () => void;
  loading?: boolean;
  size?: number;
  color?: string;
  style?: object;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  isFavorite,
  onPress,
  loading = false,
  size = 28,
  color,
  style,
}) => {
  const iconColor = color || (isFavorite ? COLORS.primary : COLORS.gray);

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={size}
          color={iconColor}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
