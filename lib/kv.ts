/**
 * Utilitário para operações com KV/Redis
 * Suporta Vercel KV (produção) e Redis local (desenvolvimento)
 */

import { kv } from '@vercel/kv';
import Redis from 'ioredis';

// Detectar ambiente
const isDevelopment = process.env.NODE_ENV === 'development';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Cliente Redis para desenvolvimento
let redisClient: Redis | null = null;

if (isDevelopment) {
  redisClient = new Redis(REDIS_URL);
}

/**
 * Gera hash SHA-256 de um token
 * Funciona tanto no servidor (Node.js) quanto no cliente (browser)
 */
export async function hashToken(token: string): Promise<string> {
  // No servidor (Node.js), usar módulo crypto
  if (typeof window === 'undefined') {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  }
  
  // No cliente (browser), usar Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Interface para dados armazenados no KV
 */
export interface TournamentData {
  tournament: any; // Tournament type
  adminTokenHash: string;
  updatedAt: string;
}

/**
 * Buscar torneio do KV/Redis
 */
export async function getTournament(id: string): Promise<TournamentData | null> {
  try {
    const key = `tournament:${id}`;
    let data: TournamentData | null = null;

    if (isDevelopment && redisClient) {
      const result = await redisClient.get(key);
      data = result ? JSON.parse(result) : null;
    } else {
      data = await kv.get<TournamentData>(key);
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar torneio:', error);
    return null;
  }
}

/**
 * Salvar torneio no KV/Redis com TTL
 */
export async function saveTournament(
  id: string,
  data: TournamentData,
  ttlSeconds: number = 7776000 // 90 dias padrão
): Promise<boolean> {
  try {
    const key = `tournament:${id}`;
    const value = JSON.stringify(data);

    if (isDevelopment && redisClient) {
      await redisClient.setex(key, ttlSeconds, value);
    } else {
      await kv.set(key, data, { ex: ttlSeconds });
    }

    return true;
  } catch (error) {
    console.error('Erro ao salvar torneio:', error);
    return false;
  }
}

/**
 * Remover torneio do KV/Redis
 */
export async function deleteTournament(id: string): Promise<boolean> {
  try {
    const key = `tournament:${id}`;

    if (isDevelopment && redisClient) {
      await redisClient.del(key);
    } else {
      await kv.del(key);
    }

    return true;
  } catch (error) {
    console.error('Erro ao deletar torneio:', error);
    return false;
  }
}

/**
 * Verificar se torneio existe
 */
export async function existsTournament(id: string): Promise<boolean> {
  try {
    const key = `tournament:${id}`;

    if (isDevelopment && redisClient) {
      const exists = await redisClient.exists(key);
      return exists === 1;
    } else {
      const result = await kv.exists(key);
      return result === 1;
    }
  } catch (error) {
    console.error('Erro ao verificar existência do torneio:', error);
    return false;
  }
}

/**
 * Validar formato UUID
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
