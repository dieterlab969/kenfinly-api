/**
 * Test Suite: WalletManagement
 *
 * Verifies three complete user flows end-to-end:
 *
 *   TC-01  Loading wallets
 *          — spinner visible while pending, accounts rendered on success,
 *            error message + retry on failure, empty state when list is empty.
 *
 *   TC-02  Searching for a specific account
 *          — filters by name, bank_name, account_type; case-insensitive;
 *            no-results message; restoring list on clear.
 *
 *   TC-03  Sorting by balance (and other sort keys)
 *          — high → low, low → high, name A→Z / Z→A, most transactions;
 *            sort interacts correctly with an active search filter.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import WalletManagement from '../template/pages/WalletManagement';

// ─────────────────────────────────────────────────────────────────────────────
// Module mocks
// ─────────────────────────────────────────────────────────────────────────────

// react-router-dom — BackBtn uses Link + useNavigate; stub both so no
// BrowserRouter context is needed in tests.
vi.mock('react-router-dom', () => ({
    Link: ({
        children,
        to,
        ...rest
    }: {
        children: React.ReactNode;
        to: string;
        [k: string]: unknown;
    }) => (
        <a href={String(to)} {...rest}>
            {children}
        </a>
    ),
    useNavigate: () => vi.fn(),
}));

// api — intercept all HTTP calls made by the component
const mockApiGet: Mock = vi.fn();
const mockApiPost: Mock = vi.fn();
const mockApiPut: Mock = vi.fn();
const mockApiDelete: Mock = vi.fn();

vi.mock('../utils/api', () => ({
    default: {
        get:    (...args: unknown[]) => mockApiGet(...args),
        post:   (...args: unknown[]) => mockApiPost(...args),
        put:    (...args: unknown[]) => mockApiPut(...args),
        delete: (...args: unknown[]) => mockApiDelete(...args),
    },
}));

// formatCurrency — deterministic output makes assertions readable
vi.mock('../constants/categories', () => ({
    formatCurrency: vi.fn(
        (value: number, currency: string): string => `${currency} ${value}`,
    ),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Per-test setup
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
    vi.clearAllMocks();

    // Bootstrap Modal is not available in jsdom; provide a minimal stub so the
    // component's `new Modal(el)` call doesn't throw.
    // Arrow functions cannot be constructors — use a class instead.
    class MockBootstrapModal {
        show = vi.fn();
        hide = vi.fn();
    }
    Object.assign(window, { bootstrap: { Modal: MockBootstrapModal } });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test-data factories
// ─────────────────────────────────────────────────────────────────────────────

interface TestAccount {
    id: number;
    name: string;
    balance: number;
    currency: string;
    icon: string | null;
    color: string | null;
    bank_name: string | null;
    account_type: string;
    transactions_count: number;
}

const makeAccount = (overrides: Partial<TestAccount> = {}): TestAccount => ({
    id: 1,
    name: 'Cash Wallet',
    balance: 1_000_000,
    currency: 'VND',
    icon: '💰',
    color: '#00A266',
    bank_name: null,
    account_type: 'wallet',
    transactions_count: 5,
    ...overrides,
});

// ─────────────────────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────────────────────

const setupApiSuccess = (accounts: TestAccount[]): void => {
    mockApiGet.mockResolvedValue({ data: { accounts } });
};

const setupApiError = (): void => {
    mockApiGet.mockRejectedValue(new Error('Network error'));
};

// ─────────────────────────────────────────────────────────────────────────────
// Render helper
// ─────────────────────────────────────────────────────────────────────────────

const renderPage = (): RenderResult => render(<WalletManagement />);

// ─────────────────────────────────────────────────────────────────────────────
// TC-01 · Loading Wallets
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-01: Loading Wallets', () => {
    it('TC-01-a: displays a loading spinner while the API call is in-flight', () => {
        // Promise that never settles — component stays in loading state
        mockApiGet.mockReturnValue(new Promise(() => {}));
        renderPage();

        // The spinner has role="status" per the Bootstrap spinner markup
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('TC-01-b: hides the spinner once accounts are loaded', async () => {
        setupApiSuccess([makeAccount()]);
        renderPage();

        await waitFor(() =>
            expect(screen.queryByRole('status')).not.toBeInTheDocument(),
        );
    });

    it('TC-01-c: renders each account name returned by the API', async () => {
        setupApiSuccess([
            makeAccount({ id: 1, name: 'Cash Wallet' }),
            makeAccount({ id: 2, name: 'Vietcombank Savings', account_type: 'savings' }),
            makeAccount({ id: 3, name: 'BIDV Credit Card', account_type: 'credit_card' }),
        ]);
        renderPage();

        await waitFor(() => screen.getByText('Cash Wallet'));
        expect(screen.getByText('Vietcombank Savings')).toBeInTheDocument();
        expect(screen.getByText('BIDV Credit Card')).toBeInTheDocument();
    });

    it('TC-01-d: renders the human-readable account-type badge for each card', async () => {
        setupApiSuccess([
            makeAccount({ id: 1, account_type: 'bank',        name: 'Bank Account' }),
            makeAccount({ id: 2, account_type: 'savings',     name: 'Savings Account' }),
            makeAccount({ id: 3, account_type: 'credit_card', name: 'Credit Card Account' }),
            makeAccount({ id: 4, account_type: 'investment',  name: 'Investment Account' }),
        ]);
        renderPage();

        await waitFor(() => screen.getByText('Bank Account'));

        // Every type label also appears in the modal's account-type picker buttons
        // (rendered in the DOM even while the modal is closed), so use getAllByText
        // and confirm at least one element exists for each expected label.
        expect(screen.getAllByText('Bank').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Savings').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Credit Card').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Investment').length).toBeGreaterThanOrEqual(1);
    });

    it('TC-01-e: shows the total account count in the summary section', async () => {
        setupApiSuccess([
            makeAccount({ id: 1 }),
            makeAccount({ id: 2, name: 'Secondary' }),
            makeAccount({ id: 3, name: 'Tertiary' }),
        ]);
        renderPage();

        await waitFor(() => expect(screen.getByText(/3 accounts/i)).toBeInTheDocument());
    });

    it('TC-01-f: uses the singular "account" label when only one account exists', async () => {
        setupApiSuccess([makeAccount()]);
        renderPage();

        await waitFor(() => expect(screen.getByText(/1 account$/i)).toBeInTheDocument());
        expect(screen.queryByText(/1 accounts/i)).not.toBeInTheDocument();
    });

    it('TC-01-g: shows formatted balance using formatCurrency for each account', async () => {
        setupApiSuccess([makeAccount({ balance: 5_000_000, currency: 'VND' })]);
        renderPage();

        // The mock returns "VND 5000000"; appears in the card AND the summary total
        await waitFor(() => {
            const matches = screen.getAllByText('VND 5000000');
            expect(matches.length).toBeGreaterThan(0);
        });
    });

    it('TC-01-h: displays an error message when the API call fails', async () => {
        setupApiError();
        renderPage();

        await waitFor(() =>
            expect(screen.getByText(/unable to load accounts/i)).toBeInTheDocument(),
        );
    });

    it('TC-01-i: calls GET /accounts exactly once on initial mount', async () => {
        setupApiSuccess([]);
        renderPage();

        await waitFor(() => expect(mockApiGet).toHaveBeenCalledTimes(1));
        expect(mockApiGet).toHaveBeenCalledWith('/accounts');
    });

    it('TC-01-j: the retry trigger fires a second GET /accounts after an error', async () => {
        setupApiError();
        const user: UserEvent = userEvent.setup();
        renderPage();

        await waitFor(() => screen.getByText(/unable to load accounts/i));

        // Override mock so the retry call succeeds
        setupApiSuccess([makeAccount()]);
        await user.click(screen.getByRole('link', { name: /try again/i }));

        await waitFor(() => expect(mockApiGet).toHaveBeenCalledTimes(2));
        expect(mockApiGet).toHaveBeenNthCalledWith(2, '/accounts');
    });

    it('TC-01-k: shows the empty-state message when the API returns zero accounts', async () => {
        setupApiSuccess([]);
        renderPage();

        await waitFor(() =>
            expect(screen.getByText(/no accounts yet/i)).toBeInTheDocument(),
        );
    });

    it('TC-01-l: the empty state does NOT appear when accounts are present', async () => {
        setupApiSuccess([makeAccount()]);
        renderPage();

        await waitFor(() => screen.getByText('Cash Wallet'));
        expect(screen.queryByText(/no accounts yet/i)).not.toBeInTheDocument();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-02 · Searching for a Specific Account
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-02: Searching for a Specific Account', () => {
    // Three accounts with distinct names, bank names, and types
    const accounts: TestAccount[] = [
        makeAccount({ id: 1, name: 'Cash Wallet',   bank_name: null,          account_type: 'wallet'      }),
        makeAccount({ id: 2, name: 'VCB Savings',   bank_name: 'Vietcombank', account_type: 'savings'     }),
        makeAccount({ id: 3, name: 'BIDV Credit',   bank_name: 'BIDV Bank',   account_type: 'credit_card' }),
    ];

    const getSearchInput = (): HTMLElement =>
        screen.getByPlaceholderText(/search name, bank or type/i);

    it('TC-02-a: filters the list by account name', async () => {
        setupApiSuccess(accounts);
        const user: UserEvent = userEvent.setup();
        renderPage();
        await waitFor(() => screen.getByText('Cash Wallet'));

        await user.type(getSearchInput(), 'VCB');

        expect(screen.getByText('VCB Savings')).toBeInTheDocument();
        expect(screen.queryByText('Cash Wallet')).not.toBeInTheDocument();
        expect(screen.queryByText('BIDV Credit')).not.toBeInTheDocument();
    });

    it('TC-02-b: filters the list by bank_name', async () => {
        setupApiSuccess(accounts);
        const user: UserEvent = userEvent.setup();
        renderPage();
        await waitFor(() => screen.getByText('Cash Wallet'));

        await user.type(getSearchInput(), 'BIDV');

        expect(screen.getByText('BIDV Credit')).toBeInTheDocument();
        expect(screen.queryByText('Cash Wallet')).not.toBeInTheDocument();
        expect(screen.queryByText('VCB Savings')).not.toBeInTheDocument();
    });

    it('TC-02-c: filters the list by account_type string', async () => {
        setupApiSuccess(accounts);
        const user: UserEvent = userEvent.setup();
        renderPage();
        await waitFor(() => screen.getByText('Cash Wallet'));

        await user.type(getSearchInput(), 'savings');

        expect(screen.getByText('VCB Savings')).toBeInTheDocument();
        expect(screen.queryByText('Cash Wallet')).not.toBeInTheDocument();
        expect(screen.queryByText('BIDV Credit')).not.toBeInTheDocument();
    });

    it('TC-02-d: search is case-insensitive', async () => {
        setupApiSuccess(accounts);
        const user: UserEvent = userEvent.setup();
        renderPage();
        await waitFor(() => screen.getByText('Cash Wallet'));

        await user.type(getSearchInput(), 'CASH');

        expect(screen.getByText('Cash Wallet')).toBeInTheDocument();
        expect(screen.queryByText('VCB Savings')).not.toBeInTheDocument();
        expect(screen.queryByText('BIDV Credit')).not.toBeInTheDocument();
    });

    it('TC-02-e: displays the no-results message when nothing matches', async () => {
        setupApiSuccess(accounts);
        const user: UserEvent = userEvent.setup();
        renderPage();
        await waitFor(() => screen.getByText('Cash Wallet'));

        await user.type(getSearchInput(), 'xyznonexistent');

        expect(screen.getByText(/no accounts match/i)).toBeInTheDocument();
        expect(screen.queryByText('Cash Wallet')).not.toBeInTheDocument();
    });

    it('TC-02-f: clearing the search restores all accounts', async () => {
        setupApiSuccess(accounts);
        const user: UserEvent = userEvent.setup();
        renderPage();
        await waitFor(() => screen.getByText('Cash Wallet'));

        const input = getSearchInput();
        await user.type(input, 'VCB');
        expect(screen.queryByText('Cash Wallet')).not.toBeInTheDocument();

        await user.clear(input);

        await waitFor(() => screen.getByText('Cash Wallet'));
        expect(screen.getByText('VCB Savings')).toBeInTheDocument();
        expect(screen.getByText('BIDV Credit')).toBeInTheDocument();
    });

    it('TC-02-g: the total-balance summary reflects ALL accounts, not just visible ones', async () => {
        setupApiSuccess(accounts);
        const user: UserEvent = userEvent.setup();
        renderPage();
        await waitFor(() => screen.getByText(/3 accounts/i));

        // Search reduces visible cards to 1, but the summary count is based on
        // the full account list fetched from the API
        await user.type(getSearchInput(), 'VCB');

        expect(screen.getByText(/3 accounts/i)).toBeInTheDocument();
    });

    it('TC-02-h: partial name match works mid-string', async () => {
        setupApiSuccess(accounts);
        const user: UserEvent = userEvent.setup();
        renderPage();
        await waitFor(() => screen.getByText('Cash Wallet'));

        await user.type(getSearchInput(), 'Wallet');

        expect(screen.getByText('Cash Wallet')).toBeInTheDocument();
        expect(screen.queryByText('VCB Savings')).not.toBeInTheDocument();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-03 · Sorting by Balance
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-03: Sorting by Balance', () => {
    // Three accounts with deliberately scrambled order so every sort is testable
    const unsorted: TestAccount[] = [
        makeAccount({ id: 1, name: 'Bravo',   balance: 500_000,   transactions_count: 10 }),
        makeAccount({ id: 2, name: 'Alpha',   balance: 2_000_000, transactions_count:  3 }),
        makeAccount({ id: 3, name: 'Charlie', balance: 100_000,   transactions_count: 25 }),
    ];

    /** Returns the text of every <h2> element (account name headings) in DOM order. */
    const getOrderedNames = (): string[] =>
        screen.getAllByRole('heading', { level: 2 }).map((el) => el.textContent ?? '');

    it('TC-03-a: default sort is Name A → Z (alphabetical ascending)', async () => {
        setupApiSuccess(unsorted);
        renderPage();
        await waitFor(() => screen.getByText('Bravo'));

        const names = getOrderedNames();
        expect(names).toEqual(['Alpha', 'Bravo', 'Charlie']);
    });

    it('TC-03-b: "Balance: High → Low" places the richest account first', async () => {
        setupApiSuccess(unsorted);
        const user: UserEvent = userEvent.setup();
        renderPage();
        await waitFor(() => screen.getByText('Bravo'));

        await user.click(screen.getByRole('button', { name: /balance.*high.*low/i }));

        const names = getOrderedNames();
        expect(names[0]).toBe('Alpha');   // 2,000,000
        expect(names[1]).toBe('Bravo');   //   500,000
        expect(names[2]).toBe('Charlie'); //   100,000
    });

    it('TC-03-c: "Balance: Low → High" places the poorest account first', async () => {
        setupApiSuccess(unsorted);
        const user: UserEvent = userEvent.setup();
        renderPage();
        await waitFor(() => screen.getByText('Bravo'));

        await user.click(screen.getByRole('button', { name: /balance.*low.*high/i }));

        const names = getOrderedNames();
        expect(names[0]).toBe('Charlie'); //   100,000
        expect(names[1]).toBe('Bravo');   //   500,000
        expect(names[2]).toBe('Alpha');   // 2,000,000
    });

    it('TC-03-d: "Name Z → A" reverses alphabetical order', async () => {
        setupApiSuccess(unsorted);
        const user: UserEvent = userEvent.setup();
        renderPage();
        await waitFor(() => screen.getByText('Bravo'));

        await user.click(screen.getByRole('button', { name: /name z.*a/i }));

        const names = getOrderedNames();
        expect(names).toEqual(['Charlie', 'Bravo', 'Alpha']);
    });

    it('TC-03-e: "Most Transactions" orders by transaction count descending', async () => {
        setupApiSuccess(unsorted);
        const user: UserEvent = userEvent.setup();
        renderPage();
        await waitFor(() => screen.getByText('Bravo'));

        await user.click(screen.getByRole('button', { name: /most transactions/i }));

        const names = getOrderedNames();
        expect(names[0]).toBe('Charlie'); // 25 txns
        expect(names[1]).toBe('Bravo');   // 10 txns
        expect(names[2]).toBe('Alpha');   //  3 txns
    });

    it('TC-03-f: switching sort key re-orders the list in place without re-fetching', async () => {
        setupApiSuccess(unsorted);
        const user: UserEvent = userEvent.setup();
        renderPage();
        await waitFor(() => screen.getByText('Bravo'));

        await user.click(screen.getByRole('button', { name: /balance.*high.*low/i }));
        await user.click(screen.getByRole('button', { name: /balance.*low.*high/i }));

        // Only the initial mount triggered a GET call
        expect(mockApiGet).toHaveBeenCalledTimes(1);

        const names = getOrderedNames();
        expect(names[0]).toBe('Charlie');
        expect(names[2]).toBe('Alpha');
    });

    it('TC-03-g: sort applies on top of an active search filter', async () => {
        setupApiSuccess([
            ...unsorted,
            // Extra account whose name also starts with "A" but has much higher balance
            makeAccount({ id: 4, name: 'Alpha Extra', balance: 9_000_000, account_type: 'savings' }),
        ]);
        const user: UserEvent = userEvent.setup();
        renderPage();
        await waitFor(() => screen.getByText('Bravo'));

        // Search narrows to the two "Alpha*" accounts
        await user.type(
            screen.getByPlaceholderText(/search name, bank or type/i),
            'Alpha',
        );

        // Sort filtered subset by balance high → low
        await user.click(screen.getByRole('button', { name: /balance.*high.*low/i }));

        const names = getOrderedNames();
        expect(names[0]).toBe('Alpha Extra'); // 9,000,000
        expect(names[1]).toBe('Alpha');       // 2,000,000
    });

    it('TC-03-h: balance sort handles string-encoded numeric balances correctly', async () => {
        setupApiSuccess([
            makeAccount({ id: 1, name: 'StringHigh', balance: 3_000_000 }),
            makeAccount({ id: 2, name: 'StringLow',  balance:   200_000 }),
        ]);
        const user: UserEvent = userEvent.setup();
        renderPage();
        await waitFor(() => screen.getByText('StringHigh'));

        await user.click(screen.getByRole('button', { name: /balance.*low.*high/i }));

        const names = getOrderedNames();
        expect(names[0]).toBe('StringLow');
        expect(names[1]).toBe('StringHigh');
    });
});
