/**
 * useLocalStorage Hook
 * Persiste estado no LocalStorage com TypeScript
 */

'use client';

import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';

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

  // Atualizar valor quando a chave mudar (importante para chaves dinâmicas)
  // Usar ref para rastrear a chave anterior e evitar loops infinitos
  const prevKeyRef = useRef<string>(key);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Só atualizar se a chave realmente mudou
    if (prevKeyRef.current === key) return;
    prevKeyRef.current = key;

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        setStoredValue(parsed);
      }
      // Se não houver item, não fazer nada (manter valor atual)
      // Isso evita loops quando a chave muda mas não há valor salvo
    } catch (error) {
      console.error(`Erro ao ler localStorage key "${key}":`, error);
      // Não atualizar em caso de erro para evitar loops
    }
  }, [key]); // Apenas key como dependência

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
        
        // Dispara evento customizado para notificar outros componentes na mesma aba
        const event = new CustomEvent('localStorageChange', {
          detail: { key, newValue: valueToStore }
        });
        window.dispatchEvent(event);
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

  // Adicionar listener customizado para mudanças na mesma aba
  // (StorageEvent só funciona entre abas diferentes)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === key && e.detail.newValue !== undefined) {
        try {
          setStoredValue(e.detail.newValue);
        } catch (error) {
          console.error(`Erro ao sincronizar localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener('localStorageChange' as any, handleCustomStorageChange as any);
    return () => window.removeEventListener('localStorageChange' as any, handleCustomStorageChange as any);
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
