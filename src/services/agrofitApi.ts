// agrofitApi.ts

export interface IndicacaoUsoAgrofit {
  cultura: string;
  praga: string;
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
  cultura: string; // Mantido para retrocompatibilidade ou busca rápida
  praga: string;   // Mantido para retrocompatibilidade ou busca rápida
  indicacoesUso: IndicacaoUsoAgrofit[]; // <--- Nova lista completa
  unidadePadrao: string;
  documentosCadastrados?: DocumentoAgrofit[];
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
      
      // Mapeia todas as indicações de uso do JSON
      const indicacoesMapeadas: IndicacaoUsoAgrofit[] = Array.isArray(item.indicacao_uso)
        ? item.indicacao_uso.map((ind: any) => {
            const pragaNome = Array.isArray(ind.praga_nome_comum)
              ? ind.praga_nome_comum.join(", ")
              : ind.praga_nome_comum || ind.praga_nome_cientifico || "Não especificado";
            return {
              cultura: ind.cultura || "Geral",
              praga: pragaNome,
            };
          })
        : [];

      const primeiraIndicacao = indicacoesMapeadas[0] || { cultura: "", praga: "" };

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
        praga: primeiraIndicacao.praga,
        indicacoesUso: indicacoesMapeadas, // <--- Atribui o array completo
        unidadePadrao: primeiroAtivo?.unidade_medida || "Litros (L)",
        documentosCadastrados: documentosOtimizados,
      };
    });

    return produtosMapeados;

  } catch (erro) {
    console.error("Erro ao processar a base local do Agrofit:", erro);
    return [];
  }
}