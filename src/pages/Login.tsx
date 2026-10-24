// src/components/Login.tsx
import React, { useState } from "react";
import { Lock, Mail, AlertCircle } from "lucide-react";
import { supabase } from "../services/api";

const logoSrc = `${import.meta.env.BASE_URL}images/nav-logo.png`;

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      // Consulta direta à tabela 'usuarios' no Supabase
      const { data: usuarios, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("email", email)
        .limit(1);

      if (error) {
        throw new Error(error.message || "Erro ao consultar o banco de dados.");
      }

      if (!usuarios || usuarios.length === 0) {
        throw new Error("E-mail não encontrado.");
      }

      const usuarioEncontrado = usuarios[0];

      // Validação utilizando a coluna correta 'senha_hash'
      const senhaArmazenada = usuarioEncontrado.senha_hash;
      if (senhaArmazenada !== senha) {
        throw new Error("Senha incorreta.");
      }

      // Armazena a sessão e os dados do usuário no localStorage
      localStorage.setItem("token", "supabase-session-token");
      localStorage.setItem("usuario", JSON.stringify(usuarioEncontrado));

      // Notifica o componente principal que o login foi bem-sucedido
      onLoginSuccess();
    } catch (err: any) {
      setErro(err.message || "Erro ao realizar login.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 border border-gray-200">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src={logoSrc}
              alt="Logo DefGest"
              className="h-16 w-auto object-contain"
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Faça login para acessar o sistema
          </p>
        </div>

        {erro && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                required
                placeholder="seu-email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition text-sm shadow-sm disabled:opacity-50"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
};