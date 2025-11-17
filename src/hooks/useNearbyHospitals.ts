/**
 * @file hooks/useNearbyHospitals.ts
 * @description Hook para gerenciar busca de hospitais com paginação e cache
 */

import { useState, useCallback, useRef } from 'react';
import { Hospital, Coordinates } from '../types/hospital.types';
import googlePlacesService from '../services/googlePlaces.service';
import { CACHE_DURATION, MAP_CONFIG } from '../config/constants';
import Logger from '../utils/logger';

interface UseNearbyHospitalsReturn {
  hospitals: Hospital[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMoreResults: boolean;
  searchHospitals: (location: Coordinates, radius?: number) => Promise<void>;
  loadMoreHospitals: () => Promise<void>;
  clearHospitals: () => void;
  calculateDistances: (userLocation: Coordinates) => void;
}

interface CacheEntry {
  hospitals: Hospital[];
  nextPageToken: string | null;
  location: Coordinates;
  radius: number;
  timestamp: number;
}

export default function useNearbyHospitals(): UseNearbyHospitalsReturn {
  // Estado
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  // Cache
  const cacheRef = useRef<CacheEntry | null>(null);
  const lastSearchParamsRef = useRef<{ location: Coordinates; radius: number } | null>(null);

  /**
   * Verifica se o cache é válido para a região atual
   */
  const isCacheValid = useCallback((location: Coordinates, radius: number): boolean => {
    if (!cacheRef.current) return false;

    const cache = cacheRef.current;
    const now = Date.now();

    // Verifica expiração do cache
    if (now - cache.timestamp > CACHE_DURATION) {
      Logger.debug('[useNearbyHospitals] Cache expirado');
      return false;
    }

    // Verifica se a localização mudou significativamente
    const distance = googlePlacesService.calculateDistance(cache.location, location);
    const hasMovedSignificantly = distance > radius * 0.3; // 30% do raio

    if (hasMovedSignificantly) {
      Logger.debug('[useNearbyHospitals] Localização mudou significativamente:', distance, 'm');
      return false;
    }

    // Verifica se o raio mudou
    if (Math.abs(cache.radius - radius) > 100) {
      Logger.debug('[useNearbyHospitals] Raio mudou:', cache.radius, '→', radius);
      return false;
    }

    Logger.debug('[useNearbyHospitals] Cache válido');
    return true;
  }, []);

  /**
   * Busca hospitais próximos
   */
  const searchHospitals = useCallback(
    async (location: Coordinates, radius: number = MAP_CONFIG.DEFAULT_RADIUS) => {
      try {
        // Verifica cache
        if (isCacheValid(location, radius)) {
          Logger.info('[useNearbyHospitals] Usando cache');
          setHospitals(cacheRef.current!.hospitals);
          setNextPageToken(cacheRef.current!.nextPageToken);
          setError(null);
          return;
        }

        setLoading(true);
        setError(null);
        setHospitals([]);
        setNextPageToken(null);

        Logger.info('[useNearbyHospitals] Buscando hospitais:', { location, radius });

        // Busca inicial
        const result = await googlePlacesService.nearbySearchWithPagination({
          location,
          radius,
        });

        // Calcula distâncias
        const hospitalsWithDistance = result.hospitals.map((hospital) => ({
          ...hospital,
          distance: googlePlacesService.calculateDistance(location, hospital.coordinates),
        }));

        // Ordena por distância
        const sortedHospitals = hospitalsWithDistance.sort((a, b) => a.distance - b.distance);

        setHospitals(sortedHospitals);
        setNextPageToken(result.nextPageToken || null);

        // Atualiza cache
        cacheRef.current = {
          hospitals: sortedHospitals,
          nextPageToken: result.nextPageToken || null,
          location,
          radius,
          timestamp: Date.now(),
        };

        lastSearchParamsRef.current = { location, radius };

        Logger.info('[useNearbyHospitals] Hospitais encontrados:', sortedHospitals.length);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar hospitais';
        Logger.error('[useNearbyHospitals] Erro ao buscar hospitais:', err);
        setError(errorMessage);
        setHospitals([]);
      } finally {
        setLoading(false);
      }
    },
    [isCacheValid]
  );

  /**
   * Carrega mais resultados (paginação)
   */
  const loadMoreHospitals = useCallback(async () => {
    if (!nextPageToken || loadingMore || !lastSearchParamsRef.current) {
      Logger.debug('[useNearbyHospitals] Nenhum token de próxima página ou já carregando');
      return;
    }

    try {
      setLoadingMore(true);

      Logger.info('[useNearbyHospitals] Carregando mais hospitais...');

      const { location, radius } = lastSearchParamsRef.current;

      // Busca próxima página
      const result = await googlePlacesService.nearbySearchWithPagination({
        location,
        radius,
        pageToken: nextPageToken,
      });

      // Calcula distâncias
      const hospitalsWithDistance = result.hospitals.map((hospital) => ({
        ...hospital,
        distance: googlePlacesService.calculateDistance(location, hospital.coordinates),
      }));

      // Adiciona aos resultados existentes
      const updatedHospitals = [...hospitals, ...hospitalsWithDistance];

      // Ordena por distância
      const sortedHospitals = updatedHospitals.sort((a, b) => (a.distance || 0) - (b.distance || 0));

      setHospitals(sortedHospitals);
      setNextPageToken(result.nextPageToken || null);

      // Atualiza cache
      if (cacheRef.current) {
        cacheRef.current.hospitals = sortedHospitals;
        cacheRef.current.nextPageToken = result.nextPageToken || null;
        cacheRef.current.timestamp = Date.now();
      }

      Logger.info('[useNearbyHospitals] Total de hospitais:', sortedHospitals.length);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar mais hospitais';
      Logger.error('[useNearbyHospitals] Erro ao carregar mais:', err);
      setError(errorMessage);
    } finally {
      setLoadingMore(false);
    }
  }, [nextPageToken, loadingMore, hospitals]);

  /**
   * Limpa a lista de hospitais e cache
   */
  const clearHospitals = useCallback(() => {
    setHospitals([]);
    setError(null);
    setNextPageToken(null);
    cacheRef.current = null;
    lastSearchParamsRef.current = null;
    Logger.debug('[useNearbyHospitals] Hospitais limpos');
  }, []);

  /**
   * Recalcula distâncias com base em nova localização
   */
  const calculateDistances = useCallback((userLocation: Coordinates) => {
    setHospitals((prevHospitals) => {
      const updated = prevHospitals.map((hospital) => ({
        ...hospital,
        distance: googlePlacesService.calculateDistance(userLocation, hospital.coordinates),
      }));

      // Reordena por distância
      return updated.sort((a, b) => a.distance - b.distance);
    });

    Logger.debug('[useNearbyHospitals] Distâncias recalculadas');
  }, []);

  return {
    hospitals,
    loading,
    loadingMore,
    error,
    hasMoreResults: !!nextPageToken,
    searchHospitals,
    loadMoreHospitals,
    clearHospitals,
    calculateDistances,
  };
}
