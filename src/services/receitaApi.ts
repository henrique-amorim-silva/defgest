// src/services/receitaApi.ts
import { apiRequest } from './api';

export interface ItemReceita {
  id?: number;
  estoqueId: number;
  nomeProduto: string;
  cultura: string;
  pragaNomeComum: string;
  pragaNomeCientifico?: string;
  modoAplicacao?: string;
  dosagemUtilizada: number;
  unidadeDosagem: string;
  volumeCaldaUtilizado: number;
  unidadeVolumeCalda: string;
  areaAplicacaoHectares: number;
  quantidadeRecomendada: number;
}

export interface ReceitaAgronomica {
  id: number;
  numeroReceita: string;
  produtorNome: string;
  produtorCpfCnpj: string;
  propriedadeNome: string;
  orientacoes?: string;
  dataEmissao: string;
  empresaId?: number;
  usuarioNome?: string;
  itens: ItemReceita[];
}

export async function listarReceitas(empresaId?: string): Promise<ReceitaAgronomica[]> {
  const query = empresaId ? `?empresaId=${empresaId}` : '';
  return await apiRequest(`/receitas${query}`);
}

export async function emitirReceita(dados: {
  numeroReceita: string;
  produtorNome: string;
  produtorCpfCnpj: string;
  propriedadeNome: string;
  orientacoes?: string;
  dataEmissao: string;
  itens: ItemReceita[];
}): Promise<any> {
  return await apiRequest('/receitas', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

export async function atualizarReceita(
  id: number,
  dados: {
    numeroReceita?: string;
    produtorNome: string;
    produtorCpfCnpj: string;
    propriedadeNome: string;
    orientacoes?: string;
    dataEmissao?: string;
    itens: ItemReceita[];
  }
): Promise<any> {
  return await apiRequest(`/receitas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  });
}

export async function excluirReceita(id: number): Promise<void> {
  return await apiRequest(`/receitas/${id}`, {
    method: 'DELETE',
  });
}