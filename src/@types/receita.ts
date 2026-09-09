export interface ReceitaAgronomica {
  id: string;
  numeroReceita: string;
  produtorNome: string;
  produtorCpfCnpj: string;
  propriedadeNome: string;
  itens: {
    produtoId: string;
    nomeProduto: string;
    quantidadeRecomendada: number;
    unidade: string;
    dosagemPorHectare: string;
    areaAplicacaoHectares: number;
  }[];
  orientacoes: string;
  dataEmissao: string;
}