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

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'name_asc',  label: 'Name A → Z' },
  { value: 'name_desc', label: 'Name Z → A' },
  { value: 'type',      label: 'Type' },
  { value: 'system_first', label: 'System first' },
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
  const sorted = [...tree];
  switch (key) {
    case 'name_asc':       sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
    case 'name_desc':      sorted.sort((a, b) => b.name.localeCompare(a.name)); break;
    case 'type':           sorted.sort((a, b) => a.type.localeCompare(b.type)); break;
    case 'system_first':   sorted.sort((a, b) => (b.is_system ? 1 : 0) - (a.is_system ? 1 : 0)); break;
  }
  return sorted;
}

function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{3,8}$/.test(hex);
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const SystemBadge: React.FC = () => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 3,
    fontSize: 10, fontWeight: 700, letterSpacing: '0.4px',
    color: 'var(--sub-text-color)',
    background: 'rgba(108,61,230,0.08)',
    border: '1px solid rgba(108,61,230,0.18)',
    borderRadius: 6, padding: '2px 7px',
    userSelect: 'none',
  }}>
    🔒 System
  </span>
);

const TypeBadge: React.FC<{ type: 'expense' | 'income' }> = ({ type }) => (
  <span style={{
    display: 'inline-block',
    fontSize: 10, fontWeight: 700, letterSpacing: '0.4px',
    color: type === 'income' ? '#4ADE80' : '#F97316',
    background: type === 'income' ? 'rgba(74,222,128,0.1)' : 'rgba(249,115,22,0.1)',
    border: `1px solid ${type === 'income' ? 'rgba(74,222,128,0.25)' : 'rgba(249,115,22,0.25)'}`,
    borderRadius: 6, padding: '2px 7px',
    userSelect: 'none',
  }}>
    {type === 'income' ? '↑ Income' : '↓ Expense'}
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

const CategoryManagement: React.FC = () => {
  // ── Data ────────────────────────────────────────────────────────────────────
  const [tree,    setTree]    = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
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

  // ── Form state ──────────────────────────────────────────────────────────────
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
      setErrorMsg('Unable to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchCategories(); }, [fetchCategories]);

  // ─── Derived data ─────────────────────────────────────────────────────────────

  const flat = useMemo<Category[]>(() => flattenTree(tree), [tree]);

  /** Top-level parents only (for the "parent" dropdown in the form) */
  const topLevelOptions = useMemo<Category[]>(
    () => flat.filter((c) => c.parent_id === null),
    [flat],
  );

  /** Visible tree after search + type filter + sort */
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

  // ─── Navigation ─────────────────────────────────────────────────────────────

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

  const toggleCollapse = (id: number): void => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ─── Create ──────────────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSaving(true);
    setFormErrors({});
    setFormGenError('');

    const resolvedColor = form.customColor && isValidHex(form.customColor)
      ? form.customColor
      : form.color;

    try {
      await api.post('/categories', {
        name:      form.name,
        type:      form.type,
        icon:      form.icon,
        color:     resolvedColor,
        parent_id: form.parent_id ? parseInt(form.parent_id, 10) : null,
      });
      showPageMsg('success', `"${form.name}" created successfully.`);
      goToList();
      await fetchCategories();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { errors?: ApiValidationErrors; message?: string } } };
      const errs = ax.response?.data?.errors ?? {};
      if (Object.keys(errs).length > 0) {
        setFormErrors(errs);
      } else {
        setFormGenError(ax.response?.data?.message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  // ─── Update ──────────────────────────────────────────────────────────────────

  const handleUpdate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setFormErrors({});
    setFormGenError('');

    const resolvedColor = form.customColor && isValidHex(form.customColor)
      ? form.customColor
      : form.color;

    try {
      await api.put(`/categories/${editingId}`, {
        name:      form.name,
        type:      form.type,
        icon:      form.icon,
        color:     resolvedColor,
        parent_id: form.parent_id ? parseInt(form.parent_id, 10) : null,
      });
      showPageMsg('success', `"${form.name}" updated successfully.`);
      goToList();
      await fetchCategories();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { errors?: ApiValidationErrors; message?: string; status?: number } } };
      if (ax.response?.data?.status === 403 || (ax as { response?: { status?: number } }).response?.status === 403) {
        setFormGenError('You cannot edit a system category.');
      } else {
        const errs = ax.response?.data?.errors ?? {};
        if (Object.keys(errs).length > 0) {
          setFormErrors(errs);
        } else {
          setFormGenError(ax.response?.data?.message ?? 'Something went wrong. Please try again.');
        }
      }
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────────────────

  const handleDelete = async (id: number): Promise<void> => {
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/categories/${id}`);
      setConfirmDeleteId(null);
      await fetchCategories();
      showPageMsg('success', 'Category deleted successfully.');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setDeleteError(ax.response?.data?.message ?? 'Could not delete this category.');
    } finally {
      setDeleting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Shared form atoms
  // ─────────────────────────────────────────────────────────────────────────────

  const updateForm = (patch: Partial<CategoryForm>): void =>
    setForm((prev) => ({ ...prev, ...patch }));

  const iconPickerRow = (): React.ReactNode => (
    <div className="mb-3">
      <p style={{ color: 'var(--sub-text-color)', fontSize: 13, marginBottom: 8 }}>Icon</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {ICON_PRESETS.map((ic) => (
          <button
            key={ic}
            type="button"
            onClick={() => updateForm({ icon: ic })}
            style={{
              width: 40, height: 40, borderRadius: 10,
              border: `1px solid ${form.icon === ic ? 'var(--primary-color, #6C3DE6)' : 'var(--sub-bg-color)'}`,
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
    <div className="mb-3">
      <p style={{ color: 'var(--sub-text-color)', fontSize: 13, marginBottom: 8 }}>Color</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {COLOR_PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => updateForm({ color: c, customColor: '' })}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: c, border: 'none', cursor: 'pointer',
              outline: (form.customColor ? form.customColor : form.color) === c ? `3px solid ${c}` : 'none',
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
        className="form-control"
        placeholder="#RRGGBB  — custom hex"
        value={form.customColor}
        onChange={(e) => updateForm({ customColor: e.target.value })}
        style={{ fontSize: 13, maxWidth: 200 }}
      />
      {form.customColor && !isValidHex(form.customColor) && (
        <p style={{ color: '#F87171', fontSize: 12, marginTop: 4 }}>
          Must be a valid hex colour (e.g. #FF6B35)
        </p>
      )}
    </div>
  );

  const effectiveColor = form.customColor && isValidHex(form.customColor)
    ? form.customColor
    : form.color;

  const previewChip = (): React.ReactNode => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px',
      background: 'var(--sub-bg-color)',
      borderRadius: 14, marginBottom: 20,
      border: '1px solid var(--border-color, rgba(108,61,230,0.12))',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: effectiveColor ? `${effectiveColor}22` : 'rgba(108,61,230,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
      }}>
        {form.icon}
      </div>
      <div>
        <p style={{ fontWeight: 700, margin: 0, color: 'var(--text-color)' }}>
          {form.name || 'Category Name'}
        </p>
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <TypeBadge type={form.type} />
        </div>
      </div>
      <div style={{
        marginLeft: 'auto', width: 14, height: 14, borderRadius: '50%',
        background: effectiveColor,
      }} />
    </div>
  );

  const fieldError = (field: string): React.ReactNode =>
    formErrors[field] ? (
      <p style={{ color: '#F87171', fontSize: 12, marginTop: 4 }}>
        {formErrors[field][0]}
      </p>
    ) : null;

  // ─────────────────────────────────────────────────────────────────────────────
  // Shared form UI (used by both Add and Edit views)
  // ─────────────────────────────────────────────────────────────────────────────

  const renderForm = (isEdit: boolean): React.ReactNode => (
    <div className="body-main-sec">
      <div className="header-nav-fixed" style={{ paddingBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <button
            type="button"
            onClick={goToList}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            aria-label="Back"
          >
            <img src={BackBtnIcon} alt="back" style={{ width: 28 }} />
          </button>
          <h1 className="title" style={{ margin: 0 }}>
            {isEdit ? 'Edit Category' : 'New Category'}
          </h1>
        </div>
      </div>

      <div style={{ padding: '0 20px 100px' }}>
        {previewChip()}

        {formGenError && (
          <div style={{
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
            borderRadius: 12, padding: '10px 14px', marginBottom: 16,
            color: '#F87171', fontSize: 13,
          }}>
            {formGenError}
          </div>
        )}

        <form onSubmit={isEdit ? handleUpdate : handleCreate}>
          {/* Name */}
          <div className="mb-3">
            <label style={{ fontSize: 13, color: 'var(--sub-text-color)', marginBottom: 6, display: 'block' }}>
              Name <span style={{ color: '#F87171' }}>*</span>
            </label>
            <input
              className="form-control"
              type="text"
              placeholder="e.g. Coffee & Tea"
              value={form.name}
              onChange={(e) => updateForm({ name: e.target.value })}
              required
              maxLength={255}
            />
            {fieldError('name')}
          </div>

          {/* Type */}
          <div className="mb-3">
            <p style={{ color: 'var(--sub-text-color)', fontSize: 13, marginBottom: 8 }}>
              Type <span style={{ color: '#F87171' }}>*</span>
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => updateForm({ type: t })}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 14, fontWeight: 700,
                    border: form.type === t
                      ? `2px solid ${t === 'income' ? '#4ADE80' : '#F97316'}`
                      : '2px solid var(--sub-bg-color)',
                    background: form.type === t
                      ? (t === 'income' ? 'rgba(74,222,128,0.12)' : 'rgba(249,115,22,0.12)')
                      : 'var(--sub-bg-color)',
                    color: form.type === t
                      ? (t === 'income' ? '#4ADE80' : '#F97316')
                      : 'var(--sub-text-color)',
                    cursor: 'pointer',
                  }}
                >
                  {t === 'income' ? '↑ Income' : '↓ Expense'}
                </button>
              ))}
            </div>
            {fieldError('type')}
          </div>

          {/* Parent */}
          <div className="mb-3">
            <label style={{ fontSize: 13, color: 'var(--sub-text-color)', marginBottom: 6, display: 'block' }}>
              Parent Category <span style={{ color: 'var(--sub-text-color)', fontWeight: 400 }}>(optional)</span>
            </label>
            <select
              className="form-control"
              value={form.parent_id}
              onChange={(e) => updateForm({ parent_id: e.target.value })}
              style={{ fontSize: 14 }}
            >
              <option value="">— No parent (top-level) —</option>
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

          {/* Icon */}
          {iconPickerRow()}

          {/* Color */}
          {colorPickerRow()}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || (!!form.customColor && !isValidHex(form.customColor))}
            className="btn"
            style={{
              width: '100%', padding: '14px 0',
              background: saving ? 'rgba(108,61,230,0.5)' : 'linear-gradient(135deg,#6C3DE6,#9966FF)',
              color: '#fff', fontWeight: 700, fontSize: 16, borderRadius: 16,
              border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              marginTop: 8,
            }}
          >
            {saving ? '⏳ Saving…' : isEdit ? 'Save Changes' : 'Create Category'}
          </button>
        </form>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Category row
  // ─────────────────────────────────────────────────────────────────────────────

  const renderCategoryRow = (
    cat: Category,
    isChild = false,
  ): React.ReactNode => {
    const isDeleteConfirming = confirmDeleteId === cat.id;

    return (
      <div key={cat.id}>
        <div
          className="send-money-contact-tab"
          style={{
            paddingLeft: isChild ? 36 : 16,
            borderLeft: isChild ? `3px solid ${cat.color || '#6B7280'}33` : 'none',
            marginLeft: isChild ? 16 : 0,
            borderRadius: isChild ? '0 12px 12px 0' : undefined,
            position: 'relative',
          }}
        >
          {/* Icon avatar */}
          <div
            className="bank-img"
            style={{
              background: cat.color ? `${cat.color}22` : 'rgba(108,61,230,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0, width: 44, height: 44, borderRadius: 12,
            }}
          >
            {cat.icon || '📁'}
          </div>

          {/* Details */}
          <div className="contact-details" style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{cat.name}</h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <TypeBadge type={cat.type} />
              {cat.is_system && <SystemBadge />}
              {cat.children?.length ? (
                <span style={{ fontSize: 11, color: 'var(--sub-text-color)' }}>
                  {cat.children.length} sub-categor{cat.children.length === 1 ? 'y' : 'ies'}
                </span>
              ) : null}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            {/* Collapse toggle for parents with children */}
            {!isChild && cat.children?.length ? (
              <button
                type="button"
                onClick={() => toggleCollapse(cat.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 16, padding: 4,
                  transform: collapsed.has(cat.id) ? 'rotate(-90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
                aria-label={collapsed.has(cat.id) ? 'Expand' : 'Collapse'}
              >
                ▾
              </button>
            ) : null}

            {/* Edit / Delete (user-owned only) */}
            {!cat.is_system ? (
              <>
                <button
                  type="button"
                  onClick={() => openEdit(cat)}
                  style={{
                    background: 'rgba(108,61,230,0.1)', border: 'none', borderRadius: 8,
                    width: 32, height: 32, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  aria-label="Edit"
                  title="Edit category"
                >
                  <img src={purpleEditIcon} alt="edit" style={{ width: 16 }} />
                </button>
                <button
                  type="button"
                  onClick={() => { setConfirmDeleteId(cat.id); setDeleteError(''); }}
                  style={{
                    background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8,
                    width: 32, height: 32, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15,
                  }}
                  aria-label="Delete"
                  title="Delete category"
                >
                  🗑️
                </button>
              </>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--sub-text-color)', paddingRight: 4 }}>
                —
              </span>
            )}
          </div>
        </div>

        {/* Inline delete confirm */}
        {isDeleteConfirming && (
          <div style={{
            background: 'rgba(239,68,68,0.07)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 12, padding: '12px 16px', margin: '4px 0 4px 16px',
          }}>
            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: 'var(--text-color)' }}>
              Delete "{cat.name}"?
            </p>
            {cat.children?.length ? (
              <p style={{ fontSize: 12, color: '#FBBF24', marginBottom: 8 }}>
                ⚠️ This will also remove its {cat.children.length} sub-categor{cat.children.length === 1 ? 'y' : 'ies'}.
              </p>
            ) : null}
            {deleteError && (
              <p style={{ fontSize: 12, color: '#F87171', marginBottom: 8 }}>{deleteError}</p>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => handleDelete(cat.id)}
                disabled={deleting}
                style={{
                  background: '#EF4444', color: '#fff', border: 'none',
                  borderRadius: 10, padding: '8px 20px', fontWeight: 700,
                  fontSize: 13, cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
              <button
                type="button"
                onClick={() => { setConfirmDeleteId(null); setDeleteError(''); }}
                style={{
                  background: 'var(--sub-bg-color)', color: 'var(--text-color)',
                  border: 'none', borderRadius: 10, padding: '8px 20px',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Children */}
        {!isChild && !collapsed.has(cat.id) && cat.children?.map((child) =>
          renderCategoryRow(child, true),
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // List view
  // ─────────────────────────────────────────────────────────────────────────────

  const renderList = (): React.ReactNode => (
    <div className="body-main-sec">
      {/* Header */}
      <div className="header-nav-fixed">
        <BackBtn BackBtnIcon={BackBtnIcon} />
        <h1 className="title">Categories</h1>

        {/* Search */}
        <div className="search-bar" style={{ marginTop: 10 }}>
          <img src={SearchIcon} alt="search" />
          <input
            type="text"
            placeholder="Search categories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-bar-input"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4 }}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Type filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {(['all', 'expense', 'income'] as TypeFilter[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 13, fontWeight: 700,
                border: typeFilter === t ? '2px solid var(--primary-color, #6C3DE6)' : '2px solid var(--sub-bg-color)',
                background: typeFilter === t ? 'rgba(108,61,230,0.12)' : 'var(--sub-bg-color)',
                color: typeFilter === t ? 'var(--primary-color, #6C3DE6)' : 'var(--sub-text-color)',
                cursor: 'pointer',
              }}
            >
              {t === 'all' ? 'All' : t === 'income' ? '↑ Income' : '↓ Expense'}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--sub-text-color)', whiteSpace: 'nowrap' }}>Sort:</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="form-control"
            style={{ fontSize: 12, padding: '4px 8px' }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Page flash */}
      {pageMsg && (
        <div style={{
          margin: '8px 16px',
          padding: '10px 14px',
          borderRadius: 12,
          background: pageMsg.type === 'success' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
          border: `1px solid ${pageMsg.type === 'success' ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
          color: pageMsg.type === 'success' ? '#4ADE80' : '#F87171',
          fontSize: 13, fontWeight: 600,
        }}>
          {pageMsg.type === 'success' ? '✓' : '✕'} {pageMsg.text}
        </div>
      )}

      {/* Stats strip */}
      {!loading && !errorMsg && (
        <div style={{
          display: 'flex', gap: 10, padding: '8px 16px',
          overflowX: 'auto',
        }}>
          {[
            { label: 'Total', count: flat.length, color: '#6C3DE6' },
            { label: 'Expense', count: flat.filter((c) => c.type === 'expense').length, color: '#F97316' },
            { label: 'Income',  count: flat.filter((c) => c.type === 'income').length,  color: '#4ADE80' },
            { label: 'Custom',  count: flat.filter((c) => !c.is_system).length,          color: '#06B6D4' },
          ].map((s) => (
            <div key={s.label} style={{
              flexShrink: 0,
              background: 'var(--sub-bg-color)',
              border: `1px solid ${s.color}33`,
              borderRadius: 12, padding: '8px 16px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: s.color, margin: 0 }}>{s.count}</p>
              <p style={{ fontSize: 11, color: 'var(--sub-text-color)', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Body */}
      <div className="body-main" style={{ paddingBottom: 100 }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--sub-text-color)' }}>
            Loading categories…
          </div>
        )}

        {!loading && errorMsg && (
          <div style={{
            margin: 16, padding: '14px 16px', borderRadius: 12,
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
            color: '#F87171', fontSize: 14,
          }}>
            {errorMsg}
            <button
              type="button"
              onClick={() => void fetchCategories()}
              style={{ marginLeft: 12, fontWeight: 700, background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !errorMsg && displayedTree.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🗂️</p>
            <p style={{ color: 'var(--sub-text-color)', fontSize: 14 }}>
              {search || typeFilter !== 'all' ? 'No categories match your filter.' : 'No categories yet.'}
            </p>
          </div>
        )}

        {!loading && !errorMsg && displayedTree.map((cat) => renderCategoryRow(cat))}
      </div>

      {/* FAB — add custom category */}
      <div
        style={{
          position: 'fixed', bottom: 90, right: 20,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg,#6C3DE6,#9966FF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(108,61,230,0.45)',
          cursor: 'pointer', zIndex: 100,
        }}
        onClick={openAdd}
        role="button"
        aria-label="Add category"
        title="Add custom category"
      >
        <img src={faqPlus} alt="add" style={{ width: 28, filter: 'brightness(10)' }} />
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Root
  // ─────────────────────────────────────────────────────────────────────────────

  if (view === 'add')  return <>{renderForm(false)}</>;
  if (view === 'edit') return <>{renderForm(true)}</>;
  return <>{renderList()}</>;
};

export default CategoryManagement;
