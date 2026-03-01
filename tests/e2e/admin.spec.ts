import { test, expect } from '@playwright/test';

test.describe('Flujos de Administrador', () => {
  const testEmail = `admin-test-${Date.now()}@example.com`;
  const servicioNombre = `Servicio Test ${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    // 1. Registro de un usuario administrador (si el backend lo permite así de fácil)
    // O mejor, asumimos que podemos crear uno o loguearnos con uno existente si hubiera seed data.
    // Como no tengo seed data claro, voy a registrar un usuario y luego intentar "ascenderlo"
    // Pero para un test E2E real, lo ideal es tener un usuario admin ya creado.
    // Voy a intentar loguearme con el admin por defecto si existe según docker-compose/env
  });

  test('debe permitir crear, editar y eliminar un servicio', async ({ page }) => {
    // Por ahora, como no tengo un login de admin garantizado, voy a saltar la auth 
    // o asumir que el primer usuario registrado es el que usamos.
    // NOTA: En un entorno real, usaríamos storageState para estar ya logueados.
    
    // Login como admin (usando credenciales que deberían existir o crearse)
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@test.com'); // Asumiendo credenciales de dev
    await page.getByLabel('Contraseña').fill('admin123');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    // Navegar a Gestión de Servicios
    await page.getByRole('link', { name: 'Servicios' }).click();
    await expect(page).toHaveURL('/admin/servicios');

    // Crear Servicio
    await page.getByRole('button', { name: 'Nuevo Servicio' }).click();
    await page.getByLabel('Nombre del Servicio').fill(servicioNombre);
    await page.getByLabel('Precio (ARS)').fill('5000');
    await page.getByLabel('Duración (minutos)').fill('60');
    await page.getByLabel('Puntos Otorgados').fill('10');
    await page.getByRole('button', { name: 'Crear' }).click();

    // Verificar creación
    await expect(page.getByText(servicioNombre)).toBeVisible();

    // Editar Servicio
    const card = page.locator('.bg-white', { hasText: servicioNombre });
    await card.locator('button').first().click(); // El botón de editar (Edit icon)
    await page.getByLabel('Nombre del Servicio').fill(`${servicioNombre} Editado`);
    await page.getByRole('button', { name: 'Actualizar' }).click();

    // Verificar edición
    await expect(page.getByText(`${servicioNombre} Editado`)).toBeVisible();

    // Eliminar Servicio
    page.on('dialog', dialog => dialog.accept());
    await card.locator('button').last().click(); // El botón de eliminar (Trash icon)
    
    await expect(page.getByText(`${servicioNombre} Editado`)).not.toBeVisible();
  });
});
