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
// A Vercel/Upstash fornece REDIS_URL quando conectado via Marketplace
const REDIS_URL_ENV = process.env.REDIS_URL; // Fornecido pela Vercel quando Upstash está conectado
const UPSTASH_REDIS_URL = process.env.UPSTASH_REDIS_URL;
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const REDIS_URL_LOCAL = 'redis://localhost:6379';

// Cliente Redis (funciona tanto para Upstash quanto para Redis local)
let redisClient: Redis | null = null;

// Inicializar cliente Redis
// Nota: Durante build, o Next.js pode tentar inicializar, mas não conectamos até runtime
if (isDevelopment) {
  // Desenvolvimento: Redis local
  console.log('🔧 Modo desenvolvimento: usando Redis local');
  redisClient = new Redis(REDIS_URL_LOCAL);
} else if (REDIS_URL_ENV) {
  // Produção: Upstash Redis via REDIS_URL (fornecido pela Vercel quando conectado)
  // IMPORTANTE: Upstash SEMPRE requer TLS (rediss://)
  // A Vercel geralmente fornece rediss://, mas garantimos TLS de qualquer forma
  console.log('✅ Upstash Redis: usando REDIS_URL (Vercel Marketplace)');
  
  // Garantir que a URL usa rediss:// (TLS) - Upstash SEMPRE requer TLS
  // A Vercel geralmente fornece rediss://, mas garantimos conversão se necessário
  let redisUrl = REDIS_URL_ENV;
  if (redisUrl.startsWith('redis://') && !redisUrl.startsWith('rediss://')) {
    // Converter redis:// para rediss:// para forçar TLS
    redisUrl = redisUrl.replace('redis://', 'rediss://');
    console.log('🔒 Convertendo redis:// para rediss:// (TLS obrigatório no Upstash)');
  }
  
  // Verificar se está usando TLS
  if (!redisUrl.startsWith('rediss://')) {
    console.error('❌ ERRO: URL Redis não usa TLS (rediss://). Upstash sempre requer TLS!');
    console.error('URL recebida:', redisUrl.replace(/:[^:@]+@/, ':***@')); // Mascarar senha
  } else {
    console.log('🔒 TLS confirmado: URL usa rediss:// (Redis Secure)');
  }
  
  // Configuração do Redis com TLS OBRIGATÓRIO (Upstash sempre requer)
  const redisOptions: any = {
    // TLS é OBRIGATÓRIO no Upstash - sempre habilitar
    tls: {
      rejectUnauthorized: false, // Upstash usa certificados válidos
    },
    // Configurações para evitar erros durante build
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
    lazyConnect: true, // Conectar apenas quando necessário (não durante build)
    connectTimeout: 10000,
    retryStrategy: () => null, // Não tentar reconectar automaticamente
  };
  
  redisClient = new Redis(redisUrl, redisOptions);
  
  // Tratar erros de conexão silenciosamente durante build
  redisClient.on('error', (err) => {
    // Durante build, ignorar erros completamente (não quebrar o build)
    // O erro será tratado quando realmente tentar usar o Redis em runtime
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return; // Silenciar durante build
    }
    console.error('❌ Erro na conexão Redis:', err.message);
  });
  
  // Com lazyConnect: true, a conexão só acontece quando realmente usamos o Redis
  // Não precisamos chamar connect() manualmente
} else if (UPSTASH_REDIS_URL) {
  // Produção: Upstash Redis com URL tradicional (alternativa)
  // Formato: redis://default:TOKEN@HOST:PORT
  console.log('✅ Upstash Redis: usando UPSTASH_REDIS_URL');
  redisClient = new Redis(UPSTASH_REDIS_URL, {
    tls: {
      rejectUnauthorized: false, // Upstash requer TLS
    },
  });
} else if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
  // Produção: Upstash Redis via REST API
  // IMPORTANTE: Upstash REST API não funciona diretamente com ioredis
  // A Vercel Marketplace deve fornecer UPSTASH_REDIS_URL (não REST_URL)
  // Se só temos REST_URL, precisamos usar a biblioteca @upstash/redis
  console.warn('⚠️ Upstash REST API detectado, mas ioredis não suporta REST API diretamente');
  console.warn('⚠️ Verifique se a Vercel injetou UPSTASH_REDIS_URL (não REST_URL)');
  console.warn('⚠️ Se não tiver UPSTASH_REDIS_URL, instale @upstash/redis e atualize o código');
  
  // Tentar construir URL Redis (pode não funcionar)
  try {
    const restUrl = new URL(UPSTASH_REDIS_REST_URL);
    const host = restUrl.hostname.replace('.upstash.io', '');
    // Upstash pode usar porta 6379 ou 6380, tentar 6379 primeiro
    const redisUrl = `rediss://default:${UPSTASH_REDIS_REST_TOKEN}@${host}.upstash.io:6379`;
    console.log('🔄 Tentando conectar com URL construída:', redisUrl.replace(UPSTASH_REDIS_REST_TOKEN, '***'));
    redisClient = new Redis(redisUrl, {
      tls: {
        rejectUnauthorized: false,
      },
      connectTimeout: 5000,
      retryStrategy: (times) => {
        if (times > 3) {
          console.error('❌ Falha ao conectar após 3 tentativas');
          return null; // Para de tentar
        }
        return Math.min(times * 200, 2000);
      },
    });
    
    // Testar conexão
    redisClient.on('error', (err) => {
      console.error('❌ Erro na conexão Redis:', err);
    });
    
    redisClient.on('connect', () => {
      console.log('✅ Conectado ao Redis com sucesso');
    });
  } catch (error) {
    console.error('❌ Erro ao construir URL Redis:', error);
  }
} else {
  console.error('❌ Redis não configurado!');
  console.error('Variáveis disponíveis:', {
    NODE_ENV: process.env.NODE_ENV,
    hasREDIS_URL: !!REDIS_URL_ENV, // Esta é a principal quando conectado via Vercel
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
      console.error('❌ Redis client não inicializado');
      console.error('Verifique se Upstash Redis está configurado no Vercel Marketplace');
      return false;
    }

    const key = `tournament:${id}`;
    const value = JSON.stringify(data);
    console.log(`💾 Salvando torneio ${id} no Redis...`);
    await redisClient.setex(key, ttlSeconds, value);
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
