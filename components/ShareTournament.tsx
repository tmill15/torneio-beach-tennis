/**
 * ShareTournament Component
 * Modal para compartilhar torneio com link e QR Code
 */

'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generateTournamentShare, SHARING_ENABLED_KEY } from '@/hooks/useTournamentSync';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const TOURNAMENT_ID_KEY = 'beachtennis-tournament-id';
const ADMIN_TOKEN_KEY = 'beachtennis-admin-token';

interface ShareTournamentProps {
  onClose: () => void;
  onShareGenerated?: (tournamentId: string) => void;
  tournamentId?: string; // Para modo espectador, passar o ID diretamente
  isViewer?: boolean; // Indica se é modo espectador
}

export function ShareTournament({ onClose, onShareGenerated, tournamentId: externalTournamentId, isViewer = false }: ShareTournamentProps) {
  const [tournamentId, setTournamentId] = useLocalStorage<string | null>(TOURNAMENT_ID_KEY, null);
  const [adminToken, setAdminToken] = useLocalStorage<string | null>(ADMIN_TOKEN_KEY, null);
  const [sharingEnabled] = useLocalStorage<boolean>(SHARING_ENABLED_KEY, false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Modo espectador: usar tournamentId externo (da URL)
    if (isViewer && externalTournamentId) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      setShareLink(`${baseUrl}/torneio/${externalTournamentId}`);
      return;
    }

    // Modo admin: verificar se compartilhamento está ativo
    if (!isViewer && !sharingEnabled) {
      return;
    }

    // Modo admin: usar tournamentId do localStorage ou gerar novo
    const currentTournamentId = externalTournamentId || tournamentId;
    if (!currentTournamentId || !adminToken) {
      const { tournamentId: newId, adminToken: newToken } = generateTournamentShare();
      setTournamentId(newId);
      setAdminToken(newToken);
      
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const link = `${baseUrl}/torneio/${newId}`;
      setShareLink(link);
      
      if (onShareGenerated) {
        onShareGenerated(newId);
      }
    } else {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      setShareLink(`${baseUrl}/torneio/${currentTournamentId}`);
    }
  }, [tournamentId, adminToken, setTournamentId, setAdminToken, onShareGenerated, externalTournamentId, isViewer, sharingEnabled]);

  const handleCopyLink = async () => {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar link:', error);
    }
  };

  // Verificar se compartilhamento está ativo (apenas para modo admin)
  if (!isViewer && !sharingEnabled) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl my-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Compartilhamento Desativado
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Para compartilhar o torneio, ative o compartilhamento nas configurações primeiro.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  if (!shareLink) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl my-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Compartilhar Torneio
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Link compartilhável */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Link de Compartilhamento
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
              >
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              QR Code
            </label>
            <div className="bg-white p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <QRCodeSVG
                value={shareLink}
                size={200}
                level="M"
                includeMargin={true}
              />
            </div>
          </div>

          {/* Instruções */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Como usar:</strong> Compartilhe este link ou QR Code com espectadores. 
              Eles poderão visualizar o torneio em tempo real, mas não poderão editar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
