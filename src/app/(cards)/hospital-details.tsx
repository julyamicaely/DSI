/**
 * @file app/hospital-details.tsx
 * @description Tela de detalhes de um hospital
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from 'expo-router';
import { toast } from '../../utils/toast';

import { PlaceDetails } from '../../types/hospital.types';
import googlePlacesService from '../../services/googlePlaces.service';
import { useFavoritesStore } from '../../store/favoritesStore';
import { FavoriteButton, LoadingOverlay, ErrorMessage } from '../../components';
import { COLORS, ERROR_MESSAGES } from '../../config/constants';
import colors from '../../components/Colors';

export default function HospitalDetails() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();

  // Estado
  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Store de favoritos
  const { addFavorite, removeFavorite, isFavorite, getFavoriteByPlaceId } =
    useFavoritesStore();

  const isHospitalFavorite = placeId ? isFavorite(placeId) : false;

  // Carrega detalhes ao montar
  useEffect(() => {
    if (placeId) {
      loadDetails();
    } else {
      setError('ID do hospital não fornecido');
      setLoading(false);
    }
  }, [placeId]);

  /**
   * Carrega os detalhes do hospital
   */
  const loadDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await googlePlacesService.getPlaceDetails(placeId);
      setDetails(data);

      setLoading(false);
    } catch (err) {
      console.error('[HospitalDetails] Erro ao carregar:', err);
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.API_ERROR);
      setLoading(false);
    }
  };

  /**
   * Toggle de favorito
   */
  const handleToggleFavorite = async () => {
    if (!details) return;

    try {
      if (isHospitalFavorite) {
        await removeFavorite(placeId);
        toast.success('Removido dos favoritos', 'Hospital removido da sua lista');
      } else {
        await addFavorite({
          placeId: details.place_id,
          name: details.name,
          address: details.formatted_address,
          latitude: details.geometry.location.lat,
          longitude: details.geometry.location.lng,
          phone: details.formatted_phone_number,
          rating: details.rating,
          photoReference: details.photos?.[0]?.photo_reference,
        });
        toast.success('Adicionado aos favoritos', 'Hospital salvo na sua lista');
      }
    } catch (err) {
      toast.error('Erro', err instanceof Error ? err.message : 'Erro ao atualizar favorito');
    }
  };

  /**
   * Abre o telefone para ligar
   */
  const handleCall = () => {
    if (details?.formatted_phone_number) {
      const phoneNumber = details.formatted_phone_number.replace(/\s/g, '');
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  /**
   * Abre no Google Maps
   */
  const handleOpenMaps = () => {
    if (details) {
      const lat = details.geometry.location.lat;
      const lng = details.geometry.location.lng;
      const label = encodeURIComponent(details.name);
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${details.place_id}`;
      Linking.openURL(url);
    }
  };

  /**
   * Abre o website
   */
  const handleOpenWebsite = () => {
    if (details?.website) {
      Linking.openURL(details.website);
    }
  };

  const photoUrl = details?.photos?.[0]?.photo_reference
    ? googlePlacesService.getPhotoUrl(details.photos[0].photo_reference, 600)
    : null;

  if (loading) {
    return <LoadingOverlay visible message="Carregando detalhes..." />;
  }

  if (error || !details) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Detalhes</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.errorWrapper}>
          <ErrorMessage
            message={error || 'Hospital não encontrado'}
            onRetry={loadDetails}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>

        <Text style={styles.title}>Detalhes</Text>

        <FavoriteButton
          isFavorite={isHospitalFavorite}
          onPress={handleToggleFavorite}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Imagem */}
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Ionicons name="medical" size={80} color={COLORS.lightGray} />
          </View>
        )}

        {/* Nome */}
        <Text style={styles.name}>{details.name}</Text>

        {/* Rating */}
        {details.rating && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={20} color="#FFB800" />
            <Text style={styles.ratingText}>{details.rating.toFixed(1)}</Text>
            {details.user_ratings_total && (
              <Text style={styles.ratingCount}>
                ({details.user_ratings_total} avaliações)
              </Text>
            )}
          </View>
        )}

        {/* Status aberto/fechado */}
        {details.opening_hours?.open_now !== undefined && (
          <View
            style={[
              styles.statusBadge,
              details.opening_hours.open_now ? styles.openBadge : styles.closedBadge,
            ]}
          >
            <Ionicons
              name={details.opening_hours.open_now ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={details.opening_hours.open_now ? COLORS.success : COLORS.error}
            />
            <Text
              style={[
                styles.statusText,
                details.opening_hours.open_now ? styles.openText : styles.closedText,
              ]}
            >
              {details.opening_hours.open_now ? 'Aberto agora' : 'Fechado'}
            </Text>
          </View>
        )}

        {/* Endereço */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color={colors.red} />
            <Text style={styles.sectionTitle}>Endereço</Text>
          </View>
          <Text style={styles.sectionContent}>{details.formatted_address}</Text>
        </View>

        {/* Telefone */}
        {details.formatted_phone_number && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="call" size={20} color={colors.red} />
              <Text style={styles.sectionTitle}>Telefone</Text>
            </View>
            <TouchableOpacity onPress={handleCall}>
              <Text style={[styles.sectionContent, styles.link]}>
                {details.formatted_phone_number}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Website */}
        {details.website && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="globe" size={20} color={colors.red} />
              <Text style={styles.sectionTitle}>Website</Text>
            </View>
            <TouchableOpacity onPress={handleOpenWebsite}>
              <Text style={[styles.sectionContent, styles.link]} numberOfLines={1}>
                {details.website}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Horário de funcionamento */}
        {details.opening_hours?.weekday_text && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={20} color={colors.red} />
              <Text style={styles.sectionTitle}>Horário de Funcionamento</Text>
            </View>
            {details.opening_hours.weekday_text.map((text, index) => (
              <Text key={index} style={styles.weekdayText}>
                {text}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Ações */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleCall} disabled={!details.formatted_phone_number}>
          <Ionicons
            name="call"
            size={24}
            color={details.formatted_phone_number ? COLORS.white : COLORS.lightGray}
          />
          <Text style={[styles.actionText, !details.formatted_phone_number && styles.actionTextDisabled]}>
            Ligar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleOpenMaps}>
          <Ionicons name="navigate" size={24} color={COLORS.white} />
          <Text style={styles.actionText}>Rotas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleOpenWebsite} disabled={!details.website}>
          <Ionicons
            name="globe"
            size={24}
            color={details.website ? COLORS.white : COLORS.lightGray}
          />
          <Text style={[styles.actionText, !details.website && styles.actionTextDisabled]}>
            Site
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray + '30',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  content: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 250,
  },
  placeholderImage: {
    backgroundColor: COLORS.lightGray + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.black,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 6,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  ratingCount: {
    fontSize: 14,
    color: COLORS.gray,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  openBadge: {
    backgroundColor: COLORS.success + '20',
  },
  closedBadge: {
    backgroundColor: COLORS.error + '20',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  openText: {
    color: COLORS.success,
  },
  closedText: {
    color: COLORS.error,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  sectionContent: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  link: {
    color: COLORS.secondary,
    textDecorationLine: 'underline',
  },
  weekdayText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 22,
  },
  errorWrapper: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: colors.red,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  actionTextDisabled: {
    color: COLORS.lightGray,
  },
});
