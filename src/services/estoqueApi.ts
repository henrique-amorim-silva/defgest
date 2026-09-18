// src/services/estoqueApi.ts
import { apiRequest } from './api';

// Representa um Lote específico do produto na tabela `lote_validade`
export interface LoteEstoque {
  id: number;
  lote: string;
  quantidadeAtual: number;
  dataValidade: string;
  numeroNotaFiscal?: string;
  dataEntrada?: string;
}

// Representa o Produto no Estoque (tabela `estoque`), que agora agrupa seus lotes
export interface ItemEstoque {
  id: number;
  empresaId?: number;
  nomeProduto: string;
  unidade: string;
  embalagem?: string;
  estMin?: number; // Ajustado para estMin (conforme o banco/backend)
  lotes: LoteEstoque[]; // Os lotes agora vêm agrupados em um array
}

export async function listarEstoque(empresaId?: string): Promise<ItemEstoque[]> {
  const query = empresaId ? `?empresaId=${empresaId}` : '';
  return await apiRequest(`/estoque${query}`);
}

// Como o cadastro direto unitário de estoque pode ter mudado para notas fiscais,
// mantemos a tipagem genérica caso seja usada em outro lugar:
export async function cadastrarItemEstoque(item: any): Promise<any> {
  return await apiRequest('/estoque', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function excluirItemEstoque(id: number): Promise<void> {
  return await apiRequest(`/estoque/${id}`, {
    method: 'DELETE',
  });
}

// --- HISTÓRICO DE NOTAS FISCAIS ---

export interface ItemNotaHistorico {
  id: number;
  estoqueId: number;
  nomeProduto: string;
  lote: string;
  quantidade: number;
  unidade: string;
  embalagem?: string;
  dataValidade: string;
}

export interface NotaFiscalHistorico {
  id: number;
  numeroNota: string;
  dataEntrada: string;
  empresaId?: number;
  usuarioNome?: string;
  fornecedorId?: number | string;
  fornecedorNome?: string;
  itens: ItemNotaHistorico[];
}

export async function listarNotasFiscais(empresaId?: string): Promise<NotaFiscalHistorico[]> {
  const query = empresaId ? `?empresaId=${empresaId}` : '';
  return await apiRequest(`/notas-fiscais${query}`);
}

export async function listarFornecedores(empresaId?: string): Promise<any[]> {
  const query = empresaId ? `?empresaId=${empresaId}` : '';
  return await apiRequest(`/fornecedores${query}`); // Ajuste a rota se necessário conforme a sua API
}

export async function salvarNotaFiscalCompleta(dados: {
  numeroNota: string;
  dataEntrada: string;
  fornecedorId?: number | null; // Adicionado aqui
  itens: any[];
  notaEmEdicaoId?: string | null;
}): Promise<any> {
  return await apiRequest('/notas-fiscais', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

export async function excluirNotaFiscalCompleta(id: number): Promise<void> {
  return await apiRequest(`/notas-fiscais/${id}`, {
    method: 'DELETE',
  });
}

export async function verificarContagemTemporaria(empresaId: string): Promise<any> {
  try {
    return await apiRequest(`/contagem-temporaria/${empresaId}`);
  } catch (error) {
    console.error("Erro ao buscar contagem temporária:", error);
    return null;
  }
}