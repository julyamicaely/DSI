/**
 * @file services/googlePlaces.service.ts
 * @description Serviço para integração com Google Places API
 * Responsável por buscar hospitais próximos e detalhes de estabelecimentos
 */

import { 
  GooglePlace, 
  PlaceDetails, 
  Hospital, 
  NearbySearchParams,
  Coordinates 
} from '../types/hospital.types';
import { 
  GOOGLE_PLACES_API_KEY, 
  API_URLS, 
  ERROR_MESSAGES,
  PLACE_TYPES,
  MAP_CONFIG 
} from '../config/constants';

/**
 * Resposta da API de busca próxima
 */
interface NearbySearchResponse {
  results: GooglePlace[];
  status: string;
  error_message?: string;
  next_page_token?: string;
}

/**
 * Resposta da API de detalhes
 */
interface PlaceDetailsResponse {
  result: PlaceDetails;
  status: string;
  error_message?: string;
}

/**
 * Serviço de integração com Google Places API
 */
class GooglePlacesService {
  private apiKey: string;

  constructor(apiKey: string = GOOGLE_PLACES_API_KEY) {
    this.apiKey = apiKey;
  }

  /**
   * Busca hospitais próximos à localização fornecida
   * @param params - Parâmetros de busca (localização, raio, tipo)
   * @returns Lista de hospitais encontrados
   * @throws Error em caso de falha na requisição
   */
  async nearbySearch(params: NearbySearchParams): Promise<Hospital[]> {
    try {
      const { location, radius = MAP_CONFIG.DEFAULT_RADIUS, type = PLACE_TYPES.HOSPITAL } = params;
      const { latitude, longitude } = location;

      // Validação de entrada
      this.validateCoordinates(location);
      this.validateRadius(radius);

      // Monta a URL da requisição
      const url = this.buildNearbySearchUrl({ location, radius, type });

      console.log('[GooglePlacesService] Buscando hospitais próximos:', { latitude, longitude, radius, type });

      // Faz a requisição
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
      }

      const data: NearbySearchResponse = await response.json();

      // Trata o status da resposta
      this.handleApiStatus(data.status, data.error_message);

      // Converte os resultados para o formato Hospital
      const hospitals = this.convertPlacesToHospitals(data.results);

      console.log('[GooglePlacesService] Hospitais encontrados:', hospitals.length);

      return hospitals;

    } catch (error) {
      console.error('[GooglePlacesService] Erro ao buscar hospitais:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtém detalhes completos de um estabelecimento
   * @param placeId - ID do estabelecimento no Google Places
   * @returns Detalhes completos do estabelecimento
   * @throws Error em caso de falha na requisição
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    try {
      // Validação de entrada
      if (!placeId || placeId.trim() === '') {
        throw new Error('Place ID inválido');
      }

      // Monta a URL da requisição
      const url = this.buildPlaceDetailsUrl(placeId);

      console.log('[GooglePlacesService] Buscando detalhes do lugar:', placeId);

      // Faz a requisição
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
      }

      const data: PlaceDetailsResponse = await response.json();

      // Trata o status da resposta
      this.handleApiStatus(data.status, data.error_message);

      console.log('[GooglePlacesService] Detalhes obtidos com sucesso');

      return data.result;

    } catch (error) {
      console.error('[GooglePlacesService] Erro ao buscar detalhes:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtém URL da foto de um estabelecimento
   * @param photoReference - Referência da foto retornada pela API
   * @param maxWidth - Largura máxima da foto (padrão: 400px)
   * @returns URL da foto
   */
  getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
    return `${API_URLS.PLACES_PHOTO}?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${this.apiKey}`;
  }

  /**
   * Calcula distância entre duas coordenadas usando fórmula de Haversine
   * @param from - Coordenadas de origem
   * @param to - Coordenadas de destino
   * @returns Distância em metros
   */
  calculateDistance(from: Coordinates, to: Coordinates): number {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = (from.latitude * Math.PI) / 180;
    const φ2 = (to.latitude * Math.PI) / 180;
    const Δφ = ((to.latitude - from.latitude) * Math.PI) / 180;
    const Δλ = ((to.longitude - from.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  /**
   * Formata distância para exibição
   * @param meters - Distância em metros
   * @returns String formatada (ex: "1.5 km" ou "500 m")
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${meters} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }

  // ========== MÉTODOS PRIVADOS ==========

  /**
   * Constrói URL para busca de lugares próximos
   */
  private buildNearbySearchUrl(params: NearbySearchParams): string {
    const { location, radius, type } = params;
    const locationStr = `${location.latitude},${location.longitude}`;

    const urlParams = new URLSearchParams({
      location: locationStr,
      radius: radius.toString(),
      type: type || PLACE_TYPES.HOSPITAL,
      key: this.apiKey,
      language: 'pt-BR',
    });

    return `${API_URLS.PLACES_NEARBY}?${urlParams.toString()}`;
  }

  /**
   * Constrói URL para detalhes de um lugar
   */
  private buildPlaceDetailsUrl(placeId: string): string {
    const urlParams = new URLSearchParams({
      place_id: placeId,
      key: this.apiKey,
      language: 'pt-BR',
      fields: 'name,formatted_address,formatted_phone_number,international_phone_number,opening_hours,website,rating,user_ratings_total,photos,geometry,place_id,types',
    });

    return `${API_URLS.PLACES_DETAILS}?${urlParams.toString()}`;
  }

  /**
   * Valida coordenadas geográficas
   */
  private validateCoordinates(coords: Coordinates): void {
    const { latitude, longitude } = coords;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error('Coordenadas inválidas: devem ser números');
    }

    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude inválida: deve estar entre -90 e 90');
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude inválida: deve estar entre -180 e 180');
    }
  }

  /**
   * Valida raio de busca
   */
  private validateRadius(radius: number): void {
    if (typeof radius !== 'number' || radius <= 0) {
      throw new Error('Raio inválido: deve ser um número positivo');
    }

    if (radius > MAP_CONFIG.MAX_RADIUS) {
      throw new Error(`Raio máximo permitido: ${MAP_CONFIG.MAX_RADIUS}m`);
    }
  }

  /**
   * Trata o status de resposta da API
   */
  private handleApiStatus(status: string, errorMessage?: string): void {
    switch (status) {
      case 'OK':
      case 'ZERO_RESULTS':
        // Status válidos
        break;
      case 'OVER_QUERY_LIMIT':
        throw new Error(ERROR_MESSAGES.OVER_QUERY_LIMIT);
      case 'REQUEST_DENIED':
        throw new Error(errorMessage || 'Requisição negada pela API');
      case 'INVALID_REQUEST':
        throw new Error(ERROR_MESSAGES.INVALID_REQUEST);
      default:
        throw new Error(errorMessage || ERROR_MESSAGES.API_ERROR);
    }
  }

  /**
   * Converte lugares da API para o formato Hospital
   */
  private convertPlacesToHospitals(places: GooglePlace[]): Hospital[] {
    return places.map((place) => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity || '',
      coordinates: {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
      },
      rating: place.rating,
      totalRatings: place.user_ratings_total,
      isOpen: place.opening_hours?.open_now,
      photoReference: place.photos?.[0]?.photo_reference,
      distance: 0, // Será calculado posteriormente
    }));
  }

  /**
   * Trata erros e retorna mensagens amigáveis
   */
  private handleError(error: unknown): Error {
    if (error instanceof Error) {
      // Erros de rede
      if (error.message.includes('Network')) {
        return new Error(ERROR_MESSAGES.NETWORK_ERROR);
      }
      return error;
    }

    // Erro desconhecido
    return new Error(ERROR_MESSAGES.API_ERROR);
  }
}

// Exporta instância única (singleton)
export default new GooglePlacesService();
