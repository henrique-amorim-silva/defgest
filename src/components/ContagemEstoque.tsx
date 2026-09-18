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

      localStorage.removeItem(chaveLocalStorage);

      if (resposta && resposta.divergencias) {
        setResultadoDivergencias(resposta.divergencias);
      } else {
        alert("Contagem processada com sucesso!");
        onFechar();
      }
    } catch (err: any) {
      console.error("Erro ao processar inventário:", err);
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
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-4xl w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="h-7 w-7 text-emerald-600 shrink-0" />
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Relatório de Divergências</h2>
                <p className="text-xs text-gray-500">Comparativo finalizado ({nomeEmpresaAtual}).</p>
              </div>
            </div>
            <button onClick={onFechar} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-700 uppercase tracking-wider border-b border-gray-200">
                  <th className="py-2.5 px-3">Produto</th>
                  <th className="py-2.5 px-3">Lote</th>
                  <th className="py-2.5 px-3 text-center">Sistema</th>
                  <th className="py-2.5 px-3 text-center">Contado</th>
                  <th className="py-2.5 px-3 text-center">Diferença</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {resultadoDivergencias.map((item, idx) => {
                  const p = produtos.find(prod => prod.id === item.estoqueId);
                  const produtoNome = p ? getNomeProduto(p) : `ID: ${item.estoqueId}`;
                  return (
                    <tr key={idx} className={item.diferenca !== 0 ? 'bg-amber-50/50' : 'hover:bg-gray-50'}>
                      <td className="py-2.5 px-3 font-medium text-gray-900">{produtoNome}</td>
                      <td className="py-2.5 px-3 text-gray-600">{item.lote || '-'}</td>
                      <td className="py-2.5 px-3 text-center text-gray-700">{item.qtdSistema}</td>
                      <td className="py-2.5 px-3 text-center font-semibold text-gray-900">{item.qtdContada}</td>
                      <td className="py-2.5 px-3 text-center">
                        {item.diferenca === 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">Igual</span>
                        ) : item.diferenca > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">+{item.diferenca}</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800">{item.diferenca}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button onClick={onFechar} className="px-5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium text-sm">
              Fechar Relatório
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-5xl w-full p-4 sm:p-6 max-h-[94vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-50 rounded-xl shrink-0">
              <ClipboardList className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">Contagem de Estoque</h2>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3 text-emerald-600 shrink-0" /> Salvo automaticamente. Pode pausar quando quiser.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-medium text-emerald-900 truncate max-w-50 sm:max-w-xs">
              <Building2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{nomeEmpresaAtual}</span>
            </div>
            <button onClick={onFechar} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Corpo adaptativo (Cartões no mobile / Tabela no desktop) */}
        <div className="flex-1 overflow-y-auto my-2 pr-1">
          {carregando ? (
            <div className="text-center py-16 text-gray-500 text-sm">A carregar produtos do estoque...</div>
          ) : produtos.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm">Nenhum produto encontrado para esta empresa.</div>
          ) : (
            <>
              {/* Layout para Mobile (Cards Verticais - Sem barra horizontal) */}
              <div className="block md:hidden space-y-4">
                {produtos.map((prod) => {
                  const nomeExibicao = getNomeProduto(prod);
                  const linhasDoProduto = linhasContagem.filter(l => l.estoqueId === prod.id);

                  return (
                    <div key={prod.id} className="bg-gray-50 border border-emerald-100 rounded-xl p-3.5 shadow-sm space-y-3">
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">{nomeExibicao}</h3>
                        <p className="text-xs text-gray-500">Embalagem: {prod.unidade || '-'} {prod.embalagem ? `(${prod.embalagem})` : ''}</p>
                      </div>

                      <div className="space-y-2 pt-1 border-t border-gray-200">
                        {linhasDoProduto.map((linha, index) => (
                          <div key={linha.idUnico} className="bg-white p-2.5 rounded-lg border border-gray-200 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1">
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Lote Físico</label>
                                <input
                                  type="text"
                                  placeholder="Ex: LOTE123"
                                  value={linha.lote}
                                  onChange={(e) => handleLinhaChange(linha.idUnico, 'lote', e.target.value)}
                                  className="w-full px-2.5 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                />
                              </div>
                              <div className="w-24">
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Qtd.</label>
                                <input
                                  type="number"
                                  step="any"
                                  placeholder="0"
                                  value={linha.quantidadeContada}
                                  onChange={(e) => handleLinhaChange(linha.idUnico, 'quantidadeContada', e.target.value)}
                                  className="w-full px-2.5 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                />
                              </div>
                              <div className="pt-4">
                                {index === 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => adicionarLoteExtra(prod.id)}
                                    title="Adicionar lote"
                                    className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded transition"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => removerLinha(linha.idUnico)}
                                    title="Remover lote"
                                    className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded transition"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Layout para Desktop (Tabela tradicional limpa) */}
              <div className="hidden md:block">
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
                                      title="Adicionar outro lote"
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
              </div>
            </>
          )}
        </div>

        {/* Rodapé com Ações */}
        <div className="pt-3 mt-2 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2">
          <button
            type="button"
            onClick={onFechar}
            className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition text-xs sm:text-sm"
          >
            Continuar depois (Pausar)
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={enviando}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-xl shadow hover:bg-emerald-700 transition disabled:opacity-50 text-xs sm:text-sm"
          >
            <Send className="h-4 w-4" />
            <span>{enviando ? 'A processar...' : 'Finalizar e Gerar Relatório'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};