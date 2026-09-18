import React, { useState, useEffect, useMemo } from "react";
import type { ItemEstoque } from "../@types/estoque";
import {
  Package,
  Search,
  Layers,
  Filter,
  AlertTriangle,
  CheckCircle,
  ClipboardList,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface EstoqueProps {
  empresaSelecionada?: string;
  setCurrentTab?: (tab: string) => void;
}

export const Estoque: React.FC<EstoqueProps> = ({ empresaSelecionada, setCurrentTab }) => {
  const [estoque, setEstoque] = useState<ItemEstoque[]>([]);
  const [temRascunhoPendente, setTemRascunhoPendente] = useState<boolean>(false);

  // Estado para controlar se os filtros começam recolhidos por padrão
  const [filtrosAbertos, setFiltrosAbertos] = useState<boolean>(false);

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

  // Chave do localStorage alinhada com a ContagemEstoque
  const chaveLocalStorage = `contagem_temporaria_empresa_${empresaSelecionada || 'geral'}`;

  // Verificar se existe rascunho salvo ao carregar ou mudar de empresa
  useEffect(() => {
    const verificarRascunho = () => {
      const salvo = localStorage.getItem(chaveLocalStorage);
      if (salvo) {
        try {
          const itens = JSON.parse(salvo);
          setTemRascunhoPendente(Array.isArray(itens) && itens.length > 0);
        } catch {
          setTemRascunhoPendente(false);
        }
      } else {
        setTemRascunhoPendente(false);
      }
    };

    verificarRascunho();
    window.addEventListener("storage", verificarRascunho);
    return () => window.removeEventListener("storage", verificarRascunho);
  }, [chaveLocalStorage]);

 // Carregar dados da API do Backend respeitando a empresa selecionada
  useEffect(() => {
    const buscarEstoque = async () => {
      try {
        // Pega a URL base configurada no seu arquivo .env (ex: ngrok ou produção)
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        
        const query = empresaSelecionada ? `?empresaId=${empresaSelecionada}` : '';
        const url = `${baseUrl.replace(/\/$/, '')}/estoque${query}`;

        const token = localStorage.getItem("token");
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
      } catch (error) {print
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
      const nome = item.nome_produto || item.nomeProduto || item.produto || "Produto Sem Nome";
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

      const lotesDoItem = Array.isArray(item.lotes) ? item.lotes : [];

      if (lotesDoItem.length === 0) {
        acc[chave].lotesDetalhados = [];
      } else {
        lotesDoItem.forEach((loteItem: any) => {
          const qtdLote = Number(
            loteItem.quantidadeAtual ?? loteItem.quantidade_atual ?? loteItem.quantidade ?? 0,
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
      }

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

  const irParaContagem = () => {
    if (setCurrentTab) {
      setCurrentTab("inventario");
    }
  };

  return (
    <div className="max-w-auto mx-auto py-4 sm:py-8 px-2 sm:px-4">
      <div className="bg-white rounded-xl shadow-md overflow-hidden p-4 sm:p-6 border border-emerald-100">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 sm:mb-6 border-b pb-4 gap-4">
          <div className="flex items-center space-x-3">
            <Package className="h-7 w-7 text-emerald-600 shrink-0" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                Controle de Estoque de Defensivos
              </h2>
              <p className="text-xs text-gray-500">
                Resumo consolidado de estoque para tomada de decisão de compra.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={irParaContagem}
              className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-medium shadow-sm transition text-xs sm:text-sm ${
                temRascunhoPendente
                  ? "bg-amber-600 hover:bg-amber-700 text-white animate-pulse"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              {temRascunhoPendente ? (
                <>
                  <Clock className="h-4 w-4" />
                  <span>Continuar Contagem (Pendente)</span>
                </>
              ) : (
                <>
                  <ClipboardList className="h-4 w-4" />
                  <span>Iniciar Contagem</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bloco de Filtros Colapsável (Recolhido por padrão) */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 mb-6 overflow-hidden">
          <div
            onClick={() => setFiltrosAbertos(!filtrosAbertos)}
            className="flex items-center justify-between p-3.5 cursor-pointer bg-gray-100/70 hover:bg-gray-200/50 transition select-none"
          >
            <div className="flex items-center space-x-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
              <Filter className="h-4 w-4 text-emerald-600" />
              <span>Filtros de Busca Avançada</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-gray-500 font-medium">
                {filtrosAbertos ? "Recolher" : "Expandir filtros"}
              </span>
              {filtrosAbertos ? (
                <ChevronUp className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              )}
            </div>
          </div>

          {filtrosAbertos && (
            <div className="p-4 space-y-4 border-t border-gray-200 bg-white">
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

              <div className="flex flex-col sm:flex-row justify-between items-center pt-3 border-t border-gray-200 gap-3">
                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3">
                  <span className="text-xs text-gray-500">Ordenação:</span>
                  <select
                    value={ordenacao}
                    onChange={(e) =>
                      setOrdenacao(
                        e.target.value as "nome-asc" | "qtd-desc" | "qtd-asc",
                      )
                    }
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="nome-asc">Nome (A - Z)</option>
                    <option value="qtd-desc">Maior Quantidade Total</option>
                    <option value="qtd-asc">Menor Quantidade Total</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={limparFiltros}
                  className="w-full sm:w-auto px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-xs font-semibold transition"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CONTEÚDO DO ESTOQUE (Cartões no Mobile / Tabela no Desktop) */}
        <div>
          {listaConsolidada.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium text-sm">
                Nenhum produto encontrado no estoque.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Verifique se há filtros ativos ou se o inventário está cadastrado.
              </p>
            </div>
          ) : (
            <>
              {/* Layout Mobile: Cartões Verticais */}
              <div className="block md:hidden space-y-3">
                {listaConsolidada.map((item: any) => {
                  const abaixoDoMinimo = item.quantidadeTotal <= item.estoqueMinimo;
                  return (
                    <div
                      key={item.idUnico}
                      className={`p-3.5 rounded-xl border shadow-sm space-y-2.5 ${
                        abaixoDoMinimo ? "bg-amber-50/60 border-amber-200" : "bg-gray-50/80 border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                            Cód: {item.idProduto}
                          </span>
                          <h3 className="font-bold text-gray-900 text-sm mt-1">
                            {item.nomeProduto}
                          </h3>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`font-bold px-2.5 py-1 rounded-full text-xs inline-block ${
                              abaixoDoMinimo
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            Qtd: {item.quantidadeTotal} {item.embalagem}
                          </span>
                        </div>
                      </div>

                      {abaixoDoMinimo && (
                        <div className="flex items-center text-[11px] font-bold text-amber-800 bg-amber-100/70 px-2 py-1 rounded">
                          <AlertTriangle className="h-3 w-3 mr-1 text-amber-600 shrink-0" />
                          <span>Estoque Crítico (Mínimo: {item.estoqueMinimo})</span>
                        </div>
                      )}

                      {/* Lotes Detalhados no Mobile */}
                      <div className="pt-2 border-t border-gray-200 space-y-1.5 text-xs">
                        {item.lotesDetalhados.length === 0 ? (
                          <span className="text-gray-400 italic">
                            Nenhum lote cadastrado ou estoque zerado.
                          </span>
                        ) : (
                          item.lotesDetalhados.map((l: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex flex-wrap items-center justify-between gap-1 bg-white px-2.5 py-1.5 rounded border border-gray-200"
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
                    </div>
                  );
                })}
              </div>

              {/* Layout Desktop: Tabela Tradicional */}
              <div className="hidden md:block overflow-x-auto border rounded-lg">
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};