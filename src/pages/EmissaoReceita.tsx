// src/components/EmissaoReceita.tsx
import React, { useState, useEffect } from "react";
import { sincronizarCatalogoAgrofit } from "../services/agrofitApi";
import { supabase } from "../services/api";
import type { ItemEstoque } from "../@types/estoque";
import type {
  ReceitaAgronomica,
  ItemReceitaAgronomica,
} from "../@types/receita";
import type {
  ProdutoAgrofitCompleto,
  IndicacaoUsoAgrofit,
} from "../services/agrofitApi";
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  Printer,
  Edit,
  ArrowLeft,
  History,
  Search,
  Eye,
  AlertTriangle,
} from "lucide-react";

export const EmissaoReceita: React.FC = () => {
  const parseNum = (val: any): number => {
    if (!val) return 0;
    if (typeof val === "number") return isNaN(val) ? 0 : val;
    // Substitui vírgula por ponto para converter strings do tipo "0,25" corretamente
    const limpo = String(val).replace(",", ".").trim();
    const num = parseFloat(limpo);
    return isNaN(num) ? 0 : num;
  };

  const [estoque, setEstoque] = useState<ItemEstoque[]>([]);
  const [catalogoAgrofit, setCatalogoAgrofit] = useState<
    ProdutoAgrofitCompleto[]
  >([]);
  const [receitas, setReceitas] = useState<ReceitaAgronomica[]>([]);

  // Listas de Clientes e Propriedades do Banco
  const [clientesLista, setClientesLista] = useState<any[]>([]);
  const [propriedadesLista, setPropriedadesLista] = useState<any[]>([]);

  const [modo, setModo] = useState<
    "lista" | "formulario" | "sucesso" | "detalhes"
  >("lista");
  const [receitaEmEdicaoId, setReceitaEmEdicaoId] = useState<string | null>(
    null,
  );

  const [filtroBusca, setFiltroBusca] = useState("");

  const obterEmpresaAtivaId = () => {
    try {
      const direta =
        localStorage.getItem("empresaId") ||
        localStorage.getItem("empresaAtivaId") ||
        sessionStorage.getItem("empresaId");
      if (direta) return direta;

      const usuarioStr = localStorage.getItem("usuario");
      if (usuarioStr) {
        const usuarioObj = JSON.parse(usuarioStr);
        if (usuarioObj?.empresa_id) return String(usuarioObj.empresa_id);
        if (usuarioObj?.empresaId) return String(usuarioObj.empresaId);
      }

      return "1";
    } catch (e) {
      return "1";
    }
  };

  const [empresaAtual, setEmpresaAtual] = useState(obterEmpresaAtivaId());

  // Campos de Identificação
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState("");
  const [propriedadeSelecionadaId, setPropriedadeSelecionadaId] = useState("");

  const [produtorNome, setProdutorNome] = useState("");
  const [produtorCpfCnpj, setProdutorCpfCnpj] = useState("");
  const [produtorRgIe, setProdutorRgIe] = useState("");
  const [produtorEndereco, setProdutorEndereco] = useState("");
  const [produtorMunicipio, setProdutorMunicipio] = useState("");
  const [produtorTelefone, setProdutorTelefone] = useState("");

  const [propriedadeNome, setPropriedadeNome] = useState("");
  const [propriedadeCpfCnpj, setPropriedadeCpfCnpj] = useState("");
  const [propriedadeIpr, setPropriedadeIpr] = useState("");
  const [propriedadeEndereco, setPropriedadeEndereco] = useState("");
  const [propriedadeMunicipio, setPropriedadeMunicipio] = useState("");
  const [propriedadeAreaTotal, setPropriedadeAreaTotal] = useState<number>(0);

  // Responsável Técnico
  const [respTecNome, setRespTecNome] = useState("Alex Jorge");
  const [respTecCpfCrea, setRespTecCpfCrea] = useState("695.732.176-27");
  const [respTecLocal, setRespTecLocal] = useState("Viçosa / MG");
  const [artTrtNumero, setArtTrtNumero] = useState("32");

  const [orientacoes, setOrientacoes] = useState("");
  const [itensReceita, setItensReceita] = useState<ItemReceitaAgronomica[]>([]);

  // Campos do Formulário do Item em Seleção
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState("");
  const [culturaSelecionada, setCulturaSelecionada] = useState("");
  const [pragaSelecionadaIndex, setPragaSelecionadaIndex] = useState<
    number | string
  >("");

  const [area, setArea] = useState("");
  const [dosagemUtilizada, setDosagemUtilizada] = useState("");
  const [volumeCaldaUtilizado, setVolumeCaldaUtilizado] = useState("");
  const [modoAplicacaoUtilizado, setModoAplicacaoUtilizado] = useState("");
  const [numeroAplicacoes, setNumeroAplicacoes] = useState("1");
  const [epocaEModoInstrucoes, setEpocaEModoInstrucoes] = useState("");

  const [culturasDisponiveis, setCulturasDisponiveis] = useState<string[]>([]);
  const [pragasDisponiveis, setPragasDisponiveis] = useState<
    IndicacaoUsoAgrofit[]
  >([]);
  const [indicacaoAtiva, setIndicacaoAtiva] =
    useState<IndicacaoUsoAgrofit | null>(null);
  const [produtoAgrofitAtivo, setProdutoAgrofitAtivo] =
    useState<ProdutoAgrofitCompleto | null>(null);

  const [receitaEmitida, setReceitaEmitida] =
    useState<ReceitaAgronomica | null>(null);
  const [receitaVisualizada, setReceitaVisualizada] =
    useState<ReceitaAgronomica | null>(null);

  useEffect(() => {
    const verificarTrocaEmpresa = () => {
      const novaEmpresa = obterEmpresaAtivaId();
      if (novaEmpresa !== empresaAtual) {
        setEmpresaAtual(novaEmpresa);
      }
    };
    const interval = setInterval(verificarTrocaEmpresa, 500);
    window.addEventListener("storage", verificarTrocaEmpresa);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", verificarTrocaEmpresa);
    };
  }, [empresaAtual]);

  useEffect(() => {
    carregarDadosIniciais();
  }, [empresaAtual]);

  const carregarDadosIniciais = async () => {
    try {
      const empresaIdAtiva = obterEmpresaAtivaId();

      const { data: dadosClientes } = await supabase
        .from("clientes")
        .select("*")
        .eq("empresa_id", empresaIdAtiva);
      if (dadosClientes) setClientesLista(dadosClientes);

      const { data: dadosPropriedades } = await supabase
        .from("propriedades")
        .select("*");
      if (dadosPropriedades) setPropriedadesLista(dadosPropriedades);

      const { data: dadosEstoque, error: errEstoque } = await supabase
        .from("estoque")
        .select("*, lote_validade(*)")
        .eq("empresa_id", empresaIdAtiva);
      if (errEstoque) throw errEstoque;

      if (Array.isArray(dadosEstoque)) {
        setEstoque(
          dadosEstoque.map((item: any) => ({
            id: item.id,
            empresaId: item.empresa_id,
            nomeProduto: item.nome_produto,
            unidade: item.unidade,
            embalagem: item.embalagem,
            estMin: item.est_min,
            lotes: Array.isArray(item.lote_validade)
              ? item.lote_validade.map((l: any) => ({
                  id: l.id,
                  lote: l.lote,
                  quantidadeAtual: l.quantidade_atual,
                  dataValidade: l.data_validade,
                }))
              : [],
          })),
        );
      }

      const { data: dadosReceitas } = await supabase
        .from("receitas_agronomicas")
        .select("*, itens_receita(*)")
        .eq("empresa_id", empresaIdAtiva);

      if (Array.isArray(dadosReceitas)) {
        setReceitas(
          dadosReceitas.map((r: any) => ({
            id: r.id,
            numeroReceita: r.numero_receita,
            produtorNome: r.produtor_nome,
            produtorCpfCnpj: r.produtor_cpf_cnpj,
            produtorRgIe: r.produtor_rg_ie || "",
            produtorEndereco: r.produtor_endereco || "",
            produtorMunicipio: r.produtor_municipio || "",
            produtorTelefone: r.produtor_telefone || "",
            propriedadeNome: r.propriedade_nome,
            propriedadeCpfCnpj: r.propriedade_cpf_cnpj || "",
            propriedadeIpr: r.propriedade_ipr || "",
            propriedadeEndereco: r.propriedade_endereco || "",
            propriedadeMunicipio: r.propriedade_municipio || "",
            respTecNome: r.resp_tec_nome || "Alex Jorge",
            respTecCpfCrea: r.resp_tec_cpf_crea || "695.732.176-27",
            respTecLocal: r.resp_tec_local || "Viçosa / MG",
            artTrtNumero: r.art_trt_numero || "32",
            orientacoes: r.orientacoes,
            dataEmissao: r.created_at,
            itens: Array.isArray(r.itens_receita)
              ? r.itens_receita.map((i: any) => ({
                  produtoId: String(i.estoque_id),
                  nomeProduto: i.nome_produto,
                  ingredienteAtivo: i.ingrediente_ativo,
                  classeToxicologica: i.classe_toxicologica,
                  grupoQuimico: i.grupo_quimico,
                  formulacao: i.formulacao,
                  concentracao: i.concentracao,
                  cultura: i.cultura,
                  pragaNomeComum: i.praga_nome_comum,
                  pragaNomeCientifico: i.praga_nome_cientifico,
                  modoAplicacao: i.modo_aplicacao,
                  epocaAplicacao: i.epoca_aplicacao,
                  dosagemMin: 0,
                  dosagemMax: 0,
                  dosagemUtilizada: i.dosagem_utilizada,
                  unidadeDosagem: i.unidade_dosagem,
                  volumeCaldaMin: 0,
                  volumeCaldaMax: 0,
                  volumeCaldaUtilizado: i.volume_calda_utilizado,
                  unidadeVolumeCalda: i.unidade_volume_calda,
                  areaAplicacaoHectares: i.area_hectares,
                  quantidadeRecomendada: i.quantidade_recomendada,
                  numeroAplicacoesMax: i.numero_aplicacoes || "1",
                  carenciaDias: i.carencia_dias || "Não determinado",
                  embalagemDescricao: i.embalagem_descricao || "",
                }))
              : [],
          })),
        );
      }

      const catalogo = await sincronizarCatalogoAgrofit();
      setCatalogoAgrofit(Array.isArray(catalogo) ? catalogo : []);
    } catch (error) {
      console.error("Erro ao carregar dados iniciais:", error);
    }
  };

  const handleSelecionarCliente = (clienteId: string) => {
    setClienteSelecionadoId(clienteId);
    setPropriedadeSelecionadaId("");
    setPropriedadeNome("");
    setPropriedadeCpfCnpj("");
    setPropriedadeIpr("");
    setPropriedadeEndereco("");
    setPropriedadeMunicipio("");
    setPropriedadeAreaTotal(0);

    if (!clienteId) {
      setProdutorNome("");
      setProdutorCpfCnpj("");
      setProdutorRgIe("");
      setProdutorEndereco("");
      setProdutorMunicipio("");
      setProdutorTelefone("");
      return;
    }

    const cli = clientesLista.find((c) => String(c.id) === String(clienteId));
    if (cli) {
      setProdutorNome(cli.nome || "");
      setProdutorCpfCnpj(cli.cpf_cnpj || "");
      setProdutorRgIe(cli.inscricao_estadual || cli.registro_geral || "");
      setProdutorEndereco(
        `${cli.endereco || ""}, ${cli.numero || ""} - ${cli.bairro || ""}`.trim(),
      );
      setProdutorMunicipio(`${cli.cidade || ""} / ${cli.uf || ""}`.trim());
      setProdutorTelefone(cli.telefone || cli.whatsapp || "");
    }
  };

  const handleSelecionarPropriedade = (propId: string) => {
    setPropriedadeSelecionadaId(propId);
    if (!propId) {
      setPropriedadeNome("");
      setPropriedadeCpfCnpj("");
      setPropriedadeIpr("");
      setPropriedadeEndereco("");
      setPropriedadeMunicipio("");
      setPropriedadeAreaTotal(0);
      return;
    }

    const prop = propriedadesLista.find((p) => String(p.id) === String(propId));
    if (prop) {
      setPropriedadeNome(prop.nome_propriedade || "");
      setPropriedadeCpfCnpj(prop.cpf_cnpj || "");
      setPropriedadeIpr(prop.lpr || prop.ie || "");
      setPropriedadeEndereco(
        `${prop.endereco || ""}, ${prop.numero || ""}`.trim(),
      );
      setPropriedadeMunicipio(`${prop.cidade || ""} / ${prop.uf || ""}`.trim());
      setPropriedadeAreaTotal(
        Number(prop.area_total_ha || prop.area_ha || prop.area || 0),
      );
    }
  };

  const propriedadesDoClienteSelecionado = propriedadesLista.filter(
    (p) => String(p.cliente_id) === String(clienteSelecionadoId),
  );

  const abrirNovaReceita = () => {
    setReceitaEmEdicaoId(null);
    setClienteSelecionadoId("");
    setPropriedadeSelecionadaId("");
    setProdutorNome("");
    setProdutorCpfCnpj("");
    setProdutorRgIe("");
    setProdutorEndereco("");
    setProdutorMunicipio("");
    setProdutorTelefone("");
    setPropriedadeNome("");
    setPropriedadeCpfCnpj("");
    setPropriedadeIpr("");
    setPropriedadeEndereco("");
    setPropriedadeMunicipio("");
    setPropriedadeAreaTotal(0);
    setOrientacoes("");
    setItensReceita([]);
    limparCamposSelecao();
    setModo("formulario");
  };

  const limparCamposSelecao = () => {
    setProdutoSelecionadoId("");
    setCulturaSelecionada("");
    setPragaSelecionadaIndex("");
    setArea("");
    setDosagemUtilizada("");
    setVolumeCaldaUtilizado("");
    setModoAplicacaoUtilizado("");
    setNumeroAplicacoes("1");
    setEpocaEModoInstrucoes("");
    setCulturasDisponiveis([]);
    setPragasDisponiveis([]);
    setIndicacaoAtiva(null);
    setProdutoAgrofitAtivo(null);
  };

  const handleSelecionarProdutoEstoque = async (idEstoque: string) => {
    setProdutoSelecionadoId(idEstoque);
    setCulturaSelecionada("");
    setPragaSelecionadaIndex("");
    setPragasDisponiveis([]);
    setIndicacaoAtiva(null);
    setDosagemUtilizada("");
    setVolumeCaldaUtilizado("");
    setModoAplicacaoUtilizado("");
    setEpocaEModoInstrucoes("");
    setCulturasDisponiveis([]);

    const itemEstoque = estoque.find(
      (e: any) => String(e.id) === String(idEstoque),
    );
    if (!itemEstoque) return;

    const nomeProd = itemEstoque.nomeProduto || "";

    try {
      let numeroRegistroAlvo: string | null = null;

      // 1. Busca o produto na tabela agrofit_produtos do Supabase pelo nome comercial
      const { data: produtoAgrofitDb } = await supabase
        .from("agrofit_produtos")
        .select(
          "numero_registro, marca_comercial, ingrediente_ativo, classe_categoria_agronomico, grupo_quimico, formulacao",
        )
        .ilike("marca_comercial", `%${nomeProd}%`)
        .limit(1);

      if (produtoAgrofitDb && produtoAgrofitDb.length > 0) {
        numeroRegistroAlvo = produtoAgrofitDb[0].numero_registro;
        setProdutoAgrofitAtivo({
          numeroRegistro: produtoAgrofitDb[0].numero_registro,
          nomeComercial: produtoAgrofitDb[0].marca_comercial,
          ingredienteAtivo: produtoAgrofitDb[0].ingrediente_ativo,
          classeToxicologica: produtoAgrofitDb[0].classe_categoria_agronomico,
          grupoQuimico: produtoAgrofitDb[0].grupo_quimico,
          formulacao: produtoAgrofitDb[0].formulacao,
          indicacoesUso: [],
        } as any);
      } else {
        // Fallback para o catálogo local caso não encontre no DB
        const prodLocal = catalogoAgrofit.find(
          (p) => p.nomeComercial?.toLowerCase() === nomeProd.toLowerCase(),
        ) as any;
        if (prodLocal) {
          numeroRegistroAlvo = prodLocal.registro || prodLocal.numeroRegistro;
          setProdutoAgrofitAtivo(prodLocal);
        }
      }

      if (!numeroRegistroAlvo) {
        setCulturasDisponiveis([]);
        return;
      }

      // 2. Busca EXCLUSIVAMENTE na tabela instrucoes_uso do Supabase
      const { data: instrucoesSupabase, error } = await supabase
        .from("instrucoes_uso")
        .select("*")
        .eq("numero_registro", String(numeroRegistroAlvo));

      if (!error && instrucoesSupabase && instrucoesSupabase.length > 0) {
        const indicacoesMapeadas = (instrucoesSupabase as any[]).map(
          (i: any) => ({
            cultura: i.cultura,
            pragaNomeComum: i.praga_nome_comum,
            pragaNomeCientifico: i.praga_nome_cientifico,
            doseMin: parseNum(i.dose_min),
            doseMax: parseNum(i.dose_max) || parseNum(i.dose_min),
            doseUnid: i.dose_unidade || "L/ha",
            modoAplicacao: i.forma_aplicacao || "Pulverização Terrestre",
            vCaldaMin: parseNum(i.volume_calda_min),
            vCaldaMax:
              parseNum(i.volume_calda_max) || parseNum(i.volume_calda_min),
            vCaldaUnid: i.volume_calda_unidade || "L/ha",
            numAplicacoes: i.n_aplicacoes || "1",
            intervaloSeguranca: i.int_seguranca || "Não determinado",
            observacao: i.observacao || "",
          }),
        );

        const culturasUnicas = Array.from(
          new Set(indicacoesMapeadas.map((i) => i.cultura)),
        ) as string[];

        setCulturasDisponiveis(culturasUnicas);

        setProdutoAgrofitAtivo(
          (prev) =>
            ({
              ...(prev || {}),
              indicacoesUso: indicacoesMapeadas,
            }) as any,
        );
      } else {
        setCulturasDisponiveis([]);
      }
    } catch (err) {
      console.error("Erro ao carregar instrucoes_uso do Supabase:", err);
      setCulturasDisponiveis([]);
    }
  };

  const handleSelecionarCultura = (cultura: string) => {
    setCulturaSelecionada(cultura);
    setPragaSelecionadaIndex("");
    setIndicacaoAtiva(null);
    setDosagemUtilizada("");
    setVolumeCaldaUtilizado("");
    setModoAplicacaoUtilizado("");
    setEpocaEModoInstrucoes("");

    if (produtoAgrofitAtivo && produtoAgrofitAtivo.indicacoesUso) {
      const indicacoesFiltradas = produtoAgrofitAtivo.indicacoesUso.filter(
        (i) => i.cultura === cultura,
      );
      setPragasDisponiveis(indicacoesFiltradas);
    } else {
      setPragasDisponiveis([]);
    }
  };

  const handleSelecionarPraga = (indexStr: string) => {
    setPragaSelecionadaIndex(indexStr);
    if (indexStr === "") {
      setIndicacaoAtiva(null);
      setDosagemUtilizada("");
      setVolumeCaldaUtilizado("");
      setModoAplicacaoUtilizado("");
      setEpocaEModoInstrucoes("");
      return;
    }

    const index = Number(indexStr);
    const ind = pragasDisponiveis[index] as any;
    if (ind) {
      setIndicacaoAtiva(ind);
      setModoAplicacaoUtilizado(ind.modoAplicacao || "Pulverização Terrestre");
      setNumeroAplicacoes(
        String(ind.numAplicacoes || ind.numeroAplicacoes || "1"),
      );
      setEpocaEModoInstrucoes(
        ind.observacao ||
          ind.epocaAplicacao ||
          `Instruções de Uso: Aplicar ${ind.doseMin} ${ind.doseUnid || "L/ha"} com volume de calda de ${ind.vCaldaMin} L/ha.`,
      );

      // Cálculo direto da média da dose e volume de calda por hectare
      const dMin = parseNum(ind.doseMin);
      const dMax = parseNum(ind.doseMax) || dMin;
      const doseMedia = dMin > 0 || dMax > 0 ? (dMin + dMax) / 2 : 0;

      const cMin = parseNum(ind.vCaldaMin);
      const cMax = parseNum(ind.vCaldaMax) || cMin;
      const caldaMedia = cMin > 0 || cMax > 0 ? (cMin + cMax) / 2 : 0;

      setDosagemUtilizada(doseMedia > 0 ? String(doseMedia) : "");
      setVolumeCaldaUtilizado(caldaMedia > 0 ? String(caldaMedia) : "");
    }
  };

  const handleAdicionarItem = () => {
    if (!produtoSelecionadoId || !culturaSelecionada || !area) {
      alert(
        "Preencha os campos obrigatórios do item (Produto, Cultura e Área).",
      );
      return;
    }

    const itemEstoque = estoque.find(
      (e) => String(e.id) === String(produtoSelecionadoId),
    );
    if (!itemEstoque) {
      alert("Produto selecionado não encontrado no estoque.");
      return;
    }

    const dosagemNum = Number(dosagemUtilizada) || 0;
    const volumeCaldaNum = Number(volumeCaldaUtilizado) || 0;
    const areaNum = Number(area) || 0;
    const quantidadeTotal = dosagemNum > 0 ? dosagemNum * areaNum : 1;

    const novoItemReceita: ItemReceitaAgronomica = {
      produtoId: String(itemEstoque.id),
      nomeProduto: itemEstoque.nomeProduto,
      ingredienteAtivo:
        produtoAgrofitAtivo?.ingredienteAtivo || "Não informado",
      classeToxicologica:
        produtoAgrofitAtivo?.classeToxicologica || "Categoria 5",
      grupoQuimico: produtoAgrofitAtivo?.grupoQuimico || "Não informado",
      formulacao:
        produtoAgrofitAtivo?.formulacao || "SC - Suspensão Concentrada",
      concentracao: "500",
      cultura: culturaSelecionada,
      pragaNomeComum: indicacaoAtiva?.pragaNomeComum || "Aplicação Geral",
      pragaNomeCientifico: indicacaoAtiva?.pragaNomeCientifico || "",
      modoAplicacao:
        modoAplicacaoUtilizado ||
        indicacaoAtiva?.modoAplicacao ||
        "Pulverização Terrestre",
      epocaAplicacao:
        epocaEModoInstrucoes ||
        "Realizar aplicação conforme orientação agronômica.",
      dosagemMin: Number(indicacaoAtiva?.doseMin || 0),
      dosagemMax: Number(indicacaoAtiva?.doseMax || 0),
      dosagemUtilizada: dosagemNum,
      unidadeDosagem: indicacaoAtiva?.doseUnid || itemEstoque.unidade || "L/ha",
      volumeCaldaMin: Number(indicacaoAtiva?.vCaldaMin || 0),
      volumeCaldaMax: Number(indicacaoAtiva?.vCaldaMax || 0),
      volumeCaldaUtilizado: volumeCaldaNum,
      unidadeVolumeCalda: indicacaoAtiva?.vCaldaUnid || "L/ha",
      areaAplicacaoHectares: areaNum,
      quantidadeRecomendada: quantidadeTotal,
      numeroAplicacoesMax: numeroAplicacoes,
      carenciaDias: indicacaoAtiva?.intervaloSeguranca || "Não determinado",
      embalagemDescricao: itemEstoque.embalagem || "Frasco - Plástico - Rígido",
    };

    setItensReceita([...itensReceita, novoItemReceita]);
    limparCamposSelecao();
  };

  const handleRemoverItem = (index: number) => {
    setItensReceita(itensReceita.filter((_, i) => i !== index));
  };

  const handleSalvarReceita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (itensReceita.length === 0) {
      alert("Adicione pelo menos um produto à receita.");
      return;
    }

    try {
      const empresaIdAtiva = obterEmpresaAtivaId();
      const numeroReceitaGerado = `REC-${Date.now().toString().slice(-6)}`;

      const dadosPayload = {
        produtor_nome: produtorNome,
        produtor_cpf_cnpj: produtorCpfCnpj,
        produtor_rg_ie: produtorRgIe,
        produtor_endereco: produtorEndereco,
        produtor_municipio: produtorMunicipio,
        produtor_telefone: produtorTelefone,
        propriedade_nome: propriedadeNome,
        propriedade_cpf_cnpj: propriedadeCpfCnpj,
        propriedade_ipr: propriedadeIpr,
        propriedade_endereco: propriedadeEndereco,
        propriedade_municipio: propriedadeMunicipio,
        resp_tec_nome: respTecNome,
        resp_tec_cpf_crea: respTecCpfCrea,
        resp_tec_local: respTecLocal,
        art_trt_numero: artTrtNumero,
        orientacoes: orientacoes,
      };

      let receitaIdFinal = receitaEmEdicaoId;

      if (receitaEmEdicaoId) {
        await supabase
          .from("receitas_agronomicas")
          .update(dadosPayload)
          .eq("id", receitaEmEdicaoId);

        await supabase
          .from("itens_receita")
          .delete()
          .eq("receita_id", receitaEmEdicaoId);

        const itensFormatados = itensReceita.map((item) => ({
          receita_id: Number(receitaEmEdicaoId),
          estoque_id: Number(item.produtoId),
          nome_produto: item.nomeProduto,
          ingrediente_ativo: item.ingredienteAtivo,
          classe_toxicologica: item.classeToxicologica,
          grupo_quimico: item.grupoQuimico,
          formulacao: item.formulacao,
          concentracao: item.concentracao,
          cultura: item.cultura,
          praga_nome_comum: item.pragaNomeComum,
          praga_nome_cientifico: item.pragaNomeCientifico,
          modo_aplicacao: item.modoAplicacao,
          epoca_aplicacao: item.epocaAplicacao,
          dosagem_utilizada: item.dosagemUtilizada,
          unidade_dosagem: item.unidadeDosagem,
          volume_calda_utilizado: item.volumeCaldaUtilizado,
          unidade_volume_calda: item.unidadeVolumeCalda,
          area_hectares: item.areaAplicacaoHectares,
          quantidade_recomendada: item.quantidadeRecomendada,
          numero_aplicacoes: String(item.numeroAplicacoesMax || "1"),
          carencia_dias: String(item.carenciaDias || "Não determinado"),
          embalagem_descricao: item.embalagemDescricao || "",
        }));

        await supabase.from("itens_receita").insert(itensFormatados);
      } else {
        const { data: novaRec, error: recError } = await supabase
          .from("receitas_agronomicas")
          .insert([
            {
              empresa_id: Number(empresaIdAtiva),
              numero_receita: numeroReceitaGerado,
              ...dadosPayload,
            },
          ])
          .select()
          .single();

        if (recError) throw recError;
        receitaIdFinal = String(novaRec.id);

        const itensFormatados = itensReceita.map((item) => ({
          receita_id: novaRec.id,
          estoque_id: Number(item.produtoId),
          nome_produto: item.nomeProduto,
          ingrediente_ativo: item.ingredienteAtivo,
          classe_toxicologica: item.classeToxicologica,
          grupo_quimico: item.grupoQuimico,
          formulacao: item.formulacao,
          concentracao: item.concentracao,
          cultura: item.cultura,
          praga_nome_comum: item.pragaNomeComum,
          praga_nome_cientifico: item.pragaNomeCientifico,
          modo_aplicacao: item.modoAplicacao,
          epoca_aplicacao: item.epocaAplicacao,
          dosagem_utilizada: item.dosagemUtilizada,
          unidade_dosagem: item.unidadeDosagem,
          volume_calda_utilizado: item.volumeCaldaUtilizado,
          unidade_volume_calda: item.unidadeVolumeCalda,
          area_hectares: item.areaAplicacaoHectares,
          quantidade_recomendada: item.quantidadeRecomendada,
          numero_aplicacoes: String(item.numeroAplicacoesMax || "1"),
          carencia_dias: String(item.carenciaDias || "Não determinado"),
          embalagem_descricao: item.embalagemDescricao || "",
        }));

        await supabase.from("itens_receita").insert(itensFormatados);
      }

      const objetoEmitido: ReceitaAgronomica = {
        id: receitaIdFinal!,
        numeroReceita: numeroReceitaGerado,
        produtorNome,
        produtorCpfCnpj,
        produtorRgIe,
        produtorEndereco,
        produtorMunicipio,
        produtorTelefone,
        propriedadeNome,
        propriedadeCpfCnpj,
        propriedadeIpr,
        propriedadeEndereco,
        propriedadeMunicipio,
        propriedadeAreaTotalHa: propriedadeAreaTotal,
        respTecNome,
        respTecCpfCrea,
        respTecLocal,
        artTrtNumero,
        orientacoes,
        dataEmissao: new Date().toISOString(),
        itens: itensReceita,
      };

      setReceitaEmitida(objetoEmitido);
      await carregarDadosIniciais();
      setModo("sucesso");
    } catch (err: any) {
      alert(err.message || "Erro ao salvar a receita.");
    }
  };

  const handleExcluirReceita = async (id: number | string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta receita?")) return;
    try {
      await supabase.from("receitas_agronomicas").delete().eq("id", id);
      carregarDadosIniciais();
    } catch (err: any) {
      alert(err.message || "Erro ao excluir receita.");
    }
  };

  const handleEditarReceita = (receita: ReceitaAgronomica) => {
    setReceitaEmEdicaoId(String(receita.id));
    setProdutorNome(receita.produtorNome || "");
    setProdutorCpfCnpj(receita.produtorCpfCnpj || "");
    setProdutorRgIe(receita.produtorRgIe || "");
    setProdutorEndereco(receita.produtorEndereco || "");
    setProdutorMunicipio(receita.produtorMunicipio || "");
    setProdutorTelefone(receita.produtorTelefone || "");
    setPropriedadeNome(receita.propriedadeNome || "");
    setPropriedadeCpfCnpj(receita.propriedadeCpfCnpj || "");
    setPropriedadeIpr(receita.propriedadeIpr || "");
    setPropriedadeEndereco(receita.propriedadeEndereco || "");
    setPropriedadeMunicipio(receita.propriedadeMunicipio || "");
    setPropriedadeAreaTotal(receita.propriedadeAreaTotalHa || 0);
    setRespTecNome(receita.respTecNome || "Alex Jorge");
    setRespTecCpfCrea(receita.respTecCpfCrea || "695.732.176-27");
    setRespTecLocal(receita.respTecLocal || "Viçosa / MG");
    setArtTrtNumero(receita.artTrtNumero || "32");
    setOrientacoes(receita.orientacoes || "");
    setItensReceita([...receita.itens]);
    setModo("formulario");
  };

  const handleVisualizarReceita = (receita: ReceitaAgronomica) => {
    setReceitaVisualizada(receita);
    setModo("detalhes");
  };

  const receitasFiltradas = receitas.filter((rec) => {
    const termo = filtroBusca.toLowerCase();
    return (
      (rec.produtorNome || "").toLowerCase().includes(termo) ||
      (rec.numeroReceita || "").toLowerCase().includes(termo) ||
      (rec.propriedadeNome || "").toLowerCase().includes(termo)
    );
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Estilos globais para ocultar elementos da interface durante a impressão */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #secao-impressao-receita, #secao-impressao-receita * {
            visibility: visible;
          }
          #secao-impressao-receita {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
      {modo === "lista" && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 border border-emerald-100">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4 gap-4">
            <div className="flex items-center space-x-3">
              <History className="h-7 w-7 text-emerald-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Emissão de Receitas Agronômicas
                </h2>
                <p className="text-sm text-gray-500">
                  Histórico e gerenciamento de receitas emitidas via Supabase.
                </p>
              </div>
            </div>
            <button
              onClick={abrirNovaReceita}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-md transition flex items-center space-x-2 shadow"
            >
              <Plus className="h-5 w-5" />
              <span>Nova Receita</span>
            </button>
          </div>

          <div className="mb-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Pesquisar por nome do produtor, número da receita ou propriedade..."
              value={filtroBusca}
              onChange={(e) => setFiltroBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {receitasFiltradas.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="font-medium">
                Nenhuma receita agronômica encontrada.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {receitasFiltradas.map((rec) => (
                <div
                  key={rec.id}
                  className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-emerald-200 transition"
                >
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-sm">
                        {rec.numeroReceita}
                      </span>
                      <span className="text-xs text-gray-500">
                        Data:{" "}
                        {rec.dataEmissao
                          ? new Date(rec.dataEmissao).toLocaleDateString()
                          : "-"}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">
                      Produtor: {rec.produtorNome}{" "}
                      {rec.produtorCpfCnpj ? `(${rec.produtorCpfCnpj})` : ""}
                    </p>
                    <p className="text-xs text-gray-600">
                      Propriedade: {rec.propriedadeNome || "Não informada"} |
                      Itens: {rec.itens?.length || 0} produto(s)
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleVisualizarReceita(rec)}
                      className="text-emerald-700 hover:text-emerald-900 p-1.5 bg-emerald-50 rounded border border-emerald-200 text-xs flex items-center space-x-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Ver Modelo Oficial</span>
                    </button>
                    <button
                      onClick={() => handleEditarReceita(rec)}
                      className="text-amber-600 hover:text-amber-800 p-1.5 bg-amber-50 rounded border border-amber-200 text-xs flex items-center space-x-1"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleExcluirReceita(rec.id)}
                      className="text-red-600 hover:text-red-800 p-1.5 bg-red-50 rounded border border-red-200 text-xs flex items-center space-x-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VISUALIZAÇÃO COM O LAYOUT TÉCNICO OFICIAL IGUAL À IMAGEM */}
      {modo === "detalhes" && receitaVisualizada && (
        <div
          id="secao-impressao-receita"
          className="bg-white rounded-xl shadow-md p-8 border border-emerald-100 space-y-6 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none"
        >
          <div className="flex items-center justify-between border-b pb-4 print:hidden">
            <h2 className="text-xl font-bold text-gray-800">
              Visualizar Receita Agronômica (Modelo Oficial)
            </h2>
            <button
              type="button"
              onClick={() => setModo("lista")}
              className="text-gray-600 hover:text-gray-800 text-sm flex items-center space-x-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </button>
          </div>

          <div className="border-2 border-black p-3 text-[11px] leading-tight text-black space-y-3 bg-white font-sans print:border-none print:p-1">
            {/* Cabeçalho */}
            <div className="border-b-2 border-black pb-2">
              <div className="flex justify-between items-center">
                <h1 className="text-sm font-bold uppercase">
                  Receita Agronômica
                </h1>
                <span className="text-[9px] text-right">
                  1º Via - Estabelecimento Comercial / 2º Via - Usuário / 3º Via
                  - CREA-CFTA / 4º Via - Profissional
                </span>
              </div>
              <div className="grid grid-cols-3 font-semibold mt-1 border-t border-black pt-1">
                <span>
                  Receita nº:{" "}
                  <span className="font-mono">
                    {receitaVisualizada.numeroReceita}
                  </span>
                </span>
                <span>
                  ART/TRT nº: {receitaVisualizada.artTrtNumero || "32"}
                </span>
                <span>
                  Local: {receitaVisualizada.respTecLocal || "Viçosa / MG"}
                </span>
              </div>
            </div>

            {/* Produtor / Propriedade */}
            <div className="grid grid-cols-2 border border-black divide-x divide-black">
              <div className="p-1.5 space-y-0.5">
                <div className="font-bold border-b border-gray-300 pb-0.5 mb-1">
                  DADOS DO PRODUTOR
                </div>
                <div>
                  <strong>Nome:</strong> {receitaVisualizada.produtorNome}
                </div>
                <div>
                  <strong>End.:</strong>{" "}
                  {receitaVisualizada.produtorEndereco || "-"}
                </div>
                <div>
                  <strong>Município:</strong>{" "}
                  {receitaVisualizada.produtorMunicipio || "-"}
                </div>
                <div>
                  <strong>CPF/CNPJ:</strong>{" "}
                  {receitaVisualizada.produtorCpfCnpj || "-"}
                </div>
                <div>
                  <strong>RG/IE:</strong>{" "}
                  {receitaVisualizada.produtorRgIe || "-"}
                </div>
              </div>
              <div className="p-1.5 space-y-0.5">
                <div className="font-bold border-b border-gray-300 pb-0.5 mb-1">
                  PROPRIEDADE & RESP. TÉCNICO
                </div>
                <div>
                  <strong>Propriedade:</strong>{" "}
                  {receitaVisualizada.propriedadeNome || "-"}
                </div>
                <div>
                  <strong>End. Prop.:</strong>{" "}
                  {receitaVisualizada.propriedadeEndereco || "-"}
                </div>
                <div>
                  <strong>Resp. Téc.:</strong>{" "}
                  {receitaVisualizada.respTecNome || "Alex Jorge"}
                </div>
                <div>
                  <strong>CREA/CFTA:</strong>{" "}
                  {receitaVisualizada.respTecCpfCrea || "695.732.176-27"}
                </div>
              </div>
            </div>

            {/* SEÇÕES TÉCNICAS IGUAIS À SEGUNDA IMAGEM */}
            {receitaVisualizada.itens?.map((item, idx) => (
              <div
                key={idx}
                className="border border-black space-y-0 text-[10.5px]"
              >
                {/* 1. DADOS TÉCNICOS */}
                <div className="bg-gray-100 font-bold px-2 py-0.5 border-b border-black text-center uppercase">
                  DADOS TÉCNICOS
                </div>
                <div className="grid grid-cols-2 p-1.5 gap-x-4 gap-y-1 border-b border-black">
                  <div>
                    <strong>Área:</strong> {item.areaAplicacaoHectares} (ha)
                  </div>
                  <div>
                    <strong>Diagnóstico / Alvo:</strong> {item.pragaNomeComum}{" "}
                    {item.pragaNomeCientifico
                      ? `(${item.pragaNomeCientifico})`
                      : ""}
                  </div>
                  <div>
                    <strong>Estágio:</strong> -
                  </div>
                  <div>
                    <strong>Cultura:</strong> {item.cultura}
                  </div>
                  <div>
                    <strong>Horário:</strong> Conforme condições favoráveis
                  </div>
                </div>

                {/* 2. RECOMENDAÇÕES TÉCNICAS E EPIs */}
                <div className="bg-gray-100 font-bold px-2 py-0.5 border-b border-black text-center uppercase">
                  RECOMENDAÇÕES TÉCNICAS
                </div>
                <div className="p-1.5 border-b border-black flex items-start space-x-2">
                  <span className="font-bold text-sm">EPI:</span>
                  <p className="text-[10px]">
                    Respiradores semifaciais ou faciais com filtros P2 ou P3.
                    Óculos de segurança ou viseira facial. Macacão de algodão
                    hidro-repelente e impermeável. Bota impermeável de cano alto
                    (PVC). Ao surgimento de qualquer dúvida, leia as
                    recomendações do rótulo e bula.
                  </p>
                </div>

                {/* 3. CONTROLE DO DEFENSIVO AGRÍCOLA */}
                <div className="bg-gray-100 font-bold px-2 py-0.5 border-b border-black text-center uppercase">
                  CONTROLE
                </div>
                <div className="grid grid-cols-2 p-1.5 gap-x-4 gap-y-1 border-b border-black">
                  <div>
                    <strong>Def. Agrícola:</strong> {item.nomeProduto}
                  </div>
                  <div>
                    <strong>Época de Aplicação:</strong> Conforme recomendação
                  </div>
                  <div>
                    <strong>Ingrediente ativo:</strong>{" "}
                    {item.ingredienteAtivo || "Não informado"}
                  </div>
                  <div>
                    <strong>Mod. Aplicação:</strong> {item.modoAplicacao}
                  </div>
                  <div>
                    <strong>Classe:</strong>{" "}
                    {item.classeToxicologica || "III - Produto Perigoso"}
                  </div>
                  <div>
                    <strong>Dose de aplicação:</strong> {item.dosagemUtilizada}{" "}
                    {item.unidadeDosagem}
                  </div>
                  <div>
                    <strong>Grupo químico:</strong> {item.grupoQuimico || "-"}
                  </div>
                  <div>
                    <strong>Número de aplicações:</strong>{" "}
                    {item.numeroAplicacoesMax || "1"}
                  </div>
                  <div>
                    <strong>Formulação:</strong> {item.formulacao || "-"}
                  </div>
                  <div>
                    <strong>Intervalo de aplicações (dias):</strong> 0
                  </div>
                  <div>
                    <strong>Concentração:</strong> {item.concentracao || "500"}
                  </div>
                  <div>
                    <strong>Período de carência (dias):</strong>{" "}
                    {item.carenciaDias || "Não determinado"}
                  </div>
                  <div className="col-span-2 pt-1 font-bold">
                    <strong>Quantidade Requerida:</strong>{" "}
                    {item.quantidadeRecomendada} (
                    {item.embalagemDescricao || "Unidades / Frascos"})
                  </div>
                </div>

                {/* 4. MODO DE APLICAÇÃO + ÉPOCA DE APLICAÇÃO */}
                <div className="bg-gray-100 font-bold px-2 py-0.5 border-b border-black text-center uppercase">
                  MODO DE APLICAÇÃO + ÉPOCA DE APLICAÇÃO
                </div>
                <div className="p-1.5 text-[9.5px] leading-snug">
                  <p>
                    {item.epocaAplicacao ||
                      "Realizar aplicação em pré-emergência ou pós-emergência conforme especificações técnicas do produto no rótulo e bula."}
                  </p>
                </div>
              </div>
            ))}

            {/* Orientações Finais */}
            {receitaVisualizada.orientacoes && (
              <div className="border border-black p-1.5">
                <div className="font-bold uppercase text-[10px]">
                  Orientações Técnicas Adicionais:
                </div>
                <p className="text-[10px] whitespace-pre-wrap">
                  {receitaVisualizada.orientacoes}
                </p>
              </div>
            )}

            {/* Assinaturas */}
            <div className="pt-6 grid grid-cols-2 gap-8 text-center items-end">
              <div className="border-t border-black pt-1">
                <p className="font-bold">
                  {receitaVisualizada.respTecNome || "Alex Jorge"}
                </p>
                <p className="text-[9px]">
                  CPF/CREA: {receitaVisualizada.respTecCpfCrea || "-"} - Resp.
                  Técnico
                </p>
              </div>
              <div className="border-t border-black pt-1">
                <p className="font-bold">{receitaVisualizada.produtorNome}</p>
                <p className="text-[9px]">
                  CPF/CNPJ: {receitaVisualizada.produtorCpfCnpj || "-"} -
                  Produtor / Usuário
                </p>
              </div>
            </div>

            <div className="text-[8px] text-center text-gray-600 border-t border-gray-400 pt-1">
              Data de Emissão:{" "}
              {receitaVisualizada.dataEmissao
                ? new Date(receitaVisualizada.dataEmissao).toLocaleDateString()
                : "-"}{" "}
              | Agrotóxico é Veneno. O uso indevido pode causar sérios danos à
              saúde e ao meio ambiente.
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t print:hidden">
            <button
              onClick={() => window.print()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-md transition flex items-center space-x-2 text-sm shadow"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              onClick={() => setModo("lista")}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-4 py-2 rounded-md transition text-sm"
            >
              Voltar ao Histórico
            </button>
          </div>
        </div>
      )}

      {/* FORMULÁRIO DE EMISSÃO / EDIÇÃO COM ALERTA E SELEÇÃO COMPLETA */}
      {modo === "formulario" && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 border border-emerald-100">
          <div className="flex items-center justify-between mb-6 border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {receitaEmEdicaoId
                ? "Editar Receita Agronômica"
                : "Nova Receita Agronômica"}
            </h2>
            <button
              type="button"
              onClick={() => setModo("lista")}
              className="text-gray-600 hover:text-gray-800 text-sm flex items-center space-x-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </button>
          </div>

          <form onSubmit={handleSalvarReceita} className="space-y-6">
            {/* SEÇÃO 1: CLIENTE E PROPRIEDADE */}
            <div className="p-4 bg-gray-50 border rounded-lg space-y-4">
              <h3 className="font-semibold text-gray-800 text-sm uppercase">
                1. Identificação do Cliente e Propriedade
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Selecionar Cliente / Produtor *
                  </label>
                  <select
                    value={clienteSelecionadoId}
                    onChange={(e) => handleSelecionarCliente(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  >
                    <option value="">Selecione o cliente cadastrado...</option>
                    {clientesLista.map((cli) => (
                      <option key={cli.id} value={cli.id}>
                        {cli.nome} {cli.cpf_cnpj ? `(${cli.cpf_cnpj})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Selecionar Propriedade *
                  </label>
                  <select
                    value={propriedadeSelecionadaId}
                    onChange={(e) =>
                      handleSelecionarPropriedade(e.target.value)
                    }
                    required
                    disabled={!clienteSelecionadoId}
                    className="w-full px-3 py-2 border rounded-md bg-white text-sm disabled:bg-gray-100"
                  >
                    <option value="">
                      {!clienteSelecionadoId
                        ? "Primeiro selecione o cliente..."
                        : propriedadesDoClienteSelecionado.length === 0
                          ? "Nenhuma propriedade cadastrada"
                          : "Selecione a propriedade..."}
                    </option>
                    {propriedadesDoClienteSelecionado.map((prop) => (
                      <option key={prop.id} value={prop.id}>
                        {prop.nome_propriedade}{" "}
                        {prop.cidade ? `- ${prop.cidade}` : ""}{" "}
                        {prop.area_total_ha ? `(${prop.area_total_ha} ha)` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview dos dados carregados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs text-gray-600 bg-white p-3 border rounded">
                <div>
                  <p className="font-semibold text-gray-800 mb-1">
                    Dados do Produtor:
                  </p>
                  <p>
                    <strong>Nome:</strong> {produtorNome || "-"}
                  </p>
                  <p>
                    <strong>CPF/CNPJ:</strong> {produtorCpfCnpj || "-"}
                  </p>
                  <p>
                    <strong>Endereço:</strong> {produtorEndereco || "-"} (
                    {produtorMunicipio || "-"})
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">
                    Dados da Propriedade:
                  </p>
                  <p>
                    <strong>Propriedade:</strong> {propriedadeNome || "-"}
                  </p>
                  <p>
                    <strong>Área Total Registrada:</strong>{" "}
                    {propriedadeAreaTotal > 0
                      ? `${propriedadeAreaTotal} Hectares (ha)`
                      : "Não informada"}
                  </p>
                  <p>
                    <strong>Endereço:</strong> {propriedadeEndereco || "-"} (
                    {propriedadeMunicipio || "-"})
                  </p>
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: RESPONSÁVEL TÉCNICO */}
            <div className="p-4 bg-gray-50 border rounded-lg space-y-4">
              <h3 className="font-semibold text-gray-800 text-sm uppercase">
                2. Responsável Técnico
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nome Resp. Técnico *
                  </label>
                  <input
                    type="text"
                    required
                    value={respTecNome}
                    onChange={(e) => setRespTecNome(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    CPF / CREA / CFTA *
                  </label>
                  <input
                    type="text"
                    required
                    value={respTecCpfCrea}
                    onChange={(e) => setRespTecCpfCrea(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Local / Município *
                  </label>
                  <input
                    type="text"
                    required
                    value={respTecLocal}
                    onChange={(e) => setRespTecLocal(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    ART/TRT nº *
                  </label>
                  <input
                    type="text"
                    required
                    value={artTrtNumero}
                    onChange={(e) => setArtTrtNumero(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm bg-white"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: SELEÇÃO E CÁLCULO DO PRODUTO DO ESTOQUE */}
            <div className="border p-4 rounded-lg bg-gray-50 space-y-4">
              <h3 className="font-semibold text-gray-800 text-sm uppercase">
                3. Seleção do Produto & Recomendação Técnica (Agrofit)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    1. Produto (Estoque) *
                  </label>
                  <select
                    value={produtoSelecionadoId}
                    onChange={(e) =>
                      handleSelecionarProdutoEstoque(e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  >
                    <option value="">Selecione o produto no estoque...</option>
                    {estoque.map((item) => {
                      const qtdTotal = Array.isArray(item.lotes)
                        ? item.lotes.reduce(
                            (acc, l) => acc + Number(l.quantidadeAtual || 0),
                            0,
                          )
                        : 0;
                      if (qtdTotal <= 0) return null;
                      return (
                        <option key={item.id} value={item.id}>
                          {item.nomeProduto} (Saldo: {qtdTotal}{" "}
                          {item.unidade || ""})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    2. Cultura *
                  </label>
                  <select
                    value={culturaSelecionada}
                    onChange={(e) => handleSelecionarCultura(e.target.value)}
                    disabled={
                      !produtoSelecionadoId || culturasDisponiveis.length === 0
                    }
                    className="w-full px-3 py-2 border rounded-md bg-white text-sm disabled:bg-gray-100"
                  >
                    <option value="">Selecione a cultura...</option>
                    {culturasDisponiveis.map((cultura, idx) => (
                      <option key={idx} value={cultura}>
                        {cultura}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    3. Praga / Alvo *
                  </label>
                  <select
                    value={pragaSelecionadaIndex}
                    onChange={(e) => handleSelecionarPraga(e.target.value)}
                    disabled={
                      !culturaSelecionada || pragasDisponiveis.length === 0
                    }
                    className="w-full px-3 py-2 border rounded-md bg-white text-sm disabled:bg-gray-100"
                  >
                    <option value="">Selecione o alvo / praga...</option>
                    {pragasDisponiveis.map((ind: any, idx) => {
                      const nomeCientifico =
                        ind.pragaNomeCientifico &&
                        ind.pragaNomeCientifico !== "Não especificado"
                          ? ` (${ind.pragaNomeCientifico})`
                          : "";
                      const formaAplicacao = ind.modoAplicacao
                        ? ` - [Forma: ${ind.modoAplicacao}]`
                        : "";

                      return (
                        <option key={idx} value={idx}>
                          {ind.pragaNomeComum}
                          {nomeCientifico}
                          {formaAplicacao}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Informações puxadas do Agrofit */}
              {produtoAgrofitAtivo && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs bg-white p-2.5 rounded border border-emerald-200 text-gray-700">
                  <div>
                    <strong>Ingrediente Ativo:</strong>{" "}
                    {produtoAgrofitAtivo.ingredienteAtivo || "-"}
                  </div>
                  <div>
                    <strong>Classe Tox.:</strong>{" "}
                    {produtoAgrofitAtivo.classeToxicologica || "-"}
                  </div>
                  <div>
                    <strong>Grupo Químico:</strong>{" "}
                    {produtoAgrofitAtivo.grupoQuimico || "-"}
                  </div>
                  <div>
                    <strong>Formulação:</strong>{" "}
                    {produtoAgrofitAtivo.formulacao || "-"}
                  </div>
                </div>
              )}

              {/* CAMPOS DE DOSAGEM, ÁREA E MODOS EDITÁVEIS */}
              {/* CAMPOS DE DOSAGEM, ÁREA E MODOS EDITÁVEIS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Área de Aplicação (Hectares) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Ex: 10"
                    className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-medium text-gray-700">
                      Dose ({indicacaoAtiva?.doseUnid || "L/ha"}) *
                    </label>
                    {indicacaoAtiva && (
                      <span className="text-[10px] text-gray-500 font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                        Mín: {indicacaoAtiva.doseMin} | Máx:{" "}
                        {indicacaoAtiva.doseMax || indicacaoAtiva.doseMin}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={dosagemUtilizada}
                    onChange={(e) => setDosagemUtilizada(e.target.value)}
                    placeholder="Dose por ha"
                    className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-medium text-gray-700">
                      Vol. Calda ({indicacaoAtiva?.vCaldaUnid || "L/ha"})
                    </label>
                    {indicacaoAtiva && (
                      <span className="text-[10px] text-gray-500 font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                        Mín: {indicacaoAtiva.vCaldaMin} | Máx:{" "}
                        {indicacaoAtiva.vCaldaMax || indicacaoAtiva.vCaldaMin}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={volumeCaldaUtilizado}
                    onChange={(e) => setVolumeCaldaUtilizado(e.target.value)}
                    placeholder="Calda"
                    className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Modo de Aplicação
                  </label>
                  <input
                    type="text"
                    value={modoAplicacaoUtilizado}
                    onChange={(e) => setModoAplicacaoUtilizado(e.target.value)}
                    placeholder="Ex: Pulverizador Costal"
                    className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  />
                </div>
              </div>

              {/* ALERTA NÃO-BLOQUEANTE PARA DOSE OU CALDA FORA DOS LIMITES */}
              {indicacaoAtiva &&
                (() => {
                  const doseVal = parseNum(dosagemUtilizada);
                  const caldaVal = parseNum(volumeCaldaUtilizado);
                  const dMin = parseNum(indicacaoAtiva.doseMin);
                  const dMax = parseNum(indicacaoAtiva.doseMax) || dMin;
                  const cMin = parseNum(indicacaoAtiva.vCaldaMin);
                  const cMax = parseNum(indicacaoAtiva.vCaldaMax) || cMin;

                  const doseFora =
                    doseVal > 0 &&
                    (doseVal < dMin || (dMax > 0 && doseVal > dMax));
                  const caldaFora =
                    caldaVal > 0 &&
                    (caldaVal < cMin || (cMax > 0 && caldaVal > cMax));

                  if (!doseFora && !caldaFora) return null;

                  return (
                    <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded text-amber-800 text-xs flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                      <div>
                        <strong className="font-semibold">
                          Aviso Técnico de Limites:
                        </strong>{" "}
                        O valor informado de{" "}
                        {doseFora ? `Dose (${doseVal})` : ""}{" "}
                        {doseFora && caldaFora ? "e de " : ""}
                        {caldaFora ? `Volume de Calda (${caldaVal})` : ""} está
                        fora da faixa recomendada pela bula (Dose: {dMin} a{" "}
                        {dMax} | Calda: {cMin} a {cMax}). Você pode continuar
                        normalmente.
                      </div>
                    </div>
                  );
                })()}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Modo + Época de Aplicação (Instruções da Bula)
                </label>
                <textarea
                  rows={2}
                  value={epocaEModoInstrucoes}
                  onChange={(e) => setEpocaEModoInstrucoes(e.target.value)}
                  placeholder="Instruções de aplicação..."
                  className="w-full px-3 py-2 border rounded-md text-xs bg-white"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAdicionarItem}
                  className="bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-emerald-800 transition shadow"
                >
                  Incluir Item na Receita
                </button>
              </div>
            </div>

            {/* TABELA DE ITENS INCLUÍDOS */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Itens da Receita ({itensReceita.length})
              </h4>
              {itensReceita.length === 0 ? (
                <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded border text-center">
                  Nenhum item adicionado.
                </p>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 text-sm bg-white">
                    <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
                      <tr>
                        <th className="px-3 py-2 text-left">Produto</th>
                        <th className="px-3 py-2 text-left">Cultura / Praga</th>
                        <th className="px-3 py-2 text-left">Área</th>
                        <th className="px-3 py-2 text-left">Dosagem</th>
                        <th className="px-3 py-2 text-left">Vol. Calda</th>
                        <th className="px-3 py-2 text-left">Aplicação</th>
                        <th className="px-3 py-2 text-left">Qtd Requerida</th>
                        <th className="px-3 py-2 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-xs">
                      {itensReceita.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 font-medium">
                            {item.nomeProduto}
                            <div className="text-[10px] text-gray-500">
                              {item.ingredienteAtivo}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div>
                              <span className="font-semibold text-gray-800">
                                {item.cultura}
                              </span>{" "}
                              &gt; {item.pragaNomeComum}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            {item.areaAplicacaoHectares} ha
                          </td>
                          <td className="px-3 py-2">
                            {item.dosagemUtilizada} {item.unidadeDosagem}
                          </td>
                          <td className="px-3 py-2">
                            {item.volumeCaldaUtilizado}{" "}
                            {item.unidadeVolumeCalda}
                          </td>
                          <td className="px-3 py-2 font-medium text-gray-700">
                            {item.modoAplicacao}
                          </td>
                          <td className="px-3 py-2 font-bold text-emerald-700 text-sm">
                            {item.quantidadeRecomendada}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoverItem(idx)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Orientações / Recomendações Técnicas Adicionais
              </label>
              <textarea
                value={orientacoes}
                onChange={(e) => setOrientacoes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="Instruções adicionais de aplicação, EPIs, etc."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setModo("lista")}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-emerald-600 text-white px-6 py-2 rounded-md font-medium text-sm shadow hover:bg-emerald-700"
              >
                {receitaEmEdicaoId
                  ? "Salvar Alterações"
                  : "Emitir e Salvar Receita"}
              </button>
            </div>
          </form>
        </div>
      )}

      {modo === "sucesso" && receitaEmitida && (
        <div className="bg-white rounded-xl shadow-md p-8 border border-emerald-100 text-center space-y-6 max-w-2xl mx-auto">
          <CheckCircle2 className="h-16 w-16 text-emerald-600 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-800">
            Receita Emitida com Sucesso!
          </h2>
          <p className="text-sm text-gray-600">
            Número da Receita:{" "}
            <strong className="font-mono text-emerald-800">
              {receitaEmitida.numeroReceita}
            </strong>
          </p>
          <div className="flex justify-center space-x-4 pt-4">
            <button
              onClick={() => {
                setReceitaVisualizada(receitaEmitida);
                setModo("detalhes");
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-md transition flex items-center space-x-2 text-sm shadow"
            >
              <Printer className="h-4 w-4" />
              <span>Ver e Imprimir Receita Oficial</span>
            </button>
            <button
              onClick={() => setModo("lista")}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-4 py-2 rounded-md transition text-sm"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
