import { useState, useEffect } from 'react';
import { premiosService } from '../services/premios';
import type { Premio } from '../types';
import { Card, CardContent } from '../components/Card';
import { Gift, Star, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Premios() {
  const [premios, setPremios] = useState<Premio[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    async function loadPremios() {
      try {
        const data = await premiosService.getAll();
        // Solo mostrar premios activos para las clientas
        setPremios(data.filter(p => p.activo));
      } catch (error) {
        console.error('Error al cargar premios:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPremios();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const puntosUsuario = profile?.puntos ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Canjea tus Puntos 🎁
          </h1>
          <p className="text-gray-600 mb-4">
            Usa tus puntos acumulados para obtener beneficios exclusivos
          </p>
          <div className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full font-bold shadow-md">
            <Star size={20} className="fill-white" />
            <span>Tienes {puntosUsuario} puntos disponibles</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {premios.map((premio) => {
            const puedeCanjear = puntosUsuario >= premio.puntos_requeridos;
            
            return (
              <Card key={premio.id} className={`hover:shadow-lg transition-shadow relative overflow-hidden ${!puedeCanjear ? 'opacity-80' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {premio.nombre}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {premio.descripcion || 'Sin descripción'}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${puedeCanjear ? 'bg-primary/10' : 'bg-gray-100'}`}>
                      <Gift className={`w-6 h-6 ${puedeCanjear ? 'text-primary' : 'text-gray-400'}`} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <Star size={20} className="text-accent fill-accent" />
                      <span className="text-xl font-bold text-accent">
                        {premio.puntos_requeridos} pts
                      </span>
                    </div>
                    
                    {!puedeCanjear && (
                      <div className="text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded">
                        Te faltan {premio.puntos_requeridos - puntosUsuario} pts
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 flex items-center gap-1 italic">
                      <Info size={12} /> Solicita tu canje al momento de tu cita
                    </p>
                  </div>
                </CardContent>
                
                {!puedeCanjear && (
                  <div className="absolute top-0 right-0 p-2">
                    <div className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Bloqueado
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

          {premios.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">
                No hay premios disponibles en este momento
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
