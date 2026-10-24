// src/components/EmissaoReceita.tsx
import React, { useState, useEffect } from "react";
import { sincronizarCatalogoAgrofit } from "../services/agrofitApi";
import { supabase } from "../services/api";
import type { ItemEstoque } from "../@types/estoque";
import type { ReceitaAgronomica } from "../@types/receita";
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
} from "lucide-react";

export const EmissaoReceita: React.FC = () => {
  const [estoque, setEstoque] = useState<ItemEstoque[]>([]);
  const [catalogoAgrofit, setCatalogoAgrofit] = useState<
    ProdutoAgrofitCompleto[]
  >([]);
  const [receitas, setReceitas] = useState<ReceitaAgronomica[]>([]);

  const [modo, setModo] = useState<
    "lista" | "formulario" | "sucesso" | "detalhes"
  >("lista");
  const [receitaEmEdicaoId, setReceitaEmEdicaoId] = useState<string | null>(
    null,
  );

  const [filtroBusca, setFiltroBusca] = useState("");

  const obterEmpresaAtivaId = () => {
    try {
      const direta = localStorage.getItem("empresaId") || localStorage.getItem("empresaAtivaId") || sessionStorage.getItem("empresaId");
      if (direta) return direta;

      const usuarioStr = localStorage.getItem("usuario");
      if (usuarioStr) {
        const usuarioObj = JSON.parse(usuarioStr);
        if (usuarioObj?.empresa_id) return String(usuarioObj.empresa_id);
        if (usuarioObj?.empresaId) return String(usuarioObj.empresaId);
      }

      const selects = document.querySelectorAll("header select, nav select, select");
      for (const sel of selects) {
        if (sel && (sel as HTMLSelectElement).value) {
          const val = (sel as HTMLSelectElement).value;
          if (!sel.closest("form") && !isNaN(Number(val)) && Number(val) > 0) {
            return val;
          }
        }
      }

      return "1";
    } catch (e) {
      return "1";
    }
  };

  const [empresaAtual, setEmpresaAtual] = useState(obterEmpresaAtivaId());

  // Campos do Formulário
  const [produtorNome, setProdutorNome] = useState("");
  const [produtorCpfCnpj, setProdutorCpfCnpj] = useState("");
  const [propriedadeNome, setPropriedadeNome] = useState("");
  const [orientacoes, setOrientacoes] = useState("");
  const [itensReceita, setItensReceita] = useState<ReceitaAgronomica["itens"]>(
    [],
  );

  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState("");
  const [culturaSelecionada, setCulturaSelecionada] = useState("");
  const [pragaSelecionadaIndex, setPragaSelecionadaIndex] = useState<
    number | string
  >("");

  const [area, setArea] = useState("");
  const [dosagemUtilizada, setDosagemUtilizada] = useState("");
  const [volumeCaldaUtilizado, setVolumeCaldaUtilizado] = useState("");

  const [culturasDisponiveis, setCulturasDisponiveis] = useState<string[]>([]);
  const [pragasDisponiveis, setPragasDisponiveis] = useState<
    IndicacaoUsoAgrofit[]
  >([]);
  const [indicacaoAtiva, setIndicacaoAtiva] =
    useState<IndicacaoUsoAgrofit | null>(null);

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

      // 1. Carrega Estoque do Supabase
      let queryEstoque = supabase.from('estoque').select('*, lote_validade(*)');
      if (empresaIdAtiva) {
        queryEstoque = queryEstoque.eq('empresa_id', empresaIdAtiva);
      }
      const { data: dadosEstoque, error: errEstoque } = await queryEstoque;
      if (errEstoque) throw errEstoque;

      if (Array.isArray(dadosEstoque)) {
        const estoqueMapeado = dadosEstoque.map((item: any) => ({
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
            : []
        }));
        setEstoque(estoqueMapeado);
      }

      // 2. Carrega Receitas da tabela correta: receitas_agronomicas
      let queryReceitas = supabase.from('receitas_agronomicas').select('*, itens_receita(*)');
      if (empresaIdAtiva) {
        queryReceitas = queryReceitas.eq('empresa_id', empresaIdAtiva);
      }
      const { data: dadosReceitas, error: errRec } = await queryReceitas;
      if (errRec) throw errRec;

      if (Array.isArray(dadosReceitas)) {
        const receitasMapeadas = dadosReceitas.map((r: any) => ({
          id: r.id,
          numeroReceita: r.numero_receita,
          produtorNome: r.produtor_nome,
          produtorCpfCnpj: r.produtor_cpf_cnpj,
          propriedadeNome: r.propriedade_nome,
          orientacoes: r.orientacoes,
          dataEmissao: r.data_emissao,
          empresaId: r.empresa_id,
          itens: Array.isArray(r.itens_receita)
            ? r.itens_receita.map((i: any) => ({
                produtoId: String(i.estoque_id),
                nomeProduto: i.nome_produto,
                cultura: i.cultura,
                pragaNomeComum: i.praga_nome_comum,
                pragaNomeCientifico: i.praga_nome_cientifico,
                modoAplicacao: i.modo_aplicacao,
                dosagemMin: 0,
                dosagemMax: 0,
                dosagemUtilizada: i.dosagem_utilizada,
                unidadeDosagem: i.unidade_dosagem,
                volumeCaldaMin: 0,
                volumeCaldaMax: 0,
                volumeCaldaUtilizado: i.volume_calda_utilizado,
                unidadeVolumeCalda: i.unidade_volume_calda,
                areaAplicacaoHectares: i.area_aplicacao_hectares,
                quantidadeRecomendada: i.quantidade_recomendada,
              }))
            : []
        }));
        setReceitas(receitasMapeadas);
      }

      const catalogo = await sincronizarCatalogoAgrofit();
      setCatalogoAgrofit(Array.isArray(catalogo) ? catalogo : []);
    } catch (error) {
      console.error("Erro ao carregar dados iniciais da receita:", error);
    }
  };

  const abrirNovaReceita = () => {
    setReceitaEmEdicaoId(null);
    setProdutorNome("");
    setProdutorCpfCnpj("");
    setPropriedadeNome("");
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
    setCulturasDisponiveis([]);
    setPragasDisponiveis([]);
    setIndicacaoAtiva(null);
  };

  const handleSelecionarProdutoEstoque = (idEstoque: string) => {
    setProdutoSelecionadoId(idEstoque);
    setCulturaSelecionada("");
    setPragaSelecionadaIndex("");
    setPragasDisponiveis([]);
    setIndicacaoAtiva(null);
    setDosagemUtilizada("");
    setVolumeCaldaUtilizado("");

    const itemEstoque = estoque.find(
      (e: any) => String(e.id) === String(idEstoque),
    );
    if (!itemEstoque) {
      setCulturasDisponiveis(["Geral / Outras"]);
      return;
    }

    const itemGen = itemEstoque as any;
    const nomeProd = itemGen.nomeProduto || "";

    const prodAgrofit = catalogoAgrofit.find(
      (p) => p.nomeComercial?.toLowerCase() === nomeProd.toLowerCase(),
    );

    if (
      prodAgrofit &&
      prodAgrofit.indicacoesUso &&
      prodAgrofit.indicacoesUso.length > 0
    ) {
      const culturasUnicas = Array.from(
        new Set(prodAgrofit.indicacoesUso.map((i) => i.cultura)),
      );
      setCulturasDisponiveis(culturasUnicas);
    } else {
      setCulturasDisponiveis([
        "Soja",
        "Milho",
        "Algodão",
        "Café",
        "Pastagem",
        "Geral",
      ]);
    }
  };

  const handleSelecionarCultura = (cultura: string) => {
    setCulturaSelecionada(cultura);
    setPragaSelecionadaIndex("");
    setIndicacaoAtiva(null);
    setDosagemUtilizada("");
    setVolumeCaldaUtilizado("");

    const itemEstoque = estoque.find(
      (e: any) => String(e.id) === String(produtoSelecionadoId),
    );
    if (!itemEstoque) return;

    const itemGen = itemEstoque as any;
    const nomeProd = itemGen.nomeProduto || "";

    const prodAgrofit = catalogoAgrofit.find(
      (p) => p.nomeComercial?.toLowerCase() === nomeProd.toLowerCase(),
    );

    if (prodAgrofit && prodAgrofit.indicacoesUso) {
      const indicacoesFiltradas = prodAgrofit.indicacoesUso.filter(
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
      return;
    }

    const index = Number(indexStr);
    const ind = pragasDisponiveis[index];
    if (ind) {
      setIndicacaoAtiva(ind);
      setDosagemUtilizada(String(ind.doseMed || ind.doseMin || ""));
      setVolumeCaldaUtilizado(String(ind.vCaldaMed || ind.vCaldaMin || ""));
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
      (e: any) => String(e.id) === String(produtoSelecionadoId),
    );
    if (!itemEstoque) {
      alert("Produto selecionado não encontrado no estoque.");
      return;
    }

    const itemGen = itemEstoque as any;
    const dosagemNum = Number(dosagemUtilizada) || 0;
    const volumeCaldaNum = Number(volumeCaldaUtilizado) || 0;
    const areaNum = Number(area) || 0;

    const quantidadeTotal = dosagemNum > 0 ? dosagemNum * areaNum : 1;
    
    const qtdEstoqueAtual = Array.isArray(itemGen.lotes)
      ? itemGen.lotes.reduce((acc: number, l: any) => acc + Number(l.quantidadeAtual || 0), 0)
      : 0;

    let qtdJaNaReceita = 0;
    if (receitaEmEdicaoId) {
      const receitaAntiga = receitas.find(
        (r) => String(r.id) === String(receitaEmEdicaoId),
      );
      const itemAntigo = receitaAntiga?.itens?.find(
        (i: any) => String(i.produtoId) === String(itemGen.id),
      );
      if (itemAntigo) qtdJaNaReceita = itemAntigo.quantidadeRecomendada;
    }

    const saldoDisponivel = qtdEstoqueAtual + qtdJaNaReceita;
    if (quantidadeTotal > saldoDisponivel) {
      alert(
        `Quantidade insuficiente em estoque! Disponível atual: ${qtdEstoqueAtual} ${itemGen.unidade || ""}`,
      );
      return;
    }

    const nomeProdFinal = itemGen.nomeProduto || "Produto sem nome";
    const produtoIdReal = itemGen.id;

    const novoItemReceita: any = {
      produtoId: String(produtoIdReal),
      nomeProduto: nomeProdFinal,
      cultura: culturaSelecionada,
      pragaNomeComum: indicacaoAtiva?.pragaNomeComum || "Aplicação Geral",
      pragaNomeCientifico: indicacaoAtiva?.pragaNomeCientifico || "",
      modoAplicacao: indicacaoAtiva?.modoAplicacao || "Terrestre",
      dosagemMin: Number(indicacaoAtiva?.doseMin || 0),
      dosagemMax: Number(indicacaoAtiva?.doseMax || 0),
      dosagemUtilizada: dosagemNum,
      unidadeDosagem: indicacaoAtiva?.doseUnid || itemGen.unidade || "unid",
      volumeCaldaMin: Number(indicacaoAtiva?.vCaldaMin || 0),
      volumeCaldaMax: Number(indicacaoAtiva?.vCaldaMax || 0),
      volumeCaldaUtilizado: volumeCaldaNum,
      unidadeVolumeCalda: indicacaoAtiva?.vCaldaUnid || "L/ha",
      areaAplicacaoHectares: areaNum,
      quantidadeRecomendada: quantidadeTotal,
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

      if (receitaEmEdicaoId) {
        const { error: updateError } = await supabase
          .from('receitas_agronomicas')
          .update({
            produtor_nome: produtorNome,
            produtor_cpf_cnpj: produtorCpfCnpj,
            propriedade_nome: propriedadeNome,
            orientacoes: orientacoes,
          })
          .eq('id', receitaEmEdicaoId);

        if (updateError) throw updateError;

        await supabase.from('itens_receita').delete().eq('receita_id', receitaEmEdicaoId);

        const itensFormatados = itensReceita.map((item: any) => ({
          receita_id: Number(receitaEmEdicaoId),
          estoque_id: Number(item.produtoId),
          nome_produto: item.nomeProduto,
          cultura: item.cultura,
          praga_nome_comum: item.pragaNomeComum,
          praga_nome_cientifico: item.pragaNomeCientifico,
          modo_aplicacao: item.modoAplicacao,
          dosagem_utilizada: item.dosagemUtilizada,
          unidade_dosagem: item.unidadeDosagem,
          volume_calda_utilizado: item.volumeCaldaUtilizado,
          unidade_volume_calda: item.unidadeVolumeCalda,
          area_aplicacao_hectares: item.areaAplicacaoHectares,
          quantidade_recomendada: item.quantidadeRecomendada,
        }));

        const { error: itensError } = await supabase.from('itens_receita').insert(itensFormatados);
        if (itensError) throw itensError;

        setReceitaEmitida({
          id: receitaEmEdicaoId,
          numeroReceita: numeroReceitaGerado,
          produtorNome,
          produtorCpfCnpj,
          propriedadeNome,
          orientacoes,
          dataEmissao: new Date().toLocaleDateString(),
          itens: itensReceita,
        });
      } else {
        const { data: novaRec, error: recError } = await supabase
          .from('receitas_agronomicas')
          .insert([{
            empresa_id: Number(empresaIdAtiva),
            numero_receita: numeroReceitaGerado,
            produtor_nome: produtorNome,
            produtor_cpf_cnpj: produtorCpfCnpj,
            propriedade_nome: propriedadeNome,
            orientacoes: orientacoes,
            data_emissao: new Date().toISOString()
          }])
          .select()
          .single();

        if (recError) throw recError;
        const receitaId = novaRec.id;

        const itensFormatados = itensReceita.map((item: any) => ({
          receita_id: receitaId,
          estoque_id: Number(item.produtoId),
          nome_produto: item.nomeProduto,
          cultura: item.cultura,
          praga_nome_comum: item.pragaNomeComum,
          praga_nome_cientifico: item.pragaNomeCientifico,
          modo_aplicacao: item.modoAplicacao,
          dosagem_utilizada: item.dosagemUtilizada,
          unidade_dosagem: item.unidadeDosagem,
          volume_calda_utilizado: item.volumeCaldaUtilizado,
          unidade_volume_calda: item.unidadeVolumeCalda,
          area_aplicacao_hectares: item.areaAplicacaoHectares,
          quantidade_recomendada: item.quantidadeRecomendada,
        }));

        const { error: itensError } = await supabase.from('itens_receita').insert(itensFormatados);
        if (itensError) throw itensError;

        setReceitaEmitida({
          id: String(receitaId),
          numeroReceita: numeroReceitaGerado,
          produtorNome,
          produtorCpfCnpj,
          propriedadeNome,
          orientacoes,
          dataEmissao: new Date().toLocaleDateString(),
          itens: itensReceita,
        });
      }

      await carregarDadosIniciais();
      setModo("sucesso");
    } catch (err: any) {
      alert(err.message || "Erro ao salvar a receita.");
    }
  };

  const handleExcluirReceita = async (id: number | string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta receita?")) return;

    try {
      const { error } = await supabase.from('receitas_agronomicas').delete().eq('id', id);
      if (error) throw error;
      carregarDadosIniciais();
    } catch (err: any) {
      alert(err.message || "Erro ao excluir receita.");
    }
  };

  const handleEditarReceita = (receita: ReceitaAgronomica) => {
    setReceitaEmEdicaoId(String(receita.id));
    setProdutorNome(receita.produtorNome);
    setProdutorCpfCnpj(receita.produtorCpfCnpj);
    setPropriedadeNome(receita.propriedadeNome);
    setOrientacoes(receita.orientacoes || "");
    setItensReceita([...receita.itens]);
    setModo("formulario");
  };

  const handleVisualizarReceita = (receita: ReceitaAgronomica) => {
    setReceitaVisualizada(receita);
    setModo("detalhes");
  };

  const receitasFiltradas = receitas.filter((rec: any) => {
    const termo = filtroBusca.toLowerCase();
    const produtor = (rec.produtorNome || "").toLowerCase();
    const numero = (rec.numeroReceita || "").toLowerCase();
    const propriedade = (rec.propriedadeNome || "").toLowerCase();

    return (
      produtor.includes(termo) ||
      numero.includes(termo) ||
      propriedade.includes(termo)
    );
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
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
                {receitas.length === 0
                  ? "Nenhuma receita agronômica emitida ainda."
                  : "Nenhuma receita encontrada para a busca."}
              </p>
              {receitas.length === 0 && (
                <p className="text-sm text-gray-400 mt-1">
                  Clique em "Nova Receita" para iniciar.
                </p>
              )}
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
                        Data: {rec.dataEmissao ? new Date(rec.dataEmissao).toLocaleDateString() : "Data não informada"}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">
                      Produtor: {rec.produtorNome} {rec.produtorCpfCnpj ? `(${rec.produtorCpfCnpj})` : ""}
                    </p>
                    <p className="text-xs text-gray-600">
                      Propriedade: {rec.propriedadeNome || "Não informada"} | Itens: {rec.itens?.length || 0} produto(s)
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleVisualizarReceita(rec)}
                      className="text-emerald-700 hover:text-emerald-900 p-1.5 bg-emerald-50 rounded border border-emerald-200 text-xs flex items-center space-x-1"
                      title="Visualizar Detalhes / Imprimir"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Ver / Imprimir</span>
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

      {modo === "detalhes" && receitaVisualizada && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-8 border border-emerald-100 space-y-6 max-w-3xl mx-auto print:shadow-none print:border-none">
          <div className="flex items-center justify-between border-b pb-4 print:hidden">
            <h2 className="text-xl font-bold text-gray-800">
              Visualizar Receita Agronômica
            </h2>
            <button
              type="button"
              onClick={() => setModo("lista")}
              className="text-gray-600 hover:text-gray-800 text-sm flex items-center space-x-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar ao Histórico</span>
            </button>
          </div>

          <div className="space-y-4 text-sm text-gray-800">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Número da Receita
                </p>
                <p className="font-mono font-bold text-emerald-800 text-base">
                  {receitaVisualizada.numeroReceita}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Data de Emissão
                </p>
                <p className="font-medium">
                  {receitaVisualizada.dataEmissao ? new Date(receitaVisualizada.dataEmissao).toLocaleDateString() : "-"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg bg-gray-50">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Produtor
                </p>
                <p className="font-medium">{receitaVisualizada.produtorNome}</p>
                <p className="text-xs text-gray-600">
                  CPF/CNPJ: {receitaVisualizada.produtorCpfCnpj || "Não informado"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Propriedade
                </p>
                <p className="font-medium">
                  {receitaVisualizada.propriedadeNome}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">
                Produtos Recomendados
              </h3>
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 text-xs bg-white">
                  <thead className="bg-gray-100 text-gray-600 uppercase">
                    <tr>
                      <th className="px-3 py-2 text-left">Produto</th>
                      <th className="px-3 py-2 text-left">Cultura / Praga</th>
                      <th className="px-3 py-2 text-left">Área</th>
                      <th className="px-3 py-2 text-left">Dose</th>
                      <th className="px-3 py-2 text-left">Qtd Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {receitaVisualizada.itens?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 font-medium">
                          {item.nomeProduto}
                        </td>
                        <td className="px-3 py-2">
                          {item.cultura} &gt; {item.pragaNomeComum}
                        </td>
                        <td className="px-3 py-2">
                          {item.areaAplicacaoHectares} ha
                        </td>
                        <td className="px-3 py-2">
                          {item.dosagemUtilizada} {item.unidadeDosagem}
                        </td>
                        <td className="px-3 py-2 font-bold text-emerald-700">
                          {item.quantidadeRecomendada}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {receitaVisualizada.orientacoes && (
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                  Orientações Técnicas
                </p>
                <p className="p-3 bg-gray-50 border rounded-md text-xs text-gray-700 whitespace-pre-wrap">
                  {receitaVisualizada.orientacoes}
                </p>
              </div>
            )}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Produtor *
                </label>
                <input
                  type="text"
                  required
                  value={produtorNome}
                  onChange={(e) => setProdutorNome(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF / CNPJ *
                </label>
                <input
                  type="text"
                  required
                  value={produtorCpfCnpj}
                  onChange={(e) => setProdutorCpfCnpj(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Propriedade *
                </label>
                <input
                  type="text"
                  required
                  value={propriedadeNome}
                  onChange={(e) => setPropriedadeNome(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            <div className="border p-4 rounded-lg bg-gray-50 space-y-4">
              <h3 className="font-semibold text-gray-800">
                Adicionar Produto do Estoque
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
                    <option value="">
                      Selecione o produto ({estoque.length} no estoque)...
                    </option>
                    {estoque.map((item) => {
                      const qtdTotal = Array.isArray(item.lotes)
                        ? item.lotes.reduce((acc, l) => acc + Number(l.quantidadeAtual || 0), 0)
                        : 0;

                      if (qtdTotal <= 0) return null;

                      return (
                        <option key={item.id} value={item.id}>
                          {item.nomeProduto} (Saldo: {qtdTotal} {item.unidade || ""})
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
                    3. Praga (Comum / Científico) *
                  </label>
                  <select
                    value={pragaSelecionadaIndex}
                    onChange={(e) => handleSelecionarPraga(e.target.value)}
                    disabled={
                      !culturaSelecionada || pragasDisponiveis.length === 0
                    }
                    className="w-full px-3 py-2 border rounded-md bg-white text-sm disabled:bg-gray-100"
                  >
                    <option value="">Selecione a praga...</option>
                    {pragasDisponiveis.map((ind, idx) => (
                      <option key={idx} value={idx}>
                        {ind.pragaNomeComum}{" "}
                        {ind.pragaNomeCientifico &&
                        ind.pragaNomeCientifico !== "Não especificado"
                          ? `(${ind.pragaNomeCientifico})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Área (Hectares) *
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Dosagem ({indicacaoAtiva?.doseUnid || "unid"}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={dosagemUtilizada}
                    onChange={(e) => setDosagemUtilizada(e.target.value)}
                    placeholder="Dose"
                    className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Vol. Calda ({indicacaoAtiva?.vCaldaUnid || "L/ha"}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={volumeCaldaUtilizado}
                    onChange={(e) => setVolumeCaldaUtilizado(e.target.value)}
                    placeholder="Calda"
                    className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  />
                </div>
              </div>

              {indicacaoAtiva && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 space-y-1">
                  <p>
                    <strong>Limites Agrofit para esta Correlação:</strong>
                  </p>
                  <p>
                    • Dose Permitida: {indicacaoAtiva.doseMin} a{" "}
                    {indicacaoAtiva.doseMax} {indicacaoAtiva.doseUnid}
                  </p>
                  <p>
                    • Volume de Calda: {indicacaoAtiva.vCaldaMin} a{" "}
                    {indicacaoAtiva.vCaldaMax} {indicacaoAtiva.vCaldaUnid}
                  </p>
                </div>
              )}

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
                        <th className="px-3 py-2 text-left">Qtd Total</th>
                        <th className="px-3 py-2 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {itensReceita.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 font-medium">
                            {item.nomeProduto}
                          </td>
                          <td className="px-3 py-2">
                            <div className="text-xs">
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
                          <td className="px-3 py-2 font-bold text-emerald-700">
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
                Orientações / Recomendações Técnicas
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
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-8 border border-emerald-100 text-center space-y-6 max-w-2xl mx-auto">
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
              Voltar ao Início
            </button>
          </div>
        </div>
      )}
    </div>
  );
};