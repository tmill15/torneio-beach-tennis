/**
 * BackupPanel Component
 * Permite exportar e importar backups do torneio
 */

'use client';

import { useState, useRef, ChangeEvent } from 'react';
import type { Tournament } from '@/types';
import { downloadBackup, importTournament, validateBackup, getBackupMetadata, importAllTournaments } from '@/services/backupService';
import { setAdminToken } from '@/hooks/useTournamentSync';

interface BackupPanelProps {
  tournament: Tournament;
  onImport: (importData: { 
    tournament: Tournament; 
    isSingleCategory: boolean; 
    category?: string;
    credentials?: { tournamentId: string; adminToken: string };
    sharingEnabled?: boolean;
  }) => void;
  checkTournamentExists?: (tournamentName: string) => { exists: boolean; isActive: boolean } | null;
}

interface ConfirmationData {
  title: string;
  message: string;
  details: Array<{ label: string; value: string }>;
  warnings?: string[];
  tournamentExists?: boolean;
  isActiveTournament?: boolean;
  willCreateNew?: boolean;
  onConfirm: () => void;
}

export function BackupPanel({ tournament, onImport, checkTournamentExists }: BackupPanelProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPassword, setExportPassword] = useState<string>('');
  const [showImportPasswordModal, setShowImportPasswordModal] = useState(false);
  const [importPassword, setImportPassword] = useState<string>('');
  const [pendingImportData, setPendingImportData] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);
  const [confirmReplaceChecked, setConfirmReplaceChecked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      // Validar senha (sempre obrigatória para backup completo)
      if (!exportPassword || exportPassword.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres');
        return;
      }

      // Sempre fazer backup completo do torneio ativo
      await downloadBackup(tournament, undefined, exportPassword);

      setError(null);
      setShowExportModal(false);
      setExportPassword('');
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

      // Verificar se é backup de todos os torneios
      let isAllTournamentsBackup = false;
      try {
        const data = JSON.parse(json);
        if (data.tournamentList && data.tournaments) {
          isAllTournamentsBackup = true;
        }
      } catch {
        // Não é JSON válido ou não é backup de todos os torneios
      }

      if (isAllTournamentsBackup) {
        // Backup de todos os torneios - sempre pede senha
        setPendingImportData(json);
        setShowImportPasswordModal(true);
        setIsImporting(false);
        return;
      }

      // Backup de torneio único - validação normal
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

      // Verificar se é backup de todos os torneios
      let isAllTournamentsBackup = false;
      try {
        const data = JSON.parse(json);
        if (data.tournamentList && data.tournaments) {
          isAllTournamentsBackup = true;
        }
      } catch {
        // Não é backup de todos os torneios
      }

      if (isAllTournamentsBackup) {
        // Importar todos os torneios
        if (!password) {
          throw new Error('Senha é obrigatória para backup de todos os torneios');
        }

        const importResult = await importAllTournaments(json, password);

        // Preparar dados de confirmação
        const activeTournamentName = importResult.tournamentList.activeTournamentId 
          ? importResult.tournamentList.tournaments.find(t => t.id === importResult.tournamentList.activeTournamentId)?.name || 'N/A' 
          : 'Nenhum';

        setConfirmationData({
          title: 'Restaurar TODOS os torneios?',
          message: 'Você está prestes a restaurar todos os torneios do backup.',
          details: [
            { label: 'Total de torneios', value: `${importResult.tournamentList.tournaments.length}` },
            { label: 'Torneio ativo', value: activeTournamentName },
          ],
          warnings: [
            'Todos os torneios atuais serão completamente substituídos!',
            'Todas as credenciais serão restauradas',
            'Todos os estados de compartilhamento serão restaurados',
          ],
          onConfirm: () => {
            // Restaurar lista de torneios
          localStorage.setItem('beachtennis-tournament-list', JSON.stringify(importResult.tournamentList));

          // Restaurar cada torneio
          for (const [id, tournamentData] of Object.entries(importResult.tournaments)) {
            localStorage.setItem(`beachtennis-tournament-${id}`, JSON.stringify(tournamentData));
          }

          // Restaurar credenciais (adminToken por torneio)
          for (const [id, creds] of Object.entries(importResult.credentials)) {
            // Atualizar adminToken específico do torneio
            setAdminToken(id, creds.adminToken);
            
            // Se é o torneio ativo, atualizar tournamentId global (compatibilidade)
            if (id === importResult.tournamentList.activeTournamentId) {
              localStorage.setItem('beachtennis-tournament-id', creds.tournamentId);
              window.dispatchEvent(new StorageEvent('storage', {
                key: 'beachtennis-tournament-id',
                newValue: creds.tournamentId,
              }));
            }
          }

          // Restaurar sharingEnabled
          for (const [id, enabled] of Object.entries(importResult.sharingEnabled)) {
            const sharingKey = `beachtennis-sharing-enabled-${id}`;
            localStorage.setItem(sharingKey, JSON.stringify(enabled));
            window.dispatchEvent(new StorageEvent('storage', {
              key: sharingKey,
              newValue: JSON.stringify(enabled),
            }));
          }

            // Recarregar página para aplicar mudanças
            window.location.reload();
          },
        });
        setShowConfirmModal(true);
        setIsImporting(false);
        return;
      }

      // Detectar se é backup de categoria específica e descriptografar credenciais
      const importResult = await importTournament(json, password);
      const isSingleCategory = importResult.isSingleCategory;
      const category = importResult.category;
      
      // Verificar se o torneio existe (apenas para backup completo)
      let tournamentCheck = null;
      if (!isSingleCategory && checkTournamentExists) {
        tournamentCheck = checkTournamentExists(importResult.tournament.nome);
      }
      
      // Preparar dados de confirmação
      const actionTitle = isSingleCategory 
        ? `Restaurar categoria "${category}"?`
        : `Restaurar torneio "${importResult.tournament.nome}"?`;
      
      let actionMessage = isSingleCategory 
        ? `Você está prestes a restaurar dados da categoria "${category}".`
        : `Você está prestes a restaurar o torneio "${importResult.tournament.nome}".`;
      
      // Adicionar informação sobre criação ou substituição
      if (!isSingleCategory && tournamentCheck) {
        if (tournamentCheck.exists) {
          actionMessage += tournamentCheck.isActive 
            ? ' Este é o torneio atualmente ativo.'
            : ' Este torneio já existe na lista.';
        } else {
          actionMessage += ' Um novo torneio será criado com os dados do backup.';
        }
      }
      
      const warnings: string[] = [];
      if (isSingleCategory) {
        warnings.push('Dados de outras categorias serão preservados');
        warnings.push(`Dados da categoria "${category}" serão substituídos`);
      }
      if (importResult.credentials) {
        warnings.push('Credenciais de sincronização e configurações serão restauradas');
      }
      
      // Contar apenas grupos da Fase 1 (fase inicial)
      const phase1Groups = importResult.tournament.grupos.filter(g => g.fase === 1);
      
      // Contar jogadores únicos (evitar duplicatas entre fases)
      const uniquePlayerIds = new Set<string>();
      importResult.tournament.grupos.forEach(g => {
        g.players?.forEach(p => uniquePlayerIds.add(p.id));
      });
      const totalPlayers = importResult.tournament.waitingList.length + uniquePlayerIds.size;

      setConfirmationData({
        title: actionTitle,
        message: actionMessage,
        details: [
          { label: 'Torneio', value: importResult.tournament.nome },
          { label: 'Categorias', value: importResult.tournament.categorias.join(', ') },
          { label: 'Grupos (Fase 1)', value: `${phase1Groups.length}` },
          { label: 'Jogadores', value: `${totalPlayers}` },
        ],
        warnings: warnings.length > 0 ? warnings : undefined,
        tournamentExists: tournamentCheck?.exists || false,
        isActiveTournament: tournamentCheck?.isActive || false,
        willCreateNew: tournamentCheck ? !tournamentCheck.exists : false,
        onConfirm: () => {
          onImport({
            tournament: importResult.tournament,
            isSingleCategory,
            category,
            credentials: importResult.credentials,
            sharingEnabled: importResult.sharingEnabled,
          });
          setShowConfirmModal(false);
          setConfirmationData(null);
          setConfirmReplaceChecked(false);
        },
      });
      setShowConfirmModal(true);
      setConfirmReplaceChecked(false);
      setIsImporting(false);
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
          Salva o arquivo JSON com todos os dados e configurações do torneio
        </p>
      </div>

      {/* Modal de Senha para Export */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📥 Exportar Backup Completo
            </h3>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ℹ️ Este backup incluirá todas as categorias, grupos, jogos e configurações do torneio.
                </p>
              </div>

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
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && exportPassword && exportPassword.length >= 6) {
                      handleExport();
                    }
                  }}
                />
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-2">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                    <span className="text-sm">🔒</span>
                    <span>
                      <strong>Dados Sensíveis:</strong> O backup incluirá credenciais de acesso criptografadas.
                      Mantenha a senha segura - você precisará dela para restaurar o backup.
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setExportPassword('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleExport}
                disabled={!exportPassword || exportPassword.length < 6}
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

      {/* Modal de Confirmação de Restauração */}
      {showConfirmModal && confirmationData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {confirmationData.title}
            </h3>

            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {confirmationData.message}
            </p>

            {/* Aviso sobre criação de novo torneio */}
            {confirmationData.willCreateNew && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 text-lg">ℹ️</span>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                      Novo Torneio
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Como este torneio não existe, um novo será criado com os dados do backup.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Detalhes do backup */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📋 Dados do Backup:
              </h4>
              {confirmationData.details.map((detail, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{detail.label}:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{detail.value}</span>
                </div>
              ))}
            </div>

            {/* Avisos */}
            {confirmationData.warnings && confirmationData.warnings.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</span>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                      Atenção:
                    </h4>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                      {confirmationData.warnings.map((warning, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span>•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Checkbox de confirmação para substituir torneio existente */}
            {confirmationData.tournamentExists && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmReplaceChecked}
                    onChange={(e) => setConfirmReplaceChecked(e.target.checked)}
                    className="mt-1 w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      {confirmationData.isActiveTournament 
                        ? '⚠️ Confirmo que desejo substituir TODOS os dados do torneio ativo'
                        : '⚠️ Confirmo que desejo substituir TODOS os dados deste torneio'}
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                      Esta ação não pode ser desfeita. Todos os dados atuais serão perdidos.
                    </p>
                  </div>
                </label>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmationData(null);
                  setConfirmReplaceChecked(false);
                  setIsImporting(false);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (confirmationData.onConfirm) {
                    confirmationData.onConfirm();
                  }
                }}
                disabled={confirmationData.tournamentExists && !confirmReplaceChecked}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Restauração
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
