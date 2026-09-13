import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { citasService } from '../services/citas';
import { serviciosService } from '../services/servicios';
import type { Cita, Servicio } from '@fidelity-card/shared';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { ArrowLeft, Calendar, CheckCircle, XCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import PageShell from '../components/PageShell';
import ErrorBanner from '../components/ErrorBanner';
import CitaDetalleView from '../components/CitaDetalleView';
import { resolveCitaUpdateError } from '../utils/cita-errors';

export default function MiCitaDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const [cita, setCita] = useState<Cita | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    async function loadCita() {
      try {
        const [citaData, serviciosData] = await Promise.all([
          citasService.getById(id!),
          serviciosService.getAll()
        ]);
        setCita(citaData);
        setServicios(serviciosData);
      } catch (error) {
        console.error('Error al cargar cita:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadCita();
  }, [id]);

  async function actualizarEstado(nuevoEstado: Cita['estado']) {
    if (!id) return;

    try {
      setUpdatingId(id);
      setUpdateError(null);
      const updatedCita = await citasService.update(id, { estado: nuevoEstado });
      setCita(updatedCita);
      await refreshProfile();
    } catch (error) {
      console.error('Error al actualizar cita:', error);
      setUpdateError(resolveCitaUpdateError(error));
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (notFound || !cita) {
    return (
      <PageShell>
        <div className="text-center py-12">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cita no encontrada</h2>
          <p className="text-gray-600 mb-4">La cita que buscas no existe o no tienes acceso a ella.</p>
          <Button onClick={() => navigate('/citas')}>
            Volver a Mis Citas
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="max-w-3xl">
      <div className="mb-8">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate('/citas')}
          className="mb-4"
        >
          <ArrowLeft size={16} className="mr-2" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Cita</h1>
        <p className="text-gray-600">Detalle de tu cita</p>
      </div>

      {updateError && (
        <ErrorBanner message={updateError} className="mb-6" />
      )}

      <Card>
        <CardContent className="p-6">
          <CitaDetalleView
            cita={cita}
            servicios={servicios}
            actions={cita.estado === 'pendiente' ? (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  data-testid={`btn-confirmar-${cita.id}`}
                  onClick={() => actualizarEstado('confirmada')}
                  disabled={updatingId === cita.id}
                >
                  <CheckCircle size={16} className="mr-2" />
                  Confirmar
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  data-testid={`btn-cancelar-${cita.id}`}
                  onClick={() => actualizarEstado('cancelada')}
                  disabled={updatingId === cita.id}
                >
                  <XCircle size={16} className="mr-2" />
                  Cancelar
                </Button>
              </>
            ) : undefined}
          />
        </CardContent>
      </Card>
    </PageShell>
  );
}
