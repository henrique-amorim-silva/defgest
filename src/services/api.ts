// src/services/api.ts

// Pega a URL do Ngrok definida no arquivo .env (com fallback para localhost caso rode local)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Função centralizada para requisições HTTP (GET, POST, DELETE, etc.)
 * Já injeta automaticamente a URL base, o cabeçalho anti-aviso do Ngrok e o Token JWT.
 */
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  // Garante que o endpoint comece com barra para evitar erros de rota
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_URL}${cleanEndpoint}`;

  // Recupera o token JWT salvo no localStorage
  const token = localStorage.getItem('token');

  // Prepara os headers padrão + os que vierem na requisição
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Essencial para o Ngrok não bloquear a API com página HTML
    ...(options.headers as Record<string, string> || {}),
  };

  // Se houver um token salvo, injeta no cabeçalho Authorization
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Se o token expirar ou for inválido, limpa a sessão e recarrega a página para forçar novo login
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.reload();
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    // Se a resposta não for bem-sucedida, tenta extrair o erro do backend
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.erro || `Erro na requisição: ${response.statusText}`);
    }

    // Se a resposta estiver vazia (ex: 204 No Content), retorna null
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return null;
  } catch (erro) {
    console.error(`[API Error] Falha ao acessar ${url}:`, erro);
    throw erro;
  }
}