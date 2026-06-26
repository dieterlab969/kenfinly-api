import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import BackBtn from '../components/BackBtn';
import BackBtnIcon from '../assets/svg/backBtn.svg';
import SearchIcon from '../assets/svg/search-icon.svg';
import faqPlus from '../assets/svg/faq-plus.svg';
import purpleEditIcon from '../assets/svg/purple-edit-icon.svg';
import api from '../../utils/api';
import { useTranslation } from '../../contexts/TranslationContext';

// ─────────────────────────────────────────────────────────────────────────────
// Domain types
// ─────────────────────────────────────────────────────────────────────────────

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  color: string;
  type: 'expense' | 'income';
  parent_id: number | null;
  user_id: number | null;
  is_system: boolean;
  children?: Category[];
}

interface CategoryForm {
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  customColor: string;
  parent_id: string;
}

interface ApiValidationErrors {
  [field: string]: string[];
}

interface PageMessage {
  type: 'success' | 'error';
  text: string;
}

type PageView = 'list' | 'add' | 'edit';
type TypeFilter = 'all' | 'expense' | 'income';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ICON_PRESETS: string[] = [
  '🛒', '🍽️', '🍺', '🚗', '⛽', '🎉', '🏠', '👨‍👩‍👧',
  '❤️', '🐾', '📄', '💰', '💼', '💵', '👕', '🎯',
  '📱', '💻', '🎮', '📚', '✈️', '🏥', '🎵', '🛍️',
  '☕', '🍕', '🏋️', '💊', '🏖️', '🎓', '🌱', '🔧',
];

const COLOR_PRESETS: string[] = [
  '#60A5FA', '#EF4444', '#F97316', '#FBBF24',
  '#4ADE80', '#34D399', '#A78BFA', '#F472B6',
  '#EC4899', '#8B5CF6', '#14B8A6', '#06B6D4',
  '#3B82F6', '#6B7280', '#10B981', '#84CC16',
];

const SORT_OPTIONS: { value: string; labelKey: string }[] = [
  { value: 'system_first', labelKey: 'category_mgmt.sort.system_first' },
  { value: 'name_asc',     labelKey: 'category_mgmt.sort.name_asc' },
  { value: 'name_desc',    labelKey: 'category_mgmt.sort.name_desc' },
  { value: 'type',         labelKey: 'category_mgmt.sort.by_type' },
];

const EMPTY_FORM: CategoryForm = {
  name:        '',
  type:        'expense',
  icon:        '📁',
  color:       '#6B7280',
  customColor: '',
  parent_id:   '',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function flattenTree(tree: Category[]): Category[] {
  const result: Category[] = [];
  for (const cat of tree) {
    result.push(cat);
    if (cat.children?.length) result.push(...flattenTree(cat.children));
  }
  return result;
}

function sortTree(tree: Category[], key: string): Category[] {
  const arr = [...tree];
  switch (key) {
    case 'name_asc':     return arr.sort((a, b) => a.name.localeCompare(b.name));
    case 'name_desc':    return arr.sort((a, b) => b.name.localeCompare(a.name));
    case 'type':         return arr.sort((a, b) => a.type.localeCompare(b.type));
    case 'system_first': return arr.sort((a, b) => (b.is_system ? 1 : 0) - (a.is_system ? 1 : 0));
    default:             return arr;
  }
}

function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{3,8}$/.test(hex);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

const CategoryManagement: React.FC = () => {
  const { t } = useTranslation();
  // ── Data ────────────────────────────────────────────────────────────────────
  const [tree,     setTree]    = useState<Category[]>([]);
  const [loading,  setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // ── List UI ─────────────────────────────────────────────────────────────────
  const [search,     setSearch]     = useState<string>('');
  const [sortKey,    setSortKey]    = useState<string>('system_first');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [collapsed,  setCollapsed]  = useState<Set<number>>(new Set());

  // ── View / forms ────────────────────────────────────────────────────────────
  const [view,      setView]      = useState<PageView>('list');
  const [pageMsg,   setPageMsg]   = useState<PageMessage | null>(null);
  const [form,      setForm]      = useState<CategoryForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);

  // ── Form feedback ───────────────────────────────────────────────────────────
  const [formErrors,   setFormErrors]   = useState<ApiValidationErrors>({});
  const [formGenError, setFormGenError] = useState<string>('');
  const [saving,       setSaving]       = useState<boolean>(false);

  // ── Delete ──────────────────────────────────────────────────────────────────
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting,        setDeleting]        = useState<boolean>(false);
  const [deleteError,     setDeleteError]     = useState<string>('');

  // ─── Fetch ───────────────────────────────────────────────────────────────────

  const fetchCategories = useCallback(async (): Promise<void> => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/categories');
      setTree(res.data.categories ?? []);
    } catch {
      setErrorMsg(t('category_mgmt.error.load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchCategories(); }, [fetchCategories]);

  // ─── Derived data ─────────────────────────────────────────────────────────────

  const flat = useMemo<Category[]>(() => flattenTree(tree), [tree]);

  const topLevelOptions = useMemo<Category[]>(
    () => flat.filter((c) => c.parent_id === null),
    [flat],
  );

  const displayedTree = useMemo<Category[]>(() => {
    const q = search.trim().toLowerCase();
    let filtered = tree;
    if (typeFilter !== 'all') {
      filtered = filtered.filter((c) => c.type === typeFilter);
    }
    if (q) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.children?.some((ch) => ch.name.toLowerCase().includes(q)),
      );
    }
    return sortTree(filtered, sortKey);
  }, [tree, search, typeFilter, sortKey]);

  // ─── Navigation helpers ──────────────────────────────────────────────────────

  const showPageMsg = (type: PageMessage['type'], text: string): void => {
    setPageMsg({ type, text });
    setTimeout(() => setPageMsg(null), 4000);
  };

  const goToList = (): void => {
    setView('list');
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormGenError('');
    setConfirmDeleteId(null);
    setDeleteError('');
  };

  const openAdd = (): void => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormGenError('');
    setEditingId(null);
    setView('add');
  };

  const openEdit = (cat: Category): void => {
    setForm({
      name:        cat.name,
      type:        cat.type,
      icon:        cat.icon  ?? '📁',
      color:       cat.color ?? '#6B7280',
      customColor: '',
      parent_id:   cat.parent_id ? String(cat.parent_id) : '',
    });
    setFormErrors({});
    setFormGenError('');
    setEditingId(cat.id);
    setView('edit');
  };

  const toggleCollapse = (id: number): void =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // ─── CRUD handlers ────────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSaving(true);
    setFormErrors({});
    setFormGenError('');
    const resolvedColor = form.customColor && isValidHex(form.customColor)
      ? form.customColor : form.color;
    try {
      await api.post('/categories', {
        name:      form.name,
        type:      form.type,
        icon:      form.icon,
        color:     resolvedColor,
        parent_id: form.parent_id ? parseInt(form.parent_id, 10) : null,
      });
      showPageMsg('success', t('category_mgmt.success.created').replace('{{name}}', form.name));
      goToList();
      await fetchCategories();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { errors?: ApiValidationErrors; message?: string } } };
      const errs = ax.response?.data?.errors ?? {};
      if (Object.keys(errs).length > 0) {
        setFormErrors(errs);
      } else {
        setFormGenError(ax.response?.data?.message ?? t('category_mgmt.error.generic'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setFormErrors({});
    setFormGenError('');
    const resolvedColor = form.customColor && isValidHex(form.customColor)
      ? form.customColor : form.color;
    try {
      await api.put(`/categories/${editingId}`, {
        name:      form.name,
        type:      form.type,
        icon:      form.icon,
        color:     resolvedColor,
        parent_id: form.parent_id ? parseInt(form.parent_id, 10) : null,
      });
      showPageMsg('success', t('category_mgmt.success.updated').replace('{{name}}', form.name));
      goToList();
      await fetchCategories();
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { errors?: ApiValidationErrors; message?: string } } };
      if (ax.response?.status === 403) {
        setFormGenError(t('category_mgmt.error.system_edit'));
      } else {
        const errs = ax.response?.data?.errors ?? {};
        if (Object.keys(errs).length > 0) {
          setFormErrors(errs);
        } else {
          setFormGenError(ax.response?.data?.message ?? t('category_mgmt.error.generic'));
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/categories/${id}`);
      setConfirmDeleteId(null);
      await fetchCategories();
      showPageMsg('success', t('category_mgmt.success.deleted'));
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setDeleteError(ax.response?.data?.message ?? t('category_mgmt.error.delete'));
    } finally {
      setDeleting(false);
    }
  };

  // ─── Shared form atoms ────────────────────────────────────────────────────────

  const updateForm = (patch: Partial<CategoryForm>): void =>
    setForm((prev) => ({ ...prev, ...patch }));

  const effectiveColor = form.customColor && isValidHex(form.customColor)
    ? form.customColor
    : form.color;

  const iconPickerRow = (): React.ReactNode => (
    <div className="personal-name mb-3">
      <label style={{ color: 'var(--sub-text-color)', fontSize: 13 }}>{t('category_mgmt.form.icon_label')}</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        {ICON_PRESETS.map((ic) => (
          <button
            key={ic}
            type="button"
            onClick={() => updateForm({ icon: ic })}
            style={{
              width: 40, height: 40, borderRadius: 10,
              border: `1px solid ${form.icon === ic ? 'var(--primary-color, #6C3DE6)' : 'rgba(108,61,230,0.15)'}`,
              background: form.icon === ic ? 'rgba(108,61,230,0.12)' : 'var(--sub-bg-color)',
              fontSize: 20, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: form.icon === ic ? 'scale(1.12)' : 'scale(1)',
              transition: 'transform 0.12s',
            }}
            aria-label={ic}
          >
            {ic}
          </button>
        ))}
      </div>
    </div>
  );

  const colorPickerRow = (): React.ReactNode => (
    <div className="personal-name mb-3">
      <label style={{ color: 'var(--sub-text-color)', fontSize: 13 }}>{t('category_mgmt.form.color_label')}</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8, marginBottom: 10 }}>
        {COLOR_PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => updateForm({ color: c, customColor: '' })}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: c, border: 'none', cursor: 'pointer',
              outline: form.color === c && !form.customColor ? `3px solid ${c}` : 'none',
              outlineOffset: 2,
              transform: form.color === c && !form.customColor ? 'scale(1.15)' : 'scale(1)',
              transition: 'transform 0.12s',
            }}
            aria-label={c}
          />
        ))}
      </div>
      <input
        type="text"
        className="px-0"
        placeholder={t('category_mgmt.form.color_placeholder')}
        value={form.customColor}
        onChange={(e) => updateForm({ customColor: e.target.value })}
        style={{ maxWidth: 200, fontSize: 13 }}
      />
      {form.customColor && !isValidHex(form.customColor) && (
        <p style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>
          {t('category_mgmt.form.color_error')}
        </p>
      )}
    </div>
  );

  const previewChip = (): React.ReactNode => (
    <div
      className="transfer-first"
      style={{ marginBottom: 20, pointerEvents: 'none' }}
    >
      <div
        className="bank-img"
        style={{
          background: effectiveColor ? `${effectiveColor}22` : 'rgba(108,61,230,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, flexShrink: 0,
        }}
      >
        {form.icon}
      </div>
      <div className="bank-details" style={{ flex: 1, minWidth: 0 }}>
        <h2 style={{ marginBottom: 2 }}>{form.name || t('category_mgmt.form.name_label')}</h2>
        <div className="bank-card">
          <span
            style={{
              color: form.type === 'income' ? '#4ADE80' : '#F97316',
              fontSize: 12, fontWeight: 600,
              background: form.type === 'income' ? 'rgba(74,222,128,0.15)' : 'rgba(249,115,22,0.15)',
              padding: '1px 7px', borderRadius: 20,
            }}
          >
            {form.type === 'income' ? t('category_mgmt.badge.income') : t('category_mgmt.badge.expense')}
          </span>
        </div>
      </div>
      <div className="bank-active-sec">
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: effectiveColor }} />
      </div>
    </div>
  );

  const fieldError = (field: string): React.ReactNode =>
    formErrors[field] ? (
      <div className="invalid-feedback d-block" style={{ fontSize: 12 }}>
        {formErrors[field][0]}
      </div>
    ) : null;

  // ─────────────────────────────────────────────────────────────────────────────
  // Header title map (drives the top bar text for all views)
  // ─────────────────────────────────────────────────────────────────────────────

  const headerTitle: Record<PageView, string> = {
    list: t('category_mgmt.title'),
    add:  t('category_mgmt.new_category'),
    edit: t('category_mgmt.edit_category'),
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Category row (list view)
  // ─────────────────────────────────────────────────────────────────────────────

  const renderCategoryRow = (cat: Category, isChild = false): React.ReactNode => {
    const isConfirming = confirmDeleteId === cat.id;

    if (isConfirming) {
      return (
        <div key={cat.id}>
          <div
            className="transfer-first"
            style={{
              background: '#FEF2F2', flexWrap: 'wrap', gap: 8,
              paddingLeft: isChild ? 36 : undefined,
              borderLeft: isChild ? `3px solid ${cat.color || '#6B7280'}44` : undefined,
              marginLeft: isChild ? 12 : undefined,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#991B1B', fontWeight: 600, marginBottom: 2, fontSize: 14 }}>
                {t('category_mgmt.delete_confirm').replace('{{name}}', cat.name)}
              </p>
              {cat.children?.length ? (
                <p style={{ color: '#B91C1C', fontSize: 12, marginBottom: 0 }}>
                  {cat.children.length === 1
                    ? t('category_mgmt.delete_warn_one')
                    : t('category_mgmt.delete_warn_many').replace('{{count}}', String(cat.children.length))}
                </p>
              ) : (
                <p style={{ color: '#B91C1C', fontSize: 12, marginBottom: 0 }}>{t('category_mgmt.delete_undone')}</p>
              )}
              {deleteError && (
                <p style={{ color: '#EF4444', fontSize: 12, marginTop: 4, marginBottom: 0 }}>{deleteError}</p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => { setConfirmDeleteId(null); setDeleteError(''); }}
                disabled={deleting}
                style={{
                  fontSize: 13, fontWeight: 600, padding: '5px 14px',
                  borderRadius: 8, border: '1px solid #D1D5DB',
                  background: '#fff', color: '#374151', cursor: 'pointer',
                }}
              >
                {t('category_mgmt.btn.cancel')}
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(cat.id)}
                disabled={deleting}
                style={{
                  fontSize: 13, fontWeight: 600, padding: '5px 14px',
                  borderRadius: 8, border: 'none',
                  background: '#EF4444', color: '#fff', cursor: 'pointer',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? t('category_mgmt.btn.deleting') : t('category_mgmt.btn.delete')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={cat.id}>
        {/* Main row */}
        <div
          className="transfer-first"
          style={{
            paddingLeft: isChild ? 36 : undefined,
            borderLeft: isChild ? `3px solid ${cat.color || '#6B7280'}44` : undefined,
            marginLeft: isChild ? 12 : undefined,
          }}
        >
          {/* Icon */}
          <div
            className="bank-img"
            style={{
              background: cat.color ? `${cat.color}22` : 'rgba(108,61,230,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}
          >
            {cat.icon || '📁'}
          </div>

          {/* Name + badges */}
          <div className="bank-details" style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ marginBottom: 2 }}>{cat.name}</h2>
            <div className="bank-card" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span
                style={{
                  color: cat.type === 'income' ? '#4ADE80' : '#F97316',
                  fontSize: 11, fontWeight: 700,
                  background: cat.type === 'income' ? 'rgba(74,222,128,0.12)' : 'rgba(249,115,22,0.12)',
                  padding: '1px 7px', borderRadius: 20,
                }}
              >
                {cat.type === 'income' ? t('category_mgmt.badge.income') : t('category_mgmt.badge.expense')}
              </span>
              {cat.is_system && (
                <span
                  style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.4px',
                    color: 'var(--sub-text-color)',
                    background: 'rgba(108,61,230,0.08)',
                    border: '1px solid rgba(108,61,230,0.18)',
                    borderRadius: 6, padding: '1px 6px',
                    userSelect: 'none',
                  }}
                >
                  {t('category_mgmt.badge.system')}
                </span>
              )}
              {!isChild && cat.children?.length ? (
                <span style={{ fontSize: 11, color: 'var(--sub-text-color)' }}>
                  {t('category_mgmt.children_count').replace('{{count}}', String(cat.children.length))}
                </span>
              ) : null}
            </div>
          </div>

          {/* Actions */}
          <div
            className="bank-active-sec"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}
          >
            {/* Collapse toggle */}
            {!isChild && cat.children?.length ? (
              <button
                type="button"
                onClick={() => toggleCollapse(cat.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 14, padding: 0, color: 'var(--sub-text-color)',
                  transform: collapsed.has(cat.id) ? 'rotate(-90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s', lineHeight: 1,
                }}
                aria-label={collapsed.has(cat.id) ? t('category_mgmt.btn.expand') : t('category_mgmt.btn.collapse')}
              >
                ▾
              </button>
            ) : null}

            {/* Edit / Delete — user-owned categories only */}
            {!cat.is_system ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  className="btn btn-link p-0"
                  onClick={() => openEdit(cat)}
                  title={t('category_mgmt.btn.edit_title')}
                  style={{ lineHeight: 1 }}
                >
                  <img src={purpleEditIcon} alt="edit" style={{ width: 18, height: 18 }} />
                </button>
                <button
                  className="btn btn-link p-0"
                  onClick={() => { setConfirmDeleteId(cat.id); setDeleteError(''); }}
                  title={t('category_mgmt.btn.delete_title')}
                  style={{ lineHeight: 1 }}
                >
                  <span style={{ color: '#EF4444', fontSize: 16 }}>✕</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Children — collapsed by user toggle */}
        {!isChild && !collapsed.has(cat.id) && cat.children?.map(
          (child) => renderCategoryRow(child, true),
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Shared form view (add + edit)
  // ─────────────────────────────────────────────────────────────────────────────

  const renderForm = (isEdit: boolean): React.ReactNode => (
    <>
      {formGenError && (
        <div style={{
          padding: '10px 14px', background: '#FEE2E2',
          border: '1px solid #FECACA', borderRadius: 10,
          color: '#991B1B', fontSize: 13, marginBottom: 16,
        }}>
          {formGenError}
        </div>
      )}

      {previewChip()}

      <form onSubmit={isEdit ? (e) => void handleUpdate(e) : (e) => void handleCreate(e)} noValidate>

        {/* Name */}
        <div className="personal-name mt-0 mb-3">
          <label htmlFor="cat-name" style={{ color: 'var(--sub-text-color)', fontSize: 13 }}>
            {t('category_mgmt.form.name_label')} <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input
            id="cat-name"
            type="text"
            className={`px-0${formErrors.name ? ' is-invalid' : ''}`}
            value={form.name}
            onChange={(e) => updateForm({ name: e.target.value })}
            placeholder={t('category_mgmt.form.name_placeholder')}
            maxLength={255}
          />
          {fieldError('name')}
        </div>

        {/* Type */}
        <div className="personal-name mb-3">
          <label style={{ color: 'var(--sub-text-color)', fontSize: 13 }}>
            {t('category_mgmt.form.type_label')} <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {(['expense', 'income'] as const).map((typ) => (
              <button
                key={typ}
                type="button"
                onClick={() => updateForm({ type: typ })}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  fontSize: 14, fontWeight: 700,
                  border: form.type === typ
                    ? `2px solid ${typ === 'income' ? '#4ADE80' : '#F97316'}`
                    : '2px solid rgba(108,61,230,0.15)',
                  background: form.type === typ
                    ? (typ === 'income' ? 'rgba(74,222,128,0.12)' : 'rgba(249,115,22,0.12)')
                    : 'var(--sub-bg-color)',
                  color: form.type === typ
                    ? (typ === 'income' ? '#4ADE80' : '#F97316')
                    : 'var(--sub-text-color)',
                  cursor: 'pointer',
                }}
              >
                {typ === 'income' ? t('category_mgmt.badge.income') : t('category_mgmt.badge.expense')}
              </button>
            ))}
          </div>
          {fieldError('type')}
        </div>

        {/* Parent */}
        <div className="personal-name mb-3">
          <label htmlFor="cat-parent" style={{ color: 'var(--sub-text-color)', fontSize: 13 }}>
            {t('category_mgmt.form.parent_label')}
            <span style={{ color: 'var(--sub-text-color)', fontWeight: 400, fontSize: 12 }}> {t('category_mgmt.form.optional')}</span>
          </label>
          <select
            id="cat-parent"
            className="px-0"
            value={form.parent_id}
            onChange={(e) => updateForm({ parent_id: e.target.value })}
            style={{
              background: 'var(--sub-bg-color)', color: 'var(--text-color)',
              border: 0, borderBottom: '2px solid var(--sub-bg-color)',
              width: '100%', fontSize: 14, paddingBottom: 4,
            }}
          >
            <option value="">{t('category_mgmt.form.no_parent')}</option>
            {topLevelOptions
              .filter((c) => c.id !== editingId)
              .map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.icon} {c.name}
                </option>
              ))}
          </select>
          {fieldError('parent_id')}
        </div>

        {/* Icon picker */}
        {iconPickerRow()}

        {/* Color picker */}
        {colorPickerRow()}

        {/* Submit */}
        <div className="verify-number-btn" style={{ marginTop: 8 }}>
          <button
            type="submit"
            disabled={saving || (!!form.customColor && !isValidHex(form.customColor))}
          >
            {saving
              ? (isEdit ? t('category_mgmt.form.btn_saving') : t('category_mgmt.form.btn_creating'))
              : (isEdit ? t('category_mgmt.form.btn_save') : t('category_mgmt.form.btn_create'))}
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <button
            type="button"
            onClick={goToList}
            disabled={saving}
            style={{
              background: 'none', border: 'none',
              color: 'var(--sub-text-color)', fontSize: 14,
              cursor: 'pointer', padding: '8px 0',
            }}
          >
            {t('category_mgmt.btn.cancel')}
          </button>
        </div>
      </form>
    </>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Root render — single unified layout skeleton (matches WalletManagement.tsx)
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="site-content">
        <div className="verify-number-main">

          {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
          <div className="verify-number-top">
            <div className="container">
              <div className="verify-number-top-content">
                {/* Back button */}
                <div className="back-btn">
                  {view !== 'list' ? (
                    <button
                      type="button"
                      onClick={goToList}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 1 }}
                    >
                      <img src={BackBtnIcon} alt="back" />
                    </button>
                  ) : (
                    <BackBtn />
                  )}
                </div>
                {/* Title */}
                <div className="header-title">
                  <p>{headerTitle[view]}</p>
                </div>
              </div>

              {/* Search + sort — list view only */}
              {view === 'list' && (
                <div className="contact-search">
                  <div className="input-group contact-searchbar">
                    <div className="search-icon">
                      <img src={SearchIcon} alt="search-icon" />
                    </div>
                    <div className="seach-bar" style={{ flex: 1 }}>
                      <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('category_mgmt.search_placeholder')}
                        className="form-control search-text"
                      />
                    </div>
                    <div className="dropdown">
                      <button
                        className="btn btn-sm btn-link p-0 dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        style={{ color: 'rgba(255,255,255,0.64)', fontSize: 12 }}
                      >
                        {t('category_mgmt.sort')}
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end">
                        {SORT_OPTIONS.map((opt) => (
                          <li key={opt.value}>
                            <button
                              className={`dropdown-item${sortKey === opt.value ? ' active' : ''}`}
                              onClick={() => setSortKey(opt.value)}
                            >
                              {t(opt.labelKey)}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── BODY ─────────────────────────────────────────────────────────── */}
          <div className="verify-number-bottom" id="category-management-main">
            <div className="verify-number-bottom-wrap">
              <div className="verify-number-content">
                <h1 className="d-none">Categories</h1>

                {/* Page flash message */}
                {pageMsg && (
                  <div style={{
                    padding: '10px 16px', borderRadius: 10, marginBottom: 16,
                    fontSize: 14, fontWeight: 500,
                    background: pageMsg.type === 'success' ? '#DCFCE7' : '#FEE2E2',
                    color:      pageMsg.type === 'success' ? '#166534' : '#991B1B',
                    border:     `1px solid ${pageMsg.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
                  }}>
                    {pageMsg.text}
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    LIST VIEW
                ══════════════════════════════════════════════════════════ */}
                {view === 'list' && (
                  <>
                    {/* Type filter tabs */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                      {(['all', 'expense', 'income'] as TypeFilter[]).map((typ) => (
                        <button
                          key={typ}
                          type="button"
                          onClick={() => setTypeFilter(typ)}
                          style={{
                            flex: 1, padding: '7px 0', borderRadius: 10,
                            fontSize: 12, fontWeight: 700,
                            border: typeFilter === typ
                              ? '2px solid var(--primary-color, #6C3DE6)'
                              : '2px solid rgba(108,61,230,0.15)',
                            background: typeFilter === typ
                              ? 'rgba(108,61,230,0.12)'
                              : 'var(--sub-bg-color)',
                            color: typeFilter === typ
                              ? 'var(--primary-color, #6C3DE6)'
                              : 'var(--sub-text-color)',
                            cursor: 'pointer',
                          }}
                        >
                          {typ === 'all' ? t('category_mgmt.filter.all') : typ === 'income' ? t('category_mgmt.badge.income') : t('category_mgmt.badge.expense')}
                        </button>
                      ))}
                    </div>

                    {/* Stats strip */}
                    {!loading && !errorMsg && (
                      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' }}>
                        {[
                          { label: t('category_mgmt.stats.total'),   count: flat.length,                            color: '#6C3DE6' },
                          { label: t('category_mgmt.stats.expense'), count: flat.filter((c) => c.type === 'expense').length, color: '#F97316' },
                          { label: t('category_mgmt.stats.income'),  count: flat.filter((c) => c.type === 'income').length,  color: '#4ADE80' },
                          { label: t('category_mgmt.stats.custom'),  count: flat.filter((c) => !c.is_system).length,         color: '#06B6D4' },
                        ].map((s) => (
                          <div key={s.label} style={{
                            flexShrink: 0, minWidth: 64,
                            border: `1px solid ${s.color}33`, borderRadius: 12,
                            padding: '8px 12px', textAlign: 'center',
                            background: 'var(--sub-bg-color)',
                          }}>
                            <p style={{ fontSize: 18, fontWeight: 800, color: s.color, margin: 0 }}>{s.count}</p>
                            <p style={{ fontSize: 10, color: 'var(--sub-text-color)', margin: 0 }}>{s.label}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Loading */}
                    {loading && (
                      <div className="text-center py-5">
                        <div
                          className="spinner-border"
                          role="status"
                          style={{ color: 'var(--primary-color, #6C3DE6)', width: 40, height: 40 }}
                        >
                          <span className="visually-hidden">{t('category_mgmt.loading_spinner')}</span>
                        </div>
                        <p style={{ color: 'var(--sub-text-color)', marginTop: 12, fontSize: 14 }}>
                          {t('category_mgmt.loading')}
                        </p>
                      </div>
                    )}

                    {/* Fetch error */}
                    {!loading && errorMsg && (
                      <div className="text-center py-5">
                        <p style={{ color: '#EF4444', fontSize: 15, marginBottom: 12 }}>{errorMsg}</p>
                        <div className="verify-number-btn" style={{ display: 'inline-block' }}>
                          <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); void fetchCategories(); }}
                          >
                            {t('category_mgmt.try_again')}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Empty state */}
                    {!loading && !errorMsg && displayedTree.length === 0 && (
                      <div className="text-center py-5">
                        <p style={{ fontSize: 40, marginBottom: 8 }}>🗂️</p>
                        <p style={{ color: 'var(--text-color)', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                          {search || typeFilter !== 'all' ? t('category_mgmt.empty.no_match') : t('category_mgmt.empty.no_categories')}
                        </p>
                        {search && (
                          <button
                            className="btn btn-link p-0"
                            style={{ fontSize: 14 }}
                            onClick={() => setSearch('')}
                          >
                            {t('category_mgmt.clear_search')}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Category rows */}
                    {!loading && !errorMsg && displayedTree.length > 0 && (
                      <div className="transfer-to-bank category-list-scrollable">
                        {displayedTree.map((cat) => renderCategoryRow(cat))}
                      </div>
                    )}

                    {/* Add new category CTA */}
                    {!loading && !errorMsg && (
                      <div className="verify-number-btn" style={{ marginTop: 24 }}>
                        <a
                          href="#"
                          onClick={(e) => { e.preventDefault(); openAdd(); }}
                        >
                          <span><img src={faqPlus} alt="plus-icon" /></span>
                          {t('category_mgmt.add_custom')}
                        </a>
                      </div>
                    )}
                  </>
                )}

                {/* ══════════════════════════════════════════════════════════
                    ADD VIEW
                ══════════════════════════════════════════════════════════ */}
                {view === 'add' && renderForm(false)}

                {/* ══════════════════════════════════════════════════════════
                    EDIT VIEW
                ══════════════════════════════════════════════════════════ */}
                {view === 'edit' && renderForm(true)}

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;
