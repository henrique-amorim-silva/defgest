// src/services/estoqueApi.ts
import { apiRequest } from './api';

export interface ItemEstoque {
  id: number;
  empresaId?: number;
  nomeProduto: string;
  lote: string;
  quantidadeAtual: number;
  unidade: string;
  dataValidade: string;
  numeroNotaFiscal: string;
  dataEntrada: string;
  usuarioNome?: string;
}

export async function listarEstoque(empresaId?: string): Promise<ItemEstoque[]> {
  const query = empresaId ? `?empresaId=${empresaId}` : '';
  return await apiRequest(`/estoque${query}`);
}

export async function cadastrarItemEstoque(item: Omit<ItemEstoque, 'id'>): Promise<ItemEstoque> {
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
  dataValidade: string;
}

export interface NotaFiscalHistorico {
  id: number;
  numeroNota: string;
  dataEntrada: string;
  empresaId?: number;
  usuarioNome?: string;
  itens: ItemNotaHistorico[];
}

export async function listarNotasFiscais(empresaId?: string): Promise<NotaFiscalHistorico[]> {
  const query = empresaId ? `?empresaId=${empresaId}` : '';
  return await apiRequest(`/notas-fiscais${query}`);
}

export async function salvarNotaFiscalCompleta(dados: {
  numeroNota: string;
  dataEntrada: string;
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