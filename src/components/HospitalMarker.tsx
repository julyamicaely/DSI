/**
 * @file components/HospitalMarker.tsx
 * @description Marcador personalizado para hospitais no mapa
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import Ionicons from "@react-native-vector-icons/ionicons";
import { Hospital } from '../types/hospital.types';
import { COLORS } from '../config/constants';

interface HospitalMarkerProps {
  hospital: Hospital;
  onPress?: () => void;
  isSelected?: boolean;
  isFavorite?: boolean;
}

export const HospitalMarker: React.FC<HospitalMarkerProps> = ({
  hospital,
  onPress,
  isSelected = false,
  isFavorite = false,
}) => {
  return (
    <Marker
      coordinate={{
        latitude: hospital.coordinates.latitude,
        longitude: hospital.coordinates.longitude,
      }}
      onPress={onPress}
      tracksViewChanges={false} // Otimização de performance
    >
      <View
        style={[
          styles.markerContainer,
          isSelected && styles.selectedMarker,
          isFavorite && styles.favoriteMarker,
        ]}
      >
        <Ionicons
          name="medical"
          size={isSelected ? 24 : 20}
          color={COLORS.white}
        />
      </View>

      {/* Badge de favorito */}
      {isFavorite && (
        <View style={styles.favoriteBadge}>
          <Ionicons name="heart" size={10} color={COLORS.white} />
        </View>
      )}
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.secondary,
    transform: [{ scale: 1.1 }],
  },
  favoriteMarker: {
    borderColor: COLORS.primary,
    borderWidth: 4,
  },
  favoriteBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
});
