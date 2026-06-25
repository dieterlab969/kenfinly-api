import React, { useState, useEffect, useRef, useCallback } from 'react';
import BackBtn from '../components/BackBtn.tsx';
import ProfileImg from '../assets/images/personal-info/profile-img.png';
import CameraIconImg from '../assets/svg/camera-icon.svg';
import EditIcon from '../assets/svg/edit-icon.svg';
import api from '../../utils/api.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_AVATAR_BYTES  = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  avatar: string | null;
  email_verified: boolean;
  status: string;
  roles: string[];
}

interface FormState {
  name: string;
  phone: string;
  date_of_birth: string;
  gender: string;
}

type EditableField = keyof FormState;

interface FieldErrors {
  name?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
}

// ─── Options / lookups ────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: '',                  label: 'Select gender' },
  { value: 'male',              label: 'Male' },
  { value: 'female',            label: 'Female' },
  { value: 'other',             label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const GENDER_LABELS: Record<string, string> = {
  male:              'Male',
  female:            'Female',
  other:             'Other',
  prefer_not_to_say: 'Prefer not to say',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDisplayDate(iso: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function validateForm(form: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.name.trim()) {
    errors.name = 'Name is required.';
  } else if (form.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  } else if (form.name.trim().length > 100) {
    errors.name = 'Name must not exceed 100 characters.';
  }

  if (form.phone) {
    if (form.phone.length > 30) {
      errors.phone = 'Phone must not exceed 30 characters.';
    } else if (!/^[+\d\s\-().]{0,30}$/.test(form.phone)) {
      errors.phone = 'Phone number contains invalid characters.';
    }
  }

  if (form.date_of_birth) {
    const dob = new Date(form.date_of_birth);
    if (isNaN(dob.getTime())) {
      errors.date_of_birth = 'Please enter a valid date.';
    } else if (dob >= new Date()) {
      errors.date_of_birth = 'Date of birth must be in the past.';
    }
  }

  return errors;
}

/**
 * Client-side avatar file validation before sending to the server.
 * Returns an error message string, or null if valid.
 */
function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'Please select a JPEG, PNG, or WebP image.';
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return 'Image must be smaller than 2 MB.';
  }
  return null;
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

const Spinner: React.FC<{ small?: boolean }> = ({ small }) => (
  <span
    style={{
      display: 'inline-block',
      width:   small ? 14 : 20,
      height:  small ? 14 : 20,
      border: '2px solid #e5e7eb',
      borderTop: '2px solid #6366f1',
      borderRadius: '50%',
      animation: 'pi-spin 0.7s linear infinite',
    }}
    aria-hidden="true"
  />
);

// ─── Scoped styles ────────────────────────────────────────────────────────────

const STYLES = `
  @keyframes pi-spin    { to { transform: rotate(360deg); } }
  @keyframes pi-shimmer { 0%,100%{opacity:.4} 50%{opacity:1} }

  .personal-field-value {
    flex: 1; font-size: 14px; color: #374151;
    padding: 2px 0; word-break: break-word;
  }
  .personal-edit-btn {
    background: none; border: none; padding: 4px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    border-radius: 4px; transition: background 0.15s; flex-shrink: 0;
  }
  .personal-edit-btn:hover { background: #f3f4f6; }
  .personal-field-input {
    width: 100%; border: 1px solid #d1d5db; border-radius: 6px;
    padding: 6px 10px; font-size: 14px; color: #111827; outline: none;
    transition: border-color 0.15s; background: #fff; box-sizing: border-box;
  }
  .personal-field-input:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,.12); }
  .personal-field-input.error { border-color: #ef4444; }
  .personal-field-select {
    width: 100%; border: 1px solid #d1d5db; border-radius: 6px;
    padding: 6px 10px; font-size: 14px; color: #111827; outline: none;
    background: #fff; box-sizing: border-box; cursor: pointer;
  }
  .personal-field-select:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,.12); }
  .pi-alert-success {
    background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d;
    border-radius: 8px; padding: 10px 14px; font-size: 14px;
    margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
  }
  .pi-alert-error {
    background: #fef2f2; border: 1px solid #fecaca; color: #dc2626;
    border-radius: 8px; padding: 10px 14px; font-size: 14px; margin-bottom: 12px;
  }
  .personal-name { align-items: flex-start; }

  /* Avatar upload overlay */
  .avatar-upload-wrap { position: relative; display: inline-block; }
  .avatar-upload-wrap .avatar-overlay {
    position: absolute; inset: 0; border-radius: 50%;
    background: rgba(0,0,0,.35);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity .2s;
    pointer-events: none;
  }
  .avatar-upload-wrap:hover .avatar-overlay { opacity: 1; }
  .avatar-upload-input { display: none; }
  .avatar-camera-btn {
    position: absolute; bottom: 0; right: 0;
    background: #6366f1; border: 2px solid #fff; border-radius: 50%;
    width: 32px; height: 32px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background .15s; padding: 0;
  }
  .avatar-camera-btn:hover  { background: #4f46e5; }
  .avatar-camera-btn:disabled { background: #a5b4fc; cursor: not-allowed; }
  .avatar-uploading-ring {
    width: 100%; height: 100%; border-radius: 50%;
    border: 3px solid #6366f1; border-top-color: transparent;
    animation: pi-spin .7s linear infinite;
  }
`;

// ─── Main Component ───────────────────────────────────────────────────────────

const PersonalInfo: React.FC = () => {
  // Profile data
  const [profile,        setProfile]        = useState<Profile | null>(null);
  const [form,           setForm]           = useState<FormState>({ name: '', phone: '', date_of_birth: '', gender: '' });

  // Field editing
  const [editingFields,  setEditingFields]  = useState<Set<EditableField>>(new Set());
  const [fieldErrors,    setFieldErrors]    = useState<FieldErrors>({});

  // Loading / save states
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [fetchError,     setFetchError]     = useState('');
  const [successMsg,     setSuccessMsg]     = useState('');
  const [saveError,      setSaveError]      = useState('');

  // Avatar upload states
  const [avatarPreview,  setAvatarPreview]  = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError,    setAvatarError]    = useState('');

  const successTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);

  // ── Fetch profile on mount ───────────────────────────────────────────────
  useEffect(() => {
    fetchProfile();
    return () => { if (successTimer.current) clearTimeout(successTimer.current); };
  }, []);

  async function fetchProfile() {
    setLoading(true);
    setFetchError('');
    try {
      const res = await api.get('/profile');
      const p: Profile = res.data.profile;
      applyProfile(p);
    } catch (err: any) {
      setFetchError(err.response?.data?.message ?? 'Unable to load your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function applyProfile(p: Profile) {
    setProfile(p);
    setForm({
      name:          p.name          ?? '',
      phone:         p.phone         ?? '',
      date_of_birth: p.date_of_birth ?? '',
      gender:        p.gender        ?? '',
    });
    setAvatarPreview(null); // clear local preview — use server value
  }

  // ── Avatar upload ────────────────────────────────────────────────────────
  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be re-selected after an error
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Client-side validation
    const validationError = validateAvatarFile(file);
    if (validationError) {
      setAvatarError(validationError);
      return;
    }

    // Optimistic local preview
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    setAvatarError('');
    setAvatarUploading(true);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updatedProfile: Profile = res.data.profile;
      applyProfile(updatedProfile);

      // Update localStorage cache so Setting.tsx stays in sync
      try {
        const cached = JSON.parse(localStorage.getItem('user') ?? '{}');
        localStorage.setItem('user', JSON.stringify({
          ...cached,
          avatar: updatedProfile.avatar,
          name:   updatedProfile.name,
          email:  updatedProfile.email,
        }));
      } catch { /* ignore */ }

      setSuccessMsg('Avatar updated successfully.');
      successTimer.current = setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      // Revert preview on failure
      setAvatarPreview(null);
      URL.revokeObjectURL(objectUrl);

      if (err.response?.status === 422) {
        const msgs = err.response.data?.errors?.avatar;
        setAvatarError(Array.isArray(msgs) ? msgs[0] : 'Invalid file. Please try a different image.');
      } else {
        setAvatarError(err.response?.data?.message ?? 'Upload failed. Please try again.');
      }
    } finally {
      setAvatarUploading(false);
    }
  }, []);

  // ── Field editing helpers ────────────────────────────────────────────────
  function toggleEdit(field: EditableField) {
    setEditingFields(prev => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
        if (profile) setForm(f => ({ ...f, [field]: (profile as any)[field] ?? '' }));
        setFieldErrors(e => { const n = { ...e }; delete n[field]; return n; });
      } else {
        next.add(field);
      }
      return next;
    });
    setSaveError('');
    setSuccessMsg('');
  }

  function handleChange(field: EditableField, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(e => { const n = { ...e }; delete n[field]; return n; });
    }
  }

  // ── Save profile fields ──────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (editingFields.size === 0) return;

    const errors = validateForm(form);
    const relevantErrors: FieldErrors = {};
    (Object.keys(errors) as EditableField[]).forEach(k => {
      if (editingFields.has(k)) relevantErrors[k] = errors[k];
    });
    if (Object.keys(relevantErrors).length > 0) {
      setFieldErrors(relevantErrors);
      return;
    }

    setSaving(true);
    setSaveError('');
    setSuccessMsg('');

    const payload: Partial<FormState> = {};
    editingFields.forEach(field => {
      payload[field] = form[field] || undefined as any;
    });

    try {
      const res = await api.put('/profile', payload);
      applyProfile(res.data.profile);
      setEditingFields(new Set());
      setFieldErrors({});
      setSuccessMsg('Profile updated successfully.');
      successTimer.current = setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      if (err.response?.status === 422) {
        const apiErrors = err.response.data?.errors ?? {};
        const mapped: FieldErrors = {};
        (Object.keys(apiErrors) as EditableField[]).forEach(k => {
          mapped[k] = Array.isArray(apiErrors[k]) ? apiErrors[k][0] : apiErrors[k];
        });
        setFieldErrors(mapped);
      } else {
        setSaveError(err.response?.data?.message ?? 'Failed to save changes. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  // ── Render field helper ──────────────────────────────────────────────────
  function renderField(opts: {
    field: EditableField;
    label: string;
    displayValue: string;
    inputEl: React.ReactNode;
    className?: string;
  }) {
    const { field, label, displayValue, inputEl, className = 'mt-16' } = opts;
    const isEditing = editingFields.has(field);
    const error     = fieldErrors[field];

    return (
      <div className={`personal-name ${className}`} key={field}>
        <label htmlFor={field}>{label}</label>
        {isEditing ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {inputEl}
            {error && (
              <span style={{ color: '#ef4444', fontSize: 12, marginTop: 2 }}>{error}</span>
            )}
          </div>
        ) : (
          <span className="personal-field-value">
            {displayValue || <em style={{ color: '#9ca3af', fontStyle: 'normal' }}>Not set</em>}
          </span>
        )}
        <button
          type="button"
          className="personal-edit-btn"
          onClick={() => toggleEdit(field)}
          aria-label={isEditing ? `Cancel editing ${label}` : `Edit ${label}`}
          title={isEditing ? 'Cancel' : 'Edit'}
        >
          {isEditing
            ? <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>✕</span>
            : <img src={EditIcon} alt="edit" className="custom-icon-edit" />}
        </button>
      </div>
    );
  }

  // ── Derived values ───────────────────────────────────────────────────────
  const resolvedAvatar = avatarPreview ?? profile?.avatar ?? null;
  const hasEdits       = editingFields.size > 0;

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <style>{STYLES}</style>
        <div className="site-content">
          <div className="verify-number-main">
            <div className="verify-number-top">
              <div className="container">
                <div className="verify-number-top-content">
                  <div className="back-btn"><BackBtn /></div>
                  <div className="header-title"><p>Personal Info</p></div>
                </div>
              </div>
            </div>
            <div className="verify-number-bottom" id="personal-info">
              <div className="verify-number-bottom-wrap">
                <div className="verify-number-content">
                  <div className="personal-info-main">
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0 32px' }}>
                      <Spinner />
                    </div>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`personal-name ${i > 0 ? 'mt-16' : ''}`}
                        style={{ animation: `pi-shimmer 1.4s ease infinite ${i * 0.1}s` }}>
                        <div style={{ height: 12, width: 80, background: '#e5e7eb', borderRadius: 4 }} />
                        <div style={{ height: 16, flex: 1, background: '#f3f4f6', borderRadius: 4, margin: '0 12px' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Fetch error state ────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div>
        <div className="site-content">
          <div className="verify-number-main">
            <div className="verify-number-top">
              <div className="container">
                <div className="verify-number-top-content">
                  <div className="back-btn"><BackBtn /></div>
                  <div className="header-title"><p>Personal Info</p></div>
                </div>
              </div>
            </div>
            <div className="verify-number-bottom" id="personal-info">
              <div className="verify-number-bottom-wrap">
                <div className="verify-number-content">
                  <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <p style={{ color: '#ef4444', marginBottom: 16 }}>{fetchError}</p>
                    <button
                      type="button"
                      onClick={fetchProfile}
                      style={{
                        padding: '10px 24px', background: '#6366f1', color: '#fff',
                        border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
                      }}
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div>
      <style>{STYLES}</style>

      <div className="site-content">
        <div className="verify-number-main">

          {/* ── Top bar ── */}
          <div className="verify-number-top">
            <div className="container">
              <div className="verify-number-top-content">
                <div className="back-btn"><BackBtn /></div>
                <div className="header-title"><p>Personal Info</p></div>
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="verify-number-bottom" id="personal-info">
            <div className="verify-number-bottom-wrap">
              <div className="verify-number-content">
                <h1 className="d-none">Personal Info</h1>

                <div className="personal-info-main">

                  {/* ── Avatar upload ── */}
                  <div className="profile-edit-first">
                    <div className="profile-edit-img">

                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="imageInput"
                        className="avatar-upload-input"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleAvatarChange}
                        disabled={avatarUploading}
                        aria-label="Upload profile photo"
                      />

                      {/* Avatar with upload overlay */}
                      <div className="avatar-upload-wrap">
                        {avatarUploading ? (
                          <div
                            className="profile-pic"
                            style={{
                              width: '100%', height: '100%', borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: '#f3f4f6',
                            }}
                          >
                            <div className="avatar-uploading-ring" style={{ width: 40, height: 40 }} />
                          </div>
                        ) : (
                          <>
                            <img
                              src={resolvedAvatar ?? ProfileImg}
                              alt="Profile"
                              className="profile-pic"
                              onError={(e) => { (e.target as HTMLImageElement).src = ProfileImg; }}
                            />
                            <div className="avatar-overlay">
                              <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>Change</span>
                            </div>
                          </>
                        )}

                        {/* Camera button */}
                        <label
                          htmlFor="imageInput"
                          className="avatar-camera-btn"
                          title={avatarUploading ? 'Uploading…' : 'Change profile photo'}
                          style={{ cursor: avatarUploading ? 'not-allowed' : 'pointer' }}
                        >
                          {avatarUploading
                            ? <div className="avatar-uploading-ring" style={{ width: 16, height: 16, borderWidth: 2 }} />
                            : <img src={CameraIconImg} alt="upload" style={{ width: 16, height: 16 }} />
                          }
                        </label>
                      </div>

                      {/* Avatar-specific error */}
                      {avatarError && (
                        <p style={{
                          color: '#dc2626', fontSize: 11, textAlign: 'center',
                          marginTop: 6, maxWidth: 160,
                        }}>
                          {avatarError}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ── Global alerts ── */}
                  {successMsg && (
                    <div className="pi-alert-success" role="status">
                      <span>✓</span> {successMsg}
                    </div>
                  )}
                  {saveError && (
                    <div className="pi-alert-error" role="alert">{saveError}</div>
                  )}

                  {/* ── Profile form ── */}
                  <form className="personal-info-form mt-24" onSubmit={handleSave} noValidate>

                    {/* Name */}
                    {renderField({
                      field:        'name',
                      label:        'Name',
                      displayValue: form.name,
                      className:    '',
                      inputEl: (
                        <input
                          id="name"
                          type="text"
                          className={`personal-field-input${fieldErrors.name ? ' error' : ''}`}
                          value={form.name}
                          onChange={e => handleChange('name', e.target.value)}
                          placeholder="Enter your full name"
                          autoComplete="name"
                          maxLength={100}
                          autoFocus
                        />
                      ),
                    })}

                    {/* Email — read-only */}
                    <div className="personal-name mt-16">
                      <label htmlFor="email">Email Address</label>
                      <span className="personal-field-value">
                        {profile?.email ?? '—'}
                        {profile?.email_verified && (
                          <span style={{ marginLeft: 6, color: '#16a34a', fontSize: 11 }}>✓ Verified</span>
                        )}
                      </span>
                      <span
                        style={{ width: 28, flexShrink: 0, color: '#9ca3af', fontSize: 11 }}
                        title="Email cannot be changed here"
                      >
                        🔒
                      </span>
                    </div>

                    {/* Phone */}
                    {renderField({
                      field:        'phone',
                      label:        'Phone Number',
                      displayValue: form.phone,
                      inputEl: (
                        <input
                          id="phone"
                          type="tel"
                          className={`personal-field-input${fieldErrors.phone ? ' error' : ''}`}
                          value={form.phone}
                          onChange={e => handleChange('phone', e.target.value)}
                          placeholder="+1 555 000 0000"
                          autoComplete="tel"
                          maxLength={30}
                        />
                      ),
                    })}

                    {/* Date of Birth */}
                    {renderField({
                      field:        'date_of_birth',
                      label:        'Date of Birth',
                      displayValue: formatDisplayDate(form.date_of_birth),
                      inputEl: (
                        <input
                          id="date_of_birth"
                          type="date"
                          className={`personal-field-input${fieldErrors.date_of_birth ? ' error' : ''}`}
                          value={form.date_of_birth}
                          onChange={e => handleChange('date_of_birth', e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      ),
                    })}

                    {/* Gender */}
                    {renderField({
                      field:        'gender',
                      label:        'Gender',
                      displayValue: form.gender ? (GENDER_LABELS[form.gender] ?? form.gender) : '',
                      inputEl: (
                        <select
                          id="gender"
                          className="personal-field-select"
                          value={form.gender}
                          onChange={e => handleChange('gender', e.target.value)}
                        >
                          {GENDER_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      ),
                    })}

                    {/* ── Save / Cancel ── */}
                    <div className="verify-number-btn" style={{ marginTop: 24 }}>
                      <button
                        type="submit"
                        disabled={saving || !hasEdits}
                        style={{
                          opacity:        (!hasEdits || saving) ? 0.6 : 1,
                          cursor:         (!hasEdits || saving) ? 'not-allowed' : 'pointer',
                          display:        'flex',
                          alignItems:     'center',
                          justifyContent: 'center',
                          gap: 8, width: '100%',
                        }}
                      >
                        {saving && <Spinner small />}
                        {saving ? 'Saving…' : 'Update Changes'}
                      </button>
                    </div>

                    {hasEdits && !saving && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFields(new Set());
                          if (profile) {
                            setForm({
                              name:          profile.name          ?? '',
                              phone:         profile.phone         ?? '',
                              date_of_birth: profile.date_of_birth ?? '',
                              gender:        profile.gender        ?? '',
                            });
                          }
                          setFieldErrors({});
                          setSaveError('');
                        }}
                        style={{
                          marginTop: 10, width: '100%', background: 'none',
                          border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 0',
                          color: '#6b7280', fontSize: 14, cursor: 'pointer', fontWeight: 500,
                        }}
                      >
                        Cancel All Changes
                      </button>
                    )}

                  </form>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;
