import { useState, useEffect, useCallback } from 'react';

export interface UseAdminListConfig<T, TForm> {
  fetchFn: () => Promise<T[]>;
  filterFn: (items: T[], search: string) => T[];
  createFn: (data: TForm) => Promise<void>;
  updateFn: (id: string, data: TForm) => Promise<void>;
  deleteFn: (id: string) => Promise<void>;
  initialFormData: TForm;
  mapItemToForm: (item: T) => TForm;
  itemName: string;
}

export function useAdminList<T extends { id: string }, TForm>(
  config: UseAdminListConfig<T, TForm>
) {
  const {
    fetchFn,
    filterFn,
    createFn,
    updateFn,
    deleteFn,
    initialFormData,
    mapItemToForm,
    itemName,
  } = config;

  const [items, setItems] = useState<T[]>([]);
  const [filteredItems, setFilteredItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [formData, setFormData] = useState<TForm>(initialFormData);

  useEffect(() => {
    async function loadItems() {
      try {
        const data = await fetchFn();
        setItems(data);
        setFilteredItems(data);
      } catch (error) {
        console.error(`Error al cargar ${itemName}:`, error);
      } finally {
        setLoading(false);
      }
    }
    loadItems();
  }, [fetchFn, itemName]);

  useEffect(() => {
    const filtered = filterFn(items, searchTerm);
    setFilteredItems(filtered);
  }, [searchTerm, items, filterFn]);

  const refreshItems = useCallback(async () => {
    const data = await fetchFn();
    setItems(data);
    setFilteredItems(data);
  }, [fetchFn]);

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchTerm(e.target.value);
  }

  function openModal(item?: T) {
    if (item) {
      setEditingItem(item);
      setFormData(mapItemToForm(item));
    } else {
      setEditingItem(null);
      setFormData(initialFormData);
    }
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSubmitting(false);
    setModalError(null);
    setEditingItem(null);
    setFormData(initialFormData);
  }

  async function handleSubmit(
    e: React.FormEvent,
    transformData: (data: TForm) => TForm
  ) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setModalError(null);

    try {
      const transformedData = transformData(formData);

      if (editingItem) {
        await updateFn(editingItem.id, transformedData);
      } else {
        await createFn(transformedData);
      }

      await refreshItems();
      closeModal();
    } catch (error: unknown) {
      console.error(`Error al guardar ${itemName}:`, error);
      const message =
        error instanceof Error ? error.message : `No se pudo guardar el ${itemName}.`;
      setModalError(`Error: ${message}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(`¿Estás segura de que deseas eliminar este ${itemName}?`)) return;

    try {
      await deleteFn(id);
      await refreshItems();
    } catch (error) {
      console.error(`Error al eliminar ${itemName}:`, error);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { id, name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id || name]: value,
    }));
  }

  function handleCheckboxChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { id, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: checked,
    }));
  }

  return {
    items: filteredItems,
    loading,
    searchTerm,
    modalOpen,
    submitting,
    modalError,
    editingItem,
    formData,
    setFormData,
    handleSearch,
    openModal,
    closeModal,
    handleSubmit,
    handleDelete,
    handleChange,
    handleCheckboxChange,
    refreshItems,
  };
}
