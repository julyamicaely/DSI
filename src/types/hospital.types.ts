/**
 * @file types/hospital.types.ts
 * @description Definições de tipos para hospitais, lugares e favoritos
 */

/**
 * Representa as coordenadas geográficas
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Horário de funcionamento de um estabelecimento
 */
export interface OpeningHours {
  open_now?: boolean;
  weekday_text?: string[];
}

/**
 * Resposta da Google Places API - Geometry
 */
export interface PlaceGeometry {
  location: {
    lat: number;
    lng: number;
  };
  viewport?: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
}

/**
 * Foto de um lugar da Google Places API
 */
export interface PlacePhoto {
  height: number;
  width: number;
  photo_reference: string;
  html_attributions: string[];
}

/**
 * Resposta da Google Places API - Place básico (Nearby Search)
 */
export interface GooglePlace {
  place_id: string;
  name: string;
  vicinity?: string;
  formatted_address?: string;
  geometry: PlaceGeometry;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: OpeningHours;
  photos?: PlacePhoto[];
  types?: string[];
  business_status?: string;
}

/**
 * Detalhes completos de um lugar (Place Details API)
 */
export interface PlaceDetails extends GooglePlace {
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  url?: string;
  formatted_address: string;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
}

/**
 * Resposta da Google Places Nearby Search API
 */
export interface NearbySearchResponse {
  results: GooglePlace[];
  status: 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';
  error_message?: string;
  next_page_token?: string;
}

/**
 * Resposta da Google Place Details API
 */
export interface PlaceDetailsResponse {
  result: PlaceDetails;
  status: 'OK' | 'ZERO_RESULTS' | 'NOT_FOUND' | 'INVALID_REQUEST' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'UNKNOWN_ERROR';
  error_message?: string;
}

/**
 * Hospital processado para uso no app
 */
export interface Hospital {
  id: string; // place_id
  name: string;
  address: string;
  coordinates: Coordinates;
  rating?: number;
  totalRatings?: number;
  phone?: string;
  website?: string;
  isOpen?: boolean;
  photoReference?: string;
  distance?: number; // em metros
}

/**
 * Hospital favorito salvo no SQLite
 */
export interface FavoriteHospital {
  id: number; // ID local do SQLite
  placeId: string; // place_id do Google
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  rating?: number;
  photoReference?: string;
  addedAt: string; // ISO date string
  notes?: string; // Notas pessoais do usuário (max 280 chars)
}

/**
 * Parâmetros para busca de hospitais próximos
 */
export interface NearbySearchParams {
  location: Coordinates;
  radius: number; // em metros
  type?: string;
  keyword?: string;
}

/**
 * Estado de loading/erro para operações assíncronas
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Região do mapa (para react-native-maps)
 */
export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

/**
 * Filtros de busca de hospitais
 */
export interface HospitalFilters {
  openNow?: boolean;
  minRating?: number;
  maxDistance?: number; // em metros
}
