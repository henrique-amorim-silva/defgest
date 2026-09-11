// agrofitApi.ts

export interface IndicacaoUsoAgrofit {
  cultura: string;
  pragaNomeComum: string;
  pragaNomeCientifico: string;
  modoAplicacao?: string;
  doseMin: number;
  doseMax: number;
  doseMed?: number;
  doseUnid: string;
  vCaldaMin: number;
  vCaldaMax: number;
  vCaldaMed?: number;
  vCaldaUnid: string;
  numeroAplicacoesMax?: string | number; // Novo campo para o Nº Máximo de Aplicações
  intervaloSeguranca?: string;          // Novo campo para Intervalo de Segurança / Carência
}

export interface DocumentoAgrofit {
  descricao?: string;
  tipo_documento?: string;
  data_inclusao?: string;
  url?: string;
  origem?: string;
}

export interface ProdutoAgrofitCompleto {
  id: string;
  registro: string;
  nomeComercial: string;
  titularRegistro: string;
  ingredienteAtivo: string;
  formulacao: string;
  grupoQuimico: string;
  classeToxicologica: string;
  cultura: string;
  praga: string; // Mantido para compatibilidade geral (nome comum da primeira indicação)
  indicacoesUso: IndicacaoUsoAgrofit[];
  unidadePadrao: string;
  documentosCadastrados?: DocumentoAgrofit[];
  // Propriedades de atalho para facilitar o acesso direto no formulário da receita:
  modoAplicacao?: string;
  doseMin: number;
  doseMax: number;
  doseMed?: number;
  doseUnid: string;
  vCaldaMin: number;
  vCaldaMax: number;
  vCaldaMed?: number;
  vCaldaUnid: string;
  numeroAplicacoesMax?: string | number;
  intervaloSeguranca?: string;
}

export async function sincronizarCatalogoAgrofit(): Promise<ProdutoAgrofitCompleto[]> {
  try {
    const resposta = await fetch(`${import.meta.env.BASE_URL}agrofit_base_completa.json`);
    if (!resposta.ok) {
      throw new Error("Não foi possível carregar a base de dados.");
    }

    const dadosBrutos = await resposta.json();

    if (!Array.isArray(dadosBrutos)) {
      throw new Error("O formato do JSON não é um array válido.");
    }

    const produtosMapeados: ProdutoAgrofitCompleto[] = dadosBrutos.map((item: any, index: number) => {
      const primeiroAtivo = item.ingrediente_ativo_detalhado?.[0];
      
      // Mapeia todas as indicações de uso do JSON extraindo nome comum, científico, doses, caldas, aplicações e segurança
      const indicacoesMapeadas: IndicacaoUsoAgrofit[] = Array.isArray(item.indicacao_uso)
        ? item.indicacao_uso.map((ind: any) => {
            const nomeComum = Array.isArray(ind.praga_nome_comum)
              ? ind.praga_nome_comum.join(", ")
              : ind.praga_nome_comum || "Não especificado";

            const nomeCientifico = Array.isArray(ind.praga_nome_cientifico)
              ? ind.praga_nome_cientifico.join(", ")
              : ind.praga_nome_cientifico || "Não especificado";
            
            const dMin = Number(ind.dose_min) || 0;
            const dMax = Number(ind.dose_max) || dMin;
            const vMin = Number(ind.volume_calda_min) || 0;
            const vMax = Number(ind.volume_calda_max) || vMin;

            return {
              cultura: ind.cultura || "Geral",
              pragaNomeComum: nomeComum,
              pragaNomeCientifico: nomeCientifico,
              modoAplicacao: ind.modo_aplicacao || "Terrestre",
              doseMin: dMin,
              doseMax: dMax,
              doseMed: Number(((dMin + dMax) / 2).toFixed(2)),
              doseUnid: ind.dose_unidade || primeiroAtivo?.unidade_medida || "L/ha",
              vCaldaMin: vMin,
              vCaldaMax: vMax,
              vCaldaMed: Number(((vMin + vMax) / 2).toFixed(2)),
              vCaldaUnid: ind.volume_calda_unidade || "L/ha",
              numeroAplicacoesMax: ind.numero_aplicacoes ?? ind.num_aplicacoes ?? ind.max_aplicacoes ?? "1",
              intervaloSeguranca: ind.intervalo_seguranca ?? ind.carencia ?? "N/A"
            };
          })
        : [];

      const primeiraIndicacao = indicacoesMapeadas[0] || { 
        cultura: "", 
        pragaNomeComum: "", 
        pragaNomeCientifico: "",
        modoAplicacao: "Terrestre",
        doseMin: 0, 
        doseMax: 0, 
        doseMed: 0, 
        doseUnid: "L/ha",
        vCaldaMin: 0, 
        vCaldaMax: 0, 
        vCaldaMed: 0, 
        vCaldaUnid: "L/ha",
        numeroAplicacoesMax: "1",
        intervaloSeguranca: "N/A"
      };

      const documentosOtimizados = Array.isArray(item.documento_cadastrado)
        ? item.documento_cadastrado.map((doc: any) => ({
            tipo_documento: doc.tipo_documento || "",
            url: doc.url || "",
          }))
        : [];

      return {
        id: String(item.numero_registro || index),
        registro: String(item.numero_registro || ""),
        nomeComercial: Array.isArray(item.marca_comercial) 
          ? item.marca_comercial[0] || "" 
          : item.marca_comercial || "",
        titularRegistro: item.titular_registro || "",
        ingredienteAtivo: Array.isArray(item.ingrediente_ativo)
          ? item.ingrediente_ativo.join(", ")
          : item.ingrediente_ativo || "",
        formulacao: item.formulacao || "",
        grupoQuimico: primeiroAtivo?.grupo_quimico || "",
        classeToxicologica: item.classificacao_toxicologica || "",
        cultura: primeiraIndicacao.cultura,
        praga: primeiraIndicacao.pragaNomeComum,
        indicacoesUso: indicacoesMapeadas,
        unidadePadrao: primeiroAtivo?.unidade_medida || "Litros (L)",
        documentosCadastrados: documentosOtimizados,
        // Atalhos populados com base na primeira indicação:
        modoAplicacao: primeiraIndicacao.modoAplicacao,
        doseMin: primeiraIndicacao.doseMin,
        doseMax: primeiraIndicacao.doseMax,
        doseMed: primeiraIndicacao.doseMed,
        doseUnid: primeiraIndicacao.doseUnid,
        vCaldaMin: primeiraIndicacao.vCaldaMin,
        vCaldaMax: primeiraIndicacao.vCaldaMax,
        vCaldaMed: primeiraIndicacao.vCaldaMed,
        vCaldaUnid: primeiraIndicacao.vCaldaUnid,
        numeroAplicacoesMax: primeiraIndicacao.numeroAplicacoesMax,
        intervaloSeguranca: primeiraIndicacao.intervaloSeguranca,
      };
    });

    return produtosMapeados;

  } catch (erro) {
    console.error("Erro ao processar a base local do Agrofit:", erro);
    return [];
  }
}