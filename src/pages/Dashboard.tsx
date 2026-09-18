import React, { useState, useEffect } from 'react';
import { listarEstoque } from '../services/estoqueApi';
import { LayoutDashboard, Package, AlertTriangle, CheckCircle, ArrowUpRight, Loader2, TrendingDown,  } from 'lucide-react';

interface DashboardProps {
  setCurrentTab: (tab: string) => void;
  empresaSelecionada: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ setCurrentTab, empresaSelecionada }) => {
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [totalLotes, setTotalLotes] = useState(0);
  const [alertasVencimento, setAlertasVencimento] = useState<any[]>([]);
  const [alertasEstoqueMinimo, setAlertasEstoqueMinimo] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarDadosDashboard() {
      try {
        setCarregando(true);
        setErro(null);

        // Busca o estoque real do backend filtrando pela empresa selecionada (se houver)
        const estoque = await listarEstoque(empresaSelecionada);

        let contadorLotesTotal = 0;
        const listaVencimentos: any[] = [];
        const listaEstoqueBaixo: any[] = [];

        // Datas de referência para cálculo de vencimento (Próximos 30 dias ou já vencidos)
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const trintaDiasFrente = new Date();
        trintaDiasFrente.setDate(hoje.getDate() + 30);
        trintaDiasFrente.setHours(23, 59, 59, 999);

        // Função auxiliar para interpretar a data de validade com segurança
        const parseDataValidade = (valorBruto: any) => {
          if (!valorBruto) return null;
          if (typeof valorBruto === 'string' && valorBruto.includes('/')) {
            const [dia, mes, ano] = valorBruto.split('/');
            if (dia && mes && ano) {
              return new Date(Number(ano), Number(mes) - 1, Number(dia));
            }
          }
          const dataParsed = new Date(valorBruto);
          return isNaN(dataParsed.getTime()) ? null : dataParsed;
        };

        // Itera sobre os produtos e seus respectivos lotes vindos da nova estrutura
        estoque.forEach((item: any) => {
          const nomeProd = item.nomeProduto || item.nome_produto || item.produto || item.descricao || 'Produto sem nome';
          const unidadeMedida = item.embalagem || item.unidade || item.unidade_medida || 'UN';
          const estoqueMinimo = Number(item.est_min ?? item.estoque_minimo ?? item.estoqueMinimo ?? 0);
          
          let quantidadeTotalProduto = 0;
          const lotesDoItem = item.lotes || [];

          contadorLotesTotal += lotesDoItem.length;

          // Analisa cada lote individualmente para alertas de validade
          lotesDoItem.forEach((loteItem: any) => {
            const qtdLote = Number(loteItem.quantidadeAtual ?? loteItem.quantidade_atual ?? 0);
            quantidadeTotalProduto += qtdLote;

            const dataValBruta = loteItem.dataValidade || loteItem.data_validade || loteItem.validade;
            const dataVal = parseDataValidade(dataValBruta);

            if (dataVal) {
              // Verifica se está vencido ou vence nos próximos 30 dias
              if (dataVal <= trintaDiasFrente) {
                let dataValFormatada = dataValBruta;
                if (typeof dataValFormatada === 'string' && dataValFormatada.includes('T')) {
                  const [ano, mes, dia] = dataValFormatada.split('T')[0].split('-');
                  if (ano && mes && dia) dataValFormatada = `${dia}/${mes}/${ano}`;
                }

                listaVencimentos.push({
                  idLote: loteItem.id || Math.random(),
                  nomeProduto: nomeProd,
                  lote: loteItem.lote || 'N/D',
                  quantidade: qtdLote,
                  unidade: unidadeMedida,
                  dataValidade: dataValFormatada || 'Não informada',
                  vencido: dataVal < hoje,
                });
              }
            }
          });

          // Verifica alerta de Estoque Mínimo (Quantidade total <= Estoque Mínimo)
          if (quantidadeTotalProduto <= estoqueMinimo) {
            listaEstoqueBaixo.push({
              idProduto: item.id || item.produtoId || Math.random(),
              nomeProduto: nomeProd,
              quantidadeTotal: quantidadeTotalProduto,
              estoqueMinimo: estoqueMinimo,
              unidade: unidadeMedida,
            });
          }
        });

        // Conta produtos únicos
        const produtosUnicos = new Set(
          estoque.map((i: any) => {
            const nome = i.nomeProduto || i.nome_produto || i.produto || i.descricao || '';
            return nome.toString().trim().toLowerCase();
          }).filter(Boolean)
        ).size;

        setTotalProdutos(produtosUnicos);
        setTotalLotes(contadorLotesTotal);
        setAlertasVencimento(listaVencimentos);
        setAlertasEstoqueMinimo(listaEstoqueBaixo);

      } catch (err: any) {
        setErro(err.message || 'Erro ao carregar dados do dashboard.');
      } finally {
        setCarregando(false);
      }
    }

    carregarDadosDashboard();
  }, [empresaSelecionada]);

  if (carregando) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-2 text-gray-600 font-medium">Carregando painel...</span>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-bold">Erro de Conexão</p>
          <p className="text-sm">{erro}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Cabeçalho */}
      <div className="flex items-center space-x-3 mb-8 border-b pb-4">
        <LayoutDashboard className="h-7 w-7 text-emerald-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-800">Painel Geral - DEFGEST</h2>
          <p className="text-sm text-gray-500">Visão geral do estoque e operações de defensivos agrícolas integradas ao banco.</p>
        </div>
      </div>

      {/* Cards de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

        <div className="bg-white p-6 rounded-xl shadow-md border border-emerald-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Estoque Crítico / Mín.</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{alertasEstoqueMinimo.length}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-full text-red-600">
            <TrendingDown className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md border border-emerald-100 md:col-span-1">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Ações Rápidas</h3>
          <div className="space-y-3">
            <button
              onClick={() => setCurrentTab('cadastros')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-emerald-50 rounded-lg transition text-gray-700 hover:text-emerald-800 border border-gray-200 text-sm"
            >
              <span className="font-medium">Ir para Cadastros</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentTab('entrada')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-emerald-50 rounded-lg transition text-gray-700 hover:text-emerald-800 border border-gray-200 text-sm"
            >
              <span className="font-medium">Lançar Nova Nota Fiscal</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentTab('receita')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-emerald-50 rounded-lg transition text-gray-700 hover:text-emerald-800 border border-gray-200 text-sm"
            >
              <span className="font-medium">Emitir Receita Agronômica</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentTab('estoque')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-emerald-800 hover:text-white rounded-lg transition text-gray-700 border border-gray-200 text-sm"
            >
              <span className="font-medium">Consultar Estoque Atual</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Lotes Próximos do Vencimento */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-emerald-100 md:col-span-1">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span>Validades Próximas</span>
          </h3>
          {alertasVencimento.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">Nenhum lote com alerta de vencimento próximo.</p>
          ) : (
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {alertasVencimento.map((item: any) => (
                <div key={item.idLote} className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-gray-900">{item.nomeProduto}</p>
                    <p className="text-gray-600">Lote: {item.lote} | Qtd: {item.quantidade} {item.unidade}</p>
                  </div>
                  <span className={`font-bold px-2 py-1 rounded whitespace-nowrap ml-2 ${item.vencido ? 'bg-red-200 text-red-900' : 'bg-amber-200 text-amber-900'}`}>
                    Val: {item.dataValidade}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Produtos Abaixo do Estoque Mínimo */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-emerald-100 md:col-span-1">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            <span>Estoque Crítico (Mínimo)</span>
          </h3>
          {alertasEstoqueMinimo.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">Nenhum produto abaixo do estoque mínimo.</p>
          ) : (
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {alertasEstoqueMinimo.map((item: any) => (
                <div key={item.idProduto} className="p-3 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-gray-900">{item.nomeProduto}</p>
                    <p className="text-gray-600">Atual: <span className="font-bold text-red-700">{item.quantidadeTotal}</span> | Mín: {item.estoqueMinimo} {item.unidade}</p>
                  </div>
                  <span className="font-bold px-2 py-1 rounded whitespace-nowrap ml-2 bg-red-200 text-red-900">
                    Repor
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