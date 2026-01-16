/**
 * Página de Gerenciamento de Torneios
 * Lista, cria, edita, arquiva e deleta torneios
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTournamentManager } from '@/hooks/useTournamentManager';
import type { TournamentMetadata } from '@/types';

export default function TournamentsPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<TournamentMetadata | null>(null);
  const [newTournamentName, setNewTournamentName] = useState('');
  const [newTournamentCategories, setNewTournamentCategories] = useState('Iniciante, Normal');
  const [editTournamentName, setEditTournamentName] = useState('');
  const [editTournamentCategories, setEditTournamentCategories] = useState('');

  const {
    tournamentList,
    activeTournamentId,
    getTournaments,
    createTournament,
    updateTournamentMetadata,
    archiveTournament,
    unarchiveTournament,
    deleteTournament,
    activateTournament,
  } = useTournamentManager();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filteredTournaments = filter === 'all'
    ? getTournaments()
    : getTournaments(filter === 'active' ? 'active' : 'archived');

  const handleCreate = () => {
    if (!newTournamentName.trim()) {
      alert('Por favor, informe um nome para o torneio.');
      return;
    }

    const categories = newTournamentCategories
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    if (categories.length === 0) {
      categories.push('Iniciante', 'Normal');
    }

    const newId = createTournament(newTournamentName.trim(), categories);
    setNewTournamentName('');
    setNewTournamentCategories('Iniciante, Normal');
    setShowCreateModal(false);
    
    // Redirecionar para o dashboard do novo torneio
    router.push('/');
  };

  const handleEdit = (tournament: TournamentMetadata) => {
    setSelectedTournament(tournament);
    setEditTournamentName(tournament.name);
    setEditTournamentCategories(tournament.categories.join(', '));
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!selectedTournament || !editTournamentName.trim()) {
      alert('Por favor, informe um nome válido.');
      return;
    }

    const categories = editTournamentCategories
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    if (categories.length === 0) {
      alert('Por favor, informe pelo menos uma categoria.');
      return;
    }

    updateTournamentMetadata(selectedTournament.id, {
      name: editTournamentName.trim(),
      categories,
    });

    setShowEditModal(false);
    setSelectedTournament(null);
  };

  const handleDeleteClick = (tournament: TournamentMetadata) => {
    setSelectedTournament(tournament);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTournament) return;

    await deleteTournament(selectedTournament.id);
    setShowDeleteModal(false);
    setSelectedTournament(null);

    // Se deletou o torneio ativo, redirecionar para lista
    if (selectedTournament.id === activeTournamentId) {
      router.push('/');
    }
  };

  const handleArchive = (tournament: TournamentMetadata) => {
    if (tournament.status === 'archived') {
      unarchiveTournament(tournament.id);
    } else {
      archiveTournament(tournament.id);
    }
  };

  const handleActivate = (tournament: TournamentMetadata) => {
    activateTournament(tournament.id);
    router.push('/');
  };

  if (!isMounted) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Meus Torneios
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie seus torneios de Beach Tennis
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            + Criar Novo Torneio
          </button>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Todos ({getTournaments().length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'active'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Ativos ({getTournaments('active').length})
          </button>
          <button
            onClick={() => setFilter('archived')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'archived'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Arquivados ({getTournaments('archived').length})
          </button>
        </div>

        {/* Lista de Torneios */}
        {filteredTournaments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
              {filter === 'all'
                ? 'Nenhum torneio criado ainda.'
                : filter === 'active'
                ? 'Nenhum torneio ativo.'
                : 'Nenhum torneio arquivado.'}
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Ver todos os torneios
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament) => {
              const isActive = tournament.id === activeTournamentId;
              const date = new Date(tournament.date);
              const formattedDate = date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              });

              return (
                <div
                  key={tournament.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${
                    isActive ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  {/* Header do Card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {tournament.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Criado em {formattedDate}
                      </p>
                    </div>
                    {isActive && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded">
                        Ativo
                      </span>
                    )}
                    {tournament.status === 'archived' && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-medium rounded">
                        Arquivado
                      </span>
                    )}
                  </div>

                  {/* Categorias */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Categorias:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tournament.categories.map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {!isActive && (
                      <button
                        onClick={() => handleActivate(tournament)}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                      >
                        Ativar
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(tournament)}
                      className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleArchive(tournament)}
                      className="px-3 py-2 bg-yellow-100 dark:bg-yellow-900 hover:bg-yellow-200 dark:hover:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-sm font-medium rounded transition-colors"
                    >
                      {tournament.status === 'archived' ? 'Desarquivar' : 'Arquivar'}
                    </button>
                    <button
                      onClick={() => handleDeleteClick(tournament)}
                      className="px-3 py-2 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-800 dark:text-red-200 text-sm font-medium rounded transition-colors"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Criar Torneio */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Criar Novo Torneio
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome do Torneio
                  </label>
                  <input
                    type="text"
                    value={newTournamentName}
                    onChange={(e) => setNewTournamentName(e.target.value)}
                    placeholder="Ex: Torneio de Verão 2024"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categorias (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={newTournamentCategories}
                    onChange={(e) => setNewTournamentCategories(e.target.value)}
                    placeholder="Iniciante, Normal"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewTournamentName('');
                    setNewTournamentCategories('Iniciante, Normal');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Criar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Editar Torneio */}
        {showEditModal && selectedTournament && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Editar Torneio
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome do Torneio
                  </label>
                  <input
                    type="text"
                    value={editTournamentName}
                    onChange={(e) => setEditTournamentName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categorias (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={editTournamentCategories}
                    onChange={(e) => setEditTournamentCategories(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedTournament(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Confirmar Deletar */}
        {showDeleteModal && selectedTournament && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                Confirmar Exclusão
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Tem certeza que deseja deletar o torneio <strong>{selectedTournament.name}</strong>?
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mb-6">
                ⚠️ Esta ação não pode ser desfeita. Os dados serão removidos permanentemente do
                localStorage e do Redis (se compartilhado).
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedTournament(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Deletar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Link para Dashboard */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Voltar para o Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
