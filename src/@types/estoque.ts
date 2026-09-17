// estoque.ts

export interface ItemEstoque {
  id: number;
  empresaId?: number;
  nomeProduto: string;
  lote: string;
  quantidadeAtual: number;
  estoqueMinimo?: number;
  unidade: string;
  embalagem?: string;
  dataValidade: string;
  numeroNotaFiscal: string;
  dataEntrada: string;
  usuarioNome?: string;
}