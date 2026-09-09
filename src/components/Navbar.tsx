import React from 'react';
import { LayoutDashboard, Package, FilePlus, FileText, Database } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'estoque', label: 'Estoque', icon: Package },
    { id: 'entrada', label: 'Entrada de Nota', icon: FilePlus },
    { id: 'receita', label: 'Emitir Receita', icon: FileText },
    { id: 'agrofit', label: 'Consulta Agrofit', icon: Database },
  ];

  return (
    <header className="bg-white text-gray-800 shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo DefGest com fundo claro */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <img 
              src="/images/nav-logo.png" 
              alt="DefGest Logo" 
              className="h-9 w-auto object-contain" 
            />
          </div>

          {/* Menu de Navegação */}
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
                      : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
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

      {/* Menu mobile simplificado */}
      <div className="md:hidden flex justify-around bg-gray-50 border-t border-gray-200 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`p-2 rounded-md ${
                isActive ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-200'
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