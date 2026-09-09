import React, { useState, useEffect } from "react";
import { sincronizarCatalogoAgrofit } from "../services/agrofitApi";
import type { ProdutoAgrofitCompleto } from "../services/agrofitApi";
import {
  Search,
  Database,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";

export const ConsultaAgrofit: React.FC = () => {
  const [produtos, setProdutos] = useState<ProdutoAgrofitCompleto[]>([]);
  const [termo, setTermo] = useState("");
  const [carregando, setCarregando] = useState(true);

  // Estados de Paginação configurados para 10 itens por padrão
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState<number | "todos">(10);

  useEffect(() => {
    carregarCatalogo();
  }, []);

  const carregarCatalogo = async () => {
    setCarregando(true);
    const dados = await sincronizarCatalogoAgrofit();
    setProdutos(dados);
    setCarregando(false);
  };

  // Filtragem instantânea
  const produtosFiltrados = produtos.filter(
    (p) =>
      p.nomeComercial.toLowerCase().includes(termo.toLowerCase()) ||
      p.ingredienteAtivo.toLowerCase().includes(termo.toLowerCase()) ||
      p.registro.includes(termo),
  );

  const handleMudancaTermo = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTermo(e.target.value);
    setPaginaAtual(1);
  };

  const handleMudancaItensPorPagina = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const valor = e.target.value;
    setItensPorPagina(valor === "todos" ? "todos" : Number(valor));
    setPaginaAtual(1);
  };

  // Lógica de Paginação
  const totalRegistros = produtosFiltrados.length;
  const totalPaginas =
    itensPorPagina === "todos"
      ? 1
      : Math.ceil(totalRegistros / Number(itensPorPagina));

  const indiceInicial =
    itensPorPagina === "todos" ? 0 : (paginaAtual - 1) * Number(itensPorPagina);
  const indiceFinal =
    itensPorPagina === "todos"
      ? totalRegistros
      : indiceInicial + Number(itensPorPagina);

  const produtosPaginados = produtosFiltrados.slice(indiceInicial, indiceFinal);

  return (
    <div className="max-w-[95%] mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 border border-emerald-100">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 border-b pb-4 gap-4">
          <div className="flex items-center space-x-3">
            <Database className="h-7 w-7 text-emerald-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Catálogo Nacional - Agrofit (MAPA)
              </h2>
              <p className="text-sm text-gray-500">
                Base completa otimizada para consulta rápida.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center space-x-3 gap-y-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar por registro, nome ou ativo..."
                value={termo}
                onChange={handleMudancaTermo}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={carregarCatalogo}
              title="Atualizar dados"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-md transition"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabela */}
        {carregando ? (
          <div className="text-center py-12 text-gray-500">
            Carregando catálogo...
          </div>
        ) : produtosFiltrados.length === 0 ? (
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {produtosPaginados.map((p) => {
                    // Localiza o documento do tipo 'Bula' dentro do array vindouro do JSON
                    const docBula = p.documentosCadastrados?.find(
                      (doc) =>
                        doc.tipo_documento &&
                        doc.tipo_documento.toLowerCase().includes("bula"),
                    );

                    return (
                      <tr
                        key={p.id}
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
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="font-medium text-gray-900">
                            {p.cultura}
                          </div>
                          <div className="text-xs text-gray-500">
                            Alvo: {p.praga}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                          {p.unidadePadrao}
                        </td>
                        {/* Nova Coluna com o Botão da Bula */}
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                          {docBula && docBula.url ? (
                            <a
                              href={docBula.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md shadow-sm transition"
                              title="Visualizar Bula"
                            >
                              <FileText className="h-4 w-4" />
                              Ver Bula
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              Indisponível
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Rodapé de Paginação */}
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t border-gray-200 gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span>Mostrar:</span>
                <select
                  value={itensPorPagina}
                  onChange={handleMudancaItensPorPagina}
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
    </div>
  );
};
