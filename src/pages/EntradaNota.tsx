// src/pages/EntradaNota.tsx
import React, { useState, useEffect } from "react";
import { sincronizarCatalogoAgrofit } from "../services/agrofitApi";
import type { ProdutoAgrofitCompleto } from "../services/agrofitApi";
import { 
  listarNotasFiscais, 
  salvarNotaFiscalCompleta, 
  excluirNotaFiscalCompleta, 
  type NotaFiscalHistorico, 
} from "../services/estoqueApi";
import { FilePlus, Search, Trash2, Edit, ArrowLeft, History, PackagePlus, PlusCircle } from "lucide-react";

interface ItemNotaTemporario {
  idTemp: string;
  produto: ProdutoAgrofitCompleto;
  lote: string;
  quantidade: string;
  unidade: "L" | "KG" | "ML" | "G";
  dataValidade: string;
}

interface EntradaNotaProps {
  empresaSelecionada?: string;
}

export const EntradaNota: React.FC<EntradaNotaProps> = ({ empresaSelecionada }) => {
  const [listaNotas, setListaNotas] = useState<NotaFiscalHistorico[]>([]);
  const [modo, setModo] = useState<'lista' | 'formulario'>('lista');
  const [notaEmEdicaoId, setNotaEmEdicaoId] = useState<string | null>(null);

  // Estados do Cabeçalho da Nota
  const [numeroNota, setNumeroNota] = useState("");
  const [dataEntradaNota, setDataEntradaNota] = useState(new Date().toISOString().split("T")[0]);

  // Lista de itens adicionados na nota atual
  const [itensNota, setItensNota] = useState<ItemNotaTemporario[]>([]);

  // Estados para busca e seleção do item atual (Formato original)
  const [termoBusca, setTermoBusca] = useState("");
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<ProdutoAgrofitCompleto[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoAgrofitCompleto | null>(null);
  const [lote, setLote] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState<"L" | "KG" | "ML" | "G">("L");
  const [dataValidade, setDataValidade] = useState("");

  useEffect(() => {
    carregarDadosIniciais();
  }, [empresaSelecionada]);

  const carregarDadosIniciais = async () => {
    try {
      const notas = await listarNotasFiscais(empresaSelecionada);
      setListaNotas(notas);
      const catalogo = await sincronizarCatalogoAgrofit();
      setProdutosDisponiveis(catalogo);
    } catch (error) {
      console.error("Erro ao carregar dados iniciais:", error);
    }
  };

  const abrirNovaEntrada = async () => {
    setNotaEmEdicaoId(null);
    setNumeroNota("");
    setDataEntradaNota(new Date().toISOString().split("T")[0]);
    setItensNota([]);
    limparCamposItem();
    setModo('formulario');
    
    try {
      const catalogo = await sincronizarCatalogoAgrofit();
      setProdutosDisponiveis(catalogo);
    } catch (error) {
      console.error("Erro ao carregar catálogo Agrofit:", error);
    }
  };

  const limparCamposItem = () => {
    setProdutoSelecionado(null);
    setLote("");
    setQuantidade("");
    setDataValidade("");
    setTermoBusca("");
  };

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const catalogo = await sincronizarCatalogoAgrofit();
      if (!termoBusca.trim()) {
        setProdutosDisponiveis(catalogo);
      } else {
        const termoLower = termoBusca.toLowerCase();
        const filtrados = catalogo.filter(
          (p) =>
            p.nomeComercial.toLowerCase().includes(termoLower) ||
            p.ingredienteAtivo.toLowerCase().includes(termoLower) ||
            p.registro.includes(termoBusca),
        );
        setProdutosDisponiveis(filtrados);
      }
    } catch (error) {
      console.error("Erro ao filtrar produtos:", error);
    }
  };

  const handleAdicionarItemNaNota = () => {
    if (!produtoSelecionado || !lote || !quantidade || !dataValidade) {
      alert("Preencha todos os campos do item (Produto, Lote, Quantidade e Validade).");
      return;
    }

    const novoItemTemp: ItemNotaTemporario = {
      idTemp: String(new Date().getTime() + Math.random()),
      produto: produtoSelecionado,
      lote,
      quantidade,
      unidade,
      dataValidade,
    };

    setItensNota([...itensNota, novoItemTemp]);
    limparCamposItem();
  };

  const handleRemoverItemTemp = (idTemp: string) => {
    setItensNota(itensNota.filter((i) => i.idTemp !== idTemp));
  };

  const handleSubmitNota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroNota) {
      alert("Informe o número da Nota Fiscal.");
      return;
    }
    if (itensNota.length === 0) {
      alert("Adicione pelo menos um produto/lote na nota.");
      return;
    }

    try {
      await salvarNotaFiscalCompleta({
        numeroNota,
        dataEntrada: dataEntradaNota,
        itens: itensNota,
        notaEmEdicaoId,
      });

      await carregarDadosIniciais();
      setModo('lista');
    } catch (error: any) {
      alert(`Erro ao salvar nota fiscal: ${error.message}`);
    }
  };

  const handleExcluirNota = async (idNota: number, numeroNotaFiscal: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a NF ${numeroNotaFiscal}? Todos os lotes associados serão removidos do estoque.`)) return;

    try {
      await excluirNotaFiscalCompleta(idNota);
      await carregarDadosIniciais();
    } catch (error: any) {
      alert(`Erro ao excluir nota fiscal: ${error.message}`);
    }
  };

  const handleEditarNota = async (nota: NotaFiscalHistorico) => {
    setNotaEmEdicaoId(nota.numeroNota);
    setNumeroNota(nota.numeroNota);
    setDataEntradaNota(nota.dataEntrada || new Date().toISOString().split("T")[0]);

    const catalogo = await sincronizarCatalogoAgrofit();

    const itensTempCarregados: ItemNotaTemporario[] = nota.itens.map((item) => {
      const prodEncontrado = catalogo.find(p => p.nomeComercial.toLowerCase() === item.nomeProduto.toLowerCase()) || {
        id: String(item.estoqueId),
        registro: "",
        nomeComercial: item.nomeProduto,
        titularRegistro: "",
        ingredienteAtivo: "",
        formulacao: "",
        grupoQuimico: "",
        classeToxicologica: "",
        cultura: "",
        praga: "",
        indicacoesUso: [],
        unidadePadrao: item.unidade,
        modoAplicacao: "Terrestre",
        doseMin: 0,
        doseMax: 0,
        doseMed: 0,
        doseUnid: item.unidade,
        vCaldaMin: 0,
        vCaldaMax: 0,
        vCaldaMed: 0,
        vCaldaUnid: "L/ha",
      };

      return {
        idTemp: String(item.id),
        produto: prodEncontrado,
        lote: item.lote,
        quantidade: String(item.quantidade),
        unidade: item.unidade as "L" | "KG" | "ML" | "G",
        dataValidade: item.dataValidade,
      };
    });

    setItensNota(itensTempCarregados);
    limparCamposItem();
    setModo('formulario');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {modo === 'lista' ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <History className="w-6 h-6 text-emerald-600" /> Notas Fiscais de Entrada
            </h1>
            <button
              onClick={abrirNovaEntrada}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
            >
              <FilePlus className="w-5 h-5" /> Nova Nota Fiscal
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm">
                  <th className="p-4 font-semibold">Número NF</th>
                  <th className="p-4 font-semibold">Data Entrada</th>
                  <th className="p-4 font-semibold">Itens</th>
                  <th className="p-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {listaNotas.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-500">
                      Nenhuma nota fiscal registrada.
                    </td>
                  </tr>
                ) : (
                  listaNotas.map((nota) => (
                    <tr key={nota.id} className="hover:bg-gray-50/50">
                      <td className="p-4 font-medium text-gray-800">{nota.numeroNota}</td>
                      <td className="p-4 text-gray-600">{nota.dataEntrada}</td>
                      <td className="p-4 text-gray-600">{nota.itens?.length || 0} item(ns)</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleEditarNota(nota)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded"
                          title="Editar"
                        >
                          <Edit className="w-5 h-5 inline" />
                        </button>
                        <button
                          onClick={() => handleExcluirNota(nota.id, nota.numeroNota)}
                          className="text-red-600 hover:text-red-800 p-1 rounded"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setModo('lista')}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2 font-medium"
            >
              <ArrowLeft className="w-5 h-5" /> Voltar para Listagem
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              {notaEmEdicaoId ? `Editando NF: ${notaEmEdicaoId}` : "Nova Entrada de Nota Fiscal"}
            </h1>
          </div>

          <form onSubmit={handleSubmitNota} className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número da Nota Fiscal *</label>
                <input
                  type="text"
                  value={numeroNota}
                  onChange={(e) => setNumeroNota(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Ex: 123456"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Entrada *</label>
                <input
                  type="date"
                  value={dataEntradaNota}
                  onChange={(e) => setDataEntradaNota(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-emerald-600" /> Adicionar Produtos à Nota
              </h2>

              {/* 1. Campo de busca por nome ou registro */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Buscar Produto no Catálogo (Nome ou Registro)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    placeholder="Digite o nome comercial, ingrediente ativo ou registro..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleBuscar}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
                  >
                    <Search className="w-4 h-4" /> Buscar
                  </button>
                </div>
              </div>

              {/* 2. Tabela/Lista separada para escolher o produto */}
              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="p-3">Nome Comercial</th>
                      <th className="p-3">Ingrediente Ativo</th>
                      <th className="p-3">Registro</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {produtosDisponiveis.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-gray-500">
                          Nenhum produto encontrado.
                        </td>
                      </tr>
                    ) : (
                      produtosDisponiveis.map((p) => {
                        const selecionado = produtoSelecionado?.id === p.id;
                        return (
                          <tr 
                            key={p.id} 
                            className={`cursor-pointer transition ${selecionado ? 'bg-emerald-50 font-semibold' : 'hover:bg-gray-50'}`}
                            onClick={() => {
                              setProdutoSelecionado(p);
                              setUnidade(p.unidadePadrao as any);
                            }}
                          >
                            <td className="p-3 text-gray-800">{p.nomeComercial}</td>
                            <td className="p-3 text-gray-600">{p.ingredienteAtivo}</td>
                            <td className="p-3 text-gray-600">{p.registro}</td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProdutoSelecionado(p);
                                  setUnidade(p.unidadePadrao as any);
                                }}
                                className={`px-3 py-1 rounded text-xs font-medium ${selecionado ? 'bg-emerald-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                              >
                                {selecionado ? 'Selecionado' : 'Escolher'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Indicador do produto selecionado atual */}
              {produtoSelecionado && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-sm flex items-center justify-between">
                  <span>
                    <strong>Produto Selecionado:</strong> {produtoSelecionado.nomeComercial} ({produtoSelecionado.ingredienteAtivo})
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setProdutoSelecionado(null)}
                    className="text-xs text-emerald-700 hover:text-emerald-900 underline font-medium"
                  >
                    Trocar
                  </button>
                </div>
              )}

              {/* 3. Campos complementares (Lote, Quantidade, Unidade, Validade) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lote *</label>
                  <input
                    type="text"
                    value={lote}
                    onChange={(e) => setLote(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Número do Lote"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidade *</label>
                  <select
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="L">Litros (L)</option>
                    <option value="KG">Quilos (KG)</option>
                    <option value="ML">Mililitros (ML)</option>
                    <option value="G">Gramas (G)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Validade *</label>
                  <input
                    type="date"
                    value={dataValidade}
                    onChange={(e) => setDataValidade(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleAdicionarItemNaNota}
                  className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm"
                >
                  <PlusCircle className="w-4 h-4" /> Adicionar Item
                </button>
              </div>

              {/* Tabela de itens temporários */}
              <div className="mt-4 border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Itens adicionados nesta nota:</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="p-3">Produto</th>
                        <th className="p-3">Lote</th>
                        <th className="p-3">Qtd</th>
                        <th className="p-3">Validade</th>
                        <th className="p-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {itensNota.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-gray-500">
                            Nenhum item adicionado ainda.
                          </td>
                        </tr>
                      ) : (
                        itensNota.map((item) => (
                          <tr key={item.idTemp}>
                            <td className="p-3 font-medium text-gray-800">{item.produto.nomeComercial}</td>
                            <td className="p-3 text-gray-600">{item.lote}</td>
                            <td className="p-3 text-gray-600">{item.quantidade} {item.unidade}</td>
                            <td className="p-3 text-gray-600">{item.dataValidade}</td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoverItemTemp(item.idTemp)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4 inline" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModo('lista')}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2.5 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm"
              >
                Salvar Nota Fiscal
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};