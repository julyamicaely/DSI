/**
 * @file config/constants.ts
 * @description Constantes e configurações do app
 */

import Constants from 'expo-constants';

/**
 * Chave da API do Google Places
 * @important Configurar em .env ou app.json extra
 */
export const GOOGLE_PLACES_API_KEY = 
  Constants.expoConfig?.extra?.googlePlacesApiKey || 
  'AIzaSyBkUwj1VK2KuVge6Qtaq4bq3uWZ1k_HHSo';

/**
 * URLs base das APIs
 */
export const API_URLS = {
  PLACES_NEARBY: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
  PLACES_DETAILS: 'https://maps.googleapis.com/maps/api/place/details/json',
  PLACES_PHOTO: 'https://maps.googleapis.com/maps/api/place/photo',
} as const;

/**
 * Configurações do mapa
 */
export const MAP_CONFIG = {
  DEFAULT_RADIUS: 2000, // 2km
  MAX_RADIUS: 5000, // 5km
  DEFAULT_LATITUDE_DELTA: 0.0922,
  DEFAULT_LONGITUDE_DELTA: 0.0421,
  ANIMATION_DURATION: 300,
} as const;

/**
 * Configurações de localização
 */
export const LOCATION_CONFIG = {
  ACCURACY: 'balanced' as const,
  TIME_INTERVAL: 10000, // 10 segundos
  DISTANCE_INTERVAL: 100, // 100 metros
} as const;

/**
 * Tipos de estabelecimentos para busca
 */
export const PLACE_TYPES = {
  HOSPITAL: 'hospital',
  DOCTOR: 'doctor',
  PHARMACY: 'pharmacy',
  HEALTH: 'health',
} as const;

/**
 * Mensagens de erro padrão
 */
export const ERROR_MESSAGES = {
  NO_PERMISSION: 'Permissão de localização negada. Por favor, habilite nas configurações.',
  NO_LOCATION: 'Não foi possível obter sua localização. Verifique se o GPS está ativado.',
  NO_RESULTS: 'Nenhum hospital encontrado nas proximidades.',
  API_ERROR: 'Erro ao buscar hospitais. Tente novamente.',
  NETWORK_ERROR: 'Sem conexão com a internet. Verifique sua conexão.',
  OVER_QUERY_LIMIT: 'Limite de requisições excedido. Tente novamente mais tarde.',
  INVALID_REQUEST: 'Erro na requisição. Tente novamente.',
  DB_ERROR: 'Erro ao acessar favoritos. Tente novamente.',
} as const;

/**
 * Cores do tema (seguindo a identidade visual do app)
 */
export const COLORS = {
  primary: '#A42020',
  secondary: '#5B79FF',
  lightRed: '#FFE5E5',
  lightBlue: '#E8ECFF',
  lightestBlue: '#F0F2FF',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#666666',
  lightGray: '#CCCCCC',
  success: '#27AE60',
  error: '#E74C3C',
  warning: '#F39C12',
} as const;

/**
 * Nome do banco de dados SQLite
 */
export const DB_NAME = 'lifebeat.db';

/**
 * Nome da tabela de favoritos
 */
export const FAVORITES_TABLE = 'favorites';
