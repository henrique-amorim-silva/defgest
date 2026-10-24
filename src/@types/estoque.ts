// src/@types/estoque.ts (ou o caminho correto do teu estoque.ts)

export interface LoteItem {
  id?: number;
  lote?: string;
  quantidadeAtual?: number;
  dataValidade?: string;
}

export interface ItemEstoque {
  id: number;
  empresaId?: number;
  nomeProduto: string;
  lote?: string;
  lotes?: LoteItem[]; // Adicionado para suportar a lista de lotes vindos do Supabase
  quantidadeAtual?: number;
  estoqueMinimo?: number;
  unidade: string;
  embalagem?: string;
  dataValidade?: string;
  numeroNotaFiscal?: string;
  dataEntrada?: string;
  usuarioNome?: string;
}