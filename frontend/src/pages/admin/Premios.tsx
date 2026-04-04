import { useCallback } from 'react';
import { premiosService } from '../../services/premios';
import type { Premio } from '@fidelity-card/shared';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Gift, Plus, Edit, Trash2, Search, Star, CheckCircle2, XCircle } from 'lucide-react';
import { useAdminList } from '../../hooks/useAdminList';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageShell from '../../components/PageShell';

interface PremioFormData {
  nombre: string;
  descripcion: string;
  puntos_requeridos: string;
  activo: boolean;
}

const INITIAL_FORM: PremioFormData = {
  nombre: '',
  descripcion: '',
  puntos_requeridos: '',
  activo: true,
};

export default function AdminPremios() {
  const {
    items: premios,
    loading,
    searchTerm,
    modalOpen,
    editingItem: editingPremio,
    formData,
    handleSearch,
    openModal,
    closeModal,
    handleSubmit,
    handleDelete,
    handleChange,
    handleCheckboxChange,
  } = useAdminList<Premio, PremioFormData>({
    fetchFn: useCallback(() => premiosService.getAll(), []),
    filterFn: useCallback(
      (items: Premio[], search: string) =>
        items.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase())),
      []
    ),
    createFn: useCallback(async (data: PremioFormData) => {
      await premiosService.create({
        nombre: data.nombre,
        descripcion: data.descripcion,
        puntos_requeridos: parseInt(data.puntos_requeridos),
        activo: data.activo,
      });
    }, []),
    updateFn: useCallback(async (id: string, data: PremioFormData) => {
      await premiosService.update(id, {
        nombre: data.nombre,
        descripcion: data.descripcion,
        puntos_requeridos: parseInt(data.puntos_requeridos),
        activo: data.activo,
      });
    }, []),
    deleteFn: useCallback(async (id: string) => {
      await premiosService.delete(id);
    }, []),
    initialFormData: INITIAL_FORM,
    mapItemToForm: useCallback(
      (p: Premio): PremioFormData => ({
        nombre: p.nombre,
        descripcion: p.descripcion || '',
        puntos_requeridos: p.puntos_requeridos.toString(),
        activo: p.activo,
      }),
      []
    ),
    itemName: 'premio',
  });

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <PageShell>
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
              Premios ({premios.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {premios.length === 0 ? (
              <div className="text-center py-12">
                <Gift size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'No se encontraron premios' : 'No hay premios registrados'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {premios.map((premio) => (
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
                <form onSubmit={(e) => handleSubmit(e, (d) => d)} className="space-y-4">
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
                      onChange={handleCheckboxChange}
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
    </PageShell>
  );
}
