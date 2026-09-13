import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profilesService } from '../../services/profiles';
import type { Profile } from '@fidelity-card/shared';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Search, Eye, User, Mail, Phone, Gift, Users } from 'lucide-react';
import { formatearFecha, normalizarTexto } from '../../utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageShell from '../../components/PageShell';

export default function AdminClientas() {
  const navigate = useNavigate();
  const [clientas, setClientas] = useState<Profile[]>([]);
  const [filteredClientas, setFilteredClientas] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadClientas() {
      try {
        const data = await profilesService.getByRol('clienta');
        setClientas(data);
        setFilteredClientas(data);
      } catch (error) {
        console.error('Error al cargar clientas:', error);
      } finally {
        setLoading(false);
      }
    }
    loadClientas();
  }, []);

  useEffect(() => {
    const term = normalizarTexto(searchTerm);
    const filtered = term
      ? clientas.filter(clienta =>
          normalizarTexto(`${clienta.nombre} ${clienta.apellido} ${clienta.email}`).includes(term)
        )
      : clientas;
    setFilteredClientas(filtered);
  }, [searchTerm, clientas]);

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchTerm(e.target.value);
  }

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <PageShell>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestión de Clientas
          </h1>
          <p className="text-gray-600">
            Administra la información de todas las clientas
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                id="search"
                placeholder="Buscar clienta por nombre, apellido o email..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-12"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users size={24} className="text-primary" />
              Clientas ({filteredClientas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredClientas.length === 0 ? (
              <div className="text-center py-12">
                <User size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'No se encontraron clientas' : 'No hay clientas registradas'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Nombre</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Contacto</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Puntos</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Registrada</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClientas.map((clienta) => (
                      <tr key={clienta.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/clientas/${clienta.id}`)}
                            className="font-medium text-gray-900 hover:text-primary hover:underline text-left"
                          >
                            {clienta.nombre} {clienta.apellido}
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail size={14} />
                              {clienta.email}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone size={14} />
                              {clienta.telefono}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Gift size={16} className="text-primary" />
                            <span className="font-bold text-primary">{clienta.puntos} pts</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {formatearFecha(clienta.created_at)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/admin/clientas/${clienta.id}`)}
                          >
                            <Eye size={16} className="mr-2" />
                            Ver Detalles
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
    </PageShell>
  );
}
