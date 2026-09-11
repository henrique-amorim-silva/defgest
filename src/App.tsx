import { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Dashboard } from "./pages/Dashboard";
import { Estoque } from "./pages/Estoque";
import { EntradaNota } from "./pages/EntradaNota";
import { EmissaoReceita } from "./pages/EmissaoReceita";
import { ConsultaAgrofit } from "./pages/ConsultaAgrofit";
import { Login } from "./pages/Login";
import { GerenciamentoUsuarios } from "./pages/GerenciamentoUsuarios";
import { LogOut } from "lucide-react";

export function App() {
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [token, setToken] = useState<string | null>(null);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string>("");

  useEffect(() => {
    const salvo = localStorage.getItem("token");
    if (salvo) {
      setToken(salvo);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setToken(null);
    setEmpresaSelecionada("");
  };

  if (!token) {
    return <Login onLoginSuccess={() => setToken(localStorage.getItem("token"))} />;
  }

  const renderScreen = () => {
    switch (currentTab) {
      case "dashboard":
        return <Dashboard setCurrentTab={setCurrentTab} empresaSelecionada={empresaSelecionada} />;
      case "estoque":
        return <Estoque empresaSelecionada={empresaSelecionada} />;
      case "entrada":
        return <EntradaNota empresaSelecionada={empresaSelecionada} />;
      case "receita":
        return <EmissaoReceita />;
      case "agrofit":
        return <ConsultaAgrofit />;
      case "admin_usuarios":
        return <GerenciamentoUsuarios  />;
      default:
        return <Dashboard setCurrentTab={setCurrentTab} empresaSelecionada={empresaSelecionada} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex justify-between items-center text-sm">
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
        setCurrentTab={setCurrentTab} 
        empresaSelecionada={empresaSelecionada}
        setEmpresaSelecionada={setEmpresaSelecionada}
      />
      <main className="flex-1">{renderScreen()}</main>
      <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-500">
        DEFGEST &copy; 2026 - Sistema de Controle de Estoque e Receituário Agronômico[cite: 5]
      </footer>
    </div>
  );
}

export default App;