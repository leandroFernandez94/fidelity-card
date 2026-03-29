import { test, expect } from '@playwright/test';

test.describe('Autenticación', () => {
  const baseURL = 'http://localhost:5173';
  const testEmail = `test-${Date.now()}@example.com`;

  test('debe registrar un nuevo usuario exitosamente', async ({ page }) => {
    await page.goto(`${baseURL}/register`);
    
    await page.getByLabel('Nombre').fill('Test');
    await page.getByLabel('Apellido').fill('User');
    await page.getByLabel('Teléfono').fill('1122334455');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Contraseña').fill('password123');
    
    await page.getByRole('button', { name: 'Crear Cuenta' }).click();

    // Después del registro exitoso, debería redirigir al Home y luego a /citas
    await expect(page).toHaveURL(new RegExp(`${baseURL}/citas`));
    
    // Validar que el Navbar esté presente y contenga elementos de usuario
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Mis Citas' })).toBeVisible();

    // Validar navegación a Referidos
    await page.getByRole('link', { name: 'Referidos' }).click();
    await expect(page).toHaveURL(new RegExp(`${baseURL}/referidos`));
    await expect(page.getByRole('heading', { name: 'Referir Amigas 🎁' })).toBeVisible();
    
    // Probar copiar enlace (mockeando clipboard si es necesario, pero validando el mensaje)
    await page.getByRole('button', { name: 'Copiar Enlace' }).click();
    await expect(page.getByText('¡Enlace copiado al portapapeles!')).toBeVisible();
  });

  test('debe mostrar error con credenciales inválidas en login', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    
    await page.getByLabel('Email').fill('usuario@inexistente.com');
    await page.getByLabel('Contraseña').fill('password123');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    await expect(page.getByText('Credenciales inválidas')).toBeVisible();
  });

  test('debe permitir navegar a la página de registro', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.getByRole('link', { name: 'Regístrate' }).click();
    
    await expect(page).toHaveURL(new RegExp(`${baseURL}/register`));
    await expect(page.getByRole('heading', { name: 'Crear Cuenta' })).toBeVisible();
  });
});