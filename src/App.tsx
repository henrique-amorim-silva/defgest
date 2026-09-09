import { useState } from "react";
import { Navbar } from "./components/Navbar";
import { Dashboard } from "./pages/Dashboard";
import { Estoque } from "./pages/Estoque";
import { EntradaNota } from "./pages/EntradaNota";
import { EmissaoReceita } from "./pages/EmissaoReceita";
import { ConsultaAgrofit } from "./pages/ConsultaAgrofit";

export function App() {
  const [currentTab, setCurrentTab] = useState("dashboard");

  const renderScreen = () => {
    switch (currentTab) {
      case "dashboard":
        return <Dashboard setCurrentTab={setCurrentTab} />;
      case "estoque":
        return <Estoque />;
      case "entrada":
        return <EntradaNota />;
      case "receita":
        return <EmissaoReceita />;
      case "agrofit":
        return <ConsultaAgrofit />;
      default:
        return <Dashboard setCurrentTab={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <main className="flex-1">{renderScreen()}</main>
      <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-500">
       DEFGEST &copy; 2026 - Sistema de Controle de Estoque e Receituário
        Agronômico
      </footer>
    </div>
  );
}

export default App;
