import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { citasService } from '../../services/citas';
import { serviciosService } from '../../services/servicios';
import { profilesService } from '../../services/profiles';
import type { Cita, Profile, Servicio } from '@fidelity-card/shared';
import { Card, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { ArrowLeft, Calendar, CheckCircle, Pencil, XCircle } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageShell from '../../components/PageShell';
import ErrorBanner from '../../components/ErrorBanner';
import CitaDetalleView from '../../components/CitaDetalleView';
import { resolveCitaUpdateError } from '../../utils/cita-errors';

export default function AdminCitaDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [cita, setCita] = useState<Cita | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [clienta, setClienta] = useState<Profile | null>(null);
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

        try {
          const clientaData = await profilesService.getById(citaData.clienta_id);
          setClienta(clientaData);
        } catch (clientaError) {
          console.error('Error al cargar clienta:', clientaError);
        }
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
    } catch (error) {
      console.error('Error al actualizar estado:', error);
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
          <p className="text-gray-600 mb-4">La cita que buscas no existe o fue eliminada.</p>
          <Button onClick={() => navigate('/admin/citas')}>
            Volver a Citas
          </Button>
        </div>
      </PageShell>
    );
  }

  const puedeActualizar = cita.estado === 'pendiente' || cita.estado === 'confirmada';

  return (
    <PageShell maxWidth="max-w-3xl">
      <div className="mb-8">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/citas')}
          className="mb-4"
        >
          <ArrowLeft size={16} className="mr-2" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {clienta ? `Cita de ${clienta.nombre} ${clienta.apellido}` : 'Detalle de la Cita'}
        </h1>
        <p className="text-gray-600">Información completa de la cita</p>
      </div>

      {updateError && (
        <ErrorBanner message={updateError} className="mb-6" />
      )}

      <Card>
        <CardContent className="p-6">
          <CitaDetalleView
            cita={cita}
            servicios={servicios}
            actions={
              <>
                <Link
                  to={`/admin/citas/${cita.id}/editar`}
                  className="inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 border-2 border-primary text-primary hover:bg-primary hover:text-white px-3 py-1.5 text-sm"
                >
                  <Pencil size={16} className="mr-2" />
                  Editar
                </Link>

                {puedeActualizar && (
                  <Button
                    size="sm"
                    variant="secondary"
                    data-testid={`btn-completar-${cita.id}`}
                    onClick={() => actualizarEstado('completada')}
                    disabled={updatingId === cita.id}
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Completar
                  </Button>
                )}

                {puedeActualizar && (
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
                )}
              </>
            }
          />
        </CardContent>
      </Card>
    </PageShell>
  );
}
