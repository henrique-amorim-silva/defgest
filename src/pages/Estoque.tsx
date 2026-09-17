import React, { useState, useEffect } from "react";
import type { ItemEstoque } from "../@types/estoque";
import {
  Package,
  Search,
  Layers,
  Filter,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface EstoqueProps {
  empresaSelecionada?: string;
}

export const Estoque: React.FC<EstoqueProps> = ({ empresaSelecionada }) => {
  const [estoque, setEstoque] = useState<ItemEstoque[]>([]);

  // Estados de Filtros
  const [buscaProduto, setBuscaProduto] = useState("");
  const [ordenacao, setOrdenacao] = useState<
    "nome-asc" | "qtd-desc" | "qtd-asc"
  >("nome-asc");

 // Carregar dados da API do Backend respeitando a empresa selecionada
  useEffect(() => {
    const buscarEstoque = async () => {
      try {
        const token = localStorage.getItem("token");
        const url = empresaSelecionada
          ? `http://localhost:3001/api/estoque?empresaId=${empresaSelecionada}`
          : "http://localhost:3001/api/estoque";

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const dados = await response.json();
          // Atualiza diretamente o estado com os dados estruturados do backend
          setEstoque(dados);
        } else {
          console.error("Erro ao carregar o estoque do servidor.");
        }
      } catch (error) {
        console.error("Erro de conexão com o servidor:", error);
      }
    };

    buscarEstoque();
  }, [empresaSelecionada]);

  // Função auxiliar para checar se o lote está vencido
  const isVencido = (dataValidade: string) => {
    if (!dataValidade) return false;
    const hoje = new Date().toISOString().split("T")[0];
    const dataLimpa = dataValidade.split("T")[0];
    return dataLimpa < hoje;
  };

  // Cálculo do Resumo Consolidado iterando sobre os lotes que vêm da API
  const resumoConsolidado = estoque.reduce((acc, item: any) => {
    const nome = item.nome_produto || item.nomeProduto || "Produto Sem Nome";
    const embalagem = item.embalagem || item.unidade || "UN";
    const unidade = item.unidade || "UN";
    const estoqueMinimo = Number(item.est_min ?? item.estoque_minimo ?? item.estoqueMinimo ?? 0);

    const chave = `${nome}_${embalagem}`;

    if (!acc[chave]) {
      acc[chave] = {
        idUnico: chave,
        nomeProduto: nome,
        quantidadeTotal: 0,
        estoqueMinimo: estoqueMinimo,
        unidade: unidade,
        embalagem: embalagem,
        lotesDetalhados: [],
      };
    }

    // Processa o array de lotes que vem do backend
    const lotesDoItem = item.lotes || [];
    
    lotesDoItem.forEach((loteItem: any) => {
      const qtdLote = Number(loteItem.quantidadeAtual ?? loteItem.quantidade_atual ?? 0);
      acc[chave].quantidadeTotal += qtdLote;
      
      acc[chave].lotesDetalhados.push({
        lote: loteItem.lote || "N/D",
        quantidade: qtdLote,
        validade: loteItem.dataValidade ? loteItem.dataValidade.split("T")[0] : (loteItem.data_validade ? loteItem.data_validade.split("T")[0] : "-"),
        vencido: isVencido(loteItem.dataValidade || loteItem.data_validade),
      });
    });

    return acc;
  }, {} as Record<string, any>);

  const listaConsolidada = Object.values(resumoConsolidado)
    .filter((prod: any) =>
      prod.nomeProduto.toLowerCase().includes(buscaProduto.toLowerCase()),
    )
    .sort((a: any, b: any) => {
      if (ordenacao === "nome-asc") {
        return a.nomeProduto.localeCompare(b.nomeProduto);
      }
      if (ordenacao === "qtd-desc") {
        return b.quantidadeTotal - a.quantidadeTotal;
      }
      if (ordenacao === "qtd-asc") {
        return a.quantidadeTotal - b.quantidadeTotal;
      }
      return 0;
    });

  return (
    <div className="max-w-auto mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 border border-emerald-100">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 border-b pb-4 gap-4">
          <div className="flex items-center space-x-3">
            <Package className="h-7 w-7 text-emerald-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Controle de Estoque de Defensivos
              </h2>
              <p className="text-xs text-gray-500">
                Resumo consolidado de estoque para tomada de decisão de compra.
              </p>
            </div>
          </div>
        </div>

        {/* Bloco de Filtros Simplificados */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
            <Filter className="h-4 w-4 text-emerald-600" />
            <span>Filtros de Busca</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Filtrar Produto
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nome do produto..."
                  value={buscaProduto}
                  onChange={(e) => setBuscaProduto(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Ordenar por
              </label>
              <select
                value={ordenacao}
                onChange={(e) =>
                  setOrdenacao(
                    e.target.value as "nome-asc" | "qtd-desc" | "qtd-asc",
                  )
                }
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="nome-asc">Nome (A - Z)</option>
                <option value="qtd-desc">Maior Quantidade Total</option>
                <option value="qtd-asc">Menor Quantidade Total</option>
              </select>
            </div>
          </div>
        </div>

        {/* CONTEÚDO: RESUMO CONSOLIDADO PARA COMPRAS */}
        <div>
          {listaConsolidada.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">
                Nenhum produto encontrado.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">Produto</th>
                    <th className="px-6 py-3 text-center">Embalagem</th>
                    <th className="px-6 py-3 text-center">
                      Qtd. Total em Estoque
                    </th>
                    <th className="px-6 py-3 text-center">Estoque Mínimo</th>
                    <th className="px-6 py-3 text-left">
                      Detalhamento dos Lotes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-sm">
                  {listaConsolidada.map((item: any) => (
                    <tr
                      key={item.idUnico} // CORREÇÃO: Utilizando o idUnico que inclui a embalagem correta
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {item.nomeProduto}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700 font-medium">
                        {item.embalagem}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-xs">
                          {item.quantidadeTotal}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-gray-700 font-semibold text-xs">
                          {item.estoqueMinimo}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-xs">
                          {item.lotesDetalhados.map((l: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center space-x-2 bg-gray-50 px-2 py-1 rounded border"
                            >
                              <span className="font-mono font-bold text-gray-700">
                                Lote: {l.lote}
                              </span>
                              <span className="text-emerald-700 font-semibold">
                                ({l.quantidade})
                              </span>
                              <span className="text-gray-400">
                                | Val: {l.validade}
                              </span>
                              {l.vencido ? (
                                <span className="text-red-600 font-bold flex items-center space-x-0.5">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>Vencido</span>
                                </span>
                              ) : (
                                <span className="text-emerald-600 flex items-center space-x-0.5">
                                  <CheckCircle className="h-3 w-3" />
                                  <span>No prazo</span>
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};