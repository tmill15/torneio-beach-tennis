/**
 * useLocalStorage Hook
 * Persiste estado no LocalStorage com TypeScript
 */

'use client';

import { useState, useEffect, Dispatch, SetStateAction } from 'react';

/**
 * Hook para persistir estado no LocalStorage
 * Similar ao useState mas com sincronização automática
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  // Estado para armazenar o valor
  // Passa função inicial ao useState para que a lógica seja executada apenas uma vez
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      // Busca do localStorage pela chave
      const item = window.localStorage.getItem(key);
      // Parse do JSON armazenado ou retorna initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Erro ao ler localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Retorna uma versão encapsulada da função setter do useState
  // que persiste o novo valor no localStorage
  const setValue: Dispatch<SetStateAction<T>> = (value) => {
    try {
      // Permite que value seja uma função como no useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Salva no estado
      setStoredValue(valueToStore);
      
      // Salva no localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Erro ao salvar localStorage key "${key}":`, error);
    }
  };

  // Sincroniza com outras abas/janelas
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Erro ao sincronizar localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}

/**
 * Hook para remover item do localStorage
 */
export function useRemoveFromLocalStorage() {
  return (key: string) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        console.error(`Erro ao remover localStorage key "${key}":`, error);
      }
    }
  };
}

/**
 * Hook para limpar todo o localStorage
 */
export function useClearLocalStorage() {
  return () => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.clear();
      } catch (error) {
        console.error('Erro ao limpar localStorage:', error);
      }
    }
  };
}
