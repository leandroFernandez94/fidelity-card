import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { profilesService } from '../../services/profiles';
import { citasService } from '../../services/citas';
import type { Profile, Cita } from '@fidelity-card/shared';
import { Card, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ArrowLeft, Edit, User, Gift, Calendar, Clock, CheckCircle } from 'lucide-react';
import { formatearFecha, formatearHora, getEstadoCitaColor } from '../../utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageShell from '../../components/PageShell';

interface ClientaFormData {
  nombre: string;
  apellido: string;
  telefono: string;
  puntos: number;
}

export default function ClientaDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [clienta, setClienta] = useState<Profile | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClientaFormData>({
    nombre: '',
    apellido: '',
    telefono: '',
    puntos: 0
  });

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    async function loadClienta() {
      try {
        const data = await profilesService.getById(id!);
        if (!data) {
          setNotFound(true);
          return;
        }
        setClienta(data);
        setFormData({
          nombre: data.nombre,
          apellido: data.apellido,
          telefono: data.telefono || '',
          puntos: data.puntos || 0
        });

        try {
          const citasData = await citasService.getByClienta(id!);
          setCitas(citasData.sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime()));
        } catch (citaError) {
          console.error('Error al cargar citas de la clienta:', citaError);
        }
      } catch (error) {
        console.error('Error al cargar clienta:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadClienta();
  }, [id]);

  function iniciarEdicion() {
    if (!clienta) return;
    setFormData({
      nombre: clienta.nombre,
      apellido: clienta.apellido,
      telefono: clienta.telefono || '',
      puntos: clienta.puntos || 0
    });
    setSaveError(null);
    setIsEditing(true);
  }

  function cancelarEdicion() {
    setSaveError(null);
    setIsEditing(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'puntos' ? (value === '' ? 0 : parseInt(value)) : value
    }));
  }

  async function handleSave() {
    if (!id || !clienta) return;

    setSaveError(null);
    setSaving(true);

    try {
      const updated = await profilesService.update(id, formData);
      setClienta(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Error al actualizar clienta:', error);
      setSaveError('No se pudo actualizar la información de la clienta. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (notFound || !clienta) {
    return (
      <PageShell>
        <div className="text-center py-12">
          <User size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Clienta no encontrada</h2>
          <p className="text-gray-600 mb-4">La clienta que buscas no existe o fue eliminada.</p>
          <Button onClick={() => navigate('/admin/clientas')}>
            Volver a Clientas
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mb-8">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/clientas')}
          className="mb-4"
        >
          <ArrowLeft size={16} className="mr-2" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {clienta.nombre} {clienta.apellido}
        </h1>
        <p className="text-gray-600">
          {isEditing ? 'Edita la información de la clienta' : 'Detalle de la clienta'}
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User size={20} className="text-primary" />
                Información Personal
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600">Nombre</label>
                  {isEditing ? (
                    <Input
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium">{clienta.nombre}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-600">Apellido</label>
                  {isEditing ? (
                    <Input
                      id="apellido"
                      name="apellido"
                      value={formData.apellido}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium">{clienta.apellido}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <p className="font-medium">{clienta.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Teléfono</label>
                  {isEditing ? (
                    <Input
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium">{clienta.telefono}</p>
                  )}
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
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        id="puntos"
                        type="number"
                        name="puntos"
                        value={formData.puntos}
                        onChange={handleInputChange}
                        className="text-center text-2xl font-bold text-primary"
                      />
                      <div className="text-gray-600">Puntos Acumulados</div>
                    </div>
                  ) : (
                    <>
                      <div className="text-5xl font-bold text-primary mb-2">{clienta.puntos}</div>
                      <div className="text-gray-600">Puntos Acumulados</div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-gray-600">Fecha de Registro</span>
                  <span className="font-medium">{formatearFecha(clienta.created_at)}</span>
                </div>
              </div>

              {!isEditing && (
                <div className="mt-8">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-primary" />
                    Historial de Citas
                  </h3>
                  {citas.length === 0 ? (
                    <p className="text-center py-4 text-gray-500 text-sm italic">
                      No hay citas registradas.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {citas.map((cita) => (
                        <div
                          key={cita.id}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2 text-xs font-medium">
                              <Calendar size={12} className="text-gray-400" />
                              {formatearFecha(cita.fecha_hora)}
                              <Clock size={12} className="text-gray-400 ml-1" />
                              {formatearHora(cita.fecha_hora)}
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getEstadoCitaColor(cita.estado)}`}>
                              {cita.estado}
                            </span>
                          </div>
                          <div className="flex justify-between items-end">
                            <div className="text-xs text-gray-500">
                              {cita.servicio_ids.length} servicio{cita.servicio_ids.length !== 1 ? 's' : ''}
                            </div>
                            <div className="flex gap-2">
                              {cita.puntos_ganados > 0 && (
                                <span className="text-[10px] font-bold text-primary flex items-center gap-0.5">
                                  <CheckCircle size={10} />
                                  +{cita.puntos_ganados} pts
                                </span>
                              )}
                              {cita.puntos_utilizados > 0 && (
                                <span className="text-[10px] font-bold text-red-500 flex items-center gap-0.5">
                                  <Gift size={10} />
                                  -{cita.puntos_utilizados} pts
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {saveError && (
            <p className="mt-4 text-sm text-red-600">{saveError}</p>
          )}

          <div className="mt-6 flex justify-end gap-3 border-t pt-6">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={cancelarEdicion}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} loading={saving}>
                  Guardar Cambios
                </Button>
              </>
            ) : (
              <Button onClick={iniciarEdicion}>
                <Edit size={18} className="mr-2" />
                Editar Clienta
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
