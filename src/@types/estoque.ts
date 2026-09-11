// estoque.ts

export interface ItemEstoque {
  id: string;
  produtoId: string;
  nomeProduto: string;
  lote: string;
  quantidadeAtual: number;
  unidade: 'L' | 'KG' | 'ML' | 'G';
  dataValidade: string;
  numeroNotaFiscal: string;
  dataEntrada: string;
}