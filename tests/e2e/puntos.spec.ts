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
    
    // Esperar a que el modal se cierre antes de intentar crear el siguiente
    await expect(page.getByRole('heading', { name: 'Nuevo Servicio' })).not.toBeVisible();
    
    // Crear Servicio que requiere puntos (Canjeable)
    await page.getByRole('button', { name: 'Nuevo Servicio' }).click();
    await page.getByLabel('Nombre del Servicio').fill(servicioManicura);
    await page.getByLabel('Precio (ARS)').fill('3000');
    await page.getByLabel('Duración (minutos)').fill('45');
    await page.getByLabel('Puntos Otorgados').fill('20');
    await page.getByLabel('Puntos Requeridos').fill('100'); // Cuesta 100 puntos
    await page.getByTestId('btn-crear-servicio').click();
    await expect(page.getByRole('heading', { name: 'Nuevo Servicio' })).not.toBeVisible();
    
    // Crear Servicio que requiere puntos (Canjeable)
    await page.getByRole('button', { name: 'Nuevo Servicio' }).click();
    await page.getByLabel('Nombre del Servicio').fill(servicioManicura);
    await page.getByLabel('Precio (ARS)').fill('3000');
    await page.getByLabel('Duración (minutos)').fill('45');
    await page.getByLabel('Puntos Otorgados').fill('20');
    await page.getByLabel('Puntos Requeridos').fill('100'); // Cuesta 100 puntos
    await page.getByRole('button', { name: 'Crear' }).click();

    // 2. Ir a Citas y crear una nueva cita
    await page.getByRole('link', { name: 'Citas' }).click();
    await expect(page).toHaveURL('/admin/citas');
    await page.getByRole('button', { name: 'Nueva Cita' }).click();
    
    // Seleccionar clienta (asumimos que existe una o usamos la primera)
    await page.getByLabel('Clienta').selectOption({ index: 1 });
    
    // Seleccionar servicios
    const modal = page.locator('.fixed.inset-0').filter({ has: page.getByRole('heading', { name: 'Nueva Cita' }) });
    
    // Esperar a que la lista de servicios esté presente
    const container = modal.getByTestId('servicios-list');
    await expect(container).toBeVisible();

    // Interactuar usando el nombre del servicio como parte del data-testid
    const checkCorte = container.getByTestId(`check-${servicioCorte}`);
    await checkCorte.scrollIntoViewIfNeeded();
    await checkCorte.click({ force: true });
    
    const checkManicura = container.getByTestId(`check-${servicioManicura}`);
    await checkManicura.scrollIntoViewIfNeeded();
    await checkManicura.click({ force: true });
    
    // El segundo servicio lo marcamos como 'Canjeado'
    const itemManicura = container.getByTestId(`servicio-item-${servicioManicura}`);
    const btnCanjeado = itemManicura.getByTestId('btn-canjeado');
    
    // Debug: ver si el botón existe
    const isCanjeable = await btnCanjeado.count() > 0;
    if (!isCanjeable) {
      console.log('ERROR: El servicio no es canjeable en el DOM, revisando puntos_requeridos');
      const text = await itemManicura.innerText();
      console.log('Content:', text);
    }

    await btnCanjeado.click({ force: true });

    // Verificar resumen de puntos en el modal
    await expect(page.getByText('Puntos a descontar (canjes): -100 pts')).toBeVisible();
    await expect(page.getByText('Puntos a ganar (compras): +50 pts')).toBeVisible();

    // Completar creación
    await page.getByRole('button', { name: 'Crear Cita' }).click();
    
    // Verificar que la cita aparece en la lista
    // En la lista de citas, el servicio aparece como texto plano, no necesariamente con data-testid
    await expect(page.locator('div').filter({ hasText: servicioCorte }).first()).toBeVisible();
    await expect(page.getByText('2 servicios')).toBeVisible();
  });

  test('debe validar si la clienta no tiene suficientes puntos', async ({ page }) => {
    // 1. Ir a Citas
    await page.getByRole('link', { name: 'Citas' }).click();
    await expect(page).toHaveURL('/admin/citas');
    await page.getByRole('button', { name: 'Nueva Cita' }).click();
    
    // Seleccionar una clienta
    await page.getByLabel('Clienta').selectOption({ index: 1 });
    
    // Vamos a crear el servicio canjeable aquí también para asegurar independencia
    await page.goto('/admin/servicios');
    const serviceName = `Canje-Error-${Date.now()}`;
    await page.getByRole('button', { name: 'Nuevo Servicio' }).click();
    await page.getByLabel('Nombre del Servicio').fill(serviceName);
    await page.getByLabel('Precio (ARS)').fill('1000');
    await page.getByLabel('Duración (minutos)').fill('10');
    await page.getByLabel('Puntos Requeridos').fill('999999'); // Imposible de tener
    await page.getByTestId('btn-crear-servicio').click();
    await expect(page.getByRole('heading', { name: 'Nuevo Servicio' })).not.toBeVisible();

    await page.goto('/admin/citas');
    await page.getByRole('button', { name: 'Nueva Cita' }).click();
    await page.getByLabel('Clienta').selectOption({ index: 1 });
    
    const modalError = page.locator('.fixed.inset-0').filter({ has: page.getByRole('heading', { name: 'Nueva Cita' }) });
    const containerError = modalError.getByTestId('servicios-list');
    await expect(containerError).toBeVisible();

    const checkError = containerError.getByTestId(`check-${serviceName}`);
    await checkError.click({ force: true });
    
    const itemError = containerError.getByTestId(`servicio-item-${serviceName}`);
    await itemError.getByTestId('btn-canjeado').click({ force: true });

    await page.getByRole('button', { name: 'Crear Cita' }).click();
    await expect(page.getByText('La clienta no tiene suficientes puntos para este canje.')).toBeVisible();
  });
});
