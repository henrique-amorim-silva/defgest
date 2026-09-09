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
  praga: string;
  unidadePadrao: string;
  documentosCadastrados?: DocumentoAgrofit[];
}

export async function sincronizarCatalogoAgrofit(): Promise<ProdutoAgrofitCompleto[]> {
  try {
    // Carrega diretamente do arquivo JSON estático hospedado no projeto
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
      const primeiraIndicacao = item.indicacao_uso?.[0];

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
        cultura: primeiraIndicacao?.cultura || "",
        praga: Array.isArray(primeiraIndicacao?.praga_nome_comum)
          ? primeiraIndicacao.praga_nome_comum[0]
          : primeiraIndicacao?.praga_nome_comum || "",
        unidadePadrao: primeiroAtivo?.unidade_medida || "Litros (L)",
        documentosCadastrados: documentosOtimizados,
      };
    });

    return produtosMapeados;

  } catch (erro) {
    console.error("Erro ao processar a base local do Agrofit:", erro);
    
    return [
      {
        id: "1",
        registro: "00198",
        nomeComercial: "Glifosato Master",
        titularRegistro: "Indústria Química Brasileira",
        ingredienteAtivo: "Glifosato",
        formulacao: "Concentrado Solúvel (SL)",
        grupoQuimico: "Glicina Substituída",
        classeToxicologica: "Categoria 5",
        cultura: "Soja e Milho",
        praga: "Plantas Daninhas",
        unidadePadrao: "Litros (L)",
        documentosCadastrados: [],
      },
    ];
  }
}

export async function forcarAtualizacaoAgrofit(): Promise<ProdutoAgrofitCompleto[]> {
  return await sincronizarCatalogoAgrofit();
}