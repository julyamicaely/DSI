/**
 * @file store/favoritesStore.ts
 * @description Estado global de favoritos usando Zustand
 * Gerencia lista de favoritos, sincronização com SQLite e operações CRUD
 */

import { create } from 'zustand';
import { FavoriteHospital } from '../types/hospital.types';
import sqliteService from '../services/sqlite.service';

/**
 * Estado do store de favoritos
 */
interface FavoritesState {
  // Estado
  favorites: FavoriteHospital[];
  loading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  loadFavorites: () => Promise<void>;
  addFavorite: (hospital: Omit<FavoriteHospital, 'id' | 'addedAt'>) => Promise<void>;
  removeFavorite: (placeId: string) => Promise<void>;
  updateNotes: (placeId: string, notes: string) => Promise<void>;
  isFavorite: (placeId: string) => boolean;
  getFavoriteByPlaceId: (placeId: string) => FavoriteHospital | undefined;
  clearError: () => void;
  reset: () => void;
}

/**
 * Store de favoritos
 */
export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  // Estado inicial
  favorites: [],
  loading: false,
  error: null,
  isInitialized: false,

  /**
   * Inicializa o store e carrega favoritos do banco
   */
  initialize: async () => {
    const { isInitialized, loadFavorites } = get();

    // Evita inicialização múltipla
    if (isInitialized) {
      console.log('[FavoritesStore] Já inicializado');
      return;
    }

    try {
      console.log('[FavoritesStore] Inicializando...');
      set({ loading: true, error: null });

      // Inicializa o SQLite
      await sqliteService.initialize();

      // Carrega favoritos
      await loadFavorites();

      set({ isInitialized: true, loading: false });
      console.log('[FavoritesStore] Inicializado com sucesso');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao inicializar favoritos';
      console.error('[FavoritesStore] Erro na inicialização:', error);
      set({ error: errorMessage, loading: false, isInitialized: false });
    }
  },

  /**
   * Carrega todos os favoritos do banco
   */
  loadFavorites: async () => {
    try {
      console.log('[FavoritesStore] Carregando favoritos...');
      set({ loading: true, error: null });

      const favorites = await sqliteService.getFavorites();

      set({ favorites, loading: false });
      console.log('[FavoritesStore] Favoritos carregados:', favorites.length);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar favoritos';
      console.error('[FavoritesStore] Erro ao carregar:', error);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  /**
   * Adiciona um hospital aos favoritos
   */
  addFavorite: async (hospital: Omit<FavoriteHospital, 'id' | 'addedAt'>) => {
    try {
      console.log('[FavoritesStore] Adicionando favorito:', hospital.name);
      set({ loading: true, error: null });

      // Adiciona no banco
      const newFavorite = await sqliteService.addFavorite(hospital);

      // Atualiza estado local
      set((state) => ({
        favorites: [newFavorite, ...state.favorites],
        loading: false,
      }));

      console.log('[FavoritesStore] Favorito adicionado com sucesso');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao adicionar favorito';
      console.error('[FavoritesStore] Erro ao adicionar:', error);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  /**
   * Remove um hospital dos favoritos
   */
  removeFavorite: async (placeId: string) => {
    try {
      console.log('[FavoritesStore] Removendo favorito:', placeId);
      set({ loading: true, error: null });

      // Remove do banco
      await sqliteService.removeFavorite(placeId);

      // Atualiza estado local
      set((state) => ({
        favorites: state.favorites.filter((fav) => fav.placeId !== placeId),
        loading: false,
      }));

      console.log('[FavoritesStore] Favorito removido com sucesso');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao remover favorito';
      console.error('[FavoritesStore] Erro ao remover:', error);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  /**
   * Atualiza as notas de um favorito
   */
  updateNotes: async (placeId: string, notes: string) => {
    try {
      console.log('[FavoritesStore] Atualizando notas:', placeId);
      set({ loading: true, error: null });

      // Atualiza no banco
      await sqliteService.updateNotes(placeId, notes);

      // Atualiza estado local
      set((state) => ({
        favorites: state.favorites.map((fav) =>
          fav.placeId === placeId ? { ...fav, notes } : fav
        ),
        loading: false,
      }));

      console.log('[FavoritesStore] Notas atualizadas com sucesso');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar notas';
      console.error('[FavoritesStore] Erro ao atualizar notas:', error);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  /**
   * Verifica se um hospital está nos favoritos
   */
  isFavorite: (placeId: string) => {
    const { favorites } = get();
    return favorites.some((fav) => fav.placeId === placeId);
  },

  /**
   * Obtém um favorito pelo placeId
   */
  getFavoriteByPlaceId: (placeId: string) => {
    const { favorites } = get();
    return favorites.find((fav) => fav.placeId === placeId);
  },

  /**
   * Limpa o erro atual
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reseta o store (útil para logout ou testes)
   */
  reset: () => {
    set({
      favorites: [],
      loading: false,
      error: null,
      isInitialized: false,
    });
  },
}));

/**
 * Hook para acessar apenas favoritos (otimização de re-renders)
 */
export const useFavorites = () => useFavoritesStore((state) => state.favorites);

/**
 * Hook para acessar apenas o loading state
 */
export const useFavoritesLoading = () => useFavoritesStore((state) => state.loading);

/**
 * Hook para acessar apenas o erro
 */
export const useFavoritesError = () => useFavoritesStore((state) => state.error);

/**
 * Hook para verificar se um hospital é favorito (otimizado)
 */
export const useIsFavorite = (placeId: string) =>
  useFavoritesStore((state) => state.isFavorite(placeId));

/**
 * Hook para ações de favoritos
 */
export const useFavoritesActions = () =>
  useFavoritesStore((state) => ({
    initialize: state.initialize,
    loadFavorites: state.loadFavorites,
    addFavorite: state.addFavorite,
    removeFavorite: state.removeFavorite,
    updateNotes: state.updateNotes,
    clearError: state.clearError,
  }));
