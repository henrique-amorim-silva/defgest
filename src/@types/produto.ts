// produto.ts

export interface ProdutoAgrofit {
  id: string;
  nomeComercial: string;
  ingredienteAtivo: string;
  cultura: string;
  praga: string;
  classeToxicologica: string;
  receituarioObrigatorio: boolean;
  // Novos campos agronômicos
  modoAplicacao?: string;
  doseMin?: number;
  doseMax?: number;
  doseMed?: number;
  doseUnid?: string;
  vCaldaMin?: number;
  vCaldaMax?: number;
  vCaldaMed?: number;
  vCaldaUnid?: string;
  numeroAplicacoesMax?: string | number; // Adicionado para o nº máximo de aplicações
  intervaloSeguranca?: string;          // Adicionado para o intervalo de segurança/carência
}