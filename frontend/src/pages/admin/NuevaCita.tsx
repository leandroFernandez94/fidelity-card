import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { citasService } from '../../services/citas';
import CitaForm, { type CitaFormData } from './CitaForm';
import { Card, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { ArrowLeft } from 'lucide-react';

export default function NuevaCita() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: CitaFormData) {
    setError(null);

    if (!data.clienta_id) {
      setError('Selecciona una clienta.');
      return;
    }
    if (data.items.length === 0) {
      setError('Selecciona al menos un servicio.');
      return;
    }

    setSubmitting(true);

    try {
      await citasService.create({
        clienta_id: data.clienta_id,
        items: data.items,
        fecha_hora: data.fecha_hora,
        notas: data.notas || undefined,
      });
      navigate('/admin/citas');
    } catch (err) {
      console.error('Error al crear cita:', err);
      setError('No se pudo crear la cita. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  }

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
              <h1 className="text-xl font-semibold text-gray-900">Nueva Cita</h1>
              <p className="text-sm text-gray-500">Crea una cita para una clienta</p>
            </div>
            <div className="p-6">
              <CitaForm
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
