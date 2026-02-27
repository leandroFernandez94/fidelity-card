import { supabase } from '../services/supabase';
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';

export default function TestSupabase() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    async function testConnection() {
      try {
        console.log('🔍 Probando conexión a Supabase...');
        console.log('🔗 URL:', import.meta.env.VITE_SUPABASE_URL);
        console.log('🔑 Key exists:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Sí' : 'No');
        
        setStatus('loading');
        setMessage('Conectando a Supabase...');

        const { data, error } = await supabase
          .from('servicios')
          .select('*')
          .limit(1);

        if (error) {
          console.error('❌ Error de Supabase:', error);
          setStatus('error');
          setMessage(`Error: ${error.message}`);
          
          if (error.code === 'PGRST116') {
            setMessage('Error de conexión. Verifica que la URL es correcta.');
          } else if (error.code === 'PGRST301') {
            setMessage('Error de API Key. Verifica que la key sea correcta.');
          } else {
            setMessage(`Error ${error.code}: ${error.message}`);
          }
          return;
        }

        console.log('✅ Conexión exitosa!', data);
        setStatus('success');
        setMessage('¡Conexión exitosa! La base de datos está funcionando.');
        setServices(data || []);
      } catch (err) {
        console.error('❌ Error no controlado:', err);
        setStatus('error');
        setMessage(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      }
    }

    testConnection();
  }, []);

  const urlConfigured = !!import.meta.env.VITE_SUPABASE_URL;
  const keyConfigured = !!import.meta.env.VITE_SUPABASE_ANON_KEY;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Database className="text-primary" size={32} />
            Prueba de Conexión Supabase
          </h1>
          <p className="text-gray-600">
            Verifica que las credenciales estén configuradas correctamente
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del archivo .env</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {urlConfigured ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : (
                    <XCircle className="text-red-600" size={20} />
                  )}
                  <div>
                    <div className="font-medium">VITE_SUPABASE_URL</div>
                    <div className="text-sm text-gray-500">
                      {urlConfigured 
                        ? '✅ Configurada' 
                        : '❌ No configurada (revisa el archivo .env)'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {keyConfigured ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : (
                    <XCircle className="text-red-600" size={20} />
                  )}
                  <div>
                    <div className="font-medium">VITE_SUPABASE_ANON_KEY</div>
                    <div className="text-sm text-gray-500">
                      {keyConfigured 
                        ? '✅ Configurada' 
                        : '❌ No configurada (revisa el archivo .env)'}
                    </div>
                  </div>
                </div>

                {urlConfigured && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium mb-1">URL configurada:</div>
                    <code className="text-xs break-all bg-white p-2 rounded block">
                      {import.meta.env.VITE_SUPABASE_URL}
                    </code>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado de Conexión</CardTitle>
            </CardHeader>
            <CardContent>
              {status === 'loading' && (
                <div className="flex items-center gap-3 text-blue-600">
                  <Loader2 className="animate-spin" size={24} />
                  <span className="font-medium">Probando conexión...</span>
                </div>
              )}

              {status === 'success' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-green-600">
                    <CheckCircle size={24} />
                    <span className="font-medium text-lg">{message}</span>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="font-medium mb-2">✅ Servicios encontrados: {services.length}</div>
                    {services.length > 0 && (
                      <ul className="space-y-1 text-sm">
                        {services.slice(0, 3).map((s: any) => (
                          <li key={s.id} className="text-gray-700">
                            • {s.nombre} ({s.puntos_otorgados} pts)
                          </li>
                        ))}
                        {services.length > 3 && (
                          <li className="text-gray-500">...y {services.length - 3} más</li>
                        )}
                      </ul>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium mb-2">🎉 ¡Configuración exitosa!</h4>
                    <p className="text-sm text-gray-700 mb-3">
                      Tu aplicación está conectada correctamente a Supabase. Ahora puedes:
                    </p>
                    <ul className="text-sm space-y-1 text-gray-700">
                      <li>✓ Ejecutar el script SQL completo en Supabase</li>
                      <li>✓ Crear tu usuario admin</li>
                      <li>✓ Empezar a usar la aplicación</li>
                    </ul>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-red-600">
                    <XCircle size={24} />
                    <span className="font-medium text-lg">Error de conexión</span>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="font-medium mb-2">{message}</div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium mb-2 text-yellow-800">🔍 Soluciones posibles:</h4>
                    <ul className="text-sm space-y-2 text-gray-700">
                      <li>
                        <strong>1. Verifica la URL:</strong>
                        <code className="block mt-1 text-xs bg-white p-2 rounded">
                          https://[project-id].supabase.co
                        </code>
                      </li>
                      <li>
                        <strong>2. Verifica la API Key:</strong>
                        <p className="text-xs text-gray-500 mt-1">
                          Asegúrate de copiar TODA la key (empieza con eyJhbG...)
                        </p>
                      </li>
                      <li>
                        <strong>3. Reinicia el servidor:</strong>
                        <code className="block mt-1 text-xs bg-white p-2 rounded">
                          Ctrl+C para detener, luego npm run dev
                        </code>
                      </li>
                      <li>
                        <strong>4. Ejecuta el script SQL:</strong>
                        <p className="text-xs text-gray-500 mt-1">
                          Ve a Supabase → SQL Editor y ejecuta supabase-setup.sql
                        </p>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center">
            <a
              href="/"
              className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-light transition-colors"
            >
              Volver al Inicio
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
