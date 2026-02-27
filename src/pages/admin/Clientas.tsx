import { useState, useEffect } from 'react';
import { profilesService } from '../../services/profiles';
import type { Profile } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Search, Edit, Eye, User, Mail, Phone, Gift, Calendar, TrendingUp } from 'lucide-react';
import { formatearFecha } from '../../utils';

export default function AdminClientas() {
  const [clientas, setClientas] = useState<Profile[]>([]);
  const [filteredClientas, setFilteredClientas] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClienta, setSelectedClienta] = useState<Profile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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
    const filtered = clientas.filter(clienta =>
      `${clienta.nombre} ${clienta.apellido} ${clienta.email}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClientas(filtered);
  }, [searchTerm, clientas]);

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchTerm(e.target.value);
  }

  function verDetalles(clienta: Profile) {
    setSelectedClienta(clienta);
    setModalOpen(true);
  }

  function cerrarModal() {
    setSelectedClienta(null);
    setModalOpen(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
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
                          <div className="font-medium text-gray-900">
                            {clienta.nombre} {clienta.apellido}
                          </div>
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
                            <span className="font-bold text-primary">
                              {clienta.puntos} pts
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {formatearFecha(clienta.created_at)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => verDetalles(clienta)}
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

        {modalOpen && selectedClienta && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Detalle de Clienta</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cerrarModal}
                >
                  ✕
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User size={20} className="text-primary" />
                      Información Personal
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-600">Nombre</label>
                        <p className="font-medium">{selectedClienta.nombre}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Apellido</label>
                        <p className="font-medium">{selectedClienta.apellido}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Email</label>
                        <p className="font-medium">{selectedClienta.email}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Teléfono</label>
                        <p className="font-medium">{selectedClienta.telefono}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Gift size={20} className="text-accent" />
                      Sistema de Puntos
                    </h3>
                    <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-6 rounded-lg mb-4">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-primary mb-2">
                          {selectedClienta.puntos}
                        </div>
                        <div className="text-gray-600">Puntos Acumulados</div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Fecha de Registro</span>
                        <span className="font-medium">
                          {formatearFecha(selectedClienta.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline" onClick={cerrarModal}>
                    Cerrar
                  </Button>
                  <Button>
                    <Edit size={18} className="mr-2" />
                    Editar Clienta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
