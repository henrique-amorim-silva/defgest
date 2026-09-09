import React, { useState, useEffect } from "react";
import { sincronizarCatalogoAgrofit } from "../services/agrofitApi";
import type { ProdutoAgrofitCompleto } from "../services/agrofitApi";
import { getStorageData, setStorageData } from "../utils/storage";
import type { ItemEstoque } from "../@types/estoque";
import { FilePlus, Search, CheckCircle2 } from "lucide-react";

export const EntradaNota: React.FC = () => {
  const [termoBusca, setTermoBusca] = useState("");
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<
    ProdutoAgrofitCompleto[]
  >([]);
  const [produtoSelecionado, setProdutoSelecionado] =
    useState<ProdutoAgrofitCompleto | null>(null);

  const [numeroNota, setNumeroNota] = useState("");
  const [lote, setLote] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState<"L" | "KG" | "ML" | "G">("L");
  const [dataValidade, setDataValidade] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  useEffect(() => {
    carregarProdutos("");
  }, []);

  const carregarProdutos = async (termo: string) => {
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

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    carregarProdutos(termoBusca);
  };

  const handleSubmitEntrada = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !produtoSelecionado ||
      !numeroNota ||
      !lote ||
      !quantidade ||
      !dataValidade
    ) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const novoItem: ItemEstoque = {
      id: String(new Date().getTime()),
      produtoId: produtoSelecionado.id,
      nomeProduto: produtoSelecionado.nomeComercial,
      lote,
      quantidadeAtual: Number(quantidade),
      unidade,
      dataValidade,
      numeroNotaFiscal: numeroNota,
      dataEntrada: new Date().toISOString().split("T")[0],
    };

    // Recupera estoque atual e adiciona o novo item
    const estoqueAtual = getStorageData<ItemEstoque>("estoque");
    setStorageData("estoque", [...estoqueAtual, novoItem]);

    // Limpa formulário
    setNumeroNota("");
    setLote("");
    setQuantidade("");
    setDataValidade("");
    setProdutoSelecionado(null);
    setMensagemSucesso("Nota fiscal lançada e estoque atualizado com sucesso!");

    setTimeout(() => {
      setMensagemSucesso("");
    }, 4000);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 border border-emerald-100">
        <div className="flex items-center space-x-3 mb-6 border-b pb-4">
          <FilePlus className="h-7 w-7 text-emerald-600" />
          <h2 className="text-xl font-bold text-gray-800">
            Lançamento de Entrada de Nota Fiscal
          </h2>
        </div>

        {mensagemSucesso && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>{mensagemSucesso}</span>
          </div>
        )}

        <form onSubmit={handleSubmitEntrada} className="space-y-6">
          {/* Dados da Nota */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Validade do Lote *
              </label>
              <input
                type="date"
                required
                value={dataValidade}
                onChange={(e) => setDataValidade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Seleção do Produto / Busca Agrofit */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar Produto (Base Agrofit) *
            </label>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                placeholder="Digite o nome comercial ou ingrediente ativo..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleBuscar}
                className="bg-emerald-700 text-white px-4 py-2 rounded-md hover:bg-emerald-800 transition flex items-center space-x-1"
              >
                <Search className="h-4 w-4" />
                <span>Buscar</span>
              </button>
            </div>

            {/* Lista de Produtos Encontrados */}
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md divide-y">
              {produtosDisponiveis.length === 0 ? (
                <p className="p-3 text-sm text-gray-500 text-center">
                  Nenhum produto encontrado.
                </p>
              ) : (
                produtosDisponiveis.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      setProdutoSelecionado(prod);
                      setUnidade(
                        (prod.unidadePadrao as "L" | "KG" | "ML" | "G") || "L",
                      );
                    }}
                    className={`p-3 cursor-pointer transition flex justify-between items-center ${
                      produtoSelecionado?.id === prod.id
                        ? "bg-emerald-100 font-medium"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div>
                      <p className="text-sm text-gray-900 font-semibold">
                        {prod.nomeComercial}
                      </p>
                      <p className="text-xs text-gray-500">
                        Ativo: {prod.ingredienteAtivo} | Cultura: {prod.cultura}
                      </p>
                    </div>
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                      {prod.classeToxicologica}
                    </span>
                  </div>
                ))
              )}
            </div>
            {produtoSelecionado && (
              <p className="mt-2 text-sm text-emerald-700 font-medium">
                Produto selecionado: {produtoSelecionado.nomeComercial}
              </p>
            )}
          </div>

          {/* Quantidade e Lote */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lote *
              </label>
              <input
                type="text"
                required
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                placeholder="Ex: LOT2026X"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantidade *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                placeholder="Ex: 100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidade *
              </label>
              <select
                value={unidade}
                onChange={(e) =>
                  setUnidade(e.target.value as "L" | "KG" | "ML" | "G")
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="L">Litros (L)</option>
                <option value="KG">Quilogramas (KG)</option>
                <option value="ML">Mililitros (ML)</option>
                <option value="G">Gramas (G)</option>
              </select>
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-emerald-600 text-white font-medium px-6 py-2 rounded-md hover:bg-emerald-700 transition shadow"
            >
              Salvar Entrada no Estoque
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
