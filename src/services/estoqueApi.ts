// src/services/estoqueApi.ts
import { supabase } from './api';

export interface LoteEstoque {
  id: number;
  lote: string;
  quantidadeAtual: number;
  dataValidade: string;
  numeroNotaFiscal?: string;
  dataEntrada?: string;
}

export interface ItemEstoque {
  id: number;
  empresaId?: number;
  nomeProduto: string;
  unidade: string;
  embalagem?: string;
  estMin?: number;
  lotes: LoteEstoque[];
}

export async function listarEstoque(empresaId?: string): Promise<ItemEstoque[]> {
  let query = supabase.from('estoque').select('*, lote_validade(*)');
  
  if (empresaId) {
    query = query.eq('empresa_id', empresaId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao listar o estoque:", error);
    throw error;
  }

  if (!data) return [];

  return data.map((item: any) => ({
    id: item.id,
    empresaId: item.empresa_id,
    nomeProduto: item.nome_produto || item.nomeProduto,
    unidade: item.unidade,
    embalagem: item.embalagem,
    estMin: item.est_min ?? item.estMin,
    lotes: Array.isArray(item.lote_validade)
      ? item.lote_validade.map((l: any) => ({
          id: l.id,
          lote: l.lote,
          quantidadeAtual: l.quantidade_atual ?? l.quantidadeAtual,
          dataValidade: l.data_validade ?? l.dataValidade,
          numeroNotaFiscal: l.numero_nota_fiscal ?? l.numeroNotaFiscal,
          dataEntrada: l.data_entrada ?? l.dataEntrada,
        }))
      : []
  }));
}

export async function cadastrarItemEstoque(item: any): Promise<any> {
  const { data, error } = await supabase
    .from('estoque')
    .insert([{
      empresa_id: item.empresaId || item.empresa_id,
      nome_produto: item.nomeProduto || item.nome_produto,
      unidade: item.unidade,
      embalagem: item.embalagem,
      est_min: item.estMin || item.est_min
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function excluirItemEstoque(id: number): Promise<void> {
  const { error } = await supabase
    .from('estoque')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export interface ItemNotaHistorico {
  id: number;
  estoqueId: number;
  nomeProduto: string;
  lote: string;
  quantidade: number;
  unidade: string;
  embalagem?: string;
  dataValidade: string;
}

export interface NotaFiscalHistorico {
  id: number;
  numeroNota: string;
  dataEntrada: string;
  empresaId?: number;
  usuarioNome?: string;
  fornecedorId?: number | string;
  fornecedorNome?: string;
  itens: ItemNotaHistorico[];
}

export async function listarNotasFiscais(empresaId?: string): Promise<NotaFiscalHistorico[]> {
  let query = supabase.from('notas_fiscais').select('*, itens_nota_fiscal(*)');

  if (empresaId) {
    query = query.eq('empresa_id', empresaId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao listar notas fiscais:", error);
    throw error;
  }

  return (data || []).map((nf: any) => ({
    id: nf.id,
    numeroNota: nf.numero_nota ?? nf.numeroNota,
    dataEntrada: nf.data_entrada ?? nf.dataEntrada,
    empresaId: nf.empresa_id ?? nf.empresaId,
    usuarioNome: nf.usuario_nome ?? nf.usuarioNome,
    fornecedorId: nf.fornecedor_id ?? nf.fornecedorId,
    fornecedorNome: nf.fornecedor_nome ?? nf.fornecedorNome,
    itens: Array.isArray(nf.itens_nota_fiscal)
      ? nf.itens_nota_fiscal.map((i: any) => ({
          id: i.id,
          estoqueId: i.estoque_id ?? i.estoqueId,
          nomeProduto: i.nome_produto ?? i.nomeProduto,
          lote: i.lote,
          quantidade: i.quantidade,
          unidade: i.unidade,
          embalagem: i.embalagem,
          dataValidade: i.data_validade ?? i.dataValidade,
        }))
      : []
  }));
}

export async function listarFornecedores(empresaId?: string): Promise<any[]> {
  let query = supabase.from('fornecedores').select('*');

  if (empresaId) {
    query = query.eq('empresa_id', empresaId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function salvarNotaFiscalCompleta(dados: {
  numeroNota: string;
  dataEntrada: string;
  fornecedorId?: number | null;
  itens: any[];
  notaEmEdicaoId?: string | null;
  empresaId?: string | number;
}): Promise<any> {
  const { numeroNota, dataEntrada, fornecedorId, itens, notaEmEdicaoId, empresaId } = dados;
  let nfId = notaEmEdicaoId;
  const empresaIdVal = empresaId ? Number(empresaId) : 1;

  if (notaEmEdicaoId) {
    const { error: updateError } = await supabase
      .from('notas_fiscais')
      .update({
        numero_nota: numeroNota,
        data_entrada: dataEntrada,
        fornecedor_id: fornecedorId,
      })
      .eq('id', notaEmEdicaoId);

    if (updateError) throw updateError;

    await supabase.from('itens_nota_fiscal').delete().eq('nota_fiscal_id', notaEmEdicaoId);
  } else {
    const { data: novaNf, error: insertError } = await supabase
      .from('notas_fiscais')
      .insert([{
        numero_nota: numeroNota,
        data_entrada: dataEntrada,
        fornecedor_id: fornecedorId,
        empresa_id: empresaIdVal,
      }])
      .select()
      .single();

    if (insertError) throw insertError;
    nfId = novaNf.id;
  }

  if (itens && itens.length > 0 && nfId) {
    const itensFormatados = [];

    for (const item of itens) {
      const nomeProd = item.produto?.nomeComercial || item.nomeProduto || item.nome_produto || "Produto";
      const unidadeProd = item.unidade || "L";
      const embalagemProd = item.embalagem || "";
      const estMinProd = item.estMin ? Number(item.estMin) : 0;

      // 1. Verificar se o produto já existe no estoque da empresa
      let estoqueIdFinal = null;
      const { data: estoqueExistente } = await supabase
        .from('estoque')
        .select('id')
        .eq('empresa_id', empresaIdVal)
        .ilike('nome_produto', nomeProd)
        .maybeSingle();

      if (estoqueExistente) {
        estoqueIdFinal = estoqueExistente.id;
      } else {
        // Se não existir, cadastra automaticamente no estoque
        const { data: novoEstoque, error: errEstoque } = await supabase
          .from('estoque')
          .insert([{
            empresa_id: empresaIdVal,
            nome_produto: nomeProd,
            unidade: unidadeProd,
            embalagem: embalagemProd,
            est_min: estMinProd
          }])
          .select()
          .single();

        if (errEstoque) throw errEstoque;
        estoqueIdFinal = novoEstoque.id;
      }

      // 2. Inserir lote na tabela `lote_validade` para alimentar o estoque físico
      if (item.lote && estoqueIdFinal) {
        await supabase
          .from('lote_validade')
          .insert([{
            estoque_id: estoqueIdFinal,
            empresa_id: empresaIdVal,
            lote: item.lote,
            quantidade_atual: Number(item.quantidade),
            data_validade: item.dataValidade || item.data_validade,
            numero_nota_fiscal: numeroNota,
            data_entrada: dataEntrada
          }]);
      }

      itensFormatados.push({
        nota_fiscal_id: nfId,
        estoque_id: estoqueIdFinal,
        nome_produto: nomeProd,
        lote: item.lote,
        quantidade: Number(item.quantidade),
        unidade: unidadeProd,
        embalagem: embalagemProd,
        data_validade: item.dataValidade || item.data_validade,
      });
    }

    const { error: itensError } = await supabase
      .from('itens_nota_fiscal')
      .insert(itensFormatados);

    if (itensError) throw itensError;
  }

  return { success: true, id: nfId };
}

export async function excluirNotaFiscalCompleta(id: number): Promise<void> {
  const { error } = await supabase
    .from('notas_fiscais')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function verificarContagemTemporaria(empresaId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('contagem_temporaria')
      .select('*')
      .eq('empresa_id', empresaId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Erro ao buscar contagem temporária:", error);
    return null;
  }
}