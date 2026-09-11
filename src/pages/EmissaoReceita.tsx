import React, { useState, useEffect } from 'react';
import { getStorageData, setStorageData } from '../utils/storage';
import { sincronizarCatalogoAgrofit } from '../services/agrofitApi';
import type { ItemEstoque } from '../@types/estoque';
import type { ReceitaAgronomica } from '../@types/receita';
import type { ProdutoAgrofitCompleto, IndicacaoUsoAgrofit } from '../services/agrofitApi';
import { FileText, Plus, Trash2, CheckCircle2, Printer, Edit, ArrowLeft, History } from 'lucide-react';

export const EmissaoReceita: React.FC = () => {
  const [estoque, setEstoque] = useState<ItemEstoque[]>([]);
  const [catalogoAgrofit, setCatalogoAgrofit] = useState<ProdutoAgrofitCompleto[]>([]);
  const [receitas, setReceitas] = useState<ReceitaAgronomica[]>([]);
  
  const [modo, setModo] = useState<'lista' | 'formulario' | 'sucesso'>('lista');
  const [receitaEmEdicaoId, setReceitaEmEdicaoId] = useState<string | null>(null);

  // Campos do Formulário
  const [produtorNome, setProdutorNome] = useState('');
  const [produtorCpfCnpj, setProdutorCpfCnpj] = useState('');
  const [propriedadeNome, setPropriedadeNome] = useState('');
  const [orientacoes, setOrientacoes] = useState('');
  const [itensReceita, setItensReceita] = useState<ReceitaAgronomica['itens']>([]);

  // Seleção e correlação do item atual
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState('');
  const [culturaSelecionada, setCulturaSelecionada] = useState('');
  const [pragaSelecionadaIndex, setPragaSelecionadaIndex] = useState<number | string>('');
  
  const [area, setArea] = useState('');
  const [dosagemUtilizada, setDosagemUtilizada] = useState('');
  const [volumeCaldaUtilizado, setVolumeCaldaUtilizado] = useState('');

  // Listas auxiliares filtradas para os selects dependentes
  const [culturasDisponiveis, setCulturasDisponiveis] = useState<string[]>([]);
  const [pragasDisponiveis, setPragasDisponiveis] = useState<IndicacaoUsoAgrofit[]>([]);
  const [indicacaoAtiva, setIndicacaoAtiva] = useState<IndicacaoUsoAgrofit | null>(null);

  const [receitaEmitida, setReceitaEmitida] = useState<ReceitaAgronomica | null>(null);

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  const carregarDadosIniciais = async () => {
    const dadosEstoque = getStorageData<ItemEstoque>('estoque');
    const dadosReceitas = getStorageData<ReceitaAgronomica>('receitas');
    const catalogo = await sincronizarCatalogoAgrofit();
    setEstoque(dadosEstoque);
    setReceitas(dadosReceitas);
    setCatalogoAgrofit(catalogo);
  };

  const abrirNovaReceita = () => {
    setReceitaEmEdicaoId(null);
    setProdutorNome('');
    setProdutorCpfCnpj('');
    setPropriedadeNome('');
    setOrientacoes('');
    setItensReceita([]);
    limparCamposSelecao();
    setModo('formulario');
  };

  const limparCamposSelecao = () => {
    setProdutoSelecionadoId('');
    setCulturaSelecionada('');
    setPragaSelecionadaIndex('');
    setArea('');
    setDosagemUtilizada('');
    setVolumeCaldaUtilizado('');
    setCulturasDisponiveis([]);
    setPragasDisponiveis([]);
    setIndicacaoAtiva(null);
  };

  // 1. Ao selecionar o produto do estoque, extraímos as culturas permitidas no Agrofit
  const handleSelecionarProdutoEstoque = (idEstoque: string) => {
    setProdutoSelecionadoId(idEstoque);
    setCulturaSelecionada('');
    setPragaSelecionadaIndex('');
    setPragasDisponiveis([]);
    setIndicacaoAtiva(null);
    setDosagemUtilizada('');
    setVolumeCaldaUtilizado('');

    const itemEstoque = estoque.find(e => e.id === idEstoque);
    if (!itemEstoque) {
      setCulturasDisponiveis([]);
      return;
    }

    const prodAgrofit = catalogoAgrofit.find(p => p.id === itemEstoque.produtoId || p.nomeComercial === itemEstoque.nomeProduto);
    if (prodAgrofit && prodAgrofit.indicacoesUso) {
      const culturasUnicas = Array.from(new Set(prodAgrofit.indicacoesUso.map(i => i.cultura)));
      setCulturasDisponiveis(culturasUnicas);
    } else {
      setCulturasDisponiveis([]);
    }
  };

  // 2. Ao selecionar a cultura, filtramos as pragas estritamente correlacionadas a esta cultura para este produto
  const handleSelecionarCultura = (cultura: string) => {
    setCulturaSelecionada(cultura);
    setPragaSelecionadaIndex('');
    setIndicacaoAtiva(null);
    setDosagemUtilizada('');
    setVolumeCaldaUtilizado('');

    const itemEstoque = estoque.find(e => e.id === produtoSelecionadoId);
    if (!itemEstoque) return;

    const prodAgrofit = catalogoAgrofit.find(p => p.id === itemEstoque.produtoId || p.nomeComercial === itemEstoque.nomeProduto);
    if (prodAgrofit && prodAgrofit.indicacoesUso) {
      const indicacoesFiltradas = prodAgrofit.indicacoesUso.filter(i => i.cultura === cultura);
      setPragasDisponiveis(indicacoesFiltradas);
    }
  };

  // 3. Ao selecionar a praga, definimos a indicação ativa e preenchemos as doses e caldas padrão permitidas
  const handleSelecionarPraga = (indexStr: string) => {
    setPragaSelecionadaIndex(indexStr);
    if (indexStr === '') {
      setIndicacaoAtiva(null);
      setDosagemUtilizada('');
      setVolumeCaldaUtilizado('');
      return;
    }

    const index = Number(indexStr);
    const ind = pragasDisponiveis[index];
    if (ind) {
      setIndicacaoAtiva(ind);
      setDosagemUtilizada(String(ind.doseMed || ind.doseMin));
      setVolumeCaldaUtilizado(String(ind.vCaldaMed || ind.vCaldaMin));
    }
  };

  const handleAdicionarItem = () => {
    if (!produtoSelecionadoId || !culturaSelecionada || pragaSelecionadaIndex === '' || !dosagemUtilizada || !volumeCaldaUtilizado || !area) {
      alert('Preencha todos os campos obrigatórios do item (Produto, Cultura, Praga, Área, Dosagem e Volume de Calda).');
      return;
    }

    const itemEstoque = estoque.find(e => e.id === produtoSelecionadoId);
    if (!itemEstoque || !indicacaoAtiva) return;

    const dosagemNum = Number(dosagemUtilizada);
    const volumeCaldaNum = Number(volumeCaldaUtilizado);
    const areaNum = Number(area);

    // Validação estrita baseada nos limites oficiais do Agrofit para a correlação escolhida
    if (dosagemNum < indicacaoAtiva.doseMin || dosagemNum > indicacaoAtiva.doseMax) {
      alert(`A dosagem informada (${dosagemNum}) está fora do intervalo permitido pelo Agrofit para esta praga/cultura (${indicacaoAtiva.doseMin} - ${indicacaoAtiva.doseMax} ${indicacaoAtiva.doseUnid}).`);
      return;
    }
    if (volumeCaldaNum < indicacaoAtiva.vCaldaMin || volumeCaldaNum > indicacaoAtiva.vCaldaMax) {
      alert(`O volume de calda (${volumeCaldaNum}) está fora do intervalo permitido pelo Agrofit (${indicacaoAtiva.vCaldaMin} - ${indicacaoAtiva.vCaldaMax} ${indicacaoAtiva.vCaldaUnid}).`);
      return;
    }

    const quantidadeTotal = dosagemNum * areaNum;

    let qtdJaNaReceita = 0;
    if (receitaEmEdicaoId) {
      const receitaAntiga = receitas.find(r => r.id === receitaEmEdicaoId);
      const itemAntigo = receitaAntiga?.itens.find(i => i.produtoId === itemEstoque.id);
      if (itemAntigo) qtdJaNaReceita = itemAntigo.quantidadeRecomendada;
    }

    const saldoDisponivel = itemEstoque.quantidadeAtual + qtdJaNaReceita;
    if (quantidadeTotal > saldoDisponivel) {
      alert(`Quantidade insuficiente em estoque! Disponível atual: ${itemEstoque.quantidadeAtual} ${itemEstoque.unidade}`);
      return;
    }

    const novoItemReceita = {
      produtoId: itemEstoque.id,
      nomeProduto: itemEstoque.nomeProduto,
      cultura: culturaSelecionada,
      pragaNomeComum: indicacaoAtiva.pragaNomeComum,
      pragaNomeCientifico: indicacaoAtiva.pragaNomeCientifico,
      modoAplicacao: indicacaoAtiva.modoAplicacao || 'Terrestre',
      dosagemMin: indicacaoAtiva.doseMin,
      dosagemMax: indicacaoAtiva.doseMax,
      dosagemUtilizada: dosagemNum,
      unidadeDosagem: indicacaoAtiva.doseUnid,
      volumeCaldaMin: indicacaoAtiva.vCaldaMin,
      volumeCaldaMax: indicacaoAtiva.vCaldaMax,
      volumeCaldaUtilizado: volumeCaldaNum,
      unidadeVolumeCalda: indicacaoAtiva.vCaldaUnid,
      areaAplicacaoHectares: areaNum,
      quantidadeRecomendada: quantidadeTotal,
    };

    setItensReceita([...itensReceita, novoItemReceita]);
    
    // Reseta apenas os seletores de item atual para permitir adicionar outro
    setProdutoSelecionadoId('');
    setCulturaSelecionada('');
    setPragaSelecionadaIndex('');
    setCulturasDisponiveis([]);
    setPragasDisponiveis([]);
    setIndicacaoAtiva(null);
    setArea('');
    setDosagemUtilizada('');
    setVolumeCaldaUtilizado('');
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
      const receitaAntiga = receitas.find(r => r.id === receitaEmEdicaoId);
      if (receitaAntiga) {
        receitaAntiga.itens.forEach(itemAntigo => {
          const prod = novoEstoque.find(e => e.id === itemAntigo.produtoId);
          if (prod) prod.quantidadeAtual += itemAntigo.quantidadeRecomendada;
        });
      }

      itensReceita.forEach(itemNovo => {
        const prod = novoEstoque.find(e => e.id === itemNovo.produtoId);
        if (prod) prod.quantidadeAtual = Math.max(0, prod.quantidadeAtual - itemNovo.quantidadeRecomendada);
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
      itensReceita.forEach(itemNovo => {
        const prod = novoEstoque.find(e => e.id === itemNovo.produtoId);
        if (prod) prod.quantidadeAtual = Math.max(0, prod.quantidadeAtual - itemNovo.quantidadeRecomendada);
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

    const estoqueAtual = getStorageData<ItemEstoque>('estoque');
    const novoEstoque = estoqueAtual.map(item => {
      const itemReceita = receitaAlvo.itens.find(i => i.produtoId === item.id);
      if (itemReceita) {
        return { ...item, quantidadeAtual: item.quantidadeAtual + itemReceita.quantidadeRecomendada };
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

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {modo === 'lista' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 border border-emerald-100">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4 gap-4">
            <div className="flex items-center space-x-3">
              <History className="h-7 w-7 text-emerald-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-800">Emissão de Receitas Agronômicas</h2>
                <p className="text-sm text-gray-500">Histórico e gerenciamento de receitas emitidas.</p>
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
              <p className="font-medium">Nenhuma receita agronômica emitida ainda.</p>
              <p className="text-sm text-gray-400 mt-1">Clique em "Nova Receita" para iniciar.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {receitas.map((rec) => (
                <div key={rec.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-sm">
                        {rec.numeroReceita}
                      </span>
                      <span className="text-xs text-gray-500">Data: {rec.dataEmissao}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">Produtor: {rec.produtorNome} ({rec.produtorCpfCnpj})</p>
                    <p className="text-xs text-gray-600">Propriedade: {rec.propriedadeNome} | Itens: {rec.itens.length}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditarReceita(rec)}
                      className="text-amber-600 hover:text-amber-800 p-1.5 bg-amber-50 rounded border border-amber-200 text-xs flex items-center space-x-1"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleExcluirReceita(rec.id)}
                      className="text-red-600 hover:text-red-800 p-1.5 bg-red-50 rounded border border-red-200 text-xs flex items-center space-x-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {modo === 'formulario' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 border border-emerald-100">
          <div className="flex items-center justify-between mb-6 border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {receitaEmEdicaoId ? 'Editar Receita Agronômica' : 'Nova Receita Agronômica'}
            </h2>
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
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF / CNPJ *</label>
                <input
                  type="text"
                  required
                  value={produtorCpfCnpj}
                  onChange={(e) => setProdutorCpfCnpj(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Propriedade *</label>
                <input
                  type="text"
                  required
                  value={propriedadeNome}
                  onChange={(e) => setPropriedadeNome(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            {/* Seção de Adição de Itens com Produto -> Cultura -> Praga Correlacionados */}
            <div className="border p-4 rounded-lg bg-gray-50 space-y-4">
              <h3 className="font-semibold text-gray-800">Adicionar Produto do Estoque</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Seleção de Produto */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">1. Produto (Estoque) *</label>
                  <select
                    value={produtoSelecionadoId}
                    onChange={(e) => handleSelecionarProdutoEstoque(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  >
                    <option value="">Selecione o produto...</option>
                    {estoque.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nomeProduto} (Saldo: {item.quantidadeAtual} {item.unidade})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Seleção de Cultura (Filtrada pelo Produto) */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">2. Cultura *</label>
                  <select
                    value={culturaSelecionada}
                    onChange={(e) => handleSelecionarCultura(e.target.value)}
                    disabled={!produtoSelecionadoId || culturasDisponiveis.length === 0}
                    className="w-full px-3 py-2 border rounded-md bg-white text-sm disabled:bg-gray-100"
                  >
                    <option value="">Selecione a cultura...</option>
                    {culturasDisponiveis.map((cultura, idx) => (
                      <option key={idx} value={cultura}>
                        {cultura}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Seleção de Praga (Filtrada pela Cultura) */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">3. Praga (Comum / Científico) *</label>
                  <select
                    value={pragaSelecionadaIndex}
                    onChange={(e) => handleSelecionarPraga(e.target.value)}
                    disabled={!culturaSelecionada || pragasDisponiveis.length === 0}
                    className="w-full px-3 py-2 border rounded-md bg-white text-sm disabled:bg-gray-100"
                  >
                    <option value="">Selecione a praga...</option>
                    {pragasDisponiveis.map((ind, idx) => (
                      <option key={idx} value={idx}>
                        {ind.pragaNomeComum} {ind.pragaNomeCientifico && ind.pragaNomeCientifico !== 'Não especificado' ? `(${ind.pragaNomeCientifico})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Informações de Área, Dosagem e Calda */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Área (Hectares) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Ex: 10"
                    className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Dosagem ({indicacaoAtiva?.doseUnid || 'unid'}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dosagemUtilizada}
                    onChange={(e) => setDosagemUtilizada(e.target.value)}
                    placeholder="Dose"
                    className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Vol. Calda ({indicacaoAtiva?.vCaldaUnid || 'L/ha'}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={volumeCaldaUtilizado}
                    onChange={(e) => setVolumeCaldaUtilizado(e.target.value)}
                    placeholder="Calda"
                    className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  />
                </div>
              </div>

              {indicacaoAtiva && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 space-y-1">
                  <p><strong>Limites Agrofit para esta Correlação:</strong></p>
                  <p>• Dose Permitida: {indicacaoAtiva.doseMin} a {indicacaoAtiva.doseMax} {indicacaoAtiva.doseUnid}</p>
                  <p>• Volume de Calda: {indicacaoAtiva.vCaldaMin} a {indicacaoAtiva.vCaldaMax} {indicacaoAtiva.vCaldaUnid}</p>
                  {indicacaoAtiva.pragaNomeCientifico && indicacaoAtiva.pragaNomeCientifico !== 'Não especificado' && (
                    <p>• Nome Científico: <em className="font-semibold">{indicacaoAtiva.pragaNomeCientifico}</em></p>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAdicionarItem}
                  className="bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-emerald-800 transition shadow"
                >
                  Incluir Item na Receita
                </button>
              </div>
            </div>

            {/* Listagem de Itens Inseridos */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Itens da Receita ({itensReceita.length})</h4>
              {itensReceita.length === 0 ? (
                <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded border text-center">Nenhum item adicionado.</p>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 text-sm bg-white">
                    <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
                      <tr>
                        <th className="px-3 py-2 text-left">Produto</th>
                        <th className="px-3 py-2 text-left">Cultura / Praga</th>
                        <th className="px-3 py-2 text-left">Área</th>
                        <th className="px-3 py-2 text-left">Dosagem</th>
                        <th className="px-3 py-2 text-left">Qtd Total</th>
                        <th className="px-3 py-2 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {itensReceita.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 font-medium">{item.nomeProduto}</td>
                          <td className="px-3 py-2">
                            <div className="text-xs">
                              <span className="font-semibold text-gray-800">{item.cultura}</span> &gt; {item.pragaNomeComum}
                              {item.pragaNomeCientifico && item.pragaNomeCientifico !== 'Não especificado' && (
                                <span className="block italic text-gray-500">{item.pragaNomeCientifico}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2">{item.areaAplicacaoHectares} ha</td>
                          <td className="px-3 py-2">{item.dosagemUtilizada} {item.unidadeDosagem}</td>
                          <td className="px-3 py-2 font-bold text-emerald-700">{item.quantidadeRecomendada}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoverItem(idx)}
                              className="text-red-600 hover:text-red-800"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Orientações / Recomendações Técnicas</label>
              <textarea
                value={orientacoes}
                onChange={(e) => setOrientacoes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="Instruções adicionais de aplicação, EPIs, etc."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setModo('lista')}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-emerald-600 text-white px-6 py-2 rounded-md font-medium text-sm shadow hover:bg-emerald-700"
              >
                {receitaEmEdicaoId ? 'Salvar Alterações' : 'Emitir e Salvar Receita'}
              </button>
            </div>
          </form>
        </div>
      )}

      {modo === 'sucesso' && receitaEmitida && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-8 border border-emerald-100 text-center space-y-6 max-w-2xl mx-auto">
          <CheckCircle2 className="h-16 w-16 text-emerald-600 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-800">Receita Emitida com Sucesso!</h2>
          <p className="text-sm text-gray-600">Número da Receita: <strong className="font-mono text-emerald-800">{receitaEmitida.numeroReceita}</strong></p>
          <div className="flex justify-center space-x-4 pt-4">
            <button
              onClick={() => window.print()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-md transition flex items-center space-x-2 text-sm shadow"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              onClick={() => setModo('lista')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-4 py-2 rounded-md transition text-sm"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      )}
    </div>
  );
};