/**
 * SyncStatus Component
 * Indicador visual de status de sincronização
 */

'use client';

interface SyncStatusProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  onRetry?: () => void;
}

export function SyncStatus({ status, onRetry }: SyncStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ),
          text: 'Sincronizando...',
          color: 'text-blue-600 dark:text-blue-400',
        };
      case 'saved':
        return {
          icon: (
            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ),
          text: 'Sincronizado',
          color: 'text-green-600 dark:text-green-400',
        };
      case 'error':
        return {
          icon: (
            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
          text: 'Erro ao sincronizar',
          color: 'text-red-600 dark:text-red-400',
        };
      default:
        return {
          icon: null,
          text: '',
          color: '',
        };
    }
  };

  const config = getStatusConfig();

  if (status === 'idle' || !config.text) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${config.color}`}>
      {config.icon}
      <span className="hidden sm:inline">{config.text}</span>
      {status === 'error' && onRetry && (
        <button
          onClick={onRetry}
          className="ml-2 px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded transition-colors"
          title="Tentar sincronizar novamente"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
