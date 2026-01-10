/**
 * BackupPanel Component
 * Permite exportar e importar backups do torneio
 */

'use client';

import { useState, useRef, ChangeEvent } from 'react';
import type { Tournament } from '@/types';
import { downloadBackup, importTournament, validateBackup, getBackupMetadata } from '@/services/backupService';

interface BackupPanelProps {
  tournament: Tournament;
  onImport: (tournament: Tournament) => void;
}

export function BackupPanel({ tournament, onImport }: BackupPanelProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      downloadBackup(tournament);
      setError(null);
    } catch (err) {
      setError('Erro ao criar backup');
      console.error(err);
    }
  };

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);

    try {
      const json = await file.text();

      // Valida o backup
      if (!validateBackup(json)) {
        setError('Arquivo de backup inválido ou corrompido');
        setIsImporting(false);
        return;
      }

      // Extrai metadados para confirmação
      const metadata = getBackupMetadata(json);
      if (!metadata) {
        setError('Não foi possível ler os dados do backup');
        setIsImporting(false);
        return;
      }

      // Confirmação antes de sobrescrever
      const message = `Você está prestes a substituir todos os dados atuais.\n\n` +
        `Dados do backup:\n` +
        `- Torneio: ${metadata.tournamentName}\n` +
        `- Data: ${new Date(metadata.exportDate).toLocaleString('pt-BR')}\n` +
        `- Grupos: ${metadata.totalGroups}\n` +
        `- Jogadores: ${metadata.totalPlayers}\n\n` +
        `Deseja continuar?`;

      if (window.confirm(message)) {
        const importedTournament = importTournament(json);
        onImport(importedTournament);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar backup');
      console.error(err);
    } finally {
      setIsImporting(false);
      // Limpa o input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        💾 Backup & Restauração
      </h3>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Exportar Torneio Completo */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Exportar Torneio Completo
        </h4>
        <button
          onClick={handleExport}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <span>📥</span>
          Baixar Backup Completo (.json)
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Salva o arquivo JSON com todos os dados: grupos, jogos, placares e ranking
        </p>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Importar Torneio Completo */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Importar Torneio Completo
        </h4>
        
        <label
          htmlFor="backup-file"
          className={`w-full px-4 py-3 border-2 border-dashed rounded-lg font-medium transition-all cursor-pointer flex items-center justify-center gap-2 ${
            isImporting
              ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 cursor-not-allowed'
              : 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-700 dark:text-orange-300'
          }`}
        >
          <span>📤</span>
          {isImporting ? 'Importando...' : 'Selecionar Arquivo'}
        </label>
        
        <input
          ref={fileInputRef}
          id="backup-file"
          type="file"
          accept=".json,application/json"
          onChange={handleImport}
          disabled={isImporting}
          className="hidden"
        />

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <span>
              <strong>Atenção:</strong> Importar um backup substituirá todos os dados atuais!
              Certifique-se de exportar o torneio atual antes, se necessário.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
