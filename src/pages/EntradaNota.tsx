import React, { useState, useEffect } from "react";
import { sincronizarCatalogoAgrofit } from "../services/agrofitApi";
import type { ProdutoAgrofitCompleto } from "../services/agrofitApi";
import { getStorageData, setStorageData } from "../utils/storage";
import type { ItemEstoque } from "../@types/estoque";
import { FilePlus, Search, Trash2, Edit, ArrowLeft, History, PackagePlus, PlusCircle } from "lucide-react";

interface ItemNotaTemporario {
  idTemp: string;
  produto: ProdutoAgrofitCompleto;
  lote: string;
  quantidade: string;
  unidade: "L" | "KG" | "ML" | "G";
  dataValidade: string;
}

export const EntradaNota: React.FC = () => {
  const [estoque, setEstoque] = useState<ItemEstoque[]>([]);
  const [modo, setModo] = useState<'lista' | 'formulario'>('lista');
  const [notaEmEdicaoId, setNotaEmEdicaoId] = useState<string | null>(null);

  // Estados do Cabeçalho da Nota
  const [numeroNota, setNumeroNota] = useState("");
  const [dataEntradaNota, setDataEntradaNota] = useState(new Date().toISOString().split("T")[0]);

  // Lista de itens adicionados na nota atual
  const [itensNota, setItensNota] = useState<ItemNotaTemporario[]>([]);

  // Estados para seleção do item atual
  const [termoBusca, setTermoBusca] = useState("");
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<ProdutoAgrofitCompleto[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoAgrofitCompleto | null>(null);
  const [lote, setLote] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState<"L" | "KG" | "ML" | "G">("L");
  const [dataValidade, setDataValidade] = useState("");

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  const carregarDadosIniciais = async () => {
    const dadosEstoque = getStorageData<ItemEstoque>("estoque");
    setEstoque(dadosEstoque);
    const catalogo = await sincronizarCatalogoAgrofit();
    setProdutosDisponiveis(catalogo);
  };

  const abrirNovaEntrada = () => {
    setNotaEmEdicaoId(null);
    setNumeroNota("");
    setDataEntradaNota(new Date().toISOString().split("T")[0]);
    setItensNota([]);
    limparCamposItem();
    setModo('formulario');
  };

  const limparCamposItem = () => {
    setProdutoSelecionado(null);
    setLote("");
    setQuantidade("");
    setDataValidade("");
    setTermoBusca("");
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    carregarProdutosFiltrados(termoBusca);
  };

  const carregarProdutosFiltrados = async (termo: string) => {
    const catalogo = await sincronizarCatalogoAgrofit();
    if (!termo) {
      setProdutosDisponiveis(catalogo);
    } else {
      const termoLower = termo.toLowerCase();
      const filtrados = catalogo.filter(
        (p) =>
          p.nomeComercial.toLowerCase().includes(termoLower) ||
          p.ingredienteAtivo.toLowerCase().includes(termoLower) ||
          p.registro.includes(termo),
      );
      setProdutosDisponiveis(filtrados);
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

  const handleSubmitNota = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroNota) {
      alert("Informe o número da Nota Fiscal.");
      return;
    }
    if (itensNota.length === 0) {
      alert("Adicione pelo menos um produto/lote na nota.");
      return;
    }

    const estoqueAtual = getStorageData<ItemEstoque>("estoque");
    let novoEstoque = [...estoqueAtual];

    if (notaEmEdicaoId) {
      // Se for edição, removemos primeiro os itens antigos vinculados a esta nota fiscal e adicionamos os novos
      novoEstoque = novoEstoque.filter((item) => item.numeroNotaFiscal !== numeroNota);
    }

    // Criar os novos itens de estoque para cada linha informada na nota
    const novosItensEstoque: ItemEstoque[] = itensNota.map((item, index) => ({
      id: `${new Date().getTime()}-${index}`,
      produtoId: item.produto.id,
      nomeProduto: item.produto.nomeComercial,
      lote: item.lote,
      quantidadeAtual: Number(item.quantidade),
      unidade: item.unidade,
      dataValidade: item.dataValidade,
      numeroNotaFiscal: numeroNota,
      dataEntrada: dataEntradaNota,
    }));

    novoEstoque = [...novosItensEstoque, ...novoEstoque];

    setStorageData("estoque", novoEstoque);
    setEstoque(novoEstoque);
    setModo('lista');
  };

  const handleExcluirNota = (numeroNotaFiscal: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a NF ${numeroNotaFiscal}? Todos os lotes associados serão removidos do estoque.`)) return;

    const estoqueAtual = getStorageData<ItemEstoque>("estoque");
    const novoEstoque = estoqueAtual.filter((item) => item.numeroNotaFiscal !== numeroNotaFiscal);

    setStorageData("estoque", novoEstoque);
    setEstoque(novoEstoque);
  };

  const handleEditarNota = async (numeroNotaFiscal: string) => {
    const estoqueAtual = getStorageData<ItemEstoque>("estoque");
    const itensDaNota = estoqueAtual.filter((item) => item.numeroNotaFiscal === numeroNotaFiscal);

    if (itensDaNota.length === 0) return;

    setNotaEmEdicaoId(numeroNotaFiscal);
    setNumeroNota(numeroNotaFiscal);
    setDataEntradaNota(itensDaNota[0].dataEntrada || new Date().toISOString().split("T")[0]);

    const catalogo = await sincronizarCatalogoAgrofit();

   const itensTempCarregados: ItemNotaTemporario[] = itensDaNota.map((item) => {
      const prodEncontrado = catalogo.find(p => p.id === item.produtoId) || {
        id: item.produtoId,
        registro: "",
        nomeComercial: item.nomeProduto,
        titularRegistro: "",
        ingredienteAtivo: "",
        formulacao: "",
        grupoQuimico: "",
        classeToxicologica: "",
        cultura: "",
        praga: "",
        indicacoesUso: [], // <--- Adicionado para satisfazer a interface
        unidadePadrao: item.unidade,
      };

      return {
        idTemp: item.id,
        produto: prodEncontrado,
        lote: item.lote,
        quantidade: String(item.quantidadeAtual),
        unidade: item.unidade as "L" | "KG" | "ML" | "G",
        dataValidade: item.dataValidade,
      };
    });

    setItensNota(itensTempCarregados);
    limparCamposItem();
    setModo('formulario');
  };

  // Agrupar o estoque por Nota Fiscal para exibir na listagem consolidada
  const notasAgrupadas = estoque.reduce((acc, item) => {
    const nf = item.numeroNotaFiscal || "S/N";
    if (!acc[nf]) {
      acc[nf] = {
        numeroNotaFiscal: nf,
        dataEntrada: item.dataEntrada || 'N/A',
        itens: [],
      };
    }
    acc[nf].itens.push(item);
    return acc;
  }, {} as Record<string, { numeroNotaFiscal: string; dataEntrada: string; itens: ItemEstoque[] }>);

  const listaNotas = Object.values(notasAgrupadas);

  // 1. TELA DE FORMULÁRIO
  if (modo === 'formulario') {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 border border-emerald-100">
          <div className="flex items-center justify-between mb-6 border-b pb-4">
            <div className="flex items-center space-x-3">
              <FilePlus className="h-7 w-7 text-emerald-600" />
              <h2 className="text-xl font-bold text-gray-800">
                {notaEmEdicaoId ? `Editar Nota Fiscal: ${notaEmEdicaoId}` : "Lançamento de Entrada por Nota Fiscal"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setModo('lista')}
              className="text-gray-600 hover:text-gray-800 text-sm flex items-center space-x-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </button>
          </div>

          <form onSubmit={handleSubmitNota} className="space-y-6">
            {/* Cabeçalho da Nota */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número da Nota Fiscal *
                </label>
                <input
                  type="text"
                  required
                  value={numeroNota}
                  onChange={(e) => setNumeroNota(e.target.value)}
                  placeholder="Ex: 000458"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Entrada *
                </label>
                <input
                  type="date"
                  required
                  value={dataEntradaNota}
                  onChange={(e) => setDataEntradaNota(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Adicionar Produtos / Lotes da Nota */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-4">
              <h3 className="text-md font-semibold text-gray-800 flex items-center space-x-2">
                <PackagePlus className="h-5 w-5 text-emerald-600" />
                <span>Adicionar Produtos e Lotes à Nota</span>
              </h3>

              {/* Busca Agrofit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar Produto (Base Agrofit)
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    placeholder="Nome comercial ou ingrediente ativo..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleBuscar}
                    className="bg-emerald-700 text-white px-4 py-2 rounded-md hover:bg-emerald-800 transition flex items-center space-x-1 text-sm"
                  >
                    <Search className="h-4 w-4" />
                    <span>Buscar</span>
                  </button>
                </div>

                <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-md bg-white divide-y">
                  {produtosDisponiveis.length === 0 ? (
                    <p className="p-2 text-xs text-gray-500 text-center">Nenhum produto encontrado.</p>
                  ) : (
                    produtosDisponiveis.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => {
                          setProdutoSelecionado(prod);
                          setUnidade((prod.unidadePadrao as "L" | "KG" | "ML" | "G") || "L");
                        }}
                        className={`p-2 cursor-pointer transition text-xs flex justify-between items-center ${
                          produtoSelecionado?.id === prod.id ? "bg-emerald-100 font-semibold" : "hover:bg-gray-50"
                        }`}
                      >
                        <div>
                          <p className="text-gray-900 font-medium">{prod.nomeComercial}</p>
                          <p className="text-gray-500">Ativo: {prod.ingredienteAtivo}</p>
                        </div>
                        <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{prod.classeToxicologica}</span>
                      </div>
                    ))
                  )}
                </div>
                {produtoSelecionado && (
                  <p className="mt-1 text-xs text-emerald-700 font-semibold">
                    Selecionado: {produtoSelecionado.nomeComercial}
                  </p>
                )}
              </div>

              {/* Detalhes do Lote, Qtd e Validade */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Lote</label>
                  <input
                    type="text"
                    value={lote}
                    onChange={(e) => setLote(e.target.value)}
                    placeholder="Ex: LOT-A"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Quantidade</label>
                  <input
                    type="number"
                    step="0.01"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    placeholder="Ex: 50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unidade</label>
                  <select
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value as "L" | "KG" | "ML" | "G")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="L">Litros (L)</option>
                    <option value="KG">Quilogramas (KG)</option>
                    <option value="ML">Mililitros (ML)</option>
                    <option value="G">Gramas (G)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Validade do Lote</label>
                  <input
                    type="date"
                    value={dataValidade}
                    onChange={(e) => setDataValidade(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleAdicionarItemNaNota}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm px-4 py-2 rounded-md transition flex items-center space-x-1"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Incluir Lote/Produto na Nota</span>
                </button>
              </div>
            </div>

            {/* Tabela de Itens Adicionados na Nota Atual */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Itens Inseridos Nesta Nota ({itensNota.length})</h4>
              {itensNota.length === 0 ? (
                <p className="text-xs text-gray-500 italic bg-gray-50 p-4 rounded-md border text-center">
                  Nenhum item adicionado ainda. Preencha os campos acima e clique em "Incluir Lote/Produto na Nota". (Você pode adicionar vários produtos ou vários lotes do mesmo produto).
                </p>
              ) : (
                <div className="overflow-x-auto border rounded-md">
                  <table className="min-w-full divide-y divide-gray-200 text-sm bg-white">
                    <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
                      <tr>
                        <th className="px-3 py-2 text-left">Produto</th>
                        <th className="px-3 py-2 text-left">Lote</th>
                        <th className="px-3 py-2 text-left">Quantidade</th>
                        <th className="px-3 py-2 text-left">Validade</th>
                        <th className="px-3 py-2 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {itensNota.map((item) => (
                        <tr key={item.idTemp} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-900">{item.produto.nomeComercial}</td>
                          <td className="px-3 py-2 font-mono text-emerald-800">{item.lote}</td>
                          <td className="px-3 py-2 font-bold">{item.quantidade} {item.unidade}</td>
                          <td className="px-3 py-2 text-gray-600">{item.dataValidade}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoverItemTemp(item.idTemp)}
                              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                              title="Remover item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Botão Salvar Geral */}
            <div className="flex justify-end pt-4 space-x-3 border-t">
              <button
                type="button"
                onClick={() => setModo('lista')}
                className="bg-gray-300 text-gray-700 font-medium px-4 py-2 rounded-md hover:bg-gray-400 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-emerald-600 text-white font-medium px-6 py-2 rounded-md hover:bg-emerald-700 transition shadow"
              >
                {notaEmEdicaoId ? "Salvar Alterações da Nota" : "Salvar Nota Fiscal no Estoque"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 2. TELA DE LISTAGEM DE NOTAS
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 border border-emerald-100">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4 gap-4">
          <div className="flex items-center space-x-3">
            <History className="h-7 w-7 text-emerald-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">Histórico de Entradas de Notas Fiscais</h2>
              <p className="text-sm text-gray-500">Notas fiscais cadastradas, contendo múltiplos produtos e lotes.</p>
            </div>
          </div>
          <button
            onClick={abrirNovaEntrada}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-md transition flex items-center space-x-2 shadow"
          >
            <PackagePlus className="h-5 w-5" />
            <span>Nova Entrada de Nota</span>
          </button>
        </div>

        {listaNotas.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
            <FilePlus className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="font-medium">Nenhuma nota fiscal lançada no estoque ainda.</p>
            <p className="text-sm text-gray-400 mt-1">Clique em "Nova Entrada de Nota" para começar.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {listaNotas.map((nota) => (
              <div key={nota.numeroNotaFiscal} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-gray-50 px-4 py-3 flex flex-col md:flex-row justify-between items-start md:items-center border-b gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded">
                      NF: {nota.numeroNotaFiscal}
                    </span>
                    <span className="text-xs text-gray-500">Data de Entrada: {nota.dataEntrada}</span>
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                      {nota.itens.length} {nota.itens.length === 1 ? 'item / lote' : 'itens / lotes'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditarNota(nota.numeroNotaFiscal)}
                      title="Editar Nota"
                      className="text-amber-600 hover:text-amber-800 p-1.5 bg-amber-50 rounded border border-amber-200 transition text-xs flex items-center space-x-1"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleExcluirNota(nota.numeroNotaFiscal)}
                      title="Excluir Nota"
                      className="text-red-600 hover:text-red-800 p-1.5 bg-red-50 rounded border border-red-200 transition text-xs flex items-center space-x-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>

                <div className="p-3">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 uppercase">
                        <th className="pb-2 text-left">Produto</th>
                        <th className="pb-2 text-left">Lote</th>
                        <th className="pb-2 text-left">Validade</th>
                        <th className="pb-2 text-right">Quantidade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {nota.itens.map((item) => (
                        <tr key={item.id} className="hover:bg-emerald-50/20">
                          <td className="py-2 font-medium text-gray-900">{item.nomeProduto}</td>
                          <td className="py-2 font-mono text-xs text-gray-600">{item.lote}</td>
                          <td className="py-2 text-xs text-gray-600">{item.dataValidade}</td>
                          <td className="py-2 text-right font-bold text-emerald-700">
                            {item.quantidadeAtual} {item.unidade}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};