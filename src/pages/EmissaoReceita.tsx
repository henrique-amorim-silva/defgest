import React, { useState, useEffect } from 'react';
import { getStorageData, setStorageData } from '../utils/storage';
import type { ItemEstoque } from '../@types/estoque';
import type { ReceitaAgronomica } from '../@types/receita';
import { FileText, Plus, Trash2, CheckCircle2, Printer, Edit, ArrowLeft, History } from 'lucide-react';

export const EmissaoReceita: React.FC = () => {
  const [estoque, setEstoque] = useState<ItemEstoque[]>([]);
  const [receitas, setReceitas] = useState<ReceitaAgronomica[]>([]);
  
  // Modos de tela: 'lista' | 'formulario' | 'sucesso'
  const [modo, setModo] = useState<'lista' | 'formulario' | 'sucesso'>('lista');
  const [receitaEmEdicaoId, setReceitaEmEdicaoId] = useState<string | null>(null);

  // Campos do Formulário
  const [produtorNome, setProdutorNome] = useState('');
  const [produtorCpfCnpj, setProdutorCpfCnpj] = useState('');
  const [propriedadeNome, setPropriedadeNome] = useState('');
  const [orientacoes, setOrientacoes] = useState('');
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

  // Seleção temporária de produto
  const [produtoSelecionadoId, setprodutoSelecionadoId] = useState('');
  const [dosagem, setDosagem] = useState('');
  const [area, setArea] = useState('');

  const [receitaEmitida, setReceitaEmitida] = useState<ReceitaAgronomica | null>(null);

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  const carregarDadosIniciais = () => {
    const dadosEstoque = getStorageData<ItemEstoque>('estoque');
    const dadosReceitas = getStorageData<ReceitaAgronomica>('receitas');
    setEstoque(dadosEstoque);
    setReceitas(dadosReceitas);
  };

  const abrirNovaReceita = () => {
    setReceitaEmEdicaoId(null);
    setProdutorNome('');
    setProdutorCpfCnpj('');
    setPropriedadeNome('');
    setOrientacoes('');
    setItensReceita([]);
    setModo('formulario');
  };

  const handleAdicionarItem = () => {
    if (!produtoSelecionadoId || !dosagem || !area) {
      alert('Selecione o produto, informe a dosagem e a área de aplicação.');
      return;
    }

    const itemEstoque = estoque.find((e) => e.produtoId === produtoSelecionadoId || e.id === produtoSelecionadoId);
    if (!itemEstoque) return;

    const areaNum = Number(area);
    const dosagemNum = Number(dosagem);
    const quantidadeTotal = dosagemNum * areaNum;

    // Se estiver editando, precisamos considerar o que já estava reservado por esta receita anteriormente
    let qtdJaNaReceita = 0;
    if (receitaEmEdicaoId) {
      const receitaAntiga = receitas.find(r => r.id === receitaEmEdicaoId);
      const itemAntigo = receitaAntiga?.itens.find(i => i.produtoId === itemEstoque.id);
      if (itemAntigo) {
        qtdJaNaReceita = itemAntigo.quantidadeRecomendada;
      }
    }

    const saldoDisponivel = itemEstoque.quantidadeAtual + qtdJaNaReceita;
    if (quantidadeTotal > saldoDisponivel) {
      alert(`Quantidade insuficiente em estoque! Disponível atual: ${itemEstoque.quantidadeAtual} ${itemEstoque.unidade}`);
      return;
    }

    // Evitar duplicar o mesmo produto na lista (opcional: somar ou avisar)
    const indexExistente = itensReceita.findIndex(i => i.produtoId === itemEstoque.id);
    if (indexExistente >= 0) {
      const novaLista = [...itensReceita];
      novaLista[indexExistente] = {
        produtoId: itemEstoque.id,
        nomeProduto: itemEstoque.nomeProduto,
        quantidadeRecomendada: quantidadeTotal,
        unidade: itemEstoque.unidade,
        dosagemPorHectare: `${dosagem} ${itemEstoque.unidade}/ha`,
        areaAplicacaoHectares: areaNum,
      };
      setItensReceita(novaLista);
    } else {
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
    }

    setprodutoSelecionadoId('');
    setDosagem('');
    setArea('');
  };

  const handleRemoverItem = (index: number) => {
    setItensReceita(itensReceita.filter((_, i) => i !== index));
  };

  const handleSalvarReceita = (e: React.FormEvent) => {
    e.preventDefault();
    if (itensReceita.length === 0) {
      alert('Adicione pelo menos um produto à receita.');
      return;
    }

    const estoqueAtual = getStorageData<ItemEstoque>('estoque');
    let novoEstoque = [...estoqueAtual];

    if (receitaEmEdicaoId) {
      // EDIÇÃO: Estorna o estoque antigo e abate o novo
      const receitaAntiga = receitas.find(r => r.id === receitaEmEdicaoId);
      if (receitaAntiga) {
        receitaAntiga.itens.forEach(itemAntigo => {
          const prod = novoEstoque.find(e => e.id === itemAntigo.produtoId);
          if (prod) {
            prod.quantidadeAtual += itemAntigo.quantidadeRecomendada;
          }
        });
      }

      // Abate os novos itens
      itensReceita.forEach(itemNovo => {
        const prod = novoEstoque.find(e => e.id === itemNovo.produtoId);
        if (prod) {
          prod.quantidadeAtual = Math.max(0, prod.quantidadeAtual - itemNovo.quantidadeRecomendada);
        }
      });

      const receitaAtualizada: ReceitaAgronomica = {
        id: receitaEmEdicaoId,
        numeroReceita: receitas.find(r => r.id === receitaEmEdicaoId)?.numeroReceita || `REC-${Math.floor(100000 + Math.random() * 900000)}`,
        produtorNome,
        produtorCpfCnpj,
        propriedadeNome,
        itens: itensReceita,
        orientacoes,
        dataEmissao: receitas.find(r => r.id === receitaEmEdicaoId)?.dataEmissao || new Date().toLocaleDateString('pt-BR'),
      };

      const listaAtualizada = receitas.map(r => r.id === receitaEmEdicaoId ? receitaAtualizada : r);
      setStorageData('receitas', listaAtualizada);
      setStorageData('estoque', novoEstoque);
      setReceitas(listaAtualizada);
      setEstoque(novoEstoque);
      setReceitaEmitida(receitaAtualizada);
      setModo('sucesso');

    } else {
      // CRIAÇÃO NOVA: Abate do estoque
      itensReceita.forEach(itemNovo => {
        const prod = novoEstoque.find(e => e.id === itemNovo.produtoId);
        if (prod) {
          prod.quantidadeAtual = Math.max(0, prod.quantidadeAtual - itemNovo.quantidadeRecomendada);
        }
      });

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

      const listaAtualizada = [novaReceita, ...receitas];
      setStorageData('receitas', listaAtualizada);
      setStorageData('estoque', novoEstoque);
      setReceitas(listaAtualizada);
      setEstoque(novoEstoque);
      setReceitaEmitida(novaReceita);
      setModo('sucesso');
    }
  };

  const handleExcluirReceita = (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta receita? Os produtos serão devolvidos ao estoque.')) return;

    const receitaAlvo = receitas.find(r => r.id === id);
    if (!receitaAlvo) return;

    // Estornar itens para o estoque
    const estoqueAtual = getStorageData<ItemEstoque>('estoque');
    const novoEstoque = estoqueAtual.map(item => {
      const itemReceita = receitaAlvo.itens.find(i => i.produtoId === item.id);
      if (itemReceita) {
        return {
          ...item,
          quantidadeAtual: item.quantidadeAtual + itemReceita.quantidadeRecomendada
        };
      }
      return item;
    });

    const novasReceitas = receitas.filter(r => r.id !== id);

    setStorageData('receitas', novasReceitas);
    setStorageData('estoque', novoEstoque);
    setReceitas(novasReceitas);
    setEstoque(novoEstoque);
  };

  const handleEditarReceita = (receita: ReceitaAgronomica) => {
    setReceitaEmEdicaoId(receita.id);
    setProdutorNome(receita.produtorNome);
    setProdutorCpfCnpj(receita.produtorCpfCnpj);
    setPropriedadeNome(receita.propriedadeNome);
    setOrientacoes(receita.orientacoes || '');
    setItensReceita([...receita.itens]);
    setModo('formulario');
  };

  // 1. TELA DE SUCESSO / VISUALIZAÇÃO DA RECEITA
  if (modo === 'sucesso' && receitaEmitida) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="bg-white rounded-xl shadow-md p-8 border border-emerald-100 print:shadow-none">
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <div className="flex items-center space-x-2 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
              <h2 className="text-xl font-bold">Receita Agronômica Salva com Sucesso!</h2>
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
              onClick={() => setModo('lista')}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition"
            >
              Voltar ao Histórico
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. TELA DE FORMULÁRIO (Criação / Edição)
  if (modo === 'formulario') {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 border border-emerald-100">
          <div className="flex items-center justify-between mb-6 border-b pb-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-7 w-7 text-emerald-600" />
              <h2 className="text-xl font-bold text-gray-800">
                {receitaEmEdicaoId ? 'Editar Receita Agronômica' : 'Nova Emissão de Receita Agronômica'}
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

          <form onSubmit={handleSalvarReceita} className="space-y-6">
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
                placeholder="Ex: Utilizar EPI completo (luvas, máscara, bota)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              ></textarea>
            </div>

            <div className="flex justify-end pt-4 space-x-3">
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
                {receitaEmEdicaoId ? 'Salvar Alterações' : 'Emitir Receita Agronômica'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 3. TELA DE LISTAGEM / HISTÓRICO DE RECEITAS
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 border border-emerald-100">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4 gap-4">
          <div className="flex items-center space-x-3">
            <History className="h-7 w-7 text-emerald-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">Histórico de Receitas Agronômicas</h2>
              <p className="text-sm text-gray-500">Gerencie, edite ou emita novas receitas com controle de estoque integrado.</p>
            </div>
          </div>
          <button
            onClick={abrirNovaReceita}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-md transition flex items-center space-x-2 shadow"
          >
            <Plus className="h-5 w-5" />
            <span>Nova Receita</span>
          </button>
        </div>

        {receitas.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="font-medium">Nenhuma receita emitida até o momento.</p>
            <p className="text-sm text-gray-400 mt-1">Clique em "Nova Receita" para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nº Receita</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Produtor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Propriedade</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Itens / Produtos</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {receitas.map((rec) => (
                  <tr key={rec.id} className="hover:bg-emerald-50/40 transition">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-mono font-bold text-emerald-800">
                      {rec.numeroReceita}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {rec.dataEmissao}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {rec.produtorNome}
                      <div className="text-xs font-normal text-gray-500">{rec.produtorCpfCnpj}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {rec.propriedadeNome}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      <ul className="list-disc list-inside text-xs space-y-1">
                        {rec.itens.map((it, idx) => (
                          <li key={idx}>
                            <span className="font-medium text-gray-900">{it.nomeProduto}</span>: {it.quantidadeRecomendada} {it.unidade}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditarReceita(rec)}
                        title="Editar Receita"
                        className="text-amber-600 hover:text-amber-800 p-1 bg-amber-50 rounded border border-amber-200 transition"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleExcluirReceita(rec.id)}
                        title="Excluir Receita"
                        className="text-red-600 hover:text-red-800 p-1 bg-red-50 rounded border border-red-200 transition"
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
    </div>
  );
};