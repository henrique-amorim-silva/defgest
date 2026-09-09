import React, { useState, useEffect } from 'react';
import { getStorageData } from '../utils/storage';
import type { ItemEstoque } from '../@types/estoque';
import type { ReceitaAgronomica } from '../@types/receita';
import { LayoutDashboard, Package, FileText, AlertTriangle, CheckCircle, ArrowUpRight } from 'lucide-react';

interface DashboardProps {
  setCurrentTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setCurrentTab }) => {
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [totalLotes, setTotalLotes] = useState(0);
  const [alertasVencimento, setAlertasVencimento] = useState<ItemEstoque[]>([]);
  const [totalReceitas, setTotalReceitas] = useState(0);

  useEffect(() => {
    const estoque = getStorageData<ItemEstoque>('estoque');
    const receitas = getStorageData<ReceitaAgronomica>('receitas'); // Opcional caso salve no futuro

    setTotalLotes(estoque.length);
    
    // Soma produtos únicos ou quantidade total
    const produtosUnicos = new Set(estoque.map((i) => i.produtoId)).size;
    setTotalProdutos(produtosUnicos);

    // Identificar lotes vencendo nos próximos 30 dias ou já vencidos (exemplo simples)
    const hoje = new Date();
    const trintaDiasFrente = new Date();
    trintaDiasFrente.setDate(hoje.getDate() + 30);

    const lotesAlerta = estoque.filter((item) => {
      const dataVal = new Date(item.dataValidade);
      return dataVal <= trintaDiasFrente;
    });

    setAlertasVencimento(lotesAlerta);
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Cabeçalho */}
      <div className="flex items-center space-x-3 mb-8 border-b pb-4">
        <LayoutDashboard className="h-7 w-7 text-emerald-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-800">Painel Geral - DEFGEST</h2>
          <p className="text-sm text-gray-500">Visão geral do estoque e operações de defensivos agrícolas.</p>
        </div>
      </div>

      {/* Cards de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md border border-emerald-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Lotes em Estoque</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{totalLotes}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
            <Package className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-emerald-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Produtos Diferentes</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{totalProdutos}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-full text-blue-600">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-emerald-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Alertas de Validade</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">{alertasVencimento.length}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-full text-amber-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Ações Rápidas e Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ações Rápidas */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-emerald-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Ações Rápidas</h3>
          <div className="space-y-3">
            <button
              onClick={() => setCurrentTab('entrada')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-emerald-50 rounded-lg transition text-gray-700 hover:text-emerald-800 border border-gray-200"
            >
              <span className="font-medium">Lançar Nova Nota Fiscal de Entrada</span>
              <ArrowUpRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentTab('receita')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-emerald-50 rounded-lg transition text-gray-700 hover:text-emerald-800 border border-gray-200"
            >
              <span className="font-medium">Emitir Nova Receita Agronômica</span>
              <ArrowUpRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentTab('estoque')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-emerald-800 hover:text-white rounded-lg transition text-gray-700 border border-gray-200"
            >
              <span className="font-medium">Consultar Estoque Atual</span>
              <ArrowUpRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Lotes Próximos do Vencimento */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-emerald-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span>Lotes Próximos do Vencimento</span>
          </h3>
          {alertasVencimento.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">Nenhum lote com alerta de vencimento próximo.</p>
          ) : (
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {alertasVencimento.map((item) => (
                <div key={item.id} className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex justify-between items-center text-sm">
                  <div>
                    <p className="font-semibold text-gray-900">{item.nomeProduto}</p>
                    <p className="text-xs text-gray-600">Lote: {item.lote} | Qtd: {item.quantidadeAtual} {item.unidade}</p>
                  </div>
                  <span className="text-xs font-bold bg-amber-200 text-amber-900 px-2 py-1 rounded">
                    Val: {item.dataValidade}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};