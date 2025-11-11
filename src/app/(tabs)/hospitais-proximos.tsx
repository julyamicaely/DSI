/**
 * @file app/(tabs)/hospitais-proximos.tsx
 * @description Tela principal de mapa com hospitais próximos
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Hospital, Coordinates } from '../../types/hospital.types';
import googlePlacesService from '../../services/googlePlaces.service';
import { useFavoritesStore, useIsFavorite } from '../../store/favoritesStore';
import {
  HospitalCard,
  HospitalMarker,
  LoadingOverlay,
  ErrorMessage,
} from '../../components';
import { COLORS, MAP_CONFIG, ERROR_MESSAGES } from '../../config/constants';

type ViewMode = 'map' | 'list';

export default function HospitaisProximos() {
  const mapRef = useRef<MapView>(null);

  // Estado
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState<Region | null>(null);

  // Store de favoritos
  const { initialize, addFavorite, removeFavorite, isFavorite: checkIsFavorite } =
    useFavoritesStore();

  // Inicialização
  useEffect(() => {
    initializeScreen();
  }, []);

  /**
   * Inicializa a tela: permissões + localização + favoritos
   */
  const initializeScreen = async () => {
    try {
      setLoading(true);
      setError(null);

      // Inicializa store de favoritos
      await initialize();

      // Solicita permissão de localização
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setError(ERROR_MESSAGES.NO_PERMISSION);
        setLoading(false);
        return;
      }

      // Obtém localização atual
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: Coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(coords);

      // Define região inicial do mapa
      const initialRegion: Region = {
        ...coords,
        latitudeDelta: MAP_CONFIG.DEFAULT_LATITUDE_DELTA,
        longitudeDelta: MAP_CONFIG.DEFAULT_LONGITUDE_DELTA,
      };
      setRegion(initialRegion);

      // Busca hospitais próximos
      await searchNearbyHospitals(coords);

      setLoading(false);
    } catch (err) {
      console.error('[HospitaisProximos] Erro na inicialização:', err);
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.NO_LOCATION);
      setLoading(false);
    }
  };

  /**
   * Busca hospitais próximos à localização fornecida
   */
  const searchNearbyHospitals = async (location: Coordinates) => {
    try {
      setLoading(true);
      setError(null);

      const results = await googlePlacesService.nearbySearch({
        location,
        radius: MAP_CONFIG.DEFAULT_RADIUS,
      });

      // Calcula distância de cada hospital
      const hospitalsWithDistance = results.map((hospital) => ({
        ...hospital,
        distance: googlePlacesService.calculateDistance(
          location,
          hospital.coordinates
        ),
      }));

      // Ordena por distância
      hospitalsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));

      setHospitals(hospitalsWithDistance);

      if (hospitalsWithDistance.length === 0) {
        setError(ERROR_MESSAGES.NO_RESULTS);
      }

      setLoading(false);
    } catch (err) {
      console.error('[HospitaisProximos] Erro ao buscar hospitais:', err);
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.API_ERROR);
      setLoading(false);
    }
  };

  /**
   * Centraliza o mapa em uma coordenada
   */
  const centerMapOn = (coords: Coordinates, animated = true) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...coords,
          latitudeDelta: MAP_CONFIG.DEFAULT_LATITUDE_DELTA,
          longitudeDelta: MAP_CONFIG.DEFAULT_LONGITUDE_DELTA,
        },
        animated ? MAP_CONFIG.ANIMATION_DURATION : 0
      );
    }
  };

  /**
   * Centraliza no usuário
   */
  const centerOnUser = () => {
    if (userLocation) {
      centerMapOn(userLocation);
    }
  };

  /**
   * Toggle de favorito
   */
  const handleToggleFavorite = async (hospital: Hospital) => {
    try {
      const isFav = checkIsFavorite(hospital.id);

      if (isFav) {
        await removeFavorite(hospital.id);
        Alert.alert('Removido', 'Hospital removido dos favoritos');
      } else {
        await addFavorite({
          placeId: hospital.id,
          name: hospital.name,
          address: hospital.address,
          latitude: hospital.coordinates.latitude,
          longitude: hospital.coordinates.longitude,
          phone: hospital.phone,
          rating: hospital.rating,
          photoReference: hospital.photoReference,
        });
        Alert.alert('Adicionado', 'Hospital adicionado aos favoritos');
      }
    } catch (err) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Erro ao atualizar favorito');
    }
  };

  /**
   * Navega para detalhes do hospital
   */
  const handleViewDetails = (hospital: Hospital) => {
    router.push({
      pathname: '/hospital-details',
      params: { placeId: hospital.id },
    });
  };

  /**
   * Renderiza card de hospital na lista
   */
  const renderHospitalCard = ({ item }: { item: Hospital }) => (
    <HospitalCard
      hospital={item}
      onPress={() => handleViewDetails(item)}
      onFavoritePress={() => handleToggleFavorite(item)}
      isFavorite={checkIsFavorite(item.id)}
      showDistance
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>

        <Text style={styles.title}>Hospitais Próximos</Text>

        <TouchableOpacity
          onPress={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
          style={styles.toggleButton}
        >
          <Ionicons
            name={viewMode === 'map' ? 'list' : 'map'}
            size={24}
            color={COLORS.black}
          />
        </TouchableOpacity>
      </View>

      {/* Erro */}
      {error && (
        <View style={styles.errorContainer}>
          <ErrorMessage
            message={error}
            onRetry={userLocation ? () => searchNearbyHospitals(userLocation) : initializeScreen}
            onDismiss={() => setError(null)}
          />
        </View>
      )}

      {/* Conteúdo */}
      {viewMode === 'map' ? (
        <>
          {/* Mapa */}
          {region && (
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={region}
              showsUserLocation
              showsMyLocationButton={false}
              showsCompass
              onRegionChangeComplete={setRegion}
            >
              {hospitals.map((hospital) => (
                <HospitalMarker
                  key={hospital.id}
                  hospital={hospital}
                  onPress={() => {
                    setSelectedHospital(hospital);
                    centerMapOn(hospital.coordinates);
                  }}
                  isSelected={selectedHospital?.id === hospital.id}
                  isFavorite={checkIsFavorite(hospital.id)}
                />
              ))}
            </MapView>
          )}

          {/* Botão de centralizar */}
          <TouchableOpacity style={styles.centerButton} onPress={centerOnUser}>
            <Ionicons name="locate" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Card do hospital selecionado */}
          {selectedHospital && (
            <View style={styles.selectedCard}>
              <HospitalCard
                hospital={selectedHospital}
                onPress={() => handleViewDetails(selectedHospital)}
                onFavoritePress={() => handleToggleFavorite(selectedHospital)}
                isFavorite={checkIsFavorite(selectedHospital.id)}
                showDistance
              />
            </View>
          )}
        </>
      ) : (
        <>
          {/* Lista */}
          <FlatList
            data={hospitals}
            keyExtractor={(item) => item.id}
            renderItem={renderHospitalCard}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyState}>
                  <Ionicons name="medical" size={64} color={COLORS.lightGray} />
                  <Text style={styles.emptyText}>Nenhum hospital encontrado</Text>
                </View>
              ) : null
            }
          />
        </>
      )}

      {/* Loading */}
      <LoadingOverlay visible={loading} message="Buscando hospitais..." />
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
  toggleButton: {
    padding: 8,
  },
  errorContainer: {
    padding: 16,
  },
  map: {
    flex: 1,
  },
  centerButton: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  list: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
  },
});
