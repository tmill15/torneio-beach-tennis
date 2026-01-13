/**
 * Footer Component
 * Exibe versão da aplicação e informações do rodapé
 */

'use client';

export function Footer() {
  // Usa variável de ambiente exposta pelo Next.js ou fallback para desenvolvimento
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0';

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-3 px-4 z-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600 dark:text-gray-400 gap-2">
          <p className="text-center sm:text-left">
            BeachTennis Manager v{appVersion}
          </p>
          <p className="text-center sm:text-right">
            © {new Date().getFullYear()} - Desenvolvido por Thiago Milhomem
          </p>
        </div>
      </div>
    </footer>
  );
}
