// receita.ts

export interface ReceitaAgronomica {
  id: string;
  numeroReceita: string;
  produtorNome: string;
  produtorCpfCnpj: string;
  propriedadeNome: string;
  itens: {
    produtoId: string;
    nomeProduto: string;
    cultura: string;
    pragaNomeComum: string;
    pragaNomeCientifico: string;
    modoAplicacao: string;
    dosagemMin: number;
    dosagemMax: number;
    dosagemUtilizada: number; // Editável pelo vendedor
    unidadeDosagem: string;
    volumeCaldaMin: number;
    volumeCaldaMax: number;
    volumeCaldaUtilizado: number; // Editável pelo vendedor
    unidadeVolumeCalda: string;
    areaAplicacaoHectares: number;
    quantidadeRecomendada: number; // Calculada: dosagemUtilizada * area
    numeroAplicacoesMax?: string | number; // Adicionado para o nº máximo de aplicações
    intervaloSeguranca?: string;          // Adicionado para o intervalo de segurança/carência
  }[];
  orientacoes: string;
  dataEmissao: string;
}