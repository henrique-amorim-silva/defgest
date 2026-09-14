import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, FilePlus, FileText, Database, ShieldAlert, Building2, Menu, X } from 'lucide-react';
import { apiRequest } from '../services/api';

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
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

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
    navItems.push({ id: 'admin_usuarios', label: 'Empresas / Usuários', icon: ShieldAlert });
  }

  const logoSrc = `${import.meta.env.BASE_URL}images/nav-logo.png`;

  return (
    <header className="bg-emerald-50/70 backdrop-blur-md text-gray-800 shadow-sm border-b border-emerald-200/60 sticky top-0 z-40">
      <div className="max-w-350 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo e Seletor de Empresa (Desktop) */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => { setCurrentTab('dashboard'); setMenuMobileAberto(false); }}>
              <img 
                src={logoSrc} 
                alt="DefGest Logo" 
                className="h-8 w-auto object-contain" 
              />
            </div>

            {/* Seletor de Empresa / Indicador (Visível em sm+) */}
            <div className="hidden sm:flex items-center space-x-1.5 bg-white/80 border border-emerald-200 px-2.5 py-1.5 rounded-lg shadow-sm">
              <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
              {isAdminMaster ? (
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Empresa:</span>
                  <select
                    value={empresaSelecionada || ''}
                    onChange={(e) => setEmpresaSelecionada && setEmpresaSelecionada(e.target.value)}
                    className="text-xs font-medium text-emerald-800 bg-transparent border-none focus:ring-0 cursor-pointer outline-none max-w-40 truncate"
                  >
                    <option value="">Todas as Empresas</option>
                    {empresas.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nome_fantasia}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="text-xs font-medium text-emerald-900 whitespace-nowrap">
                  {usuario?.empresaNome || 'Minha Empresa'}
                </span>
              )}
            </div>
          </div>

          {/* Navegação Desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center space-x-1.5 px-2.5 py-2 rounded-md text-xs lg:text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-emerald-100/70 hover:text-emerald-900'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Botão do Menu Hambúrguer (Aparece em telas menores que md) */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMenuMobileAberto(!menuMobileAberto)}
              className="p-2 rounded-md text-emerald-800 hover:bg-emerald-200/50 focus:outline-none transition"
              aria-label="Abrir menu"
            >
              {menuMobileAberto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Dropdown Mobile */}
      {menuMobileAberto && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-emerald-200 px-4 pt-3 pb-4 space-y-3 shadow-lg">
          
          {/* Seletor de Empresa para Celular (caso a tela seja muito pequena e esconda o sm) */}
          <div className="flex sm:hidden flex-col space-y-1 bg-emerald-50/80 border border-emerald-200 p-2.5 rounded-lg">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-gray-600">
              <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Empresa Atual:</span>
            </div>
            {isAdminMaster ? (
              <select
                value={empresaSelecionada || ''}
                onChange={(e) => setEmpresaSelecionada && setEmpresaSelecionada(e.target.value)}
                className="text-xs font-medium text-emerald-900 bg-white border border-emerald-300 rounded px-2 py-1.5 outline-none w-full"
              >
                <option value="">Todas as Empresas</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nome_fantasia}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-medium text-emerald-900 pl-5">
                {usuario?.empresaNome || 'Minha Empresa'}
              </span>
            )}
          </div>

          {/* Links de Navegação Mobile */}
          <div className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMenuMobileAberto(false);
                  }}
                  className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-colors w-full text-left ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-emerald-100/70 hover:text-emerald-900'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};