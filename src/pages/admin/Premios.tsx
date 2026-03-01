import { useState, useEffect } from 'react';
import { premiosService } from '../../services/premios';
import type { Premio } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Gift, Plus, Edit, Trash2, Search, Star, CheckCircle2, XCircle } from 'lucide-react';

export default function AdminPremios() {
  const [premios, setPremios] = useState<Premio[]>([]);
  const [filteredPremios, setFilteredPremios] = useState<Premio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPremio, setEditingPremio] = useState<Premio | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    puntos_requeridos: '',
    activo: true
  });

  useEffect(() => {
    async function loadPremios() {
      try {
        const data = await premiosService.getAll();
        setPremios(data);
        setFilteredPremios(data);
      } catch (error) {
        console.error('Error al cargar premios:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPremios();
  }, []);

  useEffect(() => {
    const filtered = premios.filter(premio =>
      premio.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPremios(filtered);
  }, [searchTerm, premios]);

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchTerm(e.target.value);
  }

  function openModal(premio?: Premio) {
    if (premio) {
      setEditingPremio(premio);
      setFormData({
        nombre: premio.nombre,
        descripcion: premio.descripcion || '',
        puntos_requeridos: premio.puntos_requeridos.toString(),
        activo: premio.activo
      });
    } else {
      setEditingPremio(null);
      setFormData({
        nombre: '',
        descripcion: '',
        puntos_requeridos: '',
        activo: true
      });
    }
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingPremio(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const premioData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        puntos_requeridos: parseInt(formData.puntos_requeridos),
        activo: formData.activo
      };

      if (editingPremio) {
        await premiosService.update(editingPremio.id, premioData);
      } else {
        await premiosService.create(premioData);
      }

      const data = await premiosService.getAll();
      setPremios(data);
      setFilteredPremios(data);
      closeModal();
    } catch (error) {
      console.error('Error al guardar premio:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás segura de que deseas eliminar este premio?')) return;

    try {
      await premiosService.delete(id);
      const data = await premiosService.getAll();
      setPremios(data);
      setFilteredPremios(data);
    } catch (error) {
      console.error('Error al eliminar premio:', error);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { id, value, type } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [id]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestión de Premios
            </h1>
            <p className="text-gray-600">
              Administra los premios canjeables por puntos
            </p>
          </div>
          <Button onClick={() => openModal()}>
            <Plus size={18} className="mr-2" />
            Nuevo Premio
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                id="search"
                placeholder="Buscar premio..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-12"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift size={24} className="text-primary" />
              Premios ({filteredPremios.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPremios.length === 0 ? (
              <div className="text-center py-12">
                <Gift size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'No se encontraron premios' : 'No hay premios registrados'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPremios.map((premio) => (
                  <div
                    key={premio.id}
                    className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow ${
                      !premio.activo ? 'opacity-60 border-gray-200' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {premio.nombre}
                        </h3>
                        {!premio.activo && (
                          <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openModal(premio)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(premio.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-4">
                      {premio.descripcion || 'Sin descripción'}
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2 text-primary font-bold">
                        <Star size={18} className="text-accent fill-accent" />
                        <span>{premio.puntos_requeridos} puntos</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        {premio.activo ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 size={14} /> Activo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-500">
                            <XCircle size={14} /> Inactivo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <CardTitle>
                  {editingPremio ? 'Editar Premio' : 'Nuevo Premio'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    id="nombre"
                    label="Nombre del Premio"
                    placeholder="Ej: 50% descuento en Mechas"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      id="descripcion"
                      rows={3}
                      placeholder="Descripción detallada del premio..."
                      value={formData.descripcion}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <Input
                    id="puntos_requeridos"
                    type="number"
                    label="Puntos Requeridos"
                    placeholder="100"
                    value={formData.puntos_requeridos}
                    onChange={handleChange}
                    required
                    min="1"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      id="activo"
                      type="checkbox"
                      checked={formData.activo}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                      Premio activo (disponible para canjear)
                    </label>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={closeModal}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingPremio ? 'Actualizar' : 'Crear'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
