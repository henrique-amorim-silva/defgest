// src/services/receitaApi.ts
import { supabase } from './api';

export interface ItemReceita {
  id?: number;
  estoqueId: number;
  nomeProduto: string;
  cultura: string;
  pragaNomeComum: string;
  pragaNomeCientifico?: string;
  modoAplicacao?: string;
  dosagemUtilizada: number;
  unidadeDosagem: string;
  volumeCaldaUtilizado: number;
  unidadeVolumeCalda: string;
  areaAplicacaoHectares: number;
  quantidadeRecomendada: number;
}

export interface ReceitaAgronomica {
  id: number;
  numeroReceita: string;
  produtorNome: string;
  produtorCpfCnpj: string;
  propriedadeNome: string;
  orientacoes?: string;
  dataEmissao: string;
  empresaId?: number;
  usuarioNome?: string;
  itens: ItemReceita[];
}

export async function listarReceitas(empresaId?: string): Promise<ReceitaAgronomica[]> {
  let query = supabase.from('receitas').select('*, itens_receita(*)');

  if (empresaId) {
    query = query.eq('empresa_id', empresaId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao listar receitas:", error);
    throw error;
  }

  return (data || []).map((r: any) => ({
    id: r.id,
    numeroReceita: r.numero_receita ?? r.numeroReceita,
    produtorNome: r.produtor_nome ?? r.produtorNome,
    produtorCpfCnpj: r.produtor_cpf_cnpj ?? r.produtorCpfCnpj,
    propriedadeNome: r.propriedade_nome ?? r.propriedadeNome,
    orientacoes: r.orientacoes,
    dataEmissao: r.data_emissao ?? r.dataEmissao,
    empresaId: r.empresa_id ?? r.empresaId,
    usuarioNome: r.usuario_nome ?? r.usuarioNome,
    itens: Array.isArray(r.itens_receita)
      ? r.itens_receita.map((i: any) => ({
          id: i.id,
          estoqueId: i.estoque_id ?? i.estoqueId,
          nomeProduto: i.nome_produto ?? i.nomeProduto,
          cultura: i.cultura,
          pragaNomeComum: i.praga_nome_comum ?? i.pragaNomeComum,
          pragaNomeCientifico: i.praga_nome_cientifico ?? i.pragaNomeCientifico,
          modoAplicacao: i.modo_aplicacao ?? i.modoAplicacao,
          dosagemUtilizada: i.dosagem_utilizada ?? i.dosagemUtilizada,
          unidadeDosagem: i.unidade_dosagem ?? i.unidadeDosagem,
          volumeCaldaUtilizado: i.volume_calda_utilizado ?? i.volumeCaldaUtilizado,
          unidadeVolumeCalda: i.unidade_volume_calda ?? i.unidadeVolumeCalda,
          areaAplicacaoHectares: i.area_aplicacao_hectares ?? i.areaAplicacaoHectares,
          quantidadeRecomendada: i.quantidade_recomendada ?? i.quantidadeRecomendada,
        }))
      : []
  }));
}

export async function emitirReceita(dados: {
  numeroReceita: string;
  produtorNome: string;
  produtorCpfCnpj: string;
  propriedadeNome: string;
  orientacoes?: string;
  dataEmissao: string;
  empresaId?: number | string;
  usuarioNome?: string;
  itens: ItemReceita[];
}): Promise<any> {
  const { numeroReceita, produtorNome, produtorCpfCnpj, propriedadeNome, orientacoes, dataEmissao, empresaId, usuarioNome, itens } = dados;

  // 1. Insere a receita principal
  const { data: novaReceita, error: receitaError } = await supabase
    .from('receitas')
    .insert([{
      numero_receita: numeroReceita,
      produtor_nome: produtorNome,
      produtor_cpf_cnpj: produtorCpfCnpj,
      propriedade_nome: propriedadeNome,
      orientacoes,
      data_emissao: dataEmissao,
      empresa_id: empresaId,
      usuario_nome: usuarioNome,
    }])
    .select()
    .single();

  if (receitaError) throw receitaError;
  const receitaId = novaReceita.id;

  // 2. Insere os itens associados à receita
  if (itens && itens.length > 0) {
    const itensFormatados = itens.map((i: any) => ({
      receita_id: receitaId,
      estoque_id: i.estoqueId || i.estoque_id,
      nome_produto: i.nomeProduto || i.nome_produto,
      cultura: i.cultura,
      praga_nome_comum: i.pragaNomeComum || i.praga_nome_comum,
      praga_nome_cientifico: i.pragaNomeCientifico || i.praga_nome_cientifico,
      modo_aplicacao: i.modoAplicacao || i.modo_aplicacao,
      dosagem_utilizada: i.dosagemUtilizada || i.dosagem_utilizada,
      unidade_dosagem: i.unidadeDosagem || i.unidade_dosagem,
      volume_calda_utilizado: i.volumeCaldaUtilizado || i.volume_calda_utilizado,
      unidade_volume_calda: i.unidadeVolumeCalda || i.unidade_volume_calda,
      area_aplicacao_hectares: i.areaAplicacaoHectares || i.area_aplicacao_hectares,
      quantidade_recomendada: i.quantidadeRecomendada || i.quantidade_recomendada,
    }));

    const { error: itensError } = await supabase
      .from('itens_receita')
      .insert(itensFormatados);

    if (itensError) throw itensError;
  }

  return { success: true, id: receitaId };
}

export async function atualizarReceita(
  id: number,
  dados: {
    numeroReceita?: string;
    produtorNome: string;
    produtorCpfCnpj: string;
    propriedadeNome: string;
    orientacoes?: string;
    dataEmissao?: string;
    itens: ItemReceita[];
  }
): Promise<any> {
  const { numeroReceita, produtorNome, produtorCpfCnpj, propriedadeNome, orientacoes, dataEmissao, itens } = dados;

  // 1. Atualiza a receita principal
  const { error: updateError } = await supabase
    .from('receitas')
    .update({
      numero_receita: numeroReceita,
      produtor_nome: produtorNome,
      produtor_cpf_cnpj: produtorCpfCnpj,
      propriedade_nome: propriedadeNome,
      orientacoes,
      data_emissao: dataEmissao,
    })
    .eq('id', id);

  if (updateError) throw updateError;

  // 2. Remove os itens antigos para substituir pelos novos
  const { error: deleteError } = await supabase
    .from('itens_receita')
    .delete()
    .eq('receita_id', id);

  if (deleteError) throw deleteError;

  // 3. Insere os novos itens
  if (itens && itens.length > 0) {
    const itensFormatados = itens.map((i: any) => ({
      receita_id: id,
      estoque_id: i.estoqueId || i.estoque_id,
      nome_produto: i.nomeProduto || i.nome_produto,
      cultura: i.cultura,
      praga_nome_comum: i.pragaNomeComum || i.praga_nome_comum,
      praga_nome_cientifico: i.pragaNomeCientifico || i.praga_nome_cientifico,
      modo_aplicacao: i.modoAplicacao || i.modo_aplicacao,
      dosagem_utilizada: i.dosagemUtilizada || i.dosagem_utilizada,
      unidade_dosagem: i.unidadeDosagem || i.unidade_dosagem,
      volume_calda_utilizado: i.volumeCaldaUtilizado || i.volume_calda_utilizado,
      unidade_volume_calda: i.unidadeVolumeCalda || i.unidade_volume_calda,
      area_aplicacao_hectares: i.areaAplicacaoHectares || i.area_aplicacao_hectares,
      quantidade_recomendada: i.quantidadeRecomendada || i.quantidade_recomendada,
    }));

    const { error: itensError } = await supabase
      .from('itens_receita')
      .insert(itensFormatados);

    if (itensError) throw itensError;
  }

  return { success: true, id };
}

export async function excluirReceita(id: number): Promise<void> {
  const { error } = await supabase
    .from('receitas')
    .delete()
    .eq('id', id);

  if (error) throw error;
}