import React, { useState, useEffect, useMemo } from "react";
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
  const [filtroCodigo, setFiltroCodigo] = useState("");
  const [buscaProduto, setBuscaProduto] = useState("");
  const [filtroLote, setFiltroLote] = useState("");
  const [filtroEmbalagem, setFiltroEmbalagem] = useState("");
  const [dataInicioValidade, setDataInicioValidade] = useState("");
  const [dataFimValidade, setDataFimValidade] = useState("");
  const [ordenacao, setOrdenacao] = useState<
    "nome-asc" | "qtd-desc" | "qtd-asc"
  >("nome-asc");

  const limparFiltros = () => {
    setFiltroCodigo("");
    setBuscaProduto("");
    setFiltroLote("");
    setFiltroEmbalagem("");
    setDataInicioValidade("");
    setDataFimValidade("");
    setOrdenacao("nome-asc");
  };

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

  // Lista dinâmica de embalagens disponíveis no estoque para preencher o select
  const embalagensDisponiveis = useMemo(() => {
    const conjunto = new Set<string>();
    estoque.forEach((item: any) => {
      const emb = item.embalagem || item.unidade;
      if (emb) conjunto.add(emb);
    });
    return Array.from(conjunto).sort();
  }, [estoque]);

  // Cálculo do Resumo Consolidado iterando sobre os lotes que vêm da API
  const resumoConsolidado = estoque.reduce(
    (acc, item: any) => {
      const idProduto = item.id || item.produtoId || item.produto_id || "N/D";
      const nome = item.nome_produto || item.nomeProduto || "Produto Sem Nome";
      const embalagem = item.embalagem || item.unidade || "UN";
      const unidade = item.unidade || "UN";
      const estoqueMinimo = Number(
        item.est_min ?? item.estoque_minimo ?? item.estoqueMinimo ?? 0,
      );

      const chave = `${idProduto}_${nome}_${embalagem}`;

      if (!acc[chave]) {
        acc[chave] = {
          idUnico: chave,
          idProduto: String(idProduto),
          nomeProduto: nome,
          quantidadeTotal: 0,
          estoqueMinimo: estoqueMinimo,
          unidade: unidade,
          embalagem: embalagem,
          lotesDetalhados: [],
        };
      }

      const lotesDoItem = item.lotes || [];

      lotesDoItem.forEach((loteItem: any) => {
        const qtdLote = Number(
          loteItem.quantidadeAtual ?? loteItem.quantidade_atual ?? 0,
        );
        const validadeOriginal =
          loteItem.dataValidade || loteItem.data_validade || "";
        const validadeFormatada = validadeOriginal
          ? validadeOriginal.split("T")[0]
          : "-";
        const notaFiscal =
          loteItem.numeroNotaFiscal ||
          loteItem.notaFiscal ||
          loteItem.nota_fiscal ||
          loteItem.nf ||
          "N/D";

        acc[chave].quantidadeTotal += qtdLote;

        acc[chave].lotesDetalhados.push({
          lote: loteItem.lote || "N/D",
          quantidade: qtdLote,
          validade: validadeFormatada,
          vencido: isVencido(validadeOriginal),
          notaFiscal: notaFiscal,
        });
      });

      return acc;
    },
    {} as Record<string, any>,
  );

  // Aplicação dos Filtros e Ordenação
  const listaConsolidada = Object.values(resumoConsolidado)
    .map((prod: any) => {
      const lotesFiltrados = prod.lotesDetalhados.filter((l: any) => {
        const matchLote = filtroLote
          ? l.lote.toLowerCase().includes(filtroLote.toLowerCase())
          : true;

        let matchValidade = true;
        if (dataInicioValidade && l.validade !== "-") {
          matchValidade = matchValidade && l.validade >= dataInicioValidade;
        }
        if (dataFimValidade && l.validade !== "-") {
          matchValidade = matchValidade && l.validade <= dataFimValidade;
        }

        return matchLote && matchValidade;
      });

      return {
        ...prod,
        lotesDetalhados: lotesFiltrados,
      };
    })
    .filter((prod: any) => {
      const matchCodigo = filtroCodigo
        ? prod.idProduto.toLowerCase().includes(filtroCodigo.toLowerCase())
        : true;
      const matchNome = prod.nomeProduto
        .toLowerCase()
        .includes(buscaProduto.toLowerCase());
      const matchEmbalagem = filtroEmbalagem
        ? prod.embalagem === filtroEmbalagem
        : true;

      const temFiltroLoteOuValidade =
        filtroLote || dataInicioValidade || dataFimValidade;
      const passaráNosLotes = temFiltroLoteOuValidade
        ? prod.lotesDetalhados.length > 0
        : true;

      return matchCodigo && matchNome && matchEmbalagem && passaráNosLotes;
    })
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

        {/* Bloco de Filtros Avançados */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
            <Filter className="h-4 w-4 text-emerald-600" />
            <span>Filtros de Busca</span>
            <button
              type="button"
              onClick={limparFiltros}
              className="px-3 py-1.5 ml-auto bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-xs font-semibold transition flex items-center space-x-1"
            >
              <span>Limpar Filtros</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Filtrar Código
              </label>
              <input
                type="text"
                placeholder="Ex: 14..."
                value={filtroCodigo}
                onChange={(e) => setFiltroCodigo(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

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
                Filtrar Embalagem
              </label>
              <select
                value={filtroEmbalagem}
                onChange={(e) => setFiltroEmbalagem(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Todas as embalagens</option>
                {embalagensDisponiveis.map((emb) => (
                  <option key={emb} value={emb}>
                    {emb}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Filtrar Lote
              </label>
              <input
                type="text"
                placeholder="Nº do lote..."
                value={filtroLote}
                onChange={(e) => setFiltroLote(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Validade (Início)
              </label>
              <input
                type="date"
                value={dataInicioValidade}
                onChange={(e) => setDataInicioValidade(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Validade (Fim)
              </label>
              <input
                type="date"
                value={dataFimValidade}
                onChange={(e) => setDataFimValidade(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Ordenação geral dos registros:
            </div>
            <div className="w-56">
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
                Nenhum produto encontrado com os filtros selecionados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left w-24">Código</th>
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
                  {listaConsolidada.map((item: any) => {
                    const abaixoDoMinimo =
                      item.quantidadeTotal <= item.estoqueMinimo;
                    return (
                      <tr
                        key={item.idUnico}
                        className={`hover:bg-gray-50 transition ${
                          abaixoDoMinimo ? "bg-amber-50/40" : ""
                        }`}
                      >
                        <td className="px-6 py-4 font-mono font-bold text-gray-600 text-center">
                          {item.idProduto}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          <div className="flex items-center space-x-2">
                            <span>{item.nomeProduto}</span>
                            {abaixoDoMinimo && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <AlertTriangle className="h-3 w-3 mr-1 text-amber-600" />
                                Estoque Crítico
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-gray-700 font-medium">
                          {item.embalagem}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`font-bold px-3 py-1 rounded-full text-xs inline-flex items-center space-x-1 ${
                              abaixoDoMinimo
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            <span>{item.quantidadeTotal}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-gray-700 font-semibold text-xs">
                            {item.estoqueMinimo}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1.5 text-xs">
                            {item.lotesDetalhados.length === 0 ? (
                              <span className="text-gray-400 italic">
                                Nenhum lote cadastrado ou estoque zerado.
                              </span>
                            ) : (
                              item.lotesDetalhados.map((l: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex flex-wrap items-center justify-between gap-1 bg-gray-50 px-2.5 py-1.5 rounded border"
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className="font-mono font-bold text-gray-700">
                                      Lote: {l.lote}
                                    </span>
                                    <span className="text-emerald-700 font-semibold">
                                      ({l.quantidade})
                                    </span>
                                    <span className="text-gray-400">|</span>
                                    <span className="text-gray-600 font-medium">
                                      NF: {l.notaFiscal || "N/D"}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-gray-400">
                                      Val: {l.validade}
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
                                </div>
                              ))
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};