import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, FilePlus, FileText, Database, ShieldAlert, Building2 } from 'lucide-react';
import { apiRequest } from '../services/api'; // <-- 1. Importe o apiRequest do arquivo de services

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  empresaSelecionada?: string;
  setEmpresaSelecionada?: (id: string) => void;
}

interface Empresa {
  id: number;
  nome_fantasia: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, empresaSelecionada, setEmpresaSelecionada }) => {
  const usuarioStr = localStorage.getItem("usuario");
  const usuario = usuarioStr ? JSON.parse(usuarioStr) : null;
  const isAdminMaster = usuario?.permissao === 'admin_master';

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  
  // 2. Substitua o fetch manual pela chamada via apiRequest padronizada
  useEffect(() => {
    if (isAdminMaster) {
      const carregarEmpresasNavbar = async () => {
        try {
          const data = await apiRequest("empresas");
          if (Array.isArray(data)) {
            setEmpresas(data);
          }
        } catch (err: any) {
          console.error('Erro ao buscar empresas no Navbar:', err);
        }
      };

      carregarEmpresasNavbar();
    }
  }, [isAdminMaster]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'estoque', label: 'Estoque', icon: Package },
    { id: 'entrada', label: 'Entrada de Nota', icon: FilePlus },
    { id: 'receita', label: 'Emitir Receita', icon: FileText },
    { id: 'agrofit', label: 'Consulta Agrofit', icon: Database },
  ];

  if (isAdminMaster) {
    navItems.push({ id: 'admin_usuarios', label: 'Gerenciar Empresas/Usuários', icon: ShieldAlert });
  }

  const logoSrc = `${import.meta.env.BASE_URL}images/nav-logo.png`;

  return (
    <header className="bg-emerald-50/70 backdrop-blur-md text-gray-800 shadow-sm border-b border-emerald-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo e Seletor de Empresa */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
              <img 
                src={logoSrc} 
                alt="DefGest Logo" 
                className="h-9 w-auto object-contain" 
              />
            </div>

            {/* Seletor de Empresa / Indicador */}
            <div className="hidden sm:flex items-center space-x-2 bg-white/80 border border-emerald-200 px-3 py-1.5 rounded-lg shadow-sm">
              <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
              {isAdminMaster ? (
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-gray-500">Empresa:</span>
                  <select
                    value={empresaSelecionada || ''}
                    onChange={(e) => setEmpresaSelecionada && setEmpresaSelecionada(e.target.value)}
                    className="text-xs font-medium text-emerald-800 bg-transparent border-none focus:ring-0 cursor-pointer outline-none"
                  >
                    <option value="">Todas as Empresas (Visão Geral)</option>
                    {empresas.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nome_fantasia}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="text-xs font-medium text-emerald-900">
                  {usuario?.empresaNome || 'Minha Empresa'}
                </span>
              )}
            </div>
          </div>

          {/* Navegação Desktop */}
          <nav className="hidden md:flex space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-xs lg:text-sm font-medium transition-colors ${
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
    </header>
  );
};