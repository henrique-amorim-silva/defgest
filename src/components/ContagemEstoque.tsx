import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { ClipboardList, CheckCircle2, Send, Building2, Plus, Trash2, X, Clock } from 'lucide-react';

interface ProdutoInventario {
  id: number;
  nomeProduto?: string;
  produto?: string;
  nome?: string;
  nome_produto?: string;
  descricao?: string;
  unidade?: string;
  embalagem?: string;
  quantidade?: number;
  saldo?: number;
  qtdSistema?: number;
}

interface ItemContadoLinha {
  idUnico: string;
  estoqueId: number;
  lote: string;
  quantidadeContada: string;
}

interface Divergencia {
  estoqueId: number;
  lote: string;
  qtdSistema: number;
  qtdContada: number;
  diferenca: number;
}

interface Empresa {
  id: number;
  nome_fantasia: string;
}

interface ContagemEstoqueProps {
  empresaSelecionada?: string;
  onFechar: () => void;
}

export const ContagemEstoque: React.FC<ContagemEstoqueProps> = ({ empresaSelecionada, onFechar }) => {
  const [produtos, setProdutos] = useState<ProdutoInventario[]>([]);
  const [linhasContagem, setLinhasContagem] = useState<ItemContadoLinha[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [enviando, setEnviando] = useState<boolean>(false);
  const [resultadoDivergencias, setResultadoDivergencias] = useState<Divergencia[] | null>(null);
  const [nomeEmpresaAtual, setNomeEmpresaAtual] = useState<string>("Todas as Empresas");

  const usuarioStr = localStorage.getItem("usuario");
  const usuario = usuarioStr ? JSON.parse(usuarioStr) : null;
  const isAdminMaster = usuario?.permissao === 'admin_master';

  // Chave única para persistir a contagem temporária desta empresa específica
  const chaveLocalStorage = `contagem_temporaria_empresa_${empresaSelecionada || 'geral'}`;

  useEffect(() => {
    carregarDadosIniciais();
  }, [empresaSelecionada]);

  const carregarDadosIniciais = async () => {
    setCarregando(true);
    try {
      if (empresaSelecionada) {
        if (isAdminMaster) {
          const empresasData = await apiRequest("empresas");
          if (Array.isArray(empresasData)) {
            const encontrada = empresasData.find((e: Empresa) => e.id.toString() === empresaSelecionada);
            setNomeEmpresaAtual(encontrada ? encontrada.nome_fantasia : `Empresa ID: ${empresaSelecionada}`);
          }
        } else {
          setNomeEmpresaAtual(usuario?.empresaNome || 'Minha Empresa');
        }
      } else {
        setNomeEmpresaAtual(isAdminMaster ? "Todas as Empresas" : (usuario?.empresaNome || 'Minha Empresa'));
      }

      const query = empresaSelecionada ? `?empresa_id=${empresaSelecionada}` : '';
      let data = await apiRequest(`estoque${query}`);

      if (!Array.isArray(data) || data.length === 0) {
        data = await apiRequest('estoque');
      }

      if (Array.isArray(data)) {
        setProdutos(data);

        // Verificar se já existe rascunho salvo no localStorage para esta empresa
        const salvoNoStorage = localStorage.getItem(chaveLocalStorage);
        if (salvoNoStorage) {
          try {
            const linhasSalvas: ItemContadoLinha[] = JSON.parse(salvoNoStorage);
            if (Array.isArray(linhasSalvas) && linhasSalvas.length > 0) {
              setLinhasContagem(linhasSalvas);
              setCarregando(false);
              return;
            }
          } catch (e) {
            console.error("Erro ao carregar rascunho salvo:", e);
          }
        }

        // Se não houver rascunho, inicializar com uma linha vazia por produto
        const linhasIniciais: ItemContadoLinha[] = data.map((prod: ProdutoInventario) => ({
          idUnico: `${prod.id}-${Date.now()}-${Math.random()}`,
          estoqueId: prod.id,
          lote: '',
          quantidadeContada: ''
        }));
        setLinhasContagem(linhasIniciais);
      } else {
        setProdutos([]);
        setLinhasContagem([]);
      }
    } catch (err) {
      console.error("Erro ao carregar produtos do estoque:", err);
      setProdutos([]);
      setLinhasContagem([]);
    } finally {
      setCarregando(false);
    }
  };

  const getNomeProduto = (prod: ProdutoInventario) => {
    return prod.nomeProduto || prod.nome_produto || prod.produto || prod.nome || prod.descricao || `Produto ID: ${prod.id}`;
  };

  const handleLinhaChange = (idUnico: string, campo: 'lote' | 'quantidadeContada', valor: string) => {
    setLinhasContagem(prev => {
      const novasLinhas = prev.map(linha => {
        if (linha.idUnico === idUnico) {
          return { ...linha, [campo]: valor };
        }
        return linha;
      });
      // Salvar automaticamente no localStorage (persistência contínua)
      localStorage.setItem(chaveLocalStorage, JSON.stringify(novasLinhas));
      return novasLinhas;
    });
  };

  const adicionarLoteExtra = (estoqueId: number) => {
    setLinhasContagem(prev => {
      const novaLinha: ItemContadoLinha = {
        idUnico: `${estoqueId}-${Date.now()}-${Math.random()}`,
        estoqueId,
        lote: '',
        quantidadeContada: ''
      };
      const novasLinhas = [...prev, novaLinha];
      localStorage.setItem(chaveLocalStorage, JSON.stringify(novasLinhas));
      return novasLinhas;
    });
  };

  const removerLinha = (idUnico: string) => {
    setLinhasContagem(prev => {
      const novasLinhas = prev.filter(linha => linha.idUnico !== idUnico);
      localStorage.setItem(chaveLocalStorage, JSON.stringify(novasLinhas));
      return novasLinhas;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const itensContados = linhasContagem
      .filter(item => item.lote.trim() !== '' || item.quantidadeContada !== '')
      .map(item => ({
        estoqueId: item.estoqueId,
        lote: item.lote,
        quantidadeContada: item.quantidadeContada
      }));

    if (itensContados.length === 0) {
      alert("Preencha ao menos um lote e quantidade antes de finalizar.");
      return;
    }

    if (!confirm("Deseja realmente finalizar e processar esta contagem de estoque?")) return;

    setEnviando(true);
    try {
      const payload = {
        itensContados,
        empresaId: empresaSelecionada ? Number(empresaSelecionada) : null
      };

      const resposta = await apiRequest('estoque/processar-inventario', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Limpar rascunho do localStorage ao finalizar com sucesso
      localStorage.removeItem(chaveLocalStorage);

      if (resposta && resposta.divergencias) {
        setResultadoDivergencias(resposta.divergencias);
      } else {
        alert("Contagem processada com sucesso!");
        onFechar();
      }
    } catch (err: any) {
      console.error("Erro ao processar inventário:", err);
      // Tentativa de fallback local se a rota do backend não existir ainda
      const divergenciasCalculadas: Divergencia[] = itensContados.map(item => {
        const prod = produtos.find(p => p.id === item.estoqueId);
        const qtdSistema = Number(prod?.quantidade ?? prod?.saldo ?? prod?.qtdSistema ?? 0);
        const qtdContada = Number(item.quantidadeContada || 0);
        const diferenca = qtdContada - qtdSistema;
        return { estoqueId: item.estoqueId, lote: item.lote, qtdSistema, qtdContada, diferenca };
      });
      localStorage.removeItem(chaveLocalStorage);
      setResultadoDivergencias(divergenciasCalculadas);
    } finally {
      setEnviando(false);
    }
  };

  if (resultadoDivergencias) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-800">Relatório de Divergências de Estoque</h2>
                <p className="text-sm text-gray-500">Comparativo finalizado ({nomeEmpresaAtual}).</p>
              </div>
            </div>
            <button
              onClick={onFechar}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-4">Lote</th>
                  <th className="py-3 px-4 text-center">Qtd Sistema</th>
                  <th className="py-3 px-4 text-center">Qtd Contada</th>
                  <th className="py-3 px-4 text-center">Diferença</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {resultadoDivergencias.map((item, idx) => {
                  const p = produtos.find(prod => prod.id === item.estoqueId);
                  const produtoNome = p ? getNomeProduto(p) : `ID: ${item.estoqueId}`;
                  return (
                    <tr key={idx} className={item.diferenca !== 0 ? 'bg-amber-50/50' : 'hover:bg-gray-50'}>
                      <td className="py-3 px-4 font-medium text-gray-900">{produtoNome}</td>
                      <td className="py-3 px-4 text-gray-600">{item.lote || '-'}</td>
                      <td className="py-3 px-4 text-center text-gray-700">{item.qtdSistema}</td>
                      <td className="py-3 px-4 text-center font-semibold text-gray-900">{item.qtdContada}</td>
                      <td className="py-3 px-4 text-center">
                        {item.diferenca === 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            Sem Diferença
                          </span>
                        ) : item.diferenca > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            +{item.diferenca} (Sobra)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {item.diferenca} (Falta)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onFechar}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium"
            >
              Fechar Relatório
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-6xl w-full p-6 max-h-[92vh] flex flex-col">
        {/* Cabeçalho do Componente */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <ClipboardList className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Contagem de Estoque (Inventário Físico)</h2>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3 text-emerald-600" /> Os dados são salvos automaticamente. Pode pausar e continuar quando quiser.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-900">
              <Building2 className="h-4 w-4 text-emerald-600" />
              <span>{nomeEmpresaAtual}</span>
            </div>
            <button
              onClick={onFechar}
              title="Pausar e fechar (continuar depois)"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Corpo / Tabela */}
        <div className="flex-1 overflow-y-auto my-2">
          {carregando ? (
            <div className="text-center py-16 text-gray-500">A carregar produtos do estoque...</div>
          ) : produtos.length === 0 ? (
            <div className="text-center py-16 text-gray-500">Nenhum produto encontrado para esta empresa.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50 text-emerald-900 text-xs uppercase tracking-wider sticky top-0 z-10">
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-4">Unidade / Embalagem</th>
                  <th className="py-3 px-4 w-44">Lote Físico</th>
                  <th className="py-3 px-4 w-36">Quantidade</th>
                  <th className="py-3 px-4 w-20 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {produtos.map((prod) => {
                  const nomeExibicao = getNomeProduto(prod);
                  const linhasDoProduto = linhasContagem.filter(l => l.estoqueId === prod.id);

                  return (
                    <React.Fragment key={prod.id}>
                      {linhasDoProduto.map((linha, index) => (
                        <tr key={linha.idUnico} className="hover:bg-gray-50/80">
                          {index === 0 ? (
                            <>
                              <td className="py-3 px-4 font-medium text-gray-900 align-top" rowSpan={linhasDoProduto.length}>
                                {nomeExibicao}
                              </td>
                              <td className="py-3 px-4 text-gray-600 align-top" rowSpan={linhasDoProduto.length}>
                                {prod.unidade || '-'} {prod.embalagem ? `(${prod.embalagem})` : ''}
                              </td>
                            </>
                          ) : null}
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              placeholder="Ex: LOTE123"
                              value={linha.lote}
                              onChange={(e) => handleLinhaChange(linha.idUnico, 'lote', e.target.value)}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              step="any"
                              placeholder="0"
                              value={linha.quantidadeContada}
                              onChange={(e) => handleLinhaChange(linha.idUnico, 'quantidadeContada', e.target.value)}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              {index === 0 ? (
                                <button
                                  type="button"
                                  onClick={() => adicionarLoteExtra(prod.id)}
                                  title="Adicionar outro lote para este produto"
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => removerLinha(linha.idUnico)}
                                  title="Remover lote"
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Rodapé com Ações */}
        <div className="pt-4 mt-2 border-t border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition text-sm"
          >
            Continuar depois (Pausar)
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={enviando}
            className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-xl shadow hover:bg-emerald-700 transition disabled:opacity-50 text-sm"
          >
            <Send className="h-4 w-4" />
            <span>{enviando ? 'A processar...' : 'Finalizar e Gerar Relatório'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};