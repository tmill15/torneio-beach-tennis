/**
 * Utilitário para operações com KV/Redis
 * Suporta Upstash Redis (produção via Vercel Marketplace) e Redis local (desenvolvimento)
 */

import Redis from 'ioredis';

// Detectar ambiente
const isDevelopment = process.env.NODE_ENV === 'development';

// URLs de conexão
// Produção: Upstash Redis via variáveis de ambiente da Vercel
// Desenvolvimento: Redis local
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
// Upstash também pode fornecer uma URL Redis tradicional
const UPSTASH_REDIS_URL = process.env.UPSTASH_REDIS_URL;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Cliente Redis (funciona tanto para Upstash quanto para Redis local)
let redisClient: Redis | null = null;

// Inicializar cliente Redis
if (isDevelopment) {
  // Desenvolvimento: Redis local
  redisClient = new Redis(REDIS_URL);
} else if (UPSTASH_REDIS_URL) {
  // Produção: Upstash Redis com URL tradicional (preferencial)
  // Formato: redis://default:TOKEN@HOST:PORT
  redisClient = new Redis(UPSTASH_REDIS_URL, {
    tls: {
      rejectUnauthorized: false, // Upstash requer TLS
    },
  });
} else if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
  // Produção: Upstash Redis via REST API (fallback)
  // Constrói URL Redis a partir da REST URL
  // REST URL: https://HOST.upstash.io
  // Redis URL: redis://default:TOKEN@HOST:PORT
  const restUrl = new URL(UPSTASH_REDIS_REST_URL);
  const host = restUrl.hostname.replace('.upstash.io', '');
  // Upstash Redis geralmente usa porta 6379 ou 6380
  const redisUrl = `redis://default:${UPSTASH_REDIS_REST_TOKEN}@${host}.upstash.io:6379`;
  redisClient = new Redis(redisUrl, {
    tls: {
      rejectUnauthorized: false,
    },
  });
} else {
  console.warn('⚠️ Redis não configurado. Configure Upstash Redis via Vercel Marketplace.');
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
 * Buscar torneio do Redis
 */
export async function getTournament(id: string): Promise<TournamentData | null> {
  try {
    if (!redisClient) {
      console.error('Redis client não inicializado');
      return null;
    }

    const key = `tournament:${id}`;
    const result = await redisClient.get(key);
    return result ? JSON.parse(result) : null;
  } catch (error) {
    console.error('Erro ao buscar torneio:', error);
    return null;
  }
}

/**
 * Salvar torneio no Redis com TTL
 */
export async function saveTournament(
  id: string,
  data: TournamentData,
  ttlSeconds: number = 7776000 // 90 dias padrão
): Promise<boolean> {
  try {
    if (!redisClient) {
      console.error('Redis client não inicializado');
      return false;
    }

    const key = `tournament:${id}`;
    const value = JSON.stringify(data);
    await redisClient.setex(key, ttlSeconds, value);
    return true;
  } catch (error) {
    console.error('Erro ao salvar torneio:', error);
    return false;
  }
}

/**
 * Remover torneio do Redis
 */
export async function deleteTournament(id: string): Promise<boolean> {
  try {
    if (!redisClient) {
      console.error('Redis client não inicializado');
      return false;
    }

    const key = `tournament:${id}`;
    await redisClient.del(key);
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
    if (!redisClient) {
      console.error('Redis client não inicializado');
      return false;
    }

    const key = `tournament:${id}`;
    const exists = await redisClient.exists(key);
    return exists === 1;
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
