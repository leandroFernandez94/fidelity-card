import { createClient } from '@supabase/supabase-js';
const url = 'https://ofnyrmgbrdrjvrlbpzux.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mbnlybWdicmRyanZybGJwenV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDQzMjYsImV4cCI6MjA4NjM4MDMyNn0.1AD-t-QEy7X8RQ468hDMY3BJR5iajmQ6MJxkhVJeCws';

const client = createClient(url, key);

console.log('🔍 Investigando base de datos...\n');

// Verificar trigger
client.rpc('exec_sql', { sql: "SELECT trigger_name, event_object_table, action_statement::text FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created'" })
  .then(data => console.log('Trigger:', JSON.stringify(data.data, null, 2)))
  .catch(err => console.error('❌ Error trigger:', err.message));

// Insertar premios faltantes
console.log('\n📦 Insertando premios de ejemplo...');

Promise.all([
  client.from('premios').insert({ nombre: 'Manicura Gratis', descripcion: 'Canjea una manicura gel gratis', puntos_requeridos: 100, activo: true }),
  client.from('premios').insert({ nombre: 'Pedicura Spa Gratis', descripcion: 'Canjea una pedicura spa gratis', puntos_requeridos: 80, activo: true }),
  client.from('premios').insert({ nombre: 'Nails Art Gratis', descripcion: 'Canjea un diseño de nails art gratis', puntos_requeridos: 60, activo: true }),
  client.from('premios').insert({ nombre: '20% Descuento', descripcion: 'Descuento del 20% en cualquier servicio', puntos_requeridos: 50, activo: true }),
  client.from('premios').insert({ nombre: 'Manicura + Pedicura', descripcion: 'Canjea un combo completo', puntos_requeridos: 150, activo: true })
]).then(() => console.log('✅ Premios insertados correctamente'))
  .catch(err => console.error('❌ Error insertando premios:', err.message));

// Verificar profiles después
setTimeout(() => {
  client.from('profiles').select('id, email, rol, nombre').limit(5)
    .then(data => console.log('Profiles actuales:', JSON.stringify(data.data, null, 2)))
    .catch(err => console.error('Error profiles:', err.message));
}, 2000);
