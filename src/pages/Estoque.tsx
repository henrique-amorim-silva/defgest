import React, { useState, useEffect } from 'react';
import { getStorageData } from '../utils/storage';
import type { ItemEstoque } from '../@types/estoque';
import { Package, Search, AlertTriangle, Calendar, Layers } from 'lucide-react';

export const Estoque: React.FC = () => {
  const [estoque, setEstoque] = useState<ItemEstoque[]>([]);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    const dadosEstoque = getStorageData<ItemEstoque>('estoque');
    setEstoque(dadosEstoque);
  }, []);

  const estoqueFiltrado = estoque.filter(
    (item) =>
      item.nomeProduto.toLowerCase().includes(busca.toLowerCase()) ||
      item.lote.toLowerCase().includes(busca.toLowerCase()) ||
      item.numeroNotaFiscal.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 border border-emerald-100">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 border-b pb-4 gap-4">
          <div className="flex items-center space-x-3">
            <Package className="h-7 w-7 text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-800">Controle de Estoque de Defensivos</h2>
          </div>
          
          {/* Campo de Busca */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por produto, lote ou NF..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Tabela de Estoque */}
        {estoqueFiltrado.length === 0 ? (
          <div className="text-center py-12">
            <Layers className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Nenhum produto encontrado no estoque.</p>
            <p className="text-xs text-gray-400 mt-1">Faça um lançamento na aba "Entrada de Nota" para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lote</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nota Fiscal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entrada</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {estoqueFiltrado.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {item.nomeProduto}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                      {item.lote}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-bold">
                      <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                        {item.quantidadeAtual} {item.unidade}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{item.dataValidade}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                      NF-{item.numeroNotaFiscal}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.dataEntrada}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};