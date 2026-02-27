import { useState, useEffect } from 'react';
import { serviciosService } from '../services/servicios';
import type { Servicio } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { formatearPrecio } from '../utils';
import { Gem, Clock, Star } from 'lucide-react';

export default function Servicios() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadServicios() {
      try {
        const data = await serviciosService.getAll();
        setServicios(data);
      } catch (error) {
        console.error('Error al cargar servicios:', error);
      } finally {
        setLoading(false);
      }
    }
    loadServicios();
  }, []);

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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nuestros Servicios 💅
          </h1>
          <p className="text-gray-600">
            Descubre todos nuestros servicios y gana puntos por cada visita
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicios.map((servicio) => (
            <Card key={servicio.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {servicio.nombre}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {servicio.descripcion || 'Sin descripción'}
                    </p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Gem className="w-6 h-6 text-primary" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>{servicio.duracion_min} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={16} className="text-accent fill-accent" />
                    <span className="font-semibold text-accent">
                      +{servicio.puntos_otorgados} pts
                    </span>
                  </div>
                </div>

                <div className="text-2xl font-bold text-primary">
                  {formatearPrecio(servicio.precio)}
                </div>
              </CardContent>
            </Card>
          ))}

          {servicios.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">
                No hay servicios disponibles en este momento
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
