import React, { useState, useEffect } from 'react';
import { getStorageData, setStorageData } from '../utils/storage';
import type { ItemEstoque } from '../@types/estoque';
import type { ReceitaAgronomica } from '../@types/receita';
import { FileText, Plus, Trash2, CheckCircle2, Printer } from 'lucide-react';

export const EmissaoReceita: React.FC = () => {
  const [estoque, setEstoque] = useState<ItemEstoque[]>([]);
  const [produtorNome, setProdutorNome] = useState('');
  const [produtorCpfCnpj, setProdutorCpfCnpj] = useState('');
  const [propriedadeNome, setPropriedadeNome] = useState('');
  const [orientacoes, setOrientacoes] = useState('');

  // Itens da receita atual
  const [itensReceita, setItensReceita] = useState<
    {
      produtoId: string;
      nomeProduto: string;
      quantidadeRecomendada: number;
      unidade: string;
      dosagemPorHectare: string;
      areaAplicacaoHectares: number;
    }[]
  >([]);

  // Seleção temporária para adicionar na lista da receita
  const [produtoSelecionadoId, setprodutoSelecionadoId] = useState('');
  const [dosagem, setDosagem] = useState('');
  const [area, setArea] = useState('');

  const [receitaEmitida, setReceitaEmitida] = useState<ReceitaAgronomica | null>(null);

  useEffect(() => {
    const dadosEstoque = getStorageData<ItemEstoque>('estoque');
    setEstoque(dadosEstoque);
  }, []);

  const handleAdicionarItem = () => {
    if (!produtoSelecionadoId || !dosagem || !area) {
      alert('Selecione o produto, informe a dosagem e a área de aplicação.');
      return;
    }

    const itemEstoque = estoque.find((e) => e.produtoId === produtoSelecionadoId || e.id === produtoSelecionadoId);
    if (!itemEstoque) return;

    const areaNum = Number(area);
    const dosagemNum = Number(dosagem);
    // Cálculo simples sugerido: Dosagem x Área (ou ajuste conforme regra agronômica)
    const quantidadeTotal = dosagemNum * areaNum;

    if (quantidadeTotal > itemEstoque.quantidadeAtual) {
      alert(`Quantidade insuficiente em estoque! Disponível: ${itemEstoque.quantidadeAtual} ${itemEstoque.unidade}`);
      return;
    }

    setItensReceita([
      ...itensReceita,
      {
        produtoId: itemEstoque.id,
        nomeProduto: itemEstoque.nomeProduto,
        quantidadeRecomendada: quantidadeTotal,
        unidade: itemEstoque.unidade,
        dosagemPorHectare: `${dosagem} ${itemEstoque.unidade}/ha`,
        areaAplicacaoHectares: areaNum,
      },
    ]);

    setprodutoSelecionadoId('');
    setDosagem('');
    setArea('');
  };

  const handleRemoverItem = (index: number) => {
    const novaLista = itensReceita.filter((_, i) => i !== index);
    setItensReceita(novaLista);
  };

  const handleEmitirReceita = (e: React.FormEvent) => {
    e.preventDefault();
    if (itensReceita.length === 0) {
      alert('Adicione pelo menos um produto à receita.');
      return;
    }

    const novaReceita: ReceitaAgronomica = {
      id: String(new Date().getTime()),
      numeroReceita: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
      produtorNome,
      produtorCpfCnpj,
      propriedadeNome,
      itens: itensReceita,
      orientacoes,
      dataEmissao: new Date().toLocaleDateString('pt-BR'),
    };

    // Baixa automática no estoque local
    const estoqueAtual = getStorageData<ItemEstoque>('estoque');
    const estoqueAtualizado = estoqueAtual.map((item) => {
      const itemNaReceita = itensReceita.find((r) => r.produtoId === item.id);
      if (itemNaReceita) {
        return {
          ...item,
          quantidadeAtual: Math.max(0, item.quantidadeAtual - itemNaReceita.quantidadeRecomendada),
        };
      }
      return item;
    });

    setStorageData('estoque', estoqueAtualizado);
    setEstoque(estoqueAtualizado);
    setReceitaEmitida(novaReceita);
  };

  const resetarFormulario = () => {
    setProdutorNome('');
    setProdutorCpfCnpj('');
    setPropriedadeNome('');
    setOrientacoes('');
    setItensReceita([]);
    setReceitaEmitida(null);
  };

  if (receitaEmitida) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="bg-white rounded-xl shadow-md p-8 border border-emerald-100 print:shadow-none">
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <div className="flex items-center space-x-2 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
              <h2 className="text-xl font-bold">Receita Agronômica Emitida com Sucesso!</h2>
            </div>
            <span className="font-mono bg-emerald-100 text-emerald-800 px-3 py-1 rounded font-bold">
              {receitaEmitida.numeroReceita}
            </span>
          </div>

          <div className="space-y-4 text-sm text-gray-700">
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p><strong className="text-gray-900">Produtor:</strong> {receitaEmitida.produtorNome}</p>
                <p><strong className="text-gray-900">CPF/CNPJ:</strong> {receitaEmitida.produtorCpfCnpj}</p>
              </div>
              <div>
                <p><strong className="text-gray-900">Propriedade:</strong> {receitaEmitida.propriedadeNome}</p>
                <p><strong className="text-gray-900">Emissão:</strong> {receitaEmitida.dataEmissao}</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">Produtos Recomendados:</h3>
              <table className="min-w-full divide-y divide-gray-200 border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Produto</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Dosagem</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Área (ha)</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Qtd. Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {receitaEmitida.itens.map((i, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 font-semibold text-gray-900">{i.nomeProduto}</td>
                      <td className="px-4 py-2">{i.dosagemPorHectare}</td>
                      <td className="px-4 py-2">{i.areaAplicacaoHectares} ha</td>
                      <td className="px-4 py-2 font-bold text-emerald-700">{i.quantidadeRecomendada} {i.unidade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {receitaEmitida.orientacoes && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded text-amber-900">
                <strong>Orientações Técnicas / EPIs:</strong> {receitaEmitida.orientacoes}
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <button
              onClick={() => window.print()}
              className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition flex items-center space-x-1"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              onClick={resetarFormulario}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition"
            >
              Nova Receita
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 border border-emerald-100">
        <div className="flex items-center space-x-3 mb-6 border-b pb-4">
          <FileText className="h-7 w-7 text-emerald-600" />
          <h2 className="text-xl font-bold text-gray-800">Emissão de Receita Agronômica</h2>
        </div>

        <form onSubmit={handleEmitirReceita} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produtor *</label>
              <input
                type="text"
                required
                value={produtorNome}
                onChange={(e) => setProdutorNome(e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF / CNPJ *</label>
              <input
                type="text"
                required
                value={produtorCpfCnpj}
                onChange={(e) => setProdutorCpfCnpj(e.target.value)}
                placeholder="Ex: 000.000.000-00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Propriedade *</label>
              <input
                type="text"
                required
                value={propriedadeNome}
                onChange={(e) => setPropriedadeNome(e.target.value)}
                placeholder="Ex: Fazenda Boa Vista"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Adicionar Produtos na Receita */}
          <div className="border-t pt-4">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Adicionar Produtos do Estoque</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-lg">
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Produto em Estoque</label>
                <select
                  value={produtoSelecionadoId}
                  onChange={(e) => setprodutoSelecionadoId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                >
                  <option value="">Selecione...</option>
                  {estoque.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nomeProduto} (Estoque: {item.quantidadeAtual} {item.unidade})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Dosagem por Hectare</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 2"
                  value={dosagem}
                  onChange={(e) => setDosagem(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Área (Hectares)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 50"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAdicionarItem}
                  className="w-full bg-emerald-700 text-white text-sm font-medium py-2 rounded-md hover:bg-emerald-800 transition flex items-center justify-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>

            {/* Tabela de itens adicionados */}
            <div className="mt-4">
              {itensReceita.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200 border rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Produto</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Dosagem</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Área</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Qtd. Total</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {itensReceita.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm font-semibold text-gray-900">{item.nomeProduto}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{item.dosagemPorHectare}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{item.areaAplicacaoHectares} ha</td>
                        <td className="px-4 py-2 text-sm font-bold text-emerald-700">{item.quantidadeRecomendada} {item.unidade}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoverItem(idx)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg border border-dashed">
                  Nenhum produto adicionado à receita ainda.
                </p>
              )}
            </div>
          </div>

          {/* Orientações */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Orientações Técnicas e Equipamentos de Proteção (EPI)</label>
            <textarea
              rows={3}
              value={orientacoes}
              onChange={(e) => setOrientacoes(e.target.value)}
              placeholder="Ex: Utilizar EPI completo (luvas, máscara, bota), evitar aplicação em horários quentes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            ></textarea>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-emerald-600 text-white font-medium px-6 py-2 rounded-md hover:bg-emerald-700 transition shadow"
            >
              Emitir Receita Agronômica
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};