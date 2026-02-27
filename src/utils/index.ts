import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatearFecha(fecha: string | Date): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

export function formatearHora(fecha: string | Date): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function formatearPrecio(precio: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(precio);
}

export function esFechaPasada(fecha: string | Date): boolean {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return date < new Date();
}

export function getEstadoCitaColor(estado: string): string {
  switch (estado) {
    case 'pendiente':
      return 'text-yellow-600 bg-yellow-100';
    case 'confirmada':
      return 'text-green-600 bg-green-100';
    case 'completada':
      return 'text-blue-600 bg-blue-100';
    case 'cancelada':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}
