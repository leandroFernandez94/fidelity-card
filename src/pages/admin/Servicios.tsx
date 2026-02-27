import { useState, useEffect } from 'react';
import { serviciosService } from '../../services/servicios';
import type { Servicio } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Gem, Plus, Edit, Trash2, Search, Clock, Star } from 'lucide-react';
import { formatearPrecio } from '../../utils';

export default function AdminServicios() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [filteredServicios, setFilteredServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    duracion_min: '',
    puntos_otorgados: ''
  });

  useEffect(() => {
    async function loadServicios() {
      try {
        const data = await serviciosService.getAll();
        setServicios(data);
        setFilteredServicios(data);
      } catch (error) {
        console.error('Error al cargar servicios:', error);
      } finally {
        setLoading(false);
      }
    }
    loadServicios();
  }, []);

  useEffect(() => {
    const filtered = servicios.filter(servicio =>
      servicio.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredServicios(filtered);
  }, [searchTerm, servicios]);

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchTerm(e.target.value);
  }

  function openModal(servicio?: Servicio) {
    if (servicio) {
      setEditingServicio(servicio);
      setFormData({
        nombre: servicio.nombre,
        descripcion: servicio.descripcion || '',
        precio: servicio.precio.toString(),
        duracion_min: servicio.duracion_min.toString(),
        puntos_otorgados: servicio.puntos_otorgados.toString()
      });
    } else {
      setEditingServicio(null);
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        duracion_min: '',
        puntos_otorgados: ''
      });
    }
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingServicio(null);
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      duracion_min: '',
      puntos_otorgados: ''
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const servicioData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        duracion_min: parseInt(formData.duracion_min),
        puntos_otorgados: parseInt(formData.puntos_otorgados)
      };

      if (editingServicio) {
        await serviciosService.update(editingServicio.id, servicioData);
      } else {
        await serviciosService.create(servicioData);
      }

      const data = await serviciosService.getAll();
      setServicios(data);
      setFilteredServicios(data);
      closeModal();
    } catch (error) {
      console.error('Error al guardar servicio:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás segura de que deseas eliminar este servicio?')) return;

    try {
      await serviciosService.delete(id);
      const data = await serviciosService.getAll();
      setServicios(data);
      setFilteredServicios(data);
    } catch (error) {
      console.error('Error al eliminar servicio:', error);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
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
              Gestión de Servicios
            </h1>
            <p className="text-gray-600">
              Administra los servicios del salón
            </p>
          </div>
          <Button onClick={() => openModal()}>
            <Plus size={18} className="mr-2" />
            Nuevo Servicio
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                id="search"
                placeholder="Buscar servicio..."
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
              <Gem size={24} className="text-primary" />
              Servicios ({filteredServicios.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredServicios.length === 0 ? (
              <div className="text-center py-12">
                <Gem size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'No se encontraron servicios' : 'No hay servicios registrados'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredServicios.map((servicio) => (
                  <div
                    key={servicio.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {servicio.nombre}
                      </h3>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openModal(servicio)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(servicio.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-4">
                      {servicio.descripcion || 'Sin descripción'}
                    </p>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={16} />
                        <span>{servicio.duracion_min} minutos</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Star size={16} className="text-accent fill-accent" />
                        <span>+{servicio.puntos_otorgados} puntos</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-2xl font-bold text-primary">
                        {formatearPrecio(servicio.precio)}
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
                  {editingServicio ? 'Editar Servicio' : 'Nuevo Servicio'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    id="nombre"
                    label="Nombre del Servicio"
                    placeholder="Ej: Manicura Gel"
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
                      placeholder="Descripción del servicio..."
                      value={formData.descripcion}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <Input
                    id="precio"
                    type="number"
                    label="Precio (ARS)"
                    placeholder="15000"
                    value={formData.precio}
                    onChange={handleChange}
                    required
                    min="0"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      id="duracion_min"
                      type="number"
                      label="Duración (minutos)"
                      placeholder="90"
                      value={formData.duracion_min}
                      onChange={handleChange}
                      required
                      min="1"
                    />
                    <Input
                      id="puntos_otorgados"
                      type="number"
                      label="Puntos Otorgados"
                      placeholder="15"
                      value={formData.puntos_otorgados}
                      onChange={handleChange}
                      required
                      min="0"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={closeModal}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingServicio ? 'Actualizar' : 'Crear'}
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
