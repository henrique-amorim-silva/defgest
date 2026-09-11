import React from 'react';
import { LayoutDashboard, Package, FilePlus, FileText, Database, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  // Pega os dados do usuário salvo no localStorage para checar a permissão
  const usuarioStr = localStorage.getItem("usuario");
  const usuario = usuarioStr ? JSON.parse(usuarioStr) : null;
  const isAdminMaster = usuario?.permissao === 'admin_master';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'estoque', label: 'Estoque', icon: Package },
    { id: 'entrada', label: 'Entrada de Nota', icon: FilePlus },
    { id: 'receita', label: 'Emitir Receita', icon: FileText },
    { id: 'agrofit', label: 'Consulta Agrofit', icon: Database },
  ];

  // Se for admin_master, adiciona a aba de gerenciamento ao menu
  if (isAdminMaster) {
    navItems.push({ id: 'admin_usuarios', label: 'Gerenciar Empresas/Usuários', icon: ShieldAlert });
  }

  const logoSrc = `${import.meta.env.BASE_URL}images/nav-logo.png`;

  return (
    <header className="bg-emerald-50/70 backdrop-blur-md text-gray-800 shadow-sm border-b border-emerald-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <img 
              src={logoSrc} 
              alt="DefGest Logo" 
              className="h-9 w-auto object-contain" 
            />
          </div>

          <nav className="hidden md:flex space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-emerald-100/70 hover:text-emerald-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="md:hidden flex justify-around bg-emerald-100/40 border-t border-emerald-200/60 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`p-2 rounded-md ${
                isActive ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-emerald-200/50'
              }`}
              title={item.label}
            >
              <Icon className="h-5 w-5" />
            </button>
          );
        })}
      </div>
    </header>
  );
};