// src/@types/receita.ts

export interface ItemReceitaAgronomica {
  produtoId: string;
  nomeProduto: string;
  ingredienteAtivo?: string;
  classeToxicologica?: string;
  grupoQuimico?: string;
  formulacao?: string;
  concentracao?: string;
  cultura: string;
  pragaNomeComum: string;
  pragaNomeCientifico: string;
  modoAplicacao: string;
  epocaAplicacao?: string;
  dosagemMin: number;
  dosagemMax: number;
  dosagemUtilizada: number;
  unidadeDosagem: string;
  volumeCaldaMin: number;
  volumeCaldaMax: number;
  volumeCaldaUtilizado: number;
  unidadeVolumeCalda: string;
  areaAplicacaoHectares: number;
  quantidadeRecomendada: number;
  numeroAplicacoesMax?: string | number;
  intervaloSeguranca?: string;
  carenciaDias?: string | number;
  embalagemDescricao?: string;
}

export interface ReceitaAgronomica {
  id: string;
  numeroReceita: string;
  
  // Dados do Produtor / Cliente
  produtorNome: string;
  produtorCpfCnpj: string;
  produtorRgIe?: string;
  produtorEndereco?: string;
  produtorMunicipio?: string;
  produtorTelefone?: string;

  // Dados da Propriedade
  propriedadeNome: string;
  propriedadeCpfCnpj?: string;
  propriedadeIpr?: string;
  propriedadeEndereco?: string;
  propriedadeMunicipio?: string;
  propriedadeAreaTotalHa?: number;

  // Responsável Técnico
  respTecNome?: string;
  respTecCpfCrea?: string;
  respTecLocal?: string;
  artTrtNumero?: string;

  itens: ItemReceitaAgronomica[];
  orientacoes: string;
  dataEmissao: string;
}