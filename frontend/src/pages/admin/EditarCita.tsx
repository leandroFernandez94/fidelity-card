import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { citasService } from '../../services/citas';
import type { Cita } from '@fidelity-card/shared';
import CitaForm, { type CitaFormData } from './CitaForm';
import { Card, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { ArrowLeft } from 'lucide-react';

export default function EditarCita() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [cita, setCita] = useState<Cita | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    async function loadCita() {
      try {
        const citaData = await citasService.getById(id!);
        setCita(citaData);
      } catch (err) {
        console.error('Error al cargar cita:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadCita();
  }, [id]);

  async function handleSubmit(data: CitaFormData) {
    if (!id) return;

    setError(null);

    if (data.items.length === 0) {
      setError('Selecciona al menos un servicio.');
      return;
    }

    setSubmitting(true);

    try {
      await citasService.updateFull(id, {
        items: data.items,
        fecha_hora: data.fecha_hora,
        notas: data.notas || undefined,
      });
      navigate('/admin/citas');
    } catch (err) {
      console.error('Error al actualizar cita:', err);
      setError('No se pudo actualizar la cita. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !cita) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cita no encontrada</h2>
          <p className="text-gray-600 mb-4">La cita que buscas no existe o fue eliminada.</p>
          <Button onClick={() => navigate('/admin/citas')}>
            Volver a Citas
          </Button>
        </div>
      </div>
    );
  }

  const existingItems = cita.items && cita.items.length > 0
    ? cita.items
    : cita.servicio_ids.map((sid) => ({ servicio_id: sid, tipo: 'comprado' as const }));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/citas')}>
            <ArrowLeft size={18} className="mr-2" />
            Volver a Citas
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="p-6 border-b border-gray-100">
              <h1 className="text-xl font-semibold text-gray-900">Editar Cita</h1>
              <p className="text-sm text-gray-500">Modifica los detalles de la cita</p>
            </div>
            <div className="p-6">
              <CitaForm
                initialData={cita}
                initialItems={existingItems}
                onSubmit={handleSubmit}
                submitting={submitting}
                error={error}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
