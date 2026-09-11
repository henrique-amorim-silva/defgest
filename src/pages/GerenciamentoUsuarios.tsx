import React, { useState, useEffect } from "react";
import { apiRequest } from "../services/api";
import { Building2, Users, PlusCircle, CheckCircle, AlertCircle, Trash2, KeyRound } from "lucide-react";

export function GerenciamentoUsuarios() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<"empresas" | "usuarios">("empresas");
  const [mensagem, setMensagem] = useState<{ texto: string; tipo: "sucesso" | "erro" } | null>(null);

  // Formulário Empresa
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");

  // Formulário Usuário
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [emailUsuario, setEmailUsuario] = useState("");
  const [senhaUsuario, setSenhaUsuario] = useState("");
  const [permissaoUsuario, setPermissaoUsuario] = useState("usuario");
  const [empresaIdSelecionada, setEmpresaIdSelecionada] = useState("");

  const carregarDados = async () => {
    try {
      const resEmpresas = await apiRequest("empresas");
      setEmpresas(resEmpresas);
      const resUsuarios = await apiRequest("usuarios");
      setUsuarios(resUsuarios);
    } catch (err: any) {
      console.error("Erro ao carregar dados:", err);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleSalvarEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);
    try {
      await apiRequest("empresas", {
        method: "POST",
        body: JSON.stringify({ nome_fantasia: nomeFantasia, cnpj }),
      });
      setMensagem({ texto: "Empresa cadastrada com sucesso!", tipo: "sucesso" });
      setNomeFantasia("");
      setCnpj("");
      carregarDados();
    } catch (err: any) {
      setMensagem({ texto: err.message, tipo: "erro" });
    }
  };

  const handleSalvarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);
    try {
      await apiRequest("usuarios", {
        method: "POST",
        body: JSON.stringify({
          empresa_id: empresaIdSelecionada || null,
          nome: nomeUsuario,
          email: emailUsuario,
          senha: senhaUsuario,
          permissao: permissaoUsuario,
        }),
      });
      setMensagem({ texto: "Usuário cadastrado com sucesso!", tipo: "sucesso" });
      setNomeUsuario("");
      setEmailUsuario("");
      setSenhaUsuario("");
      carregarDados();
    } catch (err: any) {
      setMensagem({ texto: err.message, tipo: "erro" });
    }
  };

  const handleExcluirUsuario = async (id: number, nome: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${nome}"?`)) return;
    setMensagem(null);
    try {
      await apiRequest(`usuarios/${id}`, { method: "DELETE" });
      setMensagem({ texto: "Usuário excluído com sucesso!", tipo: "sucesso" });
      carregarDados();
    } catch (err: any) {
      setMensagem({ texto: err.message, tipo: "erro" });
    }
  };

  const handleRedefinirSenha = async (id: number, nome: string) => {
    const novaSenha = window.prompt(`Digite a nova senha para o usuário ${nome} (mínimo 6 caracteres):`);
    if (!novaSenha) return;

    if (novaSenha.length < 6) {
      setMensagem({ texto: "A senha deve ter pelo menos 6 caracteres.", tipo: "erro" });
      return;
    }

    setMensagem(null);
    try {
      await apiRequest(`usuarios/${id}/senha`, {
        method: "PATCH",
        body: JSON.stringify({ novaSenha }),
      });
      setMensagem({ texto: `Senha de ${nome} redefinida com sucesso!`, tipo: "sucesso" });
    } catch (err: any) {
      setMensagem({ texto: err.message, tipo: "erro" });
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Painel do Administrador Master</h1>

      {mensagem && (
        <div className={`mb-6 p-4 rounded-lg text-sm flex items-center gap-2 ${
          mensagem.tipo === "sucesso" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {mensagem.tipo === "sucesso" ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span>{mensagem.texto}</span>
        </div>
      )}

      {/* Abas */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setAbaAtiva("empresas")}
          className={`py-2 px-4 font-medium text-sm flex items-center gap-2 border-b-2 ${
            abaAtiva === "empresas" ? "border-emerald-600 text-emerald-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Building2 className="h-4 w-4" /> Gerenciar Empresas
        </button>
        <button
          onClick={() => setAbaAtiva("usuarios")}
          className={`py-2 px-4 font-medium text-sm flex items-center gap-2 border-b-2 ${
            abaAtiva === "usuarios" ? "border-emerald-600 text-emerald-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users className="h-4 w-4" /> Gerenciar Usuários
        </button>
      </div>

      {/* Seção Empresas */}
      {abaAtiva === "empresas" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-emerald-600" /> Nova Empresa
            </h2>
            <form onSubmit={handleSalvarEmpresa} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Nome Fantasia</label>
                <input
                  type="text"
                  required
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Ex: Agro Comercial Ltda"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">CNPJ (Opcional)</label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="00.000.000/0001-00"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg text-sm transition"
              >
                Cadastrar Empresa
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="font-bold text-gray-800 mb-4">Empresas Cadastradas</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Nome Fantasia</th>
                    <th className="p-3">CNPJ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {empresas.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="p-3">{emp.id}</td>
                      <td className="p-3 font-medium text-gray-800">{emp.nome_fantasia}</td>
                      <td className="p-3 text-gray-500">{emp.cnpj || "Não informado"}</td>
                    </tr>
                  ))}
                  {empresas.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-gray-400">Nenhuma empresa cadastrada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Seção Usuários */}
      {abaAtiva === "usuarios" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-emerald-600" /> Novo Usuário
            </h2>
            <form onSubmit={handleSalvarUsuario} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Empresa Vinculada</label>
                <select
                  value={empresaIdSelecionada}
                  onChange={(e) => setEmpresaIdSelecionada(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="">Nenhuma (Global / Admin)</option>
                  {empresas.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.nome_fantasia}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Nome</label>
                <input
                  type="text"
                  required
                  value={nomeUsuario}
                  onChange={(e) => setNomeUsuario(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Nome do colaborador"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">E-mail de Acesso</label>
                <input
                  type="email"
                  required
                  value={emailUsuario}
                  onChange={(e) => setEmailUsuario(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="colaborador@email.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Senha Inicial</label>
                <input
                  type="password"
                  required
                  value={senhaUsuario}
                  onChange={(e) => setSenhaUsuario(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Permissão / Nível</label>
                <select
                  value={permissaoUsuario}
                  onChange={(e) => setPermissaoUsuario(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="usuario">Usuário (Padrão)</option>
                  <option value="visualizador">Visualizador (Apenas Leitura)</option>
                  <option value="admin_master">Admin Master (Global)</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg text-sm transition"
              >
                Cadastrar Usuário
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="font-bold text-gray-800 mb-4">Usuários do Sistema</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="p-3">Nome</th>
                    <th className="p-3">E-mail</th>
                    <th className="p-3">Empresa</th>
                    <th className="p-3">Permissão</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usuarios.map((usu) => (
                    <tr key={usu.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-800">{usu.nome}</td>
                      <td className="p-3 text-gray-500">{usu.email}</td>
                      <td className="p-3 text-gray-600">{usu.empresa_nome || "Global (Admin)"}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          usu.permissao === 'admin_master' ? 'bg-purple-100 text-purple-700' :
                          usu.permissao === 'usuario' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {usu.permissao}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleRedefinirSenha(usu.id, usu.nome)}
                          title="Redefinir Senha"
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition inline-flex items-center"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleExcluirUsuario(usu.id, usu.nome)}
                          title="Excluir Usuário"
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition inline-flex items-center"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {usuarios.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-gray-400">Nenhum usuário cadastrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}