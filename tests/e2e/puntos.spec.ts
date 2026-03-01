import { test, expect } from '@playwright/test';

test.describe('Puntos y Canje de Servicios', () => {
  const adminEmail = 'admin@test.com';
  const adminPassword = 'admin123';
  const servicioCorte = `Corte Test ${Date.now()}`;
  const servicioManicura = `Manicura Test ${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    // Login como Admin
    await page.goto('/login');
    await page.getByLabel('Email').fill(adminEmail);
    await page.getByLabel('Contraseña').fill(adminPassword);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    
    // Navegar a Gestión de Servicios (como hace admin.spec.ts)
    await page.getByRole('link', { name: 'Servicios' }).click();
    await expect(page).toHaveURL('/admin/servicios');
  });

  test('debe permitir crear una cita con servicios comprados y canjeados', async ({ page }) => {
    // 1. Asegurar que existan servicios con puntos configurados
    // Ya estamos en /admin/servicios por el beforeEach
    
    // Crear Servicio que otorga puntos
    await page.getByRole('button', { name: 'Nuevo Servicio' }).click();
    await page.getByLabel('Nombre del Servicio').fill(servicioCorte);
    await page.getByLabel('Precio (ARS)').fill('5000');
    await page.getByLabel('Duración (minutos)').fill('30');
    await page.getByLabel('Puntos Otorgados').fill('50');
    await page.getByTestId('btn-crear-servicio').click();
    
    // Esperar a que el modal se cierre y el servicio aparezca en la lista
    await expect(page.getByRole('heading', { name: 'Nuevo Servicio' })).not.toBeVisible();

    // Crear Servicio que requiere puntos (Canjeable)
    await page.getByRole('button', { name: 'Nuevo Servicio' }).click();
    await page.getByLabel('Nombre del Servicio').fill(servicioManicura);
    await page.getByLabel('Precio (ARS)').fill('3000');
    await page.getByLabel('Duración (minutos)').fill('45');
    await page.getByLabel('Puntos Otorgados').fill('20');
    await page.getByLabel('Puntos Requeridos').fill('10'); // Puntos bajos para que la clienta alcance
    await page.getByTestId('btn-crear-servicio').click();
    await expect(page.getByRole('heading', { name: 'Nuevo Servicio' })).not.toBeVisible();
    
    // 2. Ir a Citas y crear una nueva cita
    await page.getByRole('link', { name: 'Citas' }).click();
    await expect(page).toHaveURL('/admin/citas');
    
    // Recargar para limpiar cualquier estado
    await page.reload();
    
    await page.getByRole('button', { name: 'Nueva Cita' }).click();
    
    // Seleccionar clienta (asumimos que existe una o usamos la primera)
    await page.getByLabel('Clienta').selectOption({ index: 1 });
    
    // Esperar a que los puntos se carguen
    await page.waitForTimeout(1000);

    // Seleccionar servicios
    const modal = page.locator('.fixed.inset-0').filter({ has: page.getByRole('heading', { name: 'Nueva Cita' }) });
    
    // Esperar a que la lista de servicios esté presente
    const container = modal.getByTestId('servicios-list');
    await expect(container).toBeVisible();

    // Interactuar usando el nombre del servicio como parte del data-testid
    const checkCorte = container.getByTestId(`check-${servicioCorte}`);
    await checkCorte.scrollIntoViewIfNeeded();
    await checkCorte.click({ force: true });
    
    // Completar creación de la primera cita para ganar puntos
    await page.getByRole('button', { name: 'Crear Cita' }).click();
    await expect(modal).not.toBeVisible();
    
    // Completar la cita para que los puntos se sumen
    await page.getByRole('button', { name: 'Completar' }).first().click();
    // Esperar a que el texto "Completada" aparezca en un badge
    await expect(page.locator('span').filter({ hasText: /^Completada$/ }).first()).toBeVisible({ timeout: 10000 });
    
    // Recargar para asegurar que los puntos se reflejen
    await page.reload();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL('/admin/citas');

    // Ahora crear la segunda cita usando esos puntos
    await page.getByRole('button', { name: 'Nueva Cita' }).click();
    await page.getByLabel('Clienta').selectOption({ index: 1 });
    // Esperar a que los puntos se carguen y el botón de canje se habilite
    await page.waitForTimeout(3000);
    
    // Volver a obtener el container del nuevo modal
    const modal2 = page.locator('.fixed.inset-0').filter({ has: page.getByRole('heading', { name: 'Nueva Cita' }) });
    const container2 = modal2.getByTestId('servicios-list');
    
    const checkManicura = container2.getByTestId(`check-${servicioManicura}`);
    await checkManicura.scrollIntoViewIfNeeded();
    await checkManicura.click({ force: true });
    
    // El segundo servicio lo marcamos como 'Canjeado'
    const itemManicura = container2.getByTestId(`servicio-item-${servicioManicura}`);
    const btnCanjeado = itemManicura.getByTestId('btn-canjeado');
    
    // Intentar clickear el botón de canjeado, esperando a que no esté disabled
    await expect(btnCanjeado).toBeEnabled({ timeout: 10000 });
    await btnCanjeado.click();
    
    // Verificar que el botón de canjeado esté activo (clase bg-accent)
    await expect(btnCanjeado).toHaveClass(/bg-accent/);

    // Pequeña espera para que el resumen se actualice
    await page.waitForTimeout(1000);

    // Verificar resumen de puntos en el modal
    await expect(page.getByTestId('puntos-descontar')).toHaveText(/-10 pts/);
    await expect(page.getByTestId('puntos-ganar')).toHaveText(/\+0 pts/);

    // Completar creación
    await page.getByRole('button', { name: 'Crear Cita' }).click();
    
    // Verificar que el modal se cierra
    await expect(modal2).not.toBeVisible();
    
    // Recargar para limpiar estado
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Buscar en el texto de la página el servicio
    // El servicio está dentro de un card, pero no es visible el nombre directamente en el card (solo el conteo)
    // Así que verificamos que haya al menos una cita con el badge de canje
    await expect(page.getByText('-10 pts canjeados').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('cita-servicios-count').first()).toHaveText(/1 servicio/);
  });

  test('debe validar si la clienta no tiene suficientes puntos', async ({ page }) => {
    // 1. Ir a Citas
    await page.getByRole('link', { name: 'Citas' }).click();
    await expect(page).toHaveURL('/admin/citas');
    
    // Ir a servicios para crear un servicio caro
    await page.getByRole('link', { name: 'Servicios' }).click();
    const serviceName = `Canje-Error-${Date.now()}`;
    await page.getByRole('button', { name: 'Nuevo Servicio' }).click();
    await page.getByLabel('Nombre del Servicio').fill(serviceName);
    await page.getByLabel('Precio (ARS)').fill('1000');
    await page.getByLabel('Duración (minutos)').fill('10');
    await page.getByLabel('Puntos Otorgados').fill('15');
    await page.getByLabel('Puntos Requeridos').fill('999999'); // Imposible de tener
    
    // Capturar creación
    await page.getByTestId('btn-crear-servicio').click();
    
    // Esperar a que el modal desaparezca (en Servicios.tsx el modal se cierra al terminar handleSubmit)
    await expect(page.getByRole('heading', { name: 'Nuevo Servicio' })).not.toBeVisible({ timeout: 10000 });
    
    await page.getByRole('link', { name: 'Citas' }).click();
    await page.reload(); // Recargar para ver el nuevo servicio
    await page.getByRole('button', { name: 'Nueva Cita' }).click();
    // Seleccionar clienta (usamos la que ya tiene puntos de la prueba anterior)
    await page.getByLabel('Clienta').selectOption({ index: 1 });
    
    // Esperar a que los puntos se carguen (pueden venir de un efecto secundario)
    await page.waitForTimeout(2000);
    
    const modalError = page.locator('.fixed.inset-0').filter({ has: page.getByRole('heading', { name: 'Nueva Cita' }) });
    const containerError = modalError.getByTestId('servicios-list');
    await expect(containerError).toBeVisible();

    const checkError = containerError.getByTestId(`check-${serviceName}`);
    await checkError.scrollIntoViewIfNeeded();
    await checkError.click({ force: true });
    
    const itemError = containerError.getByTestId(`servicio-item-${serviceName}`);
    const btnCanjeadoError = itemError.getByTestId('btn-canjeado');
    
    // Asegurarse de que el botón esté deshabilitado por falta de puntos
    await expect(btnCanjeadoError).toBeDisabled();
    
    // Cambiamos el test para verificar que el botón de canje está deshabilitado y tiene el tooltip correcto
    await expect(btnCanjeadoError).toHaveAttribute('title', 'Puntos insuficientes');
  });
});
