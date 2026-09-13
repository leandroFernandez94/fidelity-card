import { useEffect, useMemo, useRef, useState } from 'react';
import type { Profile } from '@fidelity-card/shared';
import { Search, User, X, ChevronDown } from 'lucide-react';
import { Button } from './Button';
import { cn, normalizarTexto } from '../utils';

const DESKTOP_MEDIA_QUERY = '(min-width: 768px)';
const DEBOUNCE_MS = 300;

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia(DESKTOP_MEDIA_QUERY).matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isDesktop;
}

function nombreCompleto(clienta: Profile) {
  return `${clienta.nombre} ${clienta.apellido}`;
}

interface ClientaSelectProps {
  clientas: Profile[];
  value: string;
  onChange: (clientaId: string) => void;
  id?: string;
  label?: string;
  error?: string | null;
  placeholder?: string;
  disabled?: boolean;
}

export default function ClientaSelect({
  clientas,
  value,
  onChange,
  id,
  label,
  error,
  placeholder = 'Buscar clienta por nombre...',
  disabled
}: ClientaSelectProps) {
  const isDesktop = useIsDesktop();
  const containerRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');

  const selectedClienta = useMemo(
    () => clientas.find((clienta) => clienta.id === value),
    [clientas, value]
  );

  const filteredClientas = useMemo(() => {
    const term = normalizarTexto(appliedQuery);
    if (!term) return clientas;
    return clientas.filter((clienta) =>
      normalizarTexto(nombreCompleto(clienta)).includes(term)
    );
  }, [clientas, appliedQuery]);

  // Desktop: filtra automaticamente tras un breve periodo sin tipear
  useEffect(() => {
    if (!isDesktop || !open) return;
    const timer = setTimeout(() => setAppliedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, isDesktop, open]);

  // Cierra el panel al hacer click fuera del componente
  useEffect(() => {
    if (!open) return;
    function handleMouseDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
        setAppliedQuery('');
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  function openPanel() {
    setQuery('');
    setAppliedQuery('');
    setOpen(true);
  }

  function closePanel() {
    setOpen(false);
    setQuery('');
    setAppliedQuery('');
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
    setOpen(true);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      // Evita que Enter envie el formulario anfitrion; en mobile aplica el filtro
      event.preventDefault();
      if (!isDesktop) {
        setAppliedQuery(query);
      }
    }
    if (event.key === 'Escape') {
      closePanel();
    }
  }

  function handleSelect(clienta: Profile) {
    onChange(clienta.id);
    closePanel();
  }

  function handleClear() {
    onChange('');
    setQuery('');
    setAppliedQuery('');
  }

  function handleBuscarClick() {
    setOpen(true);
    setAppliedQuery(query);
  }

  const listId = id ? `${id}-listbox` : 'clienta-listbox';
  const showClear = !!selectedClienta && !open && !disabled;
  const inputValue = open
    ? query
    : selectedClienta
      ? nombreCompleto(selectedClienta)
      : '';

  return (
    <div ref={containerRef} className="relative w-full" data-testid="clienta-select">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          <input
            id={id}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            autoComplete="off"
            enterKeyHint="search"
            value={inputValue}
            placeholder={selectedClienta && !open ? nombreCompleto(selectedClienta) : placeholder}
            onFocus={openPanel}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={cn(
              'w-full px-4 py-2 border rounded-lg pl-12',
              'focus:ring-2 focus:ring-primary focus:border-transparent',
              'disabled:bg-gray-100 disabled:cursor-not-allowed',
              showClear ? 'pr-16' : 'pr-10',
              error ? 'border-red-500' : 'border-gray-300'
            )}
          />
          {showClear && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Quitar selección"
              className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={() => (open ? closePanel() : openPanel())}
            aria-label={open ? 'Cerrar listado' : 'Abrir listado'}
            tabIndex={-1}
            disabled={disabled}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
          >
            <ChevronDown size={18} className={cn('transition-transform', open && 'rotate-180')} />
          </button>
        </div>
        {/* Mobile: el filtro se aplica con este boton, no al tipear */}
        <Button
          type="button"
          variant="outline"
          className="md:hidden shrink-0"
          onClick={handleBuscarClick}
          disabled={disabled}
        >
          Buscar
        </Button>
      </div>
      {open && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <ul id={listId} role="listbox" className="max-h-64 overflow-y-auto py-1">
            {filteredClientas.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-500">
                {appliedQuery ? 'No se encontraron clientas' : 'No hay clientas disponibles'}
              </li>
            ) : (
              filteredClientas.map((clienta) => {
                const isSelected = clienta.id === value;
                return (
                  <li key={clienta.id} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      data-testid={`clienta-option-${clienta.id}`}
                      onClick={() => handleSelect(clienta)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        isSelected ? 'bg-primary/10' : 'hover:bg-gray-50'
                      )}
                    >
                      <User size={16} className={isSelected ? 'text-primary' : 'text-gray-400 shrink-0'} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-gray-900 truncate">
                          {nombreCompleto(clienta)}
                        </span>
                        <span className="block text-xs text-gray-500 truncate">
                          {clienta.email}
                        </span>
                      </span>
                      {isSelected && (
                        <span className="text-xs font-semibold text-primary shrink-0">Seleccionada</span>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
