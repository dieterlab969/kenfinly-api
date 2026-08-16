import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';

export interface ManagedCategory {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  color: string;
  type: 'expense' | 'income';
  parent_id: number | null;
  user_id: number | null;
  is_system: boolean;
  children?: ManagedCategory[];
}
export interface CategoryForm {
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  customColor: string;
  parent_id: string;
}
export interface CategoryValidationErrors { [field: string]: string[] }
export interface CategoryPageMessage { type: 'success' | 'error'; text: string }
export type CategoryPageView = 'list' | 'add' | 'edit';
export type CategoryTypeFilter = 'all' | 'expense' | 'income';

export const EMPTY_CATEGORY_FORM: CategoryForm = {
  name: '', type: 'expense', icon: '📁', color: '#6B7280', customColor: '', parent_id: '',
};

export function isValidCategoryHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{3,8}$/.test(hex);
}

function flattenTree(tree: ManagedCategory[]): ManagedCategory[] {
  return tree.flatMap((category) => [category, ...flattenTree(category.children ?? [])]);
}

function sortTree(tree: ManagedCategory[], key: string): ManagedCategory[] {
  const sorted = [...tree];
  switch (key) {
    case 'name_asc': return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'name_desc': return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'type': return sorted.sort((a, b) => a.type.localeCompare(b.type));
    case 'system_first': return sorted.sort((a, b) => Number(b.is_system) - Number(a.is_system));
    default: return sorted;
  }
}

export function useCategoryManagement() {
  const { t } = useTranslation();
  const [tree, setTree] = useState<ManagedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('system_first');
  const [typeFilter, setTypeFilter] = useState<CategoryTypeFilter>('all');
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [view, setView] = useState<CategoryPageView>('list');
  const [pageMsg, setPageMsg] = useState<CategoryPageMessage | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY_CATEGORY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<CategoryValidationErrors>({});
  const [formGenError, setFormGenError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchCategories = useCallback(async (): Promise<void> => {
    setLoading(true); setErrorMsg('');
    try {
      const response = await api.get('/categories');
      setTree(response.data.categories ?? []);
    } catch {
      setErrorMsg(t('Unable to load categories. Please try again.'));
    } finally { setLoading(false); }
  }, [t]);

  useEffect(() => { void fetchCategories(); }, [fetchCategories]);

  const flat = useMemo(() => flattenTree(tree), [tree]);
  const topLevelOptions = useMemo(() => flat.filter((category) => category.parent_id === null), [flat]);
  const displayedTree = useMemo(() => {
    const query = search.trim().toLowerCase();
    let filtered = tree;
    if (typeFilter !== 'all') filtered = filtered.filter((category) => category.type === typeFilter);
    if (query) {
      filtered = filtered.filter((category) =>
        category.name.toLowerCase().includes(query) ||
        category.children?.some((child) => child.name.toLowerCase().includes(query)));
    }
    return sortTree(filtered, sortKey);
  }, [tree, search, typeFilter, sortKey]);

  const showPageMsg = useCallback((type: CategoryPageMessage['type'], text: string) => {
    setPageMsg({ type, text }); window.setTimeout(() => setPageMsg(null), 4000);
  }, []);
  const updateForm = useCallback((patch: Partial<CategoryForm>) => setForm((current) => ({ ...current, ...patch })), []);
  const goToList = useCallback(() => {
    setView('list'); setEditingId(null); setForm(EMPTY_CATEGORY_FORM);
    setFormErrors({}); setFormGenError(''); setConfirmDeleteId(null); setDeleteError('');
  }, []);
  const openAdd = useCallback(() => {
    setForm(EMPTY_CATEGORY_FORM); setFormErrors({}); setFormGenError('');
    setEditingId(null); setView('add');
  }, []);
  const openEdit = useCallback((category: ManagedCategory) => {
    setForm({
      name: category.name, type: category.type, icon: category.icon ?? '📁',
      color: category.color ?? '#6B7280', customColor: '',
      parent_id: category.parent_id ? String(category.parent_id) : '',
    });
    setFormErrors({}); setFormGenError(''); setEditingId(category.id); setView('edit');
  }, []);
  const toggleCollapse = useCallback((id: number) => setCollapsed((current) => {
    const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next;
  }), []);
  const effectiveColor = form.customColor && isValidCategoryHex(form.customColor) ? form.customColor : form.color;

  const save = useCallback(async (event: React.FormEvent, mode: 'create' | 'update') => {
    event.preventDefault(); setSaving(true); setFormErrors({}); setFormGenError('');
    const payload = {
      name: form.name, type: form.type, icon: form.icon, color: effectiveColor,
      parent_id: form.parent_id ? parseInt(form.parent_id, 10) : null,
    };
    try {
      if (mode === 'create') await api.post('/categories', payload);
      else if (editingId) await api.put(`/categories/${editingId}`, payload);
      showPageMsg('success', t(mode === 'create' ? '"{{name}}" created successfully.' : '"{{name}}" updated successfully.', { name: form.name }));
      goToList(); await fetchCategories();
    } catch (error: unknown) {
      const response = (error as { response?: { status?: number; data?: { errors?: CategoryValidationErrors; message?: string } } }).response;
      if (response?.status === 403) setFormGenError(t('You cannot edit a system category.'));
      else if (response?.data?.errors && Object.keys(response.data.errors).length) setFormErrors(response.data.errors);
      else setFormGenError(response?.data?.message ?? t('Something went wrong. Please try again.'));
    } finally { setSaving(false); }
  }, [editingId, effectiveColor, fetchCategories, form, goToList, showPageMsg, t]);
  const handleCreate = useCallback((event: React.FormEvent) => save(event, 'create'), [save]);
  const handleUpdate = useCallback((event: React.FormEvent) => {
    if (!editingId) return Promise.resolve(); return save(event, 'update');
  }, [editingId, save]);
  const handleDelete = useCallback(async (id: number) => {
    setDeleting(true); setDeleteError('');
    try {
      await api.delete(`/categories/${id}`); setConfirmDeleteId(null);
      await fetchCategories(); showPageMsg('success', t('Category deleted successfully.'));
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      setDeleteError(message ?? t('Could not delete this category.'));
    } finally { setDeleting(false); }
  }, [fetchCategories, showPageMsg, t]);

  return {
    t, tree, loading, errorMsg, search, setSearch, sortKey, setSortKey, typeFilter, setTypeFilter,
    collapsed, view, pageMsg, form, editingId, formErrors, formGenError, saving, confirmDeleteId,
    setConfirmDeleteId, deleting, deleteError, setDeleteError, flat, topLevelOptions, displayedTree, effectiveColor,
    fetchCategories, updateForm, goToList, openAdd, openEdit, toggleCollapse, handleCreate,
    handleUpdate, handleDelete,
  };
}