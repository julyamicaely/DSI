/**
 * @file services/sqlite.service.ts
 * @description Serviço para gerenciamento de favoritos no SQLite
 * Responsável por CRUD de hospitais favoritos
 */

import * as SQLite from 'expo-sqlite';
import { FavoriteHospital } from '../types/hospital.types';
import { DB_NAME, FAVORITES_TABLE, ERROR_MESSAGES } from '../config/constants';

/**
 * Serviço de banco de dados SQLite para favoritos
 */
class SQLiteService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  /**
   * Inicializa o banco de dados e cria as tabelas necessárias
   * @throws Error se falhar ao criar o banco ou as tabelas
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        console.log('[SQLiteService] Banco já inicializado');
        return;
      }

      console.log('[SQLiteService] Inicializando banco de dados...');

      // Abre/cria o banco de dados
      this.db = await SQLite.openDatabaseAsync(DB_NAME);

      // Cria a tabela de favoritos se não existir
      await this.createTables();

      this.isInitialized = true;
      console.log('[SQLiteService] Banco inicializado com sucesso');
    } catch (error) {
      console.error('[SQLiteService] Erro ao inicializar:', error);
      throw new Error(ERROR_MESSAGES.DB_ERROR);
    }
  }

  /**
   * Cria as tabelas necessárias no banco
   */
  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Banco de dados não inicializado');
    }

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${FAVORITES_TABLE} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        placeId TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        phone TEXT,
        rating REAL,
        photoReference TEXT,
        addedAt TEXT NOT NULL,
        notes TEXT
      );
    `;

    await this.db.execAsync(createTableQuery);
    console.log('[SQLiteService] Tabela de favoritos criada/verificada');
  }

  /**
   * Adiciona um hospital aos favoritos
   * @param hospital - Dados do hospital a ser favoritado
   * @returns O hospital favorito criado com o ID do banco
   * @throws Error se o hospital já estiver favoritado ou houver erro no banco
   */
  async addFavorite(hospital: Omit<FavoriteHospital, 'id' | 'addedAt'>): Promise<FavoriteHospital> {
    try {
      await this.ensureInitialized();

      const addedAt = new Date().toISOString();

      const insertQuery = `
        INSERT INTO ${FAVORITES_TABLE} (
          placeId, name, address, latitude, longitude,
          phone, rating, photoReference, addedAt, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;

      const result = await this.db!.runAsync(
        insertQuery,
        hospital.placeId,
        hospital.name,
        hospital.address,
        hospital.latitude,
        hospital.longitude,
        hospital.phone || null,
        hospital.rating || null,
        hospital.photoReference || null,
        addedAt,
        hospital.notes || null
      );

      console.log('[SQLiteService] Favorito adicionado:', hospital.name);

      return {
        id: result.lastInsertRowId,
        ...hospital,
        addedAt,
      };
    } catch (error: any) {
      // Se o erro for de UNIQUE constraint, o hospital já está favoritado
      if (error?.message?.includes('UNIQUE constraint failed')) {
        throw new Error('Este hospital já está nos favoritos');
      }

      console.error('[SQLiteService] Erro ao adicionar favorito:', error);
      throw new Error(ERROR_MESSAGES.DB_ERROR);
    }
  }

  /**
   * Remove um hospital dos favoritos
   * @param placeId - ID do lugar no Google Places
   * @throws Error se houver erro no banco
   */
  async removeFavorite(placeId: string): Promise<void> {
    try {
      await this.ensureInitialized();

      const deleteQuery = `DELETE FROM ${FAVORITES_TABLE} WHERE placeId = ?;`;
      const result = await this.db!.runAsync(deleteQuery, placeId);

      if (result.changes > 0) {
        console.log('[SQLiteService] Favorito removido:', placeId);
      } else {
        console.warn('[SQLiteService] Favorito não encontrado:', placeId);
      }
    } catch (error) {
      console.error('[SQLiteService] Erro ao remover favorito:', error);
      throw new Error(ERROR_MESSAGES.DB_ERROR);
    }
  }

  /**
   * Obtém todos os favoritos salvos
   * @returns Lista de hospitais favoritos
   * @throws Error se houver erro no banco
   */
  async getFavorites(): Promise<FavoriteHospital[]> {
    try {
      await this.ensureInitialized();

      const selectQuery = `
        SELECT * FROM ${FAVORITES_TABLE}
        ORDER BY addedAt DESC;
      `;

      const result = await this.db!.getAllAsync<FavoriteHospital>(selectQuery);

      console.log('[SQLiteService] Favoritos carregados:', result.length);
      return result;
    } catch (error) {
      console.error('[SQLiteService] Erro ao buscar favoritos:', error);
      throw new Error(ERROR_MESSAGES.DB_ERROR);
    }
  }

  /**
   * Verifica se um hospital está favoritado
   * @param placeId - ID do lugar no Google Places
   * @returns true se estiver nos favoritos, false caso contrário
   */
  async isFavorite(placeId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();

      const selectQuery = `
        SELECT COUNT(*) as count FROM ${FAVORITES_TABLE}
        WHERE placeId = ?;
      `;

      const result = await this.db!.getFirstAsync<{ count: number }>(selectQuery, placeId);

      return (result?.count ?? 0) > 0;
    } catch (error) {
      console.error('[SQLiteService] Erro ao verificar favorito:', error);
      return false;
    }
  }

  /**
   * Obtém um favorito específico pelo placeId
   * @param placeId - ID do lugar no Google Places
   * @returns O hospital favorito ou null se não encontrado
   */
  async getFavoriteByPlaceId(placeId: string): Promise<FavoriteHospital | null> {
    try {
      await this.ensureInitialized();

      const selectQuery = `
        SELECT * FROM ${FAVORITES_TABLE}
        WHERE placeId = ?;
      `;

      const result = await this.db!.getFirstAsync<FavoriteHospital>(selectQuery, placeId);

      return result || null;
    } catch (error) {
      console.error('[SQLiteService] Erro ao buscar favorito:', error);
      return null;
    }
  }

  /**
   * Atualiza as notas de um favorito
   * @param placeId - ID do lugar no Google Places
   * @param notes - Novas notas
   * @throws Error se houver erro no banco
   */
  async updateNotes(placeId: string, notes: string): Promise<void> {
    try {
      await this.ensureInitialized();

      const updateQuery = `
        UPDATE ${FAVORITES_TABLE}
        SET notes = ?
        WHERE placeId = ?;
      `;

      const result = await this.db!.runAsync(updateQuery, notes, placeId);

      if (result.changes > 0) {
        console.log('[SQLiteService] Notas atualizadas:', placeId);
      } else {
        throw new Error('Favorito não encontrado');
      }
    } catch (error) {
      console.error('[SQLiteService] Erro ao atualizar notas:', error);
      throw new Error(ERROR_MESSAGES.DB_ERROR);
    }
  }

  /**
   * Limpa todos os favoritos (útil para testes ou reset)
   * @throws Error se houver erro no banco
   */
  async clearAllFavorites(): Promise<void> {
    try {
      await this.ensureInitialized();

      const deleteQuery = `DELETE FROM ${FAVORITES_TABLE};`;
      await this.db!.runAsync(deleteQuery);

      console.log('[SQLiteService] Todos os favoritos foram removidos');
    } catch (error) {
      console.error('[SQLiteService] Erro ao limpar favoritos:', error);
      throw new Error(ERROR_MESSAGES.DB_ERROR);
    }
  }

  /**
   * Fecha a conexão com o banco de dados
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
      console.log('[SQLiteService] Conexão com banco fechada');
    }
  }

  /**
   * Garante que o banco está inicializado antes de operações
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized || !this.db) {
      await this.initialize();
    }
  }
}

// Exporta instância única (singleton)
export default new SQLiteService();
