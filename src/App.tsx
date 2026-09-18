import { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Dashboard } from "./pages/Dashboard";
import { Estoque } from "./pages/Estoque";
import { EntradaNota } from "./pages/EntradaNota";
import { EmissaoReceita } from "./pages/EmissaoReceita";
import { ConsultaAgrofit } from "./pages/ConsultaAgrofit";
import { Login } from "./pages/Login";
import { GerenciamentoUsuarios } from "./pages/GerenciamentoUsuarios";
import Cadastros from "./pages/Cadastros";
import { LogOut } from "lucide-react";

export function App() {
  // 1. Inicializa o estado lendo do localStorage (ou define 'dashboard' como padrão)
  const [currentTab, setCurrentTab] = useState<string>(() => {
    return localStorage.getItem("defgest_aba_ativa") || "dashboard";
  });
  
  const [token, setToken] = useState<string | null>(null);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string>("");

  useEffect(() => {
    const salvo = localStorage.getItem("token");
    if (salvo) {
      setToken(salvo);
    }
  }, []);

  // 2. Sempre que a aba mudar, salvamos o valor atualizado no localStorage
  const handleTrocarTab = (tab: string) => {
    setCurrentTab(tab);
    localStorage.setItem("defgest_aba_ativa", tab);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("defgest_aba_ativa"); // Opcional: limpa a aba salva ao sair
    setToken(null);
    setEmpresaSelecionada("");
  };

  if (!token) {
    return (
      <Login onLoginSuccess={() => setToken(localStorage.getItem("token"))} />
    );
  }

  const renderScreen = () => {
    switch (currentTab) {
      case "dashboard":
        return (
          <Dashboard
            setCurrentTab={handleTrocarTab}
            empresaSelecionada={empresaSelecionada}
          />
        );
      case "estoque":
        return <Estoque empresaSelecionada={empresaSelecionada} />;
      case "entrada":
        return <EntradaNota empresaSelecionada={empresaSelecionada} />;
      case "receita":
        return <EmissaoReceita />;
      case "agrofit":
        return <ConsultaAgrofit />;
      case "cadastros":
        return <Cadastros empresaId={Number(empresaSelecionada) || 1} />;
      case "admin_usuarios":
        return <GerenciamentoUsuarios />;
      default:
        return (
          <Dashboard
            setCurrentTab={handleTrocarTab}
            empresaSelecionada={empresaSelecionada}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <div className="bg-emerald-50/70 backdrop-blur-md px-6 border-none py-0 flex justify-between items-center text-sm">
        <span className="text-gray-600 font-medium">Sessão Ativa</span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
      <Navbar
        currentTab={currentTab}
        setCurrentTab={handleTrocarTab} // Substituído para usar a função que persiste
        empresaSelecionada={empresaSelecionada}
        setEmpresaSelecionada={setEmpresaSelecionada}
      />

      <main className="flex-1">{renderScreen()}</main>
      <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-500">
        DEFGEST &copy; 2026 - Sistema de Controle de Estoque e Receituário
        Agronômico[cite: 5]
      </footer>
    </div>
  );
}

export default App;