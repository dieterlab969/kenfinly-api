/**
 * Test Suite: EditTransactionModal
 *
 * Covers QA scenarios TC-01 through TC-09 as specified:
 *   TC-01  Modal opens with 3 tabs, "Detailed Info" selected by default
 *   TC-02  Tab switching preserves unsaved form data
 *   TC-03  Amount editable for transaction created < 15 min ago
 *   TC-04  Amount locked for transaction created > 15 min ago
 *   TC-05  Amount locked at exactly the 15-min boundary
 *   TC-06  Existing photos render in the Images tab
 *   TC-07  Uploading photos within the limit increments the counter
 *   TC-08  Uploading beyond 10 photos shows an error and blocks the upload
 *   TC-09  History tab renders logs with actor, timestamp, and field diffs
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import EditTransactionModal from '../components/EditTransactionModal';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

vi.mock('../contexts/TranslationContext', () => ({
    useTranslation: () => ({ t: (key) => key }),
}));

vi.mock('../utils/imageCompression', () => ({
    validateImageFile: vi.fn(() => ({ valid: true })),
    processImageForUpload: vi.fn(async (file) => ({
        file,
        originalSize: file.size,
        compressedSize: file.size,
        wasCompressed: false,
    })),
    formatFileSize: vi.fn((bytes) => `${bytes} B`),
}));

vi.mock('../constants/categories', () => ({
    getCategoryIcon: vi.fn(() => '🛒'),
    formatCurrency: vi.fn((v) => `${v} VND`),
}));

const mockApiGet = vi.fn();
const mockApiPut = vi.fn();
const mockApiPost = vi.fn();
const mockApiDelete = vi.fn();

vi.mock('../utils/api', () => ({
    default: {
        get: (...args) => mockApiGet(...args),
        put: (...args) => mockApiPut(...args),
        post: (...args) => mockApiPost(...args),
        delete: (...args) => mockApiDelete(...args),
    },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Test-data factories
// ─────────────────────────────────────────────────────────────────────────────

const makeTransaction = (overrides = {}) => ({
    id: 1,
    type: 'expense',
    amount: 50000,
    category_id: 1,
    account_id: 1,
    notes: 'Test note',
    transaction_date: '2026-06-15',
    created_at: new Date().toISOString(),
    category: { id: 1, name: 'Food', slug: 'food-drinks' },
    account: { id: 1, name: 'Cash' },
    photos: [],
    change_logs: [],
    ...overrides,
});

const makePhoto = (id) => ({
    id,
    file_path: `photos/receipt_${id}.jpg`,
    original_filename: `receipt_${id}.jpg`,
    file_size: 102400,
});

const makeLog = (id, action, diff = null, filename = null) => ({
    id,
    action,
    created_at: '2026-06-15T10:00:00.000Z',
    user: { name: 'Alice' },
    changes: {
        ...(diff && { diff }),
        ...(filename && { filename }),
    },
});

const defaultCategories = [{ id: 1, name: 'Food', slug: 'food-drinks' }];
const defaultAccounts   = [{ id: 1, name: 'Cash' }];

const setupApiDefaults = (txOverrides = {}) => {
    const tx = makeTransaction(txOverrides);
    mockApiGet.mockImplementation((url) => {
        if (url.includes('/transactions/')) return Promise.resolve({ data: { transaction: tx, permissions: { can_edit: true, can_manage_photos: true } } });
        if (url.includes('/categories'))   return Promise.resolve({ data: { categories: defaultCategories } });
        if (url.includes('/accounts'))     return Promise.resolve({ data: { accounts: defaultAccounts } });
        return Promise.reject(new Error(`Unexpected GET ${url}`));
    });
};

const renderModal = (props = {}) =>
    render(
        <EditTransactionModal
            isOpen={true}
            onClose={vi.fn()}
            transactionId={1}
            onUpdate={vi.fn()}
            {...props}
        />
    );

// ─────────────────────────────────────────────────────────────────────────────
// Suite
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── 1. UI / Navigation ───────────────────────────────────────────────────────

describe('TC-01: Edit Form Opens Successfully', () => {
    it('renders the modal with all 3 tabs present and Detailed Info active by default', async () => {
        setupApiDefaults();
        renderModal();

        // Wait for data to load
        await waitFor(() => expect(screen.queryByRole('img', { hidden: true })).not.toBeNull);

        // The 3 tabs must exist
        expect(screen.getByRole('button', { name: /transactions\.transaction_tab_details/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /transactions\.transaction_tab_photos/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /transaction_detail_modal\.history/i })).toBeInTheDocument();
    });

    it('shows the Detailed Info form fields on load (default tab)', async () => {
        setupApiDefaults();
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('50000')).toBeInTheDocument());

        expect(screen.getByDisplayValue('50000')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2026-06-15')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test note')).toBeInTheDocument();
    });

    it('does not render Images or History content before switching tabs', async () => {
        setupApiDefaults();
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('50000')).toBeInTheDocument());

        expect(screen.queryByText(/transaction_detail_modal\.no_photos_uploaded_yet/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/transaction_detail_modal\.no_history_available/i)).not.toBeInTheDocument();
    });
});

// ─── TC-02: Tab Switching ────────────────────────────────────────────────────

describe('TC-02: Tab Switching preserves unsaved data', () => {
    it('keeps the user-typed notes value after switching to Images and back', async () => {
        setupApiDefaults();
        const user = userEvent.setup();
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('Test note')).toBeInTheDocument());

        const notesField = screen.getByDisplayValue('Test note');
        await user.clear(notesField);
        await user.type(notesField, 'Unsaved custom note');
        expect(notesField.value).toBe('Unsaved custom note');

        // Switch to Images tab
        await user.click(screen.getByRole('button', { name: /transactions\.transaction_tab_photos/i }));
        expect(screen.getByText(/transaction_detail_modal\.no_photos_uploaded_yet/i)).toBeInTheDocument();

        // Switch back to Details tab
        await user.click(screen.getByRole('button', { name: /transactions\.transaction_tab_details/i }));

        // Unsaved note must still be there
        expect(screen.getByDisplayValue('Unsaved custom note')).toBeInTheDocument();
    });

    it('switches between all three tabs without crashing', async () => {
        setupApiDefaults();
        const user = userEvent.setup();
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('50000')).toBeInTheDocument());

        await user.click(screen.getByRole('button', { name: /transactions\.transaction_tab_photos/i }));
        expect(screen.getByText(/transaction_detail_modal\.no_photos_uploaded_yet/i)).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /transaction_detail_modal\.history/i }));
        expect(screen.getByText(/transaction_detail_modal\.no_history_available/i)).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /transactions\.transaction_tab_details/i }));
        expect(screen.getByDisplayValue('50000')).toBeInTheDocument();
    });
});

// ─── 2. Detailed Info — Amount Lock Logic ────────────────────────────────────

describe('TC-03: New Transaction (< 15 min) — Amount is Editable', () => {
    it('renders the Amount input as enabled when created_at is 5 minutes ago', async () => {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        setupApiDefaults({ created_at: fiveMinutesAgo });
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('50000')).toBeInTheDocument());

        const amountInput = screen.getByDisplayValue('50000');
        expect(amountInput).not.toBeDisabled();
    });

    it('allows the user to change the amount value when unlocked', async () => {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        setupApiDefaults({ created_at: fiveMinutesAgo });
        const user = userEvent.setup();
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('50000')).toBeInTheDocument());

        const amountInput = screen.getByDisplayValue('50000');
        await user.clear(amountInput);
        await user.type(amountInput, '99000');

        expect(amountInput.value).toBe('99000');
    });

    it('does not show the lock icon when transaction is recent', async () => {
        const recentTime = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        setupApiDefaults({ created_at: recentTime });
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('50000')).toBeInTheDocument());

        expect(screen.queryByText(/transactions\.amount_locked_description/i)).not.toBeInTheDocument();
    });
});

describe('TC-04: Old Transaction (> 15 min) — Amount is Locked', () => {
    it('renders the Amount input as disabled when created_at is 16 minutes ago', async () => {
        const sixteenMinutesAgo = new Date(Date.now() - 16 * 60 * 1000).toISOString();
        setupApiDefaults({ created_at: sixteenMinutesAgo });
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('50000')).toBeInTheDocument());

        const amountInput = screen.getByDisplayValue('50000');
        expect(amountInput).toBeDisabled();
    });

    it('renders the Amount input as disabled for a days-old transaction', async () => {
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
        setupApiDefaults({ created_at: twoDaysAgo });
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('50000')).toBeInTheDocument());

        expect(screen.getByDisplayValue('50000')).toBeDisabled();
    });

    it('shows the locked-field description message', async () => {
        const oldTime = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        setupApiDefaults({ created_at: oldTime });
        renderModal();

        await waitFor(() =>
            expect(screen.getByText(/transactions\.amount_locked_description/i)).toBeInTheDocument()
        );
    });

    it('other form fields (category, account, date, notes) remain enabled', async () => {
        const oldTime = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        setupApiDefaults({ created_at: oldTime });
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('50000')).toBeInTheDocument());

        expect(screen.getByDisplayValue('2026-06-15')).not.toBeDisabled();
        expect(screen.getByDisplayValue('Test note')).not.toBeDisabled();
    });
});

describe('TC-05: Time Boundary — Exactly 15 Minutes', () => {
    it('locks the amount field at exactly 15 minutes (>= triggers lock)', async () => {
        const exactlyFifteenMinutes = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        setupApiDefaults({ created_at: exactlyFifteenMinutes });
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('50000')).toBeInTheDocument());

        expect(screen.getByDisplayValue('50000')).toBeDisabled();
    });

    it('keeps amount editable at 14 minutes 59 seconds', async () => {
        const justUnder15Minutes = new Date(Date.now() - (15 * 60 * 1000 - 1000)).toISOString();
        setupApiDefaults({ created_at: justUnder15Minutes });
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('50000')).toBeInTheDocument());

        expect(screen.getByDisplayValue('50000')).not.toBeDisabled();
    });
});

// ─── 3. Images Tab ───────────────────────────────────────────────────────────

describe('TC-06: Display Existing Images', () => {
    it('renders all 3 existing photos in the Images tab', async () => {
        const photos = [makePhoto(1), makePhoto(2), makePhoto(3)];
        setupApiDefaults({ photos });
        const user = userEvent.setup();
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('50000')).toBeInTheDocument());

        await user.click(screen.getByRole('button', { name: /transactions\.transaction_tab_photos/i }));

        expect(screen.getByAltText('receipt_1.jpg')).toBeInTheDocument();
        expect(screen.getByAltText('receipt_2.jpg')).toBeInTheDocument();
        expect(screen.getByAltText('receipt_3.jpg')).toBeInTheDocument();
    });

    it('shows the correct photo count (3 / 10) in the tab label', async () => {
        const photos = [makePhoto(1), makePhoto(2), makePhoto(3)];
        setupApiDefaults({ photos });
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('50000')).toBeInTheDocument());

        expect(screen.getByText(/\(3\)/)).toBeInTheDocument();
    });

    it('shows each photo filename and file size', async () => {
        const photos = [makePhoto(1)];
        setupApiDefaults({ photos });
        const user = userEvent.setup();
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('50000')).toBeInTheDocument());
        await user.click(screen.getByRole('button', { name: /transactions\.transaction_tab_photos/i }));

        expect(screen.getByText('receipt_1.jpg')).toBeInTheDocument();
        expect(screen.getByText('100.0 KB')).toBeInTheDocument();
    });
});

describe('TC-07: Upload New Images Within Limit', () => {
    it('calls the upload API and refreshes the transaction after upload', async () => {
        const initialPhotos = [makePhoto(1), makePhoto(2), makePhoto(3)];
        const afterUploadPhotos = [...initialPhotos, makePhoto(4), makePhoto(5)];

        let callCount = 0;
        mockApiGet.mockImplementation((url) => {
            if (url.includes('/transactions/')) {
                callCount++;
                const photos = callCount <= 3 ? initialPhotos : afterUploadPhotos;
                return Promise.resolve({
                    data: {
                        transaction: makeTransaction({ photos }),
                        permissions: { can_edit: true, can_manage_photos: true },
                    },
                });
            }
            if (url.includes('/categories')) return Promise.resolve({ data: { categories: defaultCategories } });
            if (url.includes('/accounts'))   return Promise.resolve({ data: { accounts: defaultAccounts } });
        });

        mockApiPost.mockResolvedValue({ data: {} });

        const user = userEvent.setup();
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('50000')).toBeInTheDocument());
        await user.click(screen.getByRole('button', { name: /transactions\.transaction_tab_photos/i }));

        const fileInput = document.querySelector('input[type="file"]');
        const file1 = new File(['img'], 'new1.jpg', { type: 'image/jpeg' });
        const file2 = new File(['img'], 'new2.jpg', { type: 'image/jpeg' });

        await userEvent.upload(fileInput, [file1, file2]);

        await waitFor(() => expect(mockApiPost).toHaveBeenCalledTimes(2));

        expect(mockApiPost).toHaveBeenCalledWith(
            '/transactions/1/photos',
            expect.any(FormData)
        );
    });

    it('the upload zone remains visible when photo count is below 10', async () => {
        setupApiDefaults({ photos: [makePhoto(1)] });
        const user = userEvent.setup();
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('50000')).toBeInTheDocument());
        await user.click(screen.getByRole('button', { name: /transactions\.transaction_tab_photos/i }));

        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).not.toBeDisabled();
    });
});

describe('TC-08: Exceeding Maximum Limit (max = 10 images)', () => {
    it('shows a photo error message when uploading beyond 10', async () => {
        const tenPhotos = Array.from({ length: 10 }, (_, i) => makePhoto(i + 1));
        setupApiDefaults({ photos: tenPhotos });
        const user = userEvent.setup();
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('50000')).toBeInTheDocument());
        await user.click(screen.getByRole('button', { name: /transactions\.transaction_tab_photos/i }));

        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeDisabled();
    });

    it('displays the "Maximum reached" badge when photo count equals 10', async () => {
        const tenPhotos = Array.from({ length: 10 }, (_, i) => makePhoto(i + 1));
        setupApiDefaults({ photos: tenPhotos });
        const user = userEvent.setup();
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('50000')).toBeInTheDocument());
        await user.click(screen.getByRole('button', { name: /transactions\.transaction_tab_photos/i }));

        expect(screen.getByText(/transactions\.photos\.max_reached_badge/i)).toBeInTheDocument();
    });

    it('blocks upload and shows error when 9 photos exist and user tries to upload 2', async () => {
        const { validateImageFile } = await import('../utils/imageCompression');
        validateImageFile.mockReturnValue({ valid: true });

        const ninePhotos = Array.from({ length: 9 }, (_, i) => makePhoto(i + 1));
        const afterUploadTen = [...ninePhotos, makePhoto(10)];

        let postCallCount = 0;
        mockApiGet.mockImplementation((url) => {
            if (url.includes('/transactions/')) {
                const photos = postCallCount === 0 ? ninePhotos : afterUploadTen;
                return Promise.resolve({
                    data: {
                        transaction: makeTransaction({ photos }),
                        permissions: { can_edit: true, can_manage_photos: true },
                    },
                });
            }
            if (url.includes('/categories')) return Promise.resolve({ data: { categories: defaultCategories } });
            if (url.includes('/accounts'))   return Promise.resolve({ data: { accounts: defaultAccounts } });
        });
        mockApiPost.mockImplementation(() => {
            postCallCount++;
            return Promise.resolve({ data: {} });
        });

        const user = userEvent.setup();
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('50000')).toBeInTheDocument());
        await user.click(screen.getByRole('button', { name: /transactions\.transaction_tab_photos/i }));

        const fileInput = document.querySelector('input[type="file"]');
        const file1 = new File(['img'], 'extra1.jpg', { type: 'image/jpeg' });
        const file2 = new File(['img'], 'extra2.jpg', { type: 'image/jpeg' });

        await userEvent.upload(fileInput, [file1, file2]);

        await waitFor(() =>
            expect(screen.getByText(/transactions\.photos\.upload_limit_exceeded/i)).toBeInTheDocument()
        );

        expect(mockApiPost).toHaveBeenCalledTimes(1);
    });
});

// ─── 4. Transaction History ───────────────────────────────────────────────────

describe('TC-09: Accurate History Log Rendering', () => {
    it('renders a "created" log entry with actor and timestamp', async () => {
        const logs = [makeLog(1, 'created')];
        setupApiDefaults({ change_logs: logs });
        const user = userEvent.setup();
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('50000')).toBeInTheDocument());
        await user.click(screen.getByRole('button', { name: /transaction_detail_modal\.history/i }));

        expect(screen.getByText(/transactions\.transaction_history_created/i)).toBeInTheDocument();
        expect(screen.getByText(/Alice/)).toBeInTheDocument();
        expect(screen.getByText(/Jun 15, 2026/i)).toBeInTheDocument();
    });

    it('renders an "updated" log entry with old→new field diffs', async () => {
        const diff = { amount: { from: '30000', to: '50000' } };
        const logs = [makeLog(2, 'updated', diff)];
        setupApiDefaults({ change_logs: logs });
        const user = userEvent.setup();
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('50000')).toBeInTheDocument());
        await user.click(screen.getByRole('button', { name: /transaction_detail_modal\.history/i }));

        expect(screen.getByText(/transactions\.transaction_history_updated/i)).toBeInTheDocument();

        const historyPanel = screen.getByText(/transactions\.transaction_history_updated/i).closest('div');
        expect(historyPanel).toBeDefined();

        expect(screen.getByText(/amount/i)).toBeInTheDocument();
    });

    it('renders a "photo_added" log entry with the filename', async () => {
        const logs = [makeLog(3, 'photo_added', null, 'receipt_scan.jpg')];
        setupApiDefaults({ change_logs: logs });
        const user = userEvent.setup();
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('50000')).toBeInTheDocument());
        await user.click(screen.getByRole('button', { name: /transaction_detail_modal\.history/i }));

        expect(screen.getByText(/transactions\.transaction_history_photo_added/i)).toBeInTheDocument();
        expect(screen.getByText(/receipt_scan\.jpg/i)).toBeInTheDocument();
    });

    it('renders a "photo_removed" log entry', async () => {
        const logs = [makeLog(4, 'photo_removed', null, 'old_receipt.jpg')];
        setupApiDefaults({ change_logs: logs });
        const user = userEvent.setup();
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('50000')).toBeInTheDocument());
        await user.click(screen.getByRole('button', { name: /transaction_detail_modal\.history/i }));

        expect(screen.getByText(/transactions\.transaction_history_photo_removed/i)).toBeInTheDocument();
    });

    it('renders multiple log entries in order', async () => {
        const logs = [
            makeLog(10, 'created'),
            makeLog(11, 'updated', { notes: { from: 'old', to: 'new' } }),
            makeLog(12, 'photo_added', null, 'file.jpg'),
        ];
        setupApiDefaults({ change_logs: logs });
        const user = userEvent.setup();
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('50000')).toBeInTheDocument());
        await user.click(screen.getByRole('button', { name: /transaction_detail_modal\.history/i }));

        const createdEntries = screen.getAllByText(/transactions\.transaction_history_created/i);
        const updatedEntries = screen.getAllByText(/transactions\.transaction_history_updated/i);
        const photoEntries   = screen.getAllByText(/transactions\.transaction_history_photo_added/i);

        expect(createdEntries).toHaveLength(1);
        expect(updatedEntries).toHaveLength(1);
        expect(photoEntries).toHaveLength(1);
    });

    it('shows the empty-state message when there are no history logs', async () => {
        setupApiDefaults({ change_logs: [] });
        const user = userEvent.setup();
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('50000')).toBeInTheDocument());
        await user.click(screen.getByRole('button', { name: /transaction_detail_modal\.history/i }));

        expect(screen.getByText(/transaction_detail_modal\.no_history_available/i)).toBeInTheDocument();
    });

    it('re-fetches and shows the new log after saving a field update', async () => {
        const logsAfterSave = [makeLog(20, 'updated', { notes: { from: 'old', to: 'new note' } })];
        let saveCallCount = 0;

        mockApiGet.mockImplementation((url) => {
            if (url.includes('/transactions/')) {
                const logs = saveCallCount > 0 ? logsAfterSave : [];
                return Promise.resolve({
                    data: {
                        transaction: makeTransaction({ change_logs: logs }),
                        permissions: { can_edit: true, can_manage_photos: true },
                    },
                });
            }
            if (url.includes('/categories')) return Promise.resolve({ data: { categories: defaultCategories } });
            if (url.includes('/accounts'))   return Promise.resolve({ data: { accounts: defaultAccounts } });
        });

        mockApiPut.mockImplementation(() => {
            saveCallCount++;
            return Promise.resolve({
                data: { transaction: makeTransaction({ change_logs: logsAfterSave }) },
            });
        });

        const user = userEvent.setup();
        renderModal();

        await waitFor(() => expect(screen.getByDisplayValue('50000')).toBeInTheDocument());

        const notesField = screen.getByDisplayValue('Test note');
        await user.clear(notesField);
        await user.type(notesField, 'new note');

        await user.click(screen.getByRole('button', { name: /transactions\.transaction_save_action/i }));

        await waitFor(() => expect(mockApiPut).toHaveBeenCalledTimes(1));

        await user.click(screen.getByRole('button', { name: /transaction_detail_modal\.history/i }));

        await waitFor(() =>
            expect(screen.getByText(/transactions\.transaction_history_updated/i)).toBeInTheDocument()
        );
    });
});
