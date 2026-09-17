import React, { useState, useEffect } from 'react';
import { Plus, Users, Truck, Edit, Trash2, X, MapPin } from 'lucide-react';
import { apiRequest } from '../services/api';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Correção padrão para o ícone do marcador do Leaflet no React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface CadastrosProps {
  empresaId?: string | number;
}

interface ClienteFornecedor {
  id: number;
  nome: string;
  cnpj_cpf: string;
  tipo: 'cliente' | 'fornecedor';
  telefone?: string;
  celular?: string;
  whatsapp?: string;
  email?: string;
  inscricao_estadual?: string;
  registro_geral?: string;
  cep?: string;
  endereco?: string;
  cidade?: string;
  bairro?: string;
  numero?: string;
  complemento?: string;
  uf?: string;
  codigo_ibge?: string;
  empresa_id: number;
}

interface Propriedade {
  id: number;
  cliente_id: number;
  nome_propriedade: string;
  cpf_cnpj?: string;
  lpr?: string;
  ie?: string;
  area_ha?: string;
  area_m2?: string;
  cep?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  numero?: string;
  uf?: string;
  codigo_ibge?: string;
  latitude?: string;
  longitude?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
}

// Componente auxiliar para ajustar o foco e redimensionar o mapa dinamicamente
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  }, [center, zoom, map]);
  return null;
}

export default function Cadastros({ empresaId }: CadastrosProps) {
  const [tipoAtivo, setTipoAtivo] = useState<'cliente' | 'fornecedor'>('cliente');
  const [lista, setLista] = useState<ClienteFornecedor[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [idRegistroSelecionado, setIdRegistroSelecionado] = useState<number | null>(null);
  const [abaCliente, setAbaCliente] = useState<'geral' | 'propriedades'>('geral');

  // Campos Gerais / Comuns
  const [nome, setNome] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpjCpf, setCnpjCpf] = useState('');
  const [inscricaoEstadual, setInscricaoEstadual] = useState('');
  const [rg, setRg] = useState('');
  
  // Localização Geral (Cliente/Fornecedor)
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [bairro, setBairro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [uf, setUf] = useState('');
  const [codigoIbge, setCodigoIbge] = useState('');

  // Contatos Gerais
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [celular, setCelular] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // Campos da Aba Propriedades
  const [propriedadesLista, setPropriedadesLista] = useState<Propriedade[]>([]);
  const [nomePropriedade, setNomePropriedade] = useState('');
  const [propCpfCnpj, setPropCpfCnpj] = useState('');
  const [propLpr, setPropLpr] = useState('');
  const [propIe, setPropIe] = useState('');
  const [propAreaHa, setPropAreaHa] = useState('');
  const [propAreaM2, setPropAreaM2] = useState('');
  const [propCep, setPropCep] = useState('');
  const [propEndereco, setPropEndereco] = useState('');
  const [propBairro, setPropBairro] = useState('');
  const [propCidade, setPropCidade] = useState('');
  const [propNumero, setPropNumero] = useState('');
  const [propUf, setPropUf] = useState('');
  const [propCodigoIbge, setPropCodigoIbge] = useState('');
  const [propLatitude, setPropLatitude] = useState('');
  const [propLongitude, setPropLongitude] = useState('');
  const [propTelefone, setPropTelefone] = useState('');
  const [propWhatsapp, setPropWhatsapp] = useState('');
  const [propEmail, setPropEmail] = useState('');

  // Coordenadas do Mapa (Viçosa-MG padrão)
  const [mapCenter, setMapCenter] = useState<[number, number]>([-20.7546, -42.8825]);
  const [mapZoom, setMapZoom] = useState<number>(14);

  const usuarioStr = localStorage.getItem("usuario");
  const usuario = usuarioStr ? JSON.parse(usuarioStr) : null;
  const isAdminMaster = usuario?.permissao === 'admin_master';
  const empresaEfetiva = empresaId || usuario?.empresa_id || usuario?.empresaId;

  const carregarDados = async () => {
    setLoading(true);
    try {
      const query = empresaEfetiva ? `?empresa_id=${empresaEfetiva}` : '';
      const endpoint = tipoAtivo === 'cliente' ? 'clientes' : 'fornecedores';
      const data = await apiRequest(`${endpoint}${query}`);
      
      if (Array.isArray(data)) {
        const formatados = data.map((item: any) => ({
          ...item,
          tipo: tipoAtivo,
          nome: tipoAtivo === 'cliente' ? item.nome : item.nome_fantasia,
          cnpj_cpf: tipoAtivo === 'cliente' ? item.cpf_cnpj : item.cnpj_cpf
        }));
        setLista(formatados);
      }
    } catch (err) {
      console.error('Erro ao carregar cadastros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [tipoAtivo, empresaEfetiva]);

  // Atualiza coordenadas do mapa se houver latitude/longitude preenchidas ao abrir
  useEffect(() => {
    if (abaCliente === 'propriedades' && modalAberto) {
      const lat = propLatitude ? parseFloat(propLatitude) : -20.7546;
      const lng = propLongitude ? parseFloat(propLongitude) : -42.8825;
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter([lat, lng]);
      }
    }
  }, [abaCliente, modalAberto]);

  // Busca CEP geral (Cliente/Fornecedor)
  const buscarCepGeral = async () => {
    if (!cep || cep.length < 8) return;
    try {
      const limpo = cep.replace(/\D/g, '');
      const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setEndereco(data.logradouro || '');
        setBairro(data.bairro || '');
        setCidade(data.localidade || '');
        setUf(data.uf || '');
        setCodigoIbge(data.ibge || '');
      }
    } catch (e) {
      console.error('Erro ao buscar CEP geral:', e);
    }
  };

  const atualizarCoordenadaEEnderecoPorLatLon = async (lat: number, lng: number) => {
    const latStr = lat.toFixed(6);
    const lngStr = lng.toFixed(6);
    setPropLatitude(latStr);
    setPropLongitude(lngStr);
    setMapCenter([lat, lng]);

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        if (addr.road || addr.pedestrian) setPropEndereco(addr.road || addr.pedestrian);
        if (addr.suburb || addr.neighbourhood) setPropBairro(addr.suburb || addr.neighbourhood);
        if (addr.city || addr.town || addr.village) setPropCidade(addr.city || addr.town || addr.village || '');
        if (addr.state) {
          setPropUf(addr.state.substring(0, 2).toUpperCase());
        }
        if (addr.postcode) setPropCep(addr.postcode);
        if (addr.house_number) setPropNumero(addr.house_number);
      }
    } catch (e) {
      console.error('Erro no reverse geocoding:', e);
    }
  };

  const buscarCepPropriedade = async () => {
    if (!propCep || propCep.length < 8) return;
    try {
      const limpo = propCep.replace(/\D/g, '');
      const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setPropEndereco(data.logradouro || '');
        setPropBairro(data.bairro || '');
        setPropCidade(data.localidade || '');
        setPropUf(data.uf || '');
        setPropCodigoIbge(data.ibge || '');

        const enderecoCompleto = `${data.logradouro || ''}, ${data.localidade} - ${data.uf}, ${propCep}`;
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoCompleto)}`);
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          const lat = parseFloat(geoData[0].lat);
          const lng = parseFloat(geoData[0].lon);
          setPropLatitude(lat.toFixed(6));
          setPropLongitude(lng.toFixed(6));
          setMapCenter([lat, lng]);
          setMapZoom(16);
        }
      }
    } catch (e) {
      console.error('Erro ao buscar CEP da propriedade:', e);
    }
  };

  // Componente interno para capturar cliques no mapa do Leaflet
  function MapClickHandler() {
    useMapEvents({
      click(e) {
        atualizarCoordenadaEEnderecoPorLatLon(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

  const abrirModalNovo = () => {
    setModoEdicao(false);
    setIdRegistroSelecionado(null);
    setAbaCliente('geral');
    setNome('');
    setRazaoSocial('');
    setCnpjCpf('');
    setInscricaoEstadual('');
    setRg('');
    setCep('');
    setEndereco('');
    setCidade('');
    setBairro('');
    setNumero('');
    setComplemento('');
    setUf('');
    setCodigoIbge('');
    setEmail('');
    setTelefone('');
    setCelular('');
    setWhatsapp('');
    setPropriedadesLista([]);
    setModalAberto(true);
  };

  const abrirModalEdicao = async (item: ClienteFornecedor) => {
    setModoEdicao(true);
    setIdRegistroSelecionado(item.id);
    setAbaCliente('geral');
    setNome(item.nome || '');
    setCnpjCpf(item.cnpj_cpf || '');
    setInscricaoEstadual(item.inscricao_estadual || '');
    setRg(item.registro_geral || '');
    setCep(item.cep || '');
    setEndereco(item.endereco || '');
    setCidade(item.cidade || '');
    setBairro(item.bairro || '');
    setNumero(item.numero || '');
    setComplemento(item.complemento || '');
    setUf(item.uf || '');
    setCodigoIbge(item.codigo_ibge || '');
    setEmail(item.email || '');
    setTelefone(item.telefone || '');
    setCelular(item.celular || '');
    setWhatsapp(item.whatsapp || '');
    setModalAberto(true);

    if (tipoAtivo === 'cliente') {
      try {
        const props = await apiRequest(`clientes/${item.id}/propriedades`);
        if (Array.isArray(props)) setPropriedadesLista(props);
      } catch (e) {
        setPropriedadesLista([]);
      }
    }
  };

  const salvarRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = tipoAtivo === 'cliente' ? 'clientes' : 'fornecedores';

      let payload: any = {
        id: modoEdicao && idRegistroSelecionado ? idRegistroSelecionado : undefined,
        empresaId: empresaEfetiva ? Number(empresaEfetiva) : 1,
      };

      if (tipoAtivo === 'cliente') {
        payload = {
          ...payload,
          nome,
          cpfCnpj: cnpjCpf,
          inscricaoEstadual,
          registroGeral: rg,
          cep,
          endereco,
          bairro,
          cidade,
          numero,
          complemento,
          uf,
          codigoIbge,
          telefone,
          celular,
          whatsapp,
          email,
          status: 'Ativo',
          propriedades: propriedadesLista
        };
      } else {
        payload = {
          ...payload,
          nomeFantasia: nome,
          razaoSocial: razaoSocial || nome,
          cnpjCpf,
          inscricaoEstadual,
          cep,
          endereco,
          cidade,
          bairro,
          numero,
          complemento,
          uf,
          codigoIbge,
          email,
          telefone,
          celular,
          whatsapp
        };
      }

      await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setModalAberto(false);
      carregarDados();
    } catch (err) {
      console.error('Erro ao salvar registro:', err);
      alert('Erro ao salvar os dados. Verifique os campos.');
    }
  };

  const excluirRegistro = async (id: number) => {
    if (!confirm('Deseja realmente excluir este registro?')) return;
    try {
      const endpoint = tipoAtivo === 'cliente' ? 'clientes' : 'fornecedores';
      await apiRequest(`${endpoint}/${id}`, { method: 'DELETE' });
      carregarDados();
    } catch (err) {
      console.error('Erro ao excluir:', err);
      alert('Erro ao excluir registro.');
    }
  };

  const adicionarPropriedadeLocal = () => {
    if (!nomePropriedade) {
      alert('Preencha o nome da propriedade.');
      return;
    }
    const nova: Propriedade = {
      id: Date.now(),
      cliente_id: idRegistroSelecionado || 0,
      nome_propriedade: nomePropriedade,
      cpf_cnpj: propCpfCnpj,
      lpr: propLpr,
      ie: propIe,
      area_ha: propAreaHa,
      area_m2: propAreaM2,
      cep: propCep,
      endereco: propEndereco,
      bairro: propBairro,
      cidade: propCidade,
      numero: propNumero,
      uf: propUf,
      codigo_ibge: propCodigoIbge,
      latitude: propLatitude,
      longitude: propLongitude,
      telefone: propTelefone,
      whatsapp: propWhatsapp,
      email: propEmail
    };
    setPropriedadesLista([...propriedadesLista, nova]);
    setNomePropriedade('');
    setPropCpfCnpj('');
    setPropLpr('');
    setPropIe('');
    setPropAreaHa('');
    setPropAreaM2('');
    setPropCep('');
    setPropEndereco('');
    setPropBairro('');
    setPropCidade('');
    setPropNumero('');
    setPropUf('');
    setPropCodigoIbge('');
    setPropLatitude('');
    setPropLongitude('');
    setPropTelefone('');
    setPropWhatsapp('');
    setPropEmail('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gerenciamento de Cadastros</h1>
          <p className="text-sm text-gray-500">
            {isAdminMaster && !empresaEfetiva 
              ? "Visualizando registros de todas as empresas (Modo Admin Master)" 
              : `Vinculado à empresa ID: ${empresaEfetiva || 'Geral'}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-gray-200 p-1 rounded-lg flex gap-1">
            <button
              onClick={() => setTipoAtivo('cliente')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                tipoAtivo === 'cliente' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="h-4 w-4" /> Clientes
            </button>
            <button
              onClick={() => setTipoAtivo('fornecedor')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                tipoAtivo === 'fornecedor' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Truck className="h-4 w-4" /> Fornecedores
            </button>
          </div>

          <button
            onClick={abrirModalNovo}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow transition"
          >
            <Plus className="h-4 w-4" /> Novo {tipoAtivo === 'cliente' ? 'Cliente' : 'Fornecedor'}
          </button>
        </div>
      </div>

      {/* Tabela Principal */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <th className="py-3 px-6">Nome / Razão Social</th>
              <th className="py-3 px-6">CNPJ / CPF</th>
              <th className="py-3 px-6">Telefone / Celular</th>
              <th className="py-3 px-6">E-mail</th>
              <th className="py-3 px-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">Carregando dados...</td>
              </tr>
            ) : lista.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">Nenhum {tipoAtivo} cadastrado para esta empresa.</td>
              </tr>
            ) : (
              lista.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="py-3.5 px-6 font-medium text-gray-900">{item.nome}</td>
                  <td className="py-3.5 px-6">{item.cnpj_cpf}</td>
                  <td className="py-3.5 px-6">{item.celular || item.telefone || '-'}</td>
                  <td className="py-3.5 px-6">{item.email || '-'}</td>
                  <td className="py-3.5 px-6 text-right space-x-2">
                    <button onClick={() => abrirModalEdicao(item)} className="text-blue-600 hover:text-blue-800 p-1 rounded" title="Editar">
                      <Edit className="h-4 w-4 inline" />
                    </button>
                    <button onClick={() => excluirRegistro(item.id)} className="text-red-600 hover:text-red-800 p-1 rounded" title="Excluir">
                      <Trash2 className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Principal */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl overflow-hidden my-6">
            <div className="flex justify-between items-center bg-emerald-700 text-white px-6 py-4">
              <h3 className="font-bold text-lg">
                {modoEdicao ? `Editar ${tipoAtivo === 'cliente' ? 'Cliente' : 'Fornecedor'}` : `Cadastro de ${tipoAtivo === 'cliente' ? 'Cliente' : 'Fornecedor'}`}
              </h3>
              <button onClick={() => setModalAberto(false)} className="text-white/80 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Abas se for Cliente */}
            {tipoAtivo === 'cliente' && (
              <div className="flex border-b border-gray-200 bg-gray-50 px-6 pt-3 gap-4">
                <button
                  type="button"
                  onClick={() => setAbaCliente('geral')}
                  className={`pb-2 px-4 text-sm font-semibold border-b-2 transition ${
                    abaCliente === 'geral' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Informações Gerais
                </button>
                <button
                  type="button"
                  onClick={() => setAbaCliente('propriedades')}
                  className={`pb-2 px-4 text-sm font-semibold border-b-2 transition ${
                    abaCliente === 'propriedades' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Propriedades
                </button>
              </div>
            )}

            <form onSubmit={salvarRegistro} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* ABA GERAL OU FORNECEDOR */}
              {(tipoAtivo === 'fornecedor' || abaCliente === 'geral') && (
                <div className="space-y-6">
                  
                  {/* Seção 1: Informações Gerais */}
                  <div>
                    <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3">Informações Gerais</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">{tipoAtivo === 'fornecedor' ? 'Nome Fantasia *' : 'Nome *'}</label>
                        <input
                          type="text"
                          required
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      {tipoAtivo === 'fornecedor' && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Razão Social *</label>
                          <input
                            type="text"
                            value={razaoSocial}
                            onChange={(e) => setRazaoSocial(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">CNPJ / CPF *</label>
                        <input
                          type="text"
                          required
                          value={cnpjCpf}
                          onChange={(e) => setCnpjCpf(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Inscrição Estadual</label>
                        <input
                          type="text"
                          value={inscricaoEstadual}
                          onChange={(e) => setInscricaoEstadual(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      {tipoAtivo === 'cliente' && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Registro Geral (RG)</label>
                          <input
                            type="text"
                            value={rg}
                            onChange={(e) => setRg(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Seção 2: Localização / Endereço */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3">Endereço</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">CEP *</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={cep}
                            onChange={(e) => setCep(e.target.value)}
                            onBlur={buscarCepGeral}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                          <button
                            type="button"
                            onClick={buscarCepGeral}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium transition"
                          >
                            Buscar
                          </button>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Endereço</label>
                        <input
                          type="text"
                          value={endereco}
                          onChange={(e) => setEndereco(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Bairro</label>
                        <input
                          type="text"
                          value={bairro}
                          onChange={(e) => setBairro(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Cidade *</label>
                        <input
                          type="text"
                          required
                          value={cidade}
                          onChange={(e) => setCidade(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Número</label>
                        <input
                          type="text"
                          value={numero}
                          onChange={(e) => setNumero(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Complemento</label>
                        <input
                          type="text"
                          value={complemento}
                          onChange={(e) => setComplemento(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">UF *</label>
                        <input
                          type="text"
                          required
                          maxLength={2}
                          value={uf}
                          onChange={(e) => setUf(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Código IBGE</label>
                        <input
                          type="text"
                          value={codigoIbge}
                          onChange={(e) => setCodigoIbge(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Seção 3: Contatos */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3">Contatos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Telefone</label>
                        <input
                          type="text"
                          value={telefone}
                          onChange={(e) => setTelefone(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp</label>
                        <input
                          type="text"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">E-mail</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* ABA PROPRIEDADES (CLIENTE) */}
              {tipoAtivo === 'cliente' && abaCliente === 'propriedades' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
                    <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Dados da Propriedade</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Nome da Propriedade *</label>
                        <input
                          type="text"
                          value={nomePropriedade}
                          onChange={(e) => setNomePropriedade(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Ex: Fazenda Santa Clara"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">CPF/CNPJ</label>
                        <input
                          type="text"
                          value={propCpfCnpj}
                          onChange={(e) => setPropCpfCnpj(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Inscrição Estadual (I.E.)</label>
                        <input
                          type="text"
                          value={propIe}
                          onChange={(e) => setPropIe(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">LPR</label>
                        <input
                          type="text"
                          value={propLpr}
                          onChange={(e) => setPropLpr(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Área ($m^2$)</label>
                        <input
                          type="text"
                          value={propAreaM2}
                          onChange={(e) => setPropAreaM2(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Área (ha)</label>
                        <input
                          type="text"
                          value={propAreaHa}
                          onChange={(e) => setPropAreaHa(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Bloco de Localização e Mapa Leaflet lado a lado */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                      <div className="space-y-4">
                        <h5 className="text-xs font-bold text-gray-700 uppercase">Endereço da Propriedade e Coordenadas</h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2 flex gap-2">
                            <input
                              type="text"
                              value={propCep}
                              onChange={(e) => setPropCep(e.target.value)}
                              onBlur={buscarCepPropriedade}
                              placeholder="CEP"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none"
                            />
                            <button type="button" onClick={buscarCepPropriedade} className="bg-gray-200 px-3 py-2 text-xs font-medium rounded-lg hover:bg-gray-300">Buscar</button>
                          </div>
                          <div className="col-span-2">
                            <input
                              type="text"
                              value={propEndereco}
                              onChange={(e) => setPropEndereco(e.target.value)}
                              placeholder="Endereço"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={propBairro}
                              onChange={(e) => setPropBairro(e.target.value)}
                              placeholder="Bairro"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={propCidade}
                              onChange={(e) => setPropCidade(e.target.value)}
                              placeholder="Cidade *"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={propLatitude}
                              onChange={(e) => {
                                setPropLatitude(e.target.value);
                                const l = parseFloat(e.target.value);
                                const lg = parseFloat(propLongitude);
                                if (!isNaN(l) && !isNaN(lg)) setMapCenter([l, lg]);
                              }}
                              placeholder="Latitude"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={propLongitude}
                              onChange={(e) => {
                                setPropLongitude(e.target.value);
                                const l = parseFloat(propLatitude);
                                const lg = parseFloat(e.target.value);
                                if (!isNaN(l) && !isNaN(lg)) setMapCenter([l, lg]);
                              }}
                              placeholder="Longitude"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={propNumero}
                              onChange={(e) => setPropNumero(e.target.value)}
                              placeholder="Número"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={propUf}
                              onChange={(e) => setPropUf(e.target.value)}
                              placeholder="UF"
                              maxLength={2}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none uppercase"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="text"
                              value={propCodigoIbge}
                              onChange={(e) => setPropCodigoIbge(e.target.value)}
                              placeholder="Código IBGE"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={propTelefone}
                              onChange={(e) => setPropTelefone(e.target.value)}
                              placeholder="Telefone"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={propWhatsapp}
                              onChange={(e) => setPropWhatsapp(e.target.value)}
                              placeholder="WhatsApp"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="email"
                              value={propEmail}
                              onChange={(e) => setPropEmail(e.target.value)}
                              placeholder="E-mail"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Mapa Gratuito do Leaflet */}
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-emerald-600" /> Localização no Mapa (Leaflet)
                        </span>
                        <div className="w-full h-80 rounded-xl border border-emerald-200 shadow-inner overflow-hidden relative z-0">
                          <MapContainer 
                            center={mapCenter} 
                            zoom={mapZoom} 
                            style={{ width: '100%', height: '100%' }}
                          >
                            <MapController center={mapCenter} zoom={mapZoom} />
                            <MapClickHandler />
                            <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {propLatitude && propLongitude && !isNaN(parseFloat(propLatitude)) && !isNaN(parseFloat(propLongitude)) && (
                              <Marker position={[parseFloat(propLatitude), parseFloat(propLongitude)]} />
                            )}
                          </MapContainer>
                        </div>
                        <span className="text-[10px] text-gray-500 mt-2 text-center">
                          Clique no mapa para marcar a propriedade e preencher a latitude, longitude e endereço automaticamente.
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={adicionarPropriedadeLocal}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-5 py-2.5 rounded-lg transition shadow"
                      >
                        Adicionar Propriedade
                      </button>
                    </div>
                  </div>

                  {/* Tabela de Propriedades Vinculadas */}
                  <div>
                    <h5 className="text-xs font-bold text-gray-600 uppercase mb-2">Propriedades Cadastradas</h5>
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
                          <tr>
                            <th className="p-3">Nome</th>
                            <th className="p-3">CPF/CNPJ</th>
                            <th className="p-3">Endereço</th>
                            <th className="p-3">Cidade</th>
                            <th className="p-3 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {propriedadesLista.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-gray-400">Nenhuma propriedade adicionada.</td>
                            </tr>
                          ) : (
                            propriedadesLista.map((p, idx) => (
                              <tr key={idx}>
                                <td className="p-3 font-medium text-gray-800">{p.nome_propriedade}</td>
                                <td className="p-3">{p.cpf_cnpj || '-'}</td>
                                <td className="p-3">{p.endereco || '-'}</td>
                                <td className="p-3">{p.cidade || '-'}</td>
                                <td className="p-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setPropriedadesLista(propriedadesLista.filter((_, i) => i !== idx))}
                                    className="text-red-600 hover:text-red-800 text-xs font-medium"
                                  >
                                    Remover
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Botões do Modal */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow transition"
                >
                  {modoEdicao ? 'Atualizar' : 'Salvar Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}