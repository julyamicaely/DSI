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
  ScrollView,
  ToastAndroid,
  Platform,
  Animated,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from 'expo-router';

import { Hospital, Coordinates } from '../../types/hospital.types';
import googlePlacesService from '../../services/googlePlaces.service';
import { useFavoritesStore, useIsFavorite } from '../../store/favoritesStore';
import {
  HospitalCard,
  LoadingOverlay,
  ErrorMessage,
  FavoritesSection,
} from '../../components';
import { COLORS, MAP_CONFIG, ERROR_MESSAGES } from '../../config/constants';

export default function HospitaisProximos() {
  const mapRef = useRef<MapView>(null);
  const listRef = useRef<ScrollView>(null);
  const floatingButtonAnim = useRef(new Animated.Value(0)).current;

  // Estado
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState<Region | null>(null);

  // Store de favoritos
  const { 
    initialize, 
    addFavorite, 
    removeFavorite, 
    updateNotes,
    isFavorite: checkIsFavorite,
    favorites 
  } = useFavoritesStore();

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
   * Toggle de favorito com feedback via toast
   */
  const handleToggleFavorite = async (hospital: Hospital) => {
    try {
      const isFav = checkIsFavorite(hospital.id);

      if (isFav) {
        await removeFavorite(hospital.id);
        showToast('Removido dos favoritos');
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
        showToast('Adicionado aos favoritos');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao atualizar favorito');
    }
  };

  /**
   * Atualiza nota de um favorito
   */
  const handleUpdateNote = async (placeId: string, note: string) => {
    try {
      await updateNotes(placeId, note);
      showToast('Nota salva com sucesso');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar nota');
    }
  };

  /**
   * Mostra toast (Android) ou Alert (iOS)
   */
  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('', message);
    }
  };

  /**
   * Scroll para a lista
   */
  const scrollToList = () => {
    if (listRef.current) {
      listRef.current.scrollTo({ y: isMapExpanded ? 0 : 450, animated: true });
    }
  };

  /**
   * Toggle expansão do mapa
   */
  const handleToggleMapExpansion = () => {
    const newExpandedState = !isMapExpanded;
    setIsMapExpanded(newExpandedState);
    
    // Anima o botão flutuante
    Animated.timing(floatingButtonAnim, {
      toValue: newExpandedState ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    if (newExpandedState) {
      // Expandindo: fecha o card selecionado e scroll para o topo
      setSelectedHospital(null);
      setTimeout(() => {
        if (listRef.current) {
          listRef.current.scrollTo({ y: 0, animated: true });
        }
      }, 100);
    } else {
      // Recolhendo: scroll para mostrar a lista
      setTimeout(() => {
        if (listRef.current) {
          listRef.current.scrollTo({ y: 450, animated: true });
        }
      }, 100);
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
   * Navega para detalhes de um favorito
   */
  const handleViewFavoriteDetails = (favorite: any) => {
    router.push({
      pathname: '/hospital-details',
      params: { placeId: favorite.placeId },
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

        <View style={{ width: 40 }} />
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

      <ScrollView 
        ref={listRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Mapa - 55-60% da altura ou expandido */}
        {region && (
          <View style={[styles.mapContainer, isMapExpanded && styles.mapExpanded]}>
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
              {/* Marcadores dos hospitais próximos - pins azuis */}
              {hospitals.map((hospital) => {
                const isFav = checkIsFavorite(hospital.id);
                return (
                  <Marker
                    key={hospital.id}
                    coordinate={{
                      latitude: hospital.coordinates.latitude,
                      longitude: hospital.coordinates.longitude,
                    }}
                    pinColor={isFav ? COLORS.error : COLORS.secondary}
                    onPress={() => {
                      setSelectedHospital(hospital);
                      centerMapOn(hospital.coordinates);
                    }}
                    title={hospital.name}
                    description={hospital.address}
                  />
                );
              })}
              
              {/* Marcadores dos favoritos que não estão próximos - pins vermelhos */}
              {favorites.map((favorite) => {
                // Verifica se o favorito já está na lista de hospitais próximos
                const isInHospitals = hospitals.some(h => h.id === favorite.placeId);
                if (isInHospitals) return null;
                
                // Cria um objeto Hospital a partir do favorito
                const favoriteAsHospital: Hospital = {
                  id: favorite.placeId,
                  name: favorite.name,
                  address: favorite.address,
                  coordinates: {
                    latitude: favorite.latitude,
                    longitude: favorite.longitude,
                  },
                  rating: favorite.rating,
                  phone: favorite.phone,
                  photoReference: favorite.photoReference,
                };
                
                return (
                  <Marker
                    key={`favorite-${favorite.placeId}`}
                    coordinate={{
                      latitude: favorite.latitude,
                      longitude: favorite.longitude,
                    }}
                    pinColor={COLORS.error}
                    onPress={() => {
                      setSelectedHospital(favoriteAsHospital);
                      centerMapOn(favoriteAsHospital.coordinates);
                    }}
                    title={favorite.name}
                    description={favorite.address}
                  />
                );
              })}
            </MapView>

            {/* Botão de centralizar */}
            <TouchableOpacity style={styles.centerButton} onPress={centerOnUser}>
              <Ionicons name="locate" size={24} color={COLORS.primary} />
            </TouchableOpacity>

            {/* Botão flutuante para colapsar mapa (aparece quando expandido) */}
            {isMapExpanded && (
              <Animated.View
                style={[
                  styles.floatingCollapseButton,
                  {
                    opacity: floatingButtonAnim,
                    transform: [
                      {
                        translateY: floatingButtonAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-50, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.collapseButton}
                  onPress={handleToggleMapExpansion}
                  activeOpacity={0.8}
                >
                  <Ionicons name="list" size={22} color="#FFF" />
                  <Text style={styles.collapseButtonText}>Ver Lista</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Card do hospital selecionado */}
            {selectedHospital && (
              <View style={styles.selectedCard}>
                <TouchableOpacity 
                  style={styles.closeCardButton}
                  onPress={() => setSelectedHospital(null)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={28} color={COLORS.white} />
                </TouchableOpacity>
                
                <HospitalCard
                  hospital={selectedHospital}
                  onPress={() => handleViewDetails(selectedHospital)}
                  onFavoritePress={() => handleToggleFavorite(selectedHospital)}
                  isFavorite={checkIsFavorite(selectedHospital.id)}
                  showDistance
                />
              </View>
            )}
          </View>
        )}

        {/* Botão Lista - Abaixo do mapa, alinhado à direita */}
        <View style={styles.listToggleContainer}>
          <TouchableOpacity 
            style={styles.listToggleButton} 
            onPress={handleToggleMapExpansion}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isMapExpanded ? 'contract' : 'expand'} 
              size={20} 
              color={COLORS.primary} 
            />
            <Text style={styles.listToggleText}>
              {isMapExpanded ? 'Recolher' : 'Expandir'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Hospitais */}
        {!isMapExpanded && (
          <View style={styles.listContainer}>
            <Text style={styles.sectionTitle}>Próximos a você</Text>
            
            {hospitals.length === 0 && !loading ? (
              <View style={styles.emptyState}>
                <Ionicons name="medical" size={64} color={COLORS.lightGray} />
                <Text style={styles.emptyText}>Nenhum hospital encontrado</Text>
              </View>
            ) : (
              hospitals.map((hospital) => (
                <HospitalCard
                  key={hospital.id}
                  hospital={hospital}
                  onPress={() => handleViewDetails(hospital)}
                  onFavoritePress={() => handleToggleFavorite(hospital)}
                  isFavorite={checkIsFavorite(hospital.id)}
                  showDistance
                />
              ))
            )}
          </View>
        )}

        {/* Seção de Favoritos */}
        {!isMapExpanded && (
          <FavoritesSection
            favorites={favorites}
            onRemove={removeFavorite}
            onUpdateNote={handleUpdateNote}
            onPress={handleViewFavoriteDetails}
          />
        )}
      </ScrollView>

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
  errorContainer: {
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  mapContainer: {
    height: 400, // ~55-60% da altura típica de tela
    position: 'relative',
  },
  mapExpanded: {
    height: 700, // Maior quando expandido
  },
  map: {
    width: '100%',
    height: '100%',
  },
  centerButton: {
    position: 'absolute',
    bottom: 16,
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
    right: 70, // Espaço para o botão de centralizar
  },
  closeCardButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    zIndex: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  floatingCollapseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  collapseButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collapseButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listToggleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-end',
    backgroundColor: COLORS.white,
  },
  listToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  listToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  listContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
  },
});
