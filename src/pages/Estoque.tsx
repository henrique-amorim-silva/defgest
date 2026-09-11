import React, { useState, useEffect } from "react";
import type { ItemEstoque } from "../@types/estoque";
import {
  Package,
  Search,
  Calendar,
  Layers,
  Filter,
  AlertTriangle,
  CheckCircle,
  BarChart2,
} from "lucide-react";

interface EstoqueProps {
  empresaSelecionada?: string;
}

const formatarData = (dataStr: string) => {
  if (!dataStr) return "-";
  const dataLimpa = dataStr.split("T")[0]; // Remove a parte da hora (T03:00:00.000Z)
  const partes = dataLimpa.split("-");
  if (partes.length === 3) {
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  }
  return dataStr;
};

export const Estoque: React.FC<EstoqueProps> = ({ empresaSelecionada }) => {
  const [estoque, setEstoque] = useState<ItemEstoque[]>([]);

  // Estados de Filtros Avançados
  const [buscaProduto, setBuscaProduto] = useState("");
  const [buscaLote, setBuscaLote] = useState("");
  const [buscaNf, setBuscaNf] = useState("");
  const [filtroValidade, setFiltroValidade] = useState<
    "todos" | "validos" | "vencidos"
  >("todos");
  const [ordenacao, setOrdenacao] = useState<
    "nome-asc" | "qtd-desc" | "qtd-asc"
  >("nome-asc");

  // Controle de aba de visualização (Lotes detalhados vs Resumo Consolidado para Compra)
  const [abaVisualizacao, setAbaVisualizacao] = useState<
    "lotes" | "consolidado"
  >("lotes");

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

          // Mapeamento dos campos do banco (snake_case) para o front-end (camelCase)
          const dadosFormatados = dados.map((item: any) => ({
            id: item.id,
            nomeProduto: item.nome_produto || item.nomeProduto,
            lote: item.lote,
            quantidadeAtual: Number(
              item.quantidade_atual ?? item.quantidadeAtual ?? 0,
            ),
            unidade: item.unidade,
            dataValidade: item.data_validade
              ? item.data_validade.split("T")[0]
              : "",
            numeroNotaFiscal: item.numero_nota_fiscal || item.numeroNotaFiscal,
            dataEntrada: item.data_entrada
              ? item.data_entrada.split("T")[0]
              : "",
          }));

          setEstoque(dadosFormatados);
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

  // Filtragem avançada
  const estoqueFiltrado = estoque.filter((item) => {
    const nomeProd = item.nomeProduto || "";
    const loteItem = item.lote || "";
    const nfItem = item.numeroNotaFiscal || "";

    const matchProduto = nomeProd
      .toLowerCase()
      .includes(buscaProduto.toLowerCase());
    const matchLote = loteItem.toLowerCase().includes(buscaLote.toLowerCase());
    const matchNf = nfItem.toLowerCase().includes(buscaNf.toLowerCase());

    let matchValidade = true;
    const vencido = isVencido(item.dataValidade);
    if (filtroValidade === "validos") matchValidade = !vencido;
    if (filtroValidade === "vencidos") matchValidade = vencido;

    return matchProduto && matchLote && matchNf && matchValidade;
  });

  // Ordenação
  const estoqueOrdenado = [...estoqueFiltrado].sort((a, b) => {
    if (ordenacao === "nome-asc") {
      const nomeA = a.nomeProduto || "";
      const nomeB = b.nomeProduto || "";
      return nomeA.localeCompare(nomeB);
    }
    if (ordenacao === "qtd-desc") {
      return b.quantidadeAtual - a.quantidadeAtual;
    }
    if (ordenacao === "qtd-asc") {
      return a.quantidadeAtual - b.quantidadeAtual;
    }
    return 0;
  });

  // Cálculo do Resumo Consolidado por Produto (Soma total independente do lote)
  const resumoConsolidado = estoque.reduce(
    (acc, item) => {
      const nome = item.nomeProduto || "Produto Sem Nome";
      if (!acc[nome]) {
        acc[nome] = {
          nomeProduto: nome,
          quantidadeTotal: 0,
          unidade: item.unidade || "UN",
          totalLotes: 0,
          lotesDetalhados: [],
        };
      }
      acc[nome].quantidadeTotal += Number(item.quantidadeAtual || 0);
      acc[nome].totalLotes += 1;
      acc[nome].lotesDetalhados.push({
        lote: item.lote || "N/D",
        quantidade: item.quantidadeAtual || 0,
        validade: item.dataValidade || "-",
        vencido: isVencido(item.dataValidade),
      });
      return acc;
    },
    {} as Record<string, any>,
  );

  const listaConsolidada = Object.values(resumoConsolidado)
    .filter((prod) =>
      prod.nomeProduto.toLowerCase().includes(buscaProduto.toLowerCase()),
    )
    .sort((a, b) => a.nomeProduto.localeCompare(b.nomeProduto));

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
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
                Gerencie lotes, validades e verifique totais para tomada de
                decisão de compra.
              </p>
            </div>
          </div>

          {/* Alternador de Visão */}
          <div className="flex bg-gray-100 p-1 rounded-lg border">
            <button
              onClick={() => setAbaVisualizacao("lotes")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                abaVisualizacao === "lotes"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Visão por Lotes
            </button>
            <button
              onClick={() => setAbaVisualizacao("consolidado")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center space-x-1 ${
                abaVisualizacao === "consolidado"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              <span>Resumo p/ Compras (Total por Nome)</span>
            </button>
          </div>
        </div>

        {/* Bloco de Filtros Melhores e Avançados */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
            <Filter className="h-4 w-4 text-emerald-600" />
            <span>Filtros de Busca Avançada</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
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

            {abaVisualizacao === "lotes" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Filtrar Lote
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: LOT-A..."
                    value={buscaLote}
                    onChange={(e) => setBuscaLote(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Filtrar Nota Fiscal
                  </label>
                  <input
                    type="text"
                    placeholder="Número da NF..."
                    value={buscaNf}
                    onChange={(e) => setBuscaNf(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Status Validade
                  </label>
                  <select
                    value={filtroValidade}
                    onChange={(e) =>
                      setFiltroValidade(
                        e.target.value as "todos" | "validos" | "vencidos",
                      )
                    }
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="todos">Todos os Status</option>
                    <option value="validos">Dentro do Prazo</option>
                    <option value="vencidos">Vencidos</option>
                  </select>
                </div>
              </>
            )}

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
                <option value="qtd-desc">Maior Quantidade</option>
                <option value="qtd-asc">Menor Quantidade</option>
              </select>
            </div>
          </div>
        </div>

        {/* CONTEÚDO 1: VISÃO CONSOLIDADA (Total por Nome do Produto para decisão de compra) */}
        {abaVisualizacao === "consolidado" ? (
          <div>
            <div className="mb-4 bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex items-center justify-between">
              <p className="text-xs text-emerald-800">
                💡 <strong>Visão para Compras:</strong> Aqui você visualiza o{" "}
                <strong>total geral acumulado</strong> de cada produto somando
                todos os lotes. Use esta tela para saber exatamente se o volume
                atual é suficiente ou se precisa comprar mais.
              </p>
            </div>

            {listaConsolidada.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">
                  Nenhum produto consolidado encontrado.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
                    <tr>
                      <th className="px-6 py-3 text-left">Produto</th>
                      <th className="px-6 py-3 text-center">
                        Quantidade Total em Estoque
                      </th>
                      <th className="px-6 py-3 text-center">
                        Qtd. Lotes Ativos
                      </th>
                      <th className="px-6 py-3 text-left">
                        Detalhamento dos Lotes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-sm">
                    {listaConsolidada.map((item) => (
                      <tr
                        key={item.nomeProduto}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {item.nomeProduto}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-emerald-100 text-emerald-800 font-extrabold px-3 py-1 rounded-full text-base">
                            {item.quantidadeTotal} {item.unidade}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-gray-600 font-medium">
                          {item.totalLotes}{" "}
                          {item.totalLotes === 1 ? "lote" : "lotes"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1 text-xs">
                            {item.lotesDetalhados.map((l: any, idx: any) => (
                              <div
                                key={idx}
                                className="flex items-center space-x-2 bg-gray-50 px-2 py-1 rounded border"
                              >
                                <span className="font-mono font-bold text-gray-700">
                                  Lote: {l.lote}
                                </span>
                                <span className="text-emerald-700 font-semibold">
                                  ({l.quantidade} {item.unidade})
                                </span>
                                <span className="text-gray-400">
                                  | Val: {l.validade}
                                </span>
                                {l.vencido ? (
                                  <span className="text-red-600 font-bold flex items-center space-x-0.5">
                                    <AlertTriangle className="h-3 w-3" />{" "}
                                    <span>Vencido</span>
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 flex items-center space-x-0.5">
                                    <CheckCircle className="h-3 w-3" />{" "}
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
        ) : (
          /* CONTEÚDO 2: VISÃO DETALHADA POR LOTES */
          <div>
            {estoqueOrdenado.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">
                  Nenhum registro encontrado com os filtros atuais.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 text-xs text-gray-600 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 text-left">Produto</th>
                      <th className="px-6 py-3 text-left">Lote</th>
                      <th className="px-6 py-3 text-left">Quantidade</th>
                      <th className="px-6 py-3 text-left">Validade</th>
                      <th className="px-6 py-3 text-left">Nota Fiscal</th>
                      <th className="px-6 py-3 text-left">Entrada</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-sm">
                    {estoqueOrdenado.map((item) => {
                      const vencido = isVencido(item.dataValidade);
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            {item.nomeProduto}
                          </td>
                          <td className="px-6 py-4 text-gray-600 font-mono">
                            {item.lote}
                          </td>
                          <td className="px-6 py-4 text-gray-800 font-bold">
                            <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs">
                              {item.quantidadeAtual} {item.unidade}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-xs">
                            <div className="flex items-center space-x-1.5">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span
                                className={
                                  vencido ? "text-red-600 font-bold" : ""
                                }
                              >
                                {formatarData(item.dataValidade)}
                              </span>
                              {vencido && (
                                <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                  VENCIDO
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                            {item.numeroNotaFiscal
                              ? `NF-${item.numeroNotaFiscal}`
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-xs">
                            {formatarData(item.dataEntrada)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
