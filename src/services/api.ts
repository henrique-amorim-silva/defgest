// src/services/api.ts
import { createClient } from '@supabase/supabase-js';

// Lê as variáveis de ambiente configuradas no ficheiro .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Atenção: As variáveis de ambiente do Supabase (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY) não foram definidas.');
}

/**
 * Cliente oficial do Supabase partilhado em toda a aplicação.
 * Substitui as chamadas HTTP genéricas do antigo backend.
 */
export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);