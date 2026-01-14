/**
 * BackupPanel Component
 * Permite exportar e importar backups do torneio
 */

'use client';

import { useState, useRef, ChangeEvent } from 'react';
import type { Tournament } from '@/types';
import { downloadBackup, importTournament, validateBackup, getBackupMetadata } from '@/services/backupService';
import { SHARING_ENABLED_KEY } from '@/hooks/useTournamentSync';

interface BackupPanelProps {
  tournament: Tournament;
  onImport: (importData: { tournament: Tournament; isSingleCategory: boolean; category?: string }) => void;
}

const TOURNAMENT_ID_KEY = 'beachtennis-tournament-id';
const ADMIN_TOKEN_KEY = 'beachtennis-admin-token';

export function BackupPanel({ tournament, onImport }: BackupPanelProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportCategory, setExportCategory] = useState<string>('all');
  const [exportPassword, setExportPassword] = useState<string>('');
  const [showImportPasswordModal, setShowImportPasswordModal] = useState(false);
  const [importPassword, setImportPassword] = useState<string>('');
  const [pendingImportData, setPendingImportData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const categoria = exportCategory === 'all' ? undefined : exportCategory;
      const isFullBackup = !categoria;
      
      // Validar senha se for backup completo
      if (isFullBackup) {
        if (!exportPassword || exportPassword.length < 6) {
          setError('A senha deve ter pelo menos 6 caracteres');
          return;
        }
      }

      await downloadBackup(tournament, categoria, isFullBackup ? exportPassword : undefined);
      setError(null);
      setShowExportModal(false);
      setExportPassword('');
      setExportCategory('all');
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

      // Se backup tem credenciais, pedir senha primeiro
      if (metadata.hasCredentials) {
        setPendingImportData(json);
        setShowImportPasswordModal(true);
        setIsImporting(false);
        return;
      }

      // Se não tem credenciais, importar normalmente
      await performImport(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar backup');
      console.error(err);
      setIsImporting(false);
    } finally {
      // Limpa o input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const performImport = async (json: string, password?: string) => {
    try {
      setIsImporting(true);
      setError(null);

      // Detectar se é backup de categoria específica e descriptografar credenciais
      const importResult = await importTournament(json, password);
      const isSingleCategory = importResult.isSingleCategory;
      const category = importResult.category;
      
      // Se tem credenciais, restaurar no localStorage
      if (importResult.credentials) {
        localStorage.setItem(TOURNAMENT_ID_KEY, importResult.credentials.tournamentId);
        localStorage.setItem(ADMIN_TOKEN_KEY, importResult.credentials.adminToken);
      }
      
      // Se tem estado de compartilhamento, restaurar no localStorage
      if (importResult.sharingEnabled !== undefined) {
        localStorage.setItem(SHARING_ENABLED_KEY, String(importResult.sharingEnabled));
      }
      
      // Confirmação antes de importar
      const actionText = isSingleCategory 
        ? `restaurar dados da categoria "${category}"`
        : `substituir todos os dados atuais`;
      
      const warningText = isSingleCategory
        ? `\n⚠️ Dados de outras categorias serão preservados.\nDados da categoria "${category}" serão substituídos.`
        : `\n⚠️ Todos os dados atuais serão substituídos!`;
      
      const credentialsText = importResult.credentials
        ? `\n✅ Credenciais de sincronização serão restauradas.`
        : '';
      
      const sharingText = importResult.sharingEnabled !== undefined
        ? `\n${importResult.sharingEnabled ? '✅' : '⚪'} Estado de compartilhamento será restaurado (${importResult.sharingEnabled ? 'ativado' : 'desativado'}).`
        : '';
      
      const message = `Você está prestes a ${actionText}.\n\n` +
        `Dados do backup:\n` +
        `- Torneio: ${importResult.tournament.nome}\n` +
        `- Categorias: ${importResult.tournament.categorias.join(', ')}\n` +
        `- Grupos: ${importResult.tournament.grupos.length}\n` +
        `- Jogadores: ${importResult.tournament.waitingList.length + importResult.tournament.grupos.reduce((sum, g) => sum + (g.players?.length || 0), 0)}` +
        warningText +
        credentialsText +
        sharingText +
        `\n\nDeseja continuar?`;

      if (window.confirm(message)) {
        onImport({
          tournament: importResult.tournament,
          isSingleCategory,
          category,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar backup');
      throw err;
    } finally {
      setIsImporting(false);
      setShowImportPasswordModal(false);
      setImportPassword('');
      setPendingImportData(null);
    }
  };

  const handleImportWithPassword = async () => {
    if (!importPassword || !pendingImportData) {
      setError('Por favor, digite a senha');
      return;
    }

    try {
      await performImport(pendingImportData, importPassword);
    } catch (err) {
      // Erro já foi setado em performImport
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

      {/* Exportar Torneio */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Exportar Backup
        </h4>
        <button
          onClick={() => setShowExportModal(true)}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <span>📥</span>
          Baixar Backup (.json)
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Salva o arquivo JSON com todos os dados: grupos, jogos, placares e ranking
        </p>
      </div>

      {/* Modal de Seleção de Categoria para Export */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📥 Exportar Backup
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selecionar Categoria
                </label>
                <select
                  value={exportCategory}
                  onChange={(e) => {
                    setExportCategory(e.target.value);
                    setExportPassword(''); // Limpar senha ao mudar categoria
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="all">Todas as Categorias</option>
                  {tournament.categorias.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {exportCategory === 'all' 
                    ? 'O backup incluirá dados de todas as categorias'
                    : `O backup incluirá apenas dados da categoria "${exportCategory}"`}
                </p>
              </div>

              {/* Campo de senha apenas para backup completo */}
              {exportCategory === 'all' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Senha para Proteção <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={exportPassword}
                    onChange={(e) => setExportPassword(e.target.value)}
                    placeholder="Digite uma senha (mín. 6 caracteres)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-2">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                      <span className="text-sm">🔒</span>
                      <span>
                        <strong>Dados Sensíveis:</strong> O backup completo incluirá credenciais de acesso criptografadas.
                        Mantenha a senha segura - você precisará dela para restaurar o backup.
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setExportCategory('all');
                  setExportPassword('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleExport}
                disabled={exportCategory === 'all' && (!exportPassword || exportPassword.length < 6)}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Exportar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Importar Backup */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Importar Backup
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

      {/* Modal de Senha para Importação */}
      {showImportPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🔒 Senha Necessária
            </h3>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Este backup contém credenciais de acesso criptografadas.
                  Digite a senha usada na exportação para restaurá-las.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Senha do Backup
                </label>
                <input
                  type="password"
                  value={importPassword}
                  onChange={(e) => setImportPassword(e.target.value)}
                  placeholder="Digite a senha"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && importPassword) {
                      handleImportWithPassword();
                    }
                  }}
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowImportPasswordModal(false);
                  setImportPassword('');
                  setPendingImportData(null);
                  setError(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleImportWithPassword}
                disabled={!importPassword || isImporting}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? 'Importando...' : 'Importar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
