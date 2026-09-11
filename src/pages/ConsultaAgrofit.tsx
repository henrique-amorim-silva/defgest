import React, { useState, useEffect } from "react";
import { apiRequest } from "../services/api";
import {
  Search,
  Database,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Eye,
  X,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";

export interface IndicacaoUso {
  id?: number;
  cultura: string;
  pragaNomeComum: string;
  pragaNomeCientifico: string;
  dose: string;
  numeroAplicacoesMax: string;
  maxAplicacoes: string;
  volumeCalda: string;
}

export interface DocumentoAgrofit {
  tipo_documento: string;
  url: string;
}

export interface ProdutoAgrofitCompleto {
  id?: number | string;
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
  documentosCadastrados: DocumentoAgrofit[];
  indicacoesUso: IndicacaoUso[];
}

export const ConsultaAgrofit: React.FC = () => {
  const [produtos, setProdutos] = useState<ProdutoAgrofitCompleto[]>([]);
  const [termo, setTermo] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const usuarioStr = localStorage.getItem("usuario");
  const usuario = usuarioStr ? JSON.parse(usuarioStr) : null;
  const isAdminMaster = usuario?.permissao === "admin_master";

  const [produtoModal, setProdutoModal] =
    useState<ProdutoAgrofitCompleto | null>(null);
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [produtoEmEdicao, setProdutoEmEdicao] = useState<any | null>(null);

  const [modalInstrucaoAberto, setModalInstrucaoAberto] = useState(false);
  const [instrucaoEmEdicao, setInstrucaoEmEdicao] = useState<any | null>(null);
  const [formInstrucao, setFormInstrucao] = useState({
    cultura: "",
    praga_nome_comum: "",
    praga_nome_cientifico: "",
    dose: "",
    max_aplicacoes: "",
    volume_calda: "",
  });

  const [formData, setFormData] = useState({
    numero_registro: "",
    marca_comercial: "",
    titular_registro: "",
    ingrediente_ativo: "",
    formulacao: "",
    grupo_quimico: "",
    classe_toxicologica: "",
    unidade_medida: "",
    url: "",
  });

  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState<number | "todos">(10);
  const [totalRegistros, setTotalRegistros] = useState(0);

  const carregarCatalogo = async (termoBusca = "", signal?: AbortSignal) => {
    setCarregando(true);
    setErro(null);
    try {
      const limiteParam = itensPorPagina === "todos" ? 10000 : itensPorPagina;
      const endpoint = `agrofit/produtos?page=${paginaAtual}&limit=${limiteParam}&busca=${encodeURIComponent(termoBusca)}`;
      const dados = await apiRequest(endpoint, { signal });
      setProdutos(dados.produtos || []);
      setTotalRegistros(dados.total || 0);

      if (produtoModal) {
        const atualizado = (dados.produtos || []).find(
          (p: any) => p.registro === produtoModal.registro,
        );
        if (atualizado) setProdutoModal(atualizado);
      }
    } catch (err: any) {
      if (err.name === "AbortError" || err.code === "ERR_CANCELED") return;
      setErro(err.message || "Erro ao carregar o catálogo do Agrofit.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      carregarCatalogo(termo, controller.signal);
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [termo, paginaAtual, itensPorPagina]);

  const abrirModalCadastro = () => {
    setProdutoEmEdicao(null);
    setFormData({
      numero_registro: "",
      marca_comercial: "",
      titular_registro: "",
      ingrediente_ativo: "",
      formulacao: "",
      grupo_quimico: "",
      classe_toxicologica: "",
      unidade_medida: "",
      url: "",
    });
    setModalFormAberto(true);
  };

  const abrirModalEdicao = (prod: ProdutoAgrofitCompleto) => {
    setProdutoEmEdicao(prod);
    setFormData({
      numero_registro: prod.registro || "",
      marca_comercial: prod.nomeComercial || "",
      titular_registro: prod.titularRegistro || "",
      ingrediente_ativo: prod.ingredienteAtivo || "",
      formulacao: prod.formulacao || "",
      grupo_quimico: prod.grupoQuimico || "",
      classe_toxicologica: prod.classeToxicologica || "",
      unidade_medida: prod.unidadePadrao || "",
      url: prod.documentosCadastrados?.[0]?.url || "",
    });
    setModalFormAberto(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (produtoEmEdicao) {
        // Atualização via PUT
        await apiRequest(`agrofit/produtos/${produtoEmEdicao.registro}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });

        // Atualiza a lista localmente sem precisar buscar tudo do banco de novo
        setProdutos((prev) =>
          prev.map((p) =>
            p.registro === produtoEmEdicao.registro
              ? {
                  ...p,
                  nomeComercial: formData.marca_comercial,
                  titularRegistro: formData.titular_registro,
                  ingredienteAtivo: formData.ingrediente_ativo,
                  formulacao: formData.formulacao,
                  grupoQuimico: formData.grupo_quimico,
                  classeToxicologica: formData.classe_toxicologica,
                  unidadePadrao: formData.unidade_medida,
                  documentosCadastrados: formData.url
                    ? [{ tipo_documento: "Bula", url: formData.url }]
                    : [],
                }
              : p
          )
        );
      } else {
        // Cadastro novo (mantém a recarga para o novo item aparecer na paginação corretamente)
        await apiRequest("agrofit/produtos", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        carregarCatalogo(termo);
      }
      setModalFormAberto(false);
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    }
  };

  const handleDelete = async (registro: string) => {
    if (!confirm(`Deseja realmente excluir o registro ${registro}?`)) return;
    try {
      await apiRequest(`agrofit/produtos/${registro}`, { method: "DELETE" });
      carregarCatalogo(termo);
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  const abrirNovaInstrucao = () => {
    setInstrucaoEmEdicao(null);
    setFormInstrucao({
      cultura: "",
      praga_nome_comum: "",
      praga_nome_cientifico: "",
      dose: "",
      max_aplicacoes: "",
      volume_calda: "",
    });
    setModalInstrucaoAberto(true);
  };

 const abrirEditarInstrucao = (item: any) => {
    setInstrucaoEmEdicao(item);
    setFormInstrucao({
      cultura: item.cultura || "",
      praga_nome_comum: item.pragaNomeComum || "",
      praga_nome_cientifico: item.pragaNomeCientifico || "",
      dose: item.dose || "",                 // Corrigido de doseMin para dose
      max_aplicacoes: item.maxAplicacoes || "", // Corrigido de numeroAplicacoesMax para maxAplicacoes
      volume_calda: item.volumeCalda || "",   // Corrigido de vCaldaMin para volumeCalda
    });
    setModalInstrucaoAberto(true);
  };

  const handleSubmitInstrucao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produtoModal) return;
    try {
      if (instrucaoEmEdicao && instrucaoEmEdicao.id) {
        // Edição de instrução existente
        await apiRequest(`agrofit/instrucoes/${instrucaoEmEdicao.id}`, {
          method: "PUT",
          body: JSON.stringify(formInstrucao),
        });

        // Atualiza localmente dentro do modal aberto
        const novasIndicacoes = produtoModal.indicacoesUso.map((ind) =>
          ind.id === instrucaoEmEdicao.id
            ? {
                ...ind,
                cultura: formInstrucao.cultura,
                pragaNomeComum: formInstrucao.praga_nome_comum,
                pragaNomeCientifico: formInstrucao.praga_nome_cientifico,
                dose: formInstrucao.dose,
                maxAplicacoes: formInstrucao.max_aplicacoes,
                volumeCalda: formInstrucao.volume_calda,
              }
            : ind
        );

        setProdutoModal({ ...produtoModal, indicacoesUso: novasIndicacoes });
      } else {
        // Criação de nova instrução (como gera um ID novo no banco, aqui vale a pena recarregar ou adicionar manualmente se preferir)
        await apiRequest(
          `agrofit/produtos/${produtoModal.registro}/instrucoes`,
          {
            method: "POST",
            body: JSON.stringify(formInstrucao),
          }
        );
        carregarCatalogo(termo); // Ou recarrega apenas se for inclusão nova
      }
      setModalInstrucaoAberto(false);
    } catch (err: any) {
      alert("Erro ao salvar instrução: " + err.message);
    }
  };

  const handleExcluirInstrucao = async (id: number) => {
    if (!confirm("Deseja realmente excluir esta instrução de uso?")) return;
    try {
      await apiRequest(`agrofit/instrucoes/${id}`, { method: "DELETE" });
      carregarCatalogo(termo);
    } catch (err: any) {
      alert("Erro ao excluir instrução: " + err.message);
    }
  };

  const totalPaginas =
    itensPorPagina === "todos"
      ? 1
      : Math.ceil(totalRegistros / Number(itensPorPagina));
  const indiceInicial =
    itensPorPagina === "todos" ? 0 : (paginaAtual - 1) * Number(itensPorPagina);
  const indiceFinal =
    itensPorPagina === "todos"
      ? totalRegistros
      : indiceInicial + produtos.length;

  return (
    <div className="max-w-[95%] mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 border border-emerald-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 border-b pb-4 gap-4">
          <div className="flex items-center space-x-3">
            <Database className="h-7 w-7 text-emerald-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Catálogo Nacional - Agrofit (MAPA)
              </h2>
              <p className="text-sm text-gray-500">
                Base completa sincronizada no banco de dados.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center space-x-3 gap-y-2 w-full md:w-auto">
            {isAdminMaster && (
              <button
                onClick={abrirModalCadastro}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-md text-sm font-medium transition"
              >
                <Plus className="h-4 w-4" /> Novo Agrotóxico
              </button>
            )}
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar por registro, nome ou ativo..."
                value={termo}
                onChange={(e) => {
                  setTermo(e.target.value);
                  setPaginaAtual(1);
                }}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={() => carregarCatalogo(termo)}
              title="Atualizar dados"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-md transition"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {erro && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="text-center py-12 text-gray-500">
            Carregando catálogo do banco de dados...
          </div>
        ) : produtos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Nenhum agrotóxico encontrado.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto shadow-inner rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Registro
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Nome Comercial
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Titular
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Ingrediente Ativo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Formulação / Grupo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Classe Toxicológica
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Cultura / Praga
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Unidade
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                      Bula
                    </th>
                    {isAdminMaster && (
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                        Ações
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {produtos.map((p) => {
                    const docBula = p.documentosCadastrados?.find((doc) =>
                      doc.tipo_documento?.toLowerCase().includes("bula"),
                    );

                    return (
                      <tr
                        key={p.registro}
                        className="hover:bg-emerald-50/50 transition"
                      >
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-mono font-medium text-emerald-800">
                          {p.registro}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {p.nomeComercial}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {p.titularRegistro}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                          {p.ingredienteAtivo}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="text-xs font-semibold text-gray-800">
                            {p.formulacao}
                          </div>
                          <div className="text-xs text-gray-500">
                            {p.grupoQuimico}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <span className="px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-900 rounded-full border border-amber-200">
                            {p.classeToxicologica}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          <div className="font-medium text-gray-900">
                            {/* {p.cultura}{" "} */}
                            {/* {p.indicacoesUso && p.indicacoesUso.length > 1 && (
                              <span className="text-xs text-emerald-600 font-normal">
                                (+{p.indicacoesUso.length - 1} outras)
                              </span>
                            )} */}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {/* Alvo: {p.praga} */}
                          </div>
                          {p.indicacoesUso && p.indicacoesUso.length > 0 && (
                            <button
                              onClick={() => setProdutoModal(p)}
                              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-800 transition"
                            >
                              <Eye className="h-3 w-3" /> Ver todas as
                              correlações ({p.indicacoesUso.length})
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                          {p.unidadePadrao}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                          {docBula && docBula.url ? (
                            <a
                              href={docBula.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md shadow-sm transition"
                              title="Visualizar Bula"
                            >
                              <FileText className="h-4 w-4" /> Ver Bula
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              Indisponível
                            </span>
                          )}
                        </td>
                        {isAdminMaster && (
                          <td className="px-4 py-4 whitespace-nowrap text-center text-sm space-x-1">
                            <button
                              onClick={() => abrirModalEdicao(p)}
                              className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.registro)}
                              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t border-gray-200 gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span>Mostrar:</span>
                <select
                  value={itensPorPagina}
                  onChange={(e) => {
                    const valor = e.target.value;
                    setItensPorPagina(
                      valor === "todos" ? "todos" : Number(valor),
                    );
                    setPaginaAtual(1);
                  }}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value={10}>10</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value="todos">Todos</option>
                </select>
                <span>registros por página</span>
              </div>

              <div>
                Mostrando {totalRegistros === 0 ? 0 : indiceInicial + 1} a{" "}
                {Math.min(indiceFinal, totalRegistros)} de {totalRegistros}{" "}
                registros filtrados
              </div>

              {itensPorPagina !== "todos" && totalPaginas > 1 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      setPaginaAtual((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={paginaAtual === 1}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="font-medium">
                    Página {paginaAtual} de {totalPaginas}
                  </span>
                  <button
                    onClick={() =>
                      setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))
                    }
                    disabled={paginaAtual === totalPaginas}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {produtoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  {produtoModal.nomeComercial}
                </h3>
                <p className="text-xs text-gray-500 font-mono">
                  Registro MAPA: {produtoModal.registro} | Ingrediente Ativo:{" "}
                  {produtoModal.ingredienteAtivo}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {isAdminMaster && (
                  <button
                    onClick={abrirNovaInstrucao}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-xs font-medium transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar Instrução de Uso
                  </button>
                )}
                <button
                  onClick={() => setProdutoModal(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Especificações de Uso, Doses, Aplicações e Volume de Calda por
                Cultura:
              </p>
              <div className="border border-gray-200 rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">
                        Cultura
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">
                        Praga / Alvo
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">
                        Dose
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600 text-xs">
                        Máx. Aplicações
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">
                        Volume de Calda
                      </th>
                      {isAdminMaster && (
                        <th className="px-4 py-3 text-center font-semibold text-gray-600 text-xs">
                          Ações
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {produtoModal.indicacoesUso &&
                      produtoModal.indicacoesUso.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {item.cultura}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            <div className="font-medium text-gray-800">
                              {item.pragaNomeComum}
                            </div>
                            <div className="text-xs italic text-gray-500">
                              {item.pragaNomeCientifico}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-700 font-medium">
                            {item.dose || "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center text-gray-800 font-semibold">
                            {item.maxAplicacoes || "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                            {item.volumeCalda || "-"}
                          </td>
                          {isAdminMaster && (
                            <td className="px-4 py-3 whitespace-nowrap text-center space-x-1">
                              <button
                                onClick={() => abrirEditarInstrucao(item)}
                                className="p-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded"
                                title="Editar Instrução"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  item.id && handleExcluirInstrucao(item.id)
                                }
                                className="p-1 bg-red-50 text-red-600 hover:bg-red-100 rounded"
                                title="Excluir Instrução"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setProdutoModal(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium rounded-md transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalInstrucaoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {instrucaoEmEdicao
                ? "Editar Instrução de Uso"
                : "Nova Instrução de Uso"}
            </h3>
            <form onSubmit={handleSubmitInstrucao} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Cultura
                </label>
                <input
                  type="text"
                  required
                  value={formInstrucao.cultura}
                  onChange={(e) =>
                    setFormInstrucao({
                      ...formInstrucao,
                      cultura: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Praga (Nome Comum)
                </label>
                <input
                  type="text"
                  required
                  value={formInstrucao.praga_nome_comum}
                  onChange={(e) =>
                    setFormInstrucao({
                      ...formInstrucao,
                      praga_nome_comum: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Praga (Nome Científico)
                </label>
                <input
                  type="text"
                  value={formInstrucao.praga_nome_cientifico}
                  onChange={(e) =>
                    setFormInstrucao({
                      ...formInstrucao,
                      praga_nome_cientifico: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Dose
                </label>
                <input
                  type="text"
                  placeholder="Ex: 100 a 150 L/ha"
                  value={formInstrucao.dose}
                  onChange={(e) =>
                    setFormInstrucao({ ...formInstrucao, dose: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Máx. Aplicações
                </label>
                <input
                  type="text"
                  value={formInstrucao.max_aplicacoes}
                  onChange={(e) =>
                    setFormInstrucao({
                      ...formInstrucao,
                      max_aplicacoes: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Volume de Calda
                </label>
                <input
                  type="text"
                  placeholder="Ex: 200 a 400 L/ha"
                  value={formInstrucao.volume_calda}
                  onChange={(e) =>
                    setFormInstrucao({
                      ...formInstrucao,
                      volume_calda: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setModalInstrucaoAberto(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-xs rounded font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded font-medium"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalFormAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {produtoEmEdicao
                ? "Editar Agrotóxico"
                : "Cadastrar Novo Agrotóxico"}
            </h3>
            <form onSubmit={handleSubmitForm} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Número de Registro
                </label>
                <input
                  type="text"
                  required
                  disabled={!!produtoEmEdicao}
                  value={formData.numero_registro}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      numero_registro: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded text-sm disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Marca Comercial
                </label>
                <input
                  type="text"
                  required
                  value={formData.marca_comercial}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      marca_comercial: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Titular do Registro
                </label>
                <input
                  type="text"
                  value={formData.titular_registro}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      titular_registro: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Ingrediente Ativo
                </label>
                <input
                  type="text"
                  value={formData.ingrediente_ativo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ingrediente_ativo: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Formulação
                </label>
                <input
                  type="text"
                  value={formData.formulacao}
                  onChange={(e) =>
                    setFormData({ ...formData, formulacao: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Grupo Químico
                </label>
                <input
                  type="text"
                  value={formData.grupo_quimico}
                  onChange={(e) =>
                    setFormData({ ...formData, grupo_quimico: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Classe Toxicológica
                </label>
                <input
                  type="text"
                  value={formData.classe_toxicologica}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      classe_toxicologica: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Unidade de Medida
                </label>
                <input
                  type="text"
                  value={formData.unidade_medida}
                  onChange={(e) =>
                    setFormData({ ...formData, unidade_medida: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  URL da Bula
                </label>
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setModalFormAberto(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-xs rounded font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded font-medium"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
