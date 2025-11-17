/**
 * @file app/(cards)/hospitais-proximos.tsx
 * @description Tela principal de mapa com hospitais próximos (REFATORADA)
 * - Virtualization com FlatList
 * - Hooks personalizados (useNearbyHospitals, useLocationPermission)
 * - Paginação e cache
 * - Filtros (abertos agora, avaliação mínima)
 * - Skeleton loaders
 * - Otimizações (useMemo, useCallback)
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Text,
  Alert,
  ToastAndroid,
  Platform,
  Animated,
  ListRenderItemInfo,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Hospital, Coordinates } from '../../types/hospital.types';
import googlePlacesService from '../../services/googlePlaces.service';
import { useFavoritesStore } from '../../store/favoritesStore';
import {
  HospitalCard,
  LoadingOverlay,
  ErrorMessage,
  FavoritesSection,
  MapSkeleton,
  HospitalCardSkeleton,
  LocationPermissionDialog,
  HospitalFilters,
  HospitalFiltersState,
} from '../../components';
import { COLORS, MAP_CONFIG, ERROR_MESSAGES } from '../../config/constants';
import useLocationPermission from '../../hooks/useLocationPermission';
import useNearbyHospitals from '../../hooks/useNearbyHospitals';
import Logger from '../../utils/logger';

export default function HospitaisProximos() {
  const mapRef = useRef<MapView>(null);
  const listRef = useRef<FlatList>(null);
  const floatingButtonAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  // Hooks personalizados
  const locationPermission = useLocationPermission();
  const {
    hospitals: allHospitals,
    loading: hospitalsLoading,
    loadingMore,
    error: hospitalsError,
    hasMoreResults,
    searchHospitals,
    loadMoreHospitals,
    calculateDistances,
  } = useNearbyHospitals();

  // Store de favoritos
  const { 
    initialize, 
    addFavorite, 
    removeFavorite, 
    updateNotes,
    isFavorite: checkIsFavorite,
    favorites 
  } = useFavoritesStore();

  // Estado local
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [filters, setFilters] = useState<HospitalFiltersState>({
    openNow: false,
    minRating: 0,
  });
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  // Inicialização
  useEffect(() => {
    initializeScreen();
  }, []);

  /**
   * Inicializa a tela: favoritos + localização
   */
  const initializeScreen = useCallback(async () => {
    try {
      Logger.info('[HospitaisProximos] Inicializando tela...');

      // Inicializa store de favoritos
      await initialize();

      // Solicita permissão de localização
      const granted = await locationPermission.requestPermission();

      if (!granted) {
        Logger.warn('[HospitaisProximos] Permissão negada');
        setShowPermissionDialog(true);
        return;
      }

      // Obtém localização atual
      await getUserLocation();

    } catch (err) {
      Logger.error('[HospitaisProximos] Erro na inicialização:', err);
      showToast(err instanceof Error ? err.message : ERROR_MESSAGES.NO_LOCATION);
    }
  }, [initialize, locationPermission]);

  /**
   * Obtém localização do usuário e busca hospitais
   */
  const getUserLocation = useCallback(async () => {
    try {
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
      await searchHospitals(coords);

      Logger.info('[HospitaisProximos] Localização obtida:', coords);
    } catch (err) {
      Logger.error('[HospitaisProximos] Erro ao obter localização:', err);
      showToast(ERROR_MESSAGES.NO_LOCATION);
    }
  }, [searchHospitals]);

  /**
   * Aplica filtros aos hospitais
   */
  const filteredHospitals = useMemo(() => {
    let result = [...allHospitals];

    // Filtro: Abertos Agora
    if (filters.openNow) {
      result = result.filter((h) => h.isOpen === true);
    }

    // Filtro: Avaliação Mínima
    if (filters.minRating > 0) {
      result = result.filter((h) => (h.rating || 0) >= filters.minRating);
    }

    return result;
  }, [allHospitals, filters]);

  /**
   * Centraliza o mapa em uma coordenada
   */
  const centerMapOn = useCallback((coords: Coordinates, animated = true) => {
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
  }, []);

  /**
   * Centraliza no usuário
   */
  const centerOnUser = useCallback(() => {
    if (userLocation) {
      centerMapOn(userLocation);
    }
  }, [userLocation, centerMapOn]);

  /**
   * Toggle de favorito com feedback via toast
   */
  const handleToggleFavorite = useCallback(
    async (hospital: Hospital) => {
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
        Logger.error('[HospitaisProximos] Erro ao toggle favorito:', err);
        showToast(err instanceof Error ? err.message : 'Erro ao atualizar favorito');
      }
    },
    [checkIsFavorite, removeFavorite, addFavorite]
  );

  /**
   * Atualiza nota de um favorito
   */
  const handleUpdateNote = useCallback(
    async (placeId: string, note: string) => {
      try {
        await updateNotes(placeId, note);
        showToast('Nota salva com sucesso');
      } catch (err) {
        Logger.error('[HospitaisProximos] Erro ao salvar nota:', err);
        showToast(err instanceof Error ? err.message : 'Erro ao salvar nota');
      }
    },
    [updateNotes]
  );

  /**
   * Mostra toast (Android) ou Alert (iOS)
   */
  const showToast = useCallback((message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('', message);
    }
  }, []);

  /**
   * Toggle expansão do mapa
   */
  const handleToggleMapExpansion = useCallback(() => {
    const newExpandedState = !isMapExpanded;
    setIsMapExpanded(newExpandedState);
    
    // Anima o botão flutuante
    Animated.timing(floatingButtonAnim, {
      toValue: newExpandedState ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    if (newExpandedState) {
      setSelectedHospital(null);
    }

    Logger.debug('[HospitaisProximos] Mapa expandido:', newExpandedState);
  }, [isMapExpanded, floatingButtonAnim]);

  /**
   * Navega para detalhes do hospital
   */
  const handleViewDetails = useCallback((hospital: Hospital) => {
    router.push({
      pathname: '/hospital-details',
      params: { placeId: hospital.id },
    });
  }, []);

  /**
   * Navega para detalhes de um favorito
   */
  const handleViewFavoriteDetails = useCallback((favorite: any) => {
    router.push({
      pathname: '/hospital-details',
      params: { placeId: favorite.placeId },
    });
  }, []);

  /**
   * Handler para carregar mais hospitais (paginação)
   */
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMoreResults) {
      Logger.info('[HospitaisProximos] Carregando mais hospitais...');
      loadMoreHospitals();
    }
  }, [loadingMore, hasMoreResults, loadMoreHospitals]);

  /**
   * Handler para permissão negada - abre configurações
   */
  const handleOpenSettings = useCallback(() => {
    setShowPermissionDialog(false);
    locationPermission.openSettings();
  }, [locationPermission]);

  /**
   * Handler para retry após erro de permissão
   */
  const handleRetryPermission = useCallback(async () => {
    setShowPermissionDialog(false);
    const granted = await locationPermission.requestPermission();
    if (granted) {
      await getUserLocation();
    } else {
      setShowPermissionDialog(true);
    }
  }, [locationPermission, getUserLocation]);

  /**
   * Renderiza card de hospital na lista (FlatList)
   */
  const renderHospitalCard = useCallback(
    ({ item }: ListRenderItemInfo<Hospital>) => (
      <HospitalCard
        hospital={item}
        onPress={() => handleViewDetails(item)}
        onFavoritePress={() => handleToggleFavorite(item)}
        isFavorite={checkIsFavorite(item.id)}
        showDistance
      />
    ),
    [handleViewDetails, handleToggleFavorite, checkIsFavorite]
  );

  /**
   * Renderiza skeleton de card (loading)
   */
  const renderSkeletonCard = useCallback(() => <HospitalCardSkeleton />, []);

  /**
   * Renderiza header da lista (filtros)
   */
  const renderListHeader = useCallback(() => {
    if (isMapExpanded) return null;

    return (
      <>
        {/* Botão de Expandir/Recolher Mapa */}
        <View style={styles.listToggleContainer}>
          <TouchableOpacity 
            style={styles.listToggleButton} 
            onPress={handleToggleMapExpansion}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="expand" 
              size={20} 
              color={COLORS.primary} 
            />
            <Text style={styles.listToggleText}>Expandir Mapa</Text>
          </TouchableOpacity>
        </View>

        {/* Filtros */}
        <HospitalFilters
          filters={filters}
          onFiltersChange={setFilters}
          resultCount={filteredHospitals.length}
        />

        {/* Título */}
        <View style={styles.listHeaderTitle}>
          <Text style={styles.sectionTitle}>Próximos a você</Text>
        </View>
      </>
    );
  }, [isMapExpanded, filters, filteredHospitals.length, handleToggleMapExpansion]);

  /**
   * Renderiza footer da lista (loading more + favoritos)
   */
  const renderListFooter = useCallback(() => {
    return (
      <>
        {/* Loading More */}
        {loadingMore && (
          <View style={styles.loadingMoreContainer}>
            <HospitalCardSkeleton />
          </View>
        )}

        {/* Seção de Favoritos (após a lista) */}
        <FavoritesSection
          favorites={favorites}
          onRemove={removeFavorite}
          onUpdateNote={handleUpdateNote}
          onPress={handleViewFavoriteDetails}
        />
      </>
    );
  }, [loadingMore, favorites, removeFavorite, handleUpdateNote, handleViewFavoriteDetails]);

  /**
   * Renderiza empty state
   */
  const renderEmptyState = useCallback(() => {
    if (hospitalsLoading) {
      return (
        <View style={styles.skeletonsContainer}>
          {[1, 2, 3].map((i) => (
            <HospitalCardSkeleton key={i} />
          ))}
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="medical" size={64} color={COLORS.lightGray} />
        <Text style={styles.emptyText}>
          {filters.openNow || filters.minRating > 0
            ? 'Nenhum hospital encontrado com os filtros aplicados'
            : 'Nenhum hospital encontrado'}
        </Text>
      </View>
    );
  }, [hospitalsLoading, filters]);

  /**
   * KeyExtractor para FlatList
   */
  const keyExtractor = useCallback((item: Hospital) => item.id, []);

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

      {/* Erro de busca */}
      {hospitalsError && (
        <View style={styles.errorContainer}>
          <ErrorMessage
            message={hospitalsError}
            onRetry={userLocation ? () => searchHospitals(userLocation) : initializeScreen}
            onDismiss={() => {}}
          />
        </View>
      )}

      {/* Mapa */}
      {hospitalsLoading && !region ? (
        <MapSkeleton expanded={isMapExpanded} />
      ) : region ? (
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
            {/* Marcadores dos hospitais próximos */}
            {filteredHospitals.map((hospital) => {
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
            
            {/* Marcadores dos favoritos que não estão próximos */}
            {favorites.map((favorite) => {
              // Verifica se o favorito já está na lista de hospitais próximos
              const isInHospitals = filteredHospitals.some((h) => h.id === favorite.placeId);
              if (isInHospitals) return null;
              
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

          {/* Botão de centralizar com SafeArea */}
          <TouchableOpacity 
            style={[styles.centerButton, { bottom: 16 + insets.bottom }]} 
            onPress={centerOnUser}
          >
            <Ionicons name="locate" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Botão flutuante para recolher mapa (quando expandido) com SafeArea */}
          {isMapExpanded && (
            <Animated.View
              style={[
                styles.floatingCollapseButton,
                {
                  top: 20 + insets.top,
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
      ) : null}

      {/* Lista de Hospitais com FlatList (virtualization) */}
      {!isMapExpanded && (
        <FlatList
          ref={listRef}
          data={filteredHospitals}
          renderItem={renderHospitalCard}
          keyExtractor={keyExtractor}
          ListHeaderComponent={renderListHeader}
          ListFooterComponent={renderListFooter}
          ListEmptyComponent={renderEmptyState}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}

      {/* Dialog de Permissão de Localização */}
      <LocationPermissionDialog
        visible={showPermissionDialog}
        status={locationPermission.status}
        onRequestPermission={handleRetryPermission}
        onOpenSettings={handleOpenSettings}
        onDismiss={() => setShowPermissionDialog(false)}
        requesting={locationPermission.requesting}
        canOpenSettings={locationPermission.canOpenSettings}
      />

      {/* Loading Overlay (apenas no primeiro carregamento) */}
      <LoadingOverlay 
        visible={hospitalsLoading && allHospitals.length === 0} 
        message="Buscando hospitais..." 
      />
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
    height: 300, // ~40% da altura típica de tela (reduzido de 400)
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
  listContent: {
    paddingBottom: 16,
  },
  listHeaderTitle: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  loadingMoreContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  skeletonsContainer: {
    padding: 16,
    gap: 12,
  },
});
