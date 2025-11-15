/**
 * @file components/HospitalCard.tsx
 * @description Card para exibir informações de um hospital
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Ionicons from "@react-native-vector-icons/ionicons";
import { Hospital } from '../types/hospital.types';
import { COLORS } from '../config/constants';
import googlePlacesService from '../services/googlePlaces.service';

interface HospitalCardProps {
  hospital: Hospital;
  onPress?: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
  showDistance?: boolean;
}

export const HospitalCard: React.FC<HospitalCardProps> = ({
  hospital,
  onPress,
  onFavoritePress,
  isFavorite = false,
  showDistance = true,
}) => {
  const photoUrl = hospital.photoReference
    ? googlePlacesService.getPhotoUrl(hospital.photoReference, 200)
    : null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Imagem */}
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholderImage]}>
          <Ionicons name="medical" size={40} color={COLORS.lightGray} />
        </View>
      )}

      {/* Conteúdo */}
      <View style={styles.content}>
        {/* Nome */}
        <Text style={styles.name} numberOfLines={1}>
          {hospital.name}
        </Text>

        {/* Endereço */}
        <Text style={styles.address} numberOfLines={2}>
          {hospital.address}
        </Text>

        {/* Info adicional */}
        <View style={styles.infoRow}>
          {/* Rating */}
          {hospital.rating && (
            <View style={styles.rating}>
              <Ionicons name="star" size={14} color="#FFB800" />
              <Text style={styles.ratingText}>
                {hospital.rating.toFixed(1)}
              </Text>
              {hospital.totalRatings && (
                <Text style={styles.ratingCount}>
                  ({hospital.totalRatings})
                </Text>
              )}
            </View>
          )}

          {/* Status aberto/fechado */}
          {hospital.isOpen !== undefined && (
            <View
              style={[
                styles.statusBadge,
                hospital.isOpen ? styles.openBadge : styles.closedBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  hospital.isOpen ? styles.openText : styles.closedText,
                ]}
              >
                {hospital.isOpen ? 'Aberto' : 'Fechado'}
              </Text>
            </View>
          )}

          {/* Distância */}
          {showDistance && hospital.distance !== undefined && hospital.distance > 0 && (
            <View style={styles.distance}>
              <Ionicons name="navigate" size={14} color={COLORS.gray} />
              <Text style={styles.distanceText}>
                {googlePlacesService.formatDistance(hospital.distance)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Botão de favorito */}
      {onFavoritePress && (
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={onFavoritePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? COLORS.primary : COLORS.gray}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    backgroundColor: COLORS.lightGray + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.black,
  },
  ratingCount: {
    fontSize: 12,
    color: COLORS.gray,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  openBadge: {
    backgroundColor: COLORS.success + '20',
  },
  closedBadge: {
    backgroundColor: COLORS.error + '20',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  openText: {
    color: COLORS.success,
  },
  closedText: {
    color: COLORS.error,
  },
  distance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  favoriteButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
});
