/**
 * Utilitário para operações com KV/Redis
 * Suporta Upstash Redis (produção via Vercel Marketplace) e Redis local (desenvolvimento)
 * 
 * Usa biblioteca 'redis' oficial (recomendada pela Vercel/Upstash)
 * Funciona tanto em desenvolvimento (Redis local) quanto em produção (Upstash)
 */

import { createClient } from 'redis';

// Detectar ambiente
const isDevelopment = process.env.NODE_ENV === 'development';

// URLs de conexão
// Produção: Upstash Redis via variáveis de ambiente da Vercel
// Desenvolvimento: Redis local
// A Vercel/Upstash fornece REDIS_URL quando conectado via Marketplace
const REDIS_URL_ENV = process.env.REDIS_URL; // Fornecido pela Vercel quando Upstash está conectado
const UPSTASH_REDIS_URL = process.env.UPSTASH_REDIS_URL;
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const REDIS_URL_LOCAL = 'redis://localhost:6379';

// Cliente Redis (usando biblioteca oficial)
let redisClient: ReturnType<typeof createClient> | null = null;

// Inicializar cliente Redis
if (isDevelopment) {
  // Desenvolvimento: Redis local
  console.log('🔧 Modo desenvolvimento: usando Redis local');
  try {
    redisClient = createClient({ url: REDIS_URL_LOCAL });
    
    redisClient.on('error', (err) => {
      console.error('❌ Erro na conexão Redis local:', err.message);
    });
    
    redisClient.on('connect', () => {
      console.log('✅ Conectado ao Redis local com sucesso');
    });
    
    // Conectar (lazy - só conecta quando necessário)
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      redisClient.connect().catch((err) => {
        console.warn('⚠️ Erro ao conectar ao Redis local (será reconectado quando necessário):', err.message);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao criar cliente Redis local:', error);
  }
} else if (REDIS_URL_ENV) {
  // Produção: Upstash Redis via REDIS_URL (fornecido pela Vercel quando conectado)
  // Usar biblioteca 'redis' oficial (recomendada pela Vercel/Upstash)
  console.log('✅ Upstash Redis: usando REDIS_URL (Vercel Marketplace)');
  
  // Usar a URL exatamente como fornecida pela Vercel
  // A biblioteca 'redis' oficial lida automaticamente com TLS se necessário
  const redisUrl = REDIS_URL_ENV;
  
  // Log da URL (mascarando senha) para debug
  const maskedUrl = redisUrl.replace(/:[^:@]+@/, ':***@');
  console.log('🔗 URL Redis:', maskedUrl);
  console.log('🔒 Protocolo:', redisUrl.startsWith('rediss://') ? 'TLS (rediss://)' : 'Não-TLS (redis://)');
  
  // Usar biblioteca 'redis' oficial (recomendada pela Vercel)
  try {
    redisClient = createClient({ url: redisUrl });
    
    // Tratar erros de conexão
    redisClient.on('error', (err) => {
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        return; // Silenciar durante build
      }
      console.error('❌ Erro na conexão Redis:', err.message);
    });
    
    redisClient.on('connect', () => {
      console.log('✅ Conectado ao Redis com sucesso');
    });
    
    redisClient.on('ready', () => {
      console.log('✅ Redis está pronto para uso');
    });
    
    // Conectar (lazy - só conecta quando necessário)
    // Não conectamos durante build
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      redisClient.connect().catch((err) => {
        // Ignorar erros de conexão inicial (será reconectado quando necessário)
        if (process.env.NEXT_PHASE !== 'phase-production-build') {
          console.warn('⚠️ Erro ao conectar inicialmente (será reconectado quando necessário):', err.message);
        }
      });
    }
  } catch (error) {
    console.error('❌ Erro ao criar cliente Redis:', error);
  }
} else if (UPSTASH_REDIS_URL) {
  // Produção: Upstash Redis com URL tradicional (alternativa)
  console.log('✅ Upstash Redis: usando UPSTASH_REDIS_URL');
  try {
    // Usar URL exatamente como fornecida
    const url = UPSTASH_REDIS_URL;
    const maskedUrl = url.replace(/:[^:@]+@/, ':***@');
    console.log('🔗 URL Redis:', maskedUrl);
    redisClient = createClient({ url });
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      redisClient.connect().catch(() => {});
    }
  } catch (error) {
    console.error('❌ Erro ao criar cliente Redis:', error);
  }
} else if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
  // Produção: Upstash Redis via REST API
  console.warn('⚠️ Upstash REST API detectado');
  console.warn('⚠️ Para REST API, considere usar @upstash/redis');
  // Não podemos usar REST API com biblioteca redis padrão
} else {
  console.error('❌ Redis não configurado!');
  console.error('Variáveis disponíveis:', {
    NODE_ENV: process.env.NODE_ENV,
    hasREDIS_URL: !!REDIS_URL_ENV,
    hasUPSTASH_REDIS_URL: !!UPSTASH_REDIS_URL,
    hasUPSTASH_REDIS_REST_URL: !!UPSTASH_REDIS_REST_URL,
    hasUPSTASH_REDIS_REST_TOKEN: !!UPSTASH_REDIS_REST_TOKEN,
    hasKV_REST_API_URL: !!process.env.KV_REST_API_URL,
    hasKV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
  });
  console.error('📋 INSTRUÇÕES:');
  console.error('1. Vercel Dashboard → Seu Projeto → Settings → Environment Variables');
  console.error('2. Verifique se o Upstash está conectado: Storage → Integrations');
  console.error('3. Se conectado, as variáveis devem aparecer automaticamente');
  console.error('4. Se não aparecerem, reconecte o Upstash ao projeto');
  console.error('5. Após conectar, faça um novo deploy');
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
  const hashBuffer = await crypto.subtle.digest('SHA-256', data.buffer as ArrayBuffer);
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
    const key = `tournament:${id}`;
    let result: string | null = null;

    if (redisClient) {
      // Garantir que está conectado
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
      result = await redisClient.get(key);
    } else {
      console.error('❌ Redis client não inicializado');
      return null;
    }

    return result ? JSON.parse(result) : null;
  } catch (error) {
    console.error('❌ Erro ao buscar torneio:', error);
    if (error instanceof Error) {
      console.error('Mensagem:', error.message);
    }
    return null;
  }
}

/**
 * Salvar torneio no Redis com TTL
 */
export async function saveTournament(
  id: string,
  data: TournamentData,
  ttlSeconds: number = 864000 // 10 dias padrão
): Promise<boolean> {
  try {
    const key = `tournament:${id}`;
    const value = JSON.stringify(data);
    console.log(`💾 Salvando torneio ${id} no Redis...`);

    if (redisClient) {
      // Garantir que está conectado
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
      await redisClient.setEx(key, ttlSeconds, value);
    } else {
      console.error('❌ Redis client não inicializado');
      console.error('Verifique se Upstash Redis está configurado no Vercel Marketplace');
      return false;
    }

    console.log(`✅ Torneio ${id} salvo com sucesso`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar torneio:', error);
    if (error instanceof Error) {
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
    }
    return false;
  }
}

/**
 * Remover torneio do Redis
 */
export async function deleteTournament(id: string): Promise<boolean> {
  try {
    const key = `tournament:${id}`;

    if (redisClient) {
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
      await redisClient.del(key);
    } else {
      console.error('Redis client não inicializado');
      return false;
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
    let exists = false;

    if (redisClient) {
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
      const result = await redisClient.exists(key);
      exists = result === 1;
    } else {
      console.error('Redis client não inicializado');
      return false;
    }

    return exists;
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
