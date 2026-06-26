import React, { useState } from 'react';
import BackBtn from '../components/BackBtn.tsx';
import { useTranslation } from 'react-i18next';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

interface FaqCategory {
  label: string;
  items: FaqItem[];
}

// ─── Accordion icons (inline SVG — dark mode safe) ────────────────────────────

const PlusIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M10 4.167v11.666M4.167 10h11.666" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const MinusIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M4.167 10h11.666" stroke="#7B51F1" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ─── Scoped styles ────────────────────────────────────────────────────────────

const STYLES = `
  /* Override the CSS ::before SVG content trick — we render icons in JSX instead */
  #faq-main .nested-accordion h3::before { content: none !important; }

  .faq-category-label {
    color: var(--sub-text-color);
    font-family: Poppins, sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    padding: 20px 0 8px;
  }
  .faq-category-label:first-child { padding-top: 0; }

  .faq-item {
    border-bottom: 1px solid var(--border-color);
    padding: 16px 0;
  }
  .faq-item:last-child { border-bottom: none; }

  .faq-question-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    cursor: pointer;
    background: none;
    border: none;
    width: 100%;
    padding: 0;
    text-align: left;
  }
  .faq-question-text {
    color: var(--text-color);
    font-family: Satoshi, sans-serif;
    font-size: 15px;
    font-weight: 700;
    line-height: 22px;
    flex: 1;
  }
  .faq-question-text.open { color: #7B51F1; }

  .faq-icon {
    flex-shrink: 0;
    margin-top: 1px;
    color: var(--sub-text-color);
    transition: color 0.2s ease;
  }

  .faq-answer {
    color: var(--sub-text-color);
    font-family: Satoshi, sans-serif;
    font-size: 14px;
    font-weight: 500;
    line-height: 22px;
    margin-top: 10px;
    padding-right: 32px;
  }
`;

// ─── Page ─────────────────────────────────────────────────────────────────────

const Faq: React.FC = () => {
  const { t } = useTranslation();
  const [openId, setOpenId] = useState<number | null>(null);

  const toggle = (id: number) => setOpenId((prev) => (prev === id ? null : id));

  const FAQ_DATA: FaqCategory[] = [
    {
      label: t('Getting Started'),
      items: [
        {
          id: 1,
          question: t('How do I create my first account?'),
          answer: t('After signing up, go to Settings → Wallets & Accounts and tap "Add Account". Enter a name, choose a currency, and set an opening balance. Your new account will appear on the Home dashboard instantly.'),
        },
        {
          id: 2,
          question: t('How do I add my first transaction?'),
          answer: t('Tap the "+" button on the Home screen. Choose the type (Expense or Income), select a category, enter the amount, pick the date, and optionally attach a photo receipt. Tap Save to confirm.'),
        },
        {
          id: 3,
          question: t('Can I import transactions from a CSV file?'),
          answer: t('Yes. Go to Settings → Data & Privacy and use the CSV Import option. Download the sample template, fill it with your transaction data, then upload the file. Kenfinly validates each row before importing and shows a detailed error report for any issues.'),
        },
      ],
    },
    {
      label: t('Accounts & Budgets'),
      items: [
        {
          id: 4,
          question: t('Can I manage multiple accounts and currencies?'),
          answer: t('Absolutely. Kenfinly supports unlimited accounts in different currencies (USD, VND, EUR, and more). Each account is tracked independently, and the Home dashboard can display totals converted to your preferred currency.'),
        },
        {
          id: 5,
          question: t('How do I set a spending budget?'),
          answer: t('Navigate to the Budget section from the Home screen. Tap "Add Budget", choose a category (e.g., Food, Transport), set the monthly limit, and optionally enable smart notifications when you reach 80% of your limit.'),
        },
        {
          id: 6,
          question: t('How do I invite someone to share an account?'),
          answer: t("Open the account from Wallets & Accounts, tap \"Participants\", then \"Invite\". Enter the person's email address. They will receive an invitation link and can join with an owner, editor, or viewer role."),
        },
      ],
    },
    {
      label: t('Security & Privacy'),
      items: [
        {
          id: 7,
          question: t('Is my financial data secure?'),
          answer: t('Yes. All data is encrypted in transit (TLS) and at rest. Authentication uses JWT tokens with short expiry windows. You can also enable PIN or biometric login for an extra layer of protection on your device.'),
        },
        {
          id: 8,
          question: t('How do I reset my PIN or password?'),
          answer: t('For password reset, tap "Forgot Password?" on the Sign In screen and follow the email link. For PIN reset, go to Settings → Security and choose "Change PIN". You\'ll need to confirm your current password first.'),
        },
        {
          id: 9,
          question: t('What data is collected and how is it used?'),
          answer: t('Kenfinly collects only the data you enter (transactions, account names, categories). We do not sell your data to third parties. You can download or delete all your data at any time from Settings → Data & Privacy.'),
        },
      ],
    },
    {
      label: t('Payments & Subscriptions'),
      items: [
        {
          id: 10,
          question: t('What payment methods does Kenfinly support?'),
          answer: t('Kenfinly supports credit/debit cards and PayPal for subscription payments. Payment information is processed securely and never stored on our servers — we use a PCI-compliant payment processor.'),
        },
        {
          id: 11,
          question: t('How do I cancel or change my subscription plan?'),
          answer: t('Go to Settings → Subscriptions. Tap "Manage Plan" to upgrade, downgrade, or cancel. Cancellations take effect at the end of the current billing period and your data remains accessible until then.'),
        },
      ],
    },
  ];

  return (
    <div>
      <style>{STYLES}</style>

      <div className="site-content">
        <div className="verify-number-main">

          {/* ── Header ── */}
          <div className="verify-number-top">
            <div className="container">
              <div className="verify-number-top-content">
                <div className="back-btn">
                  <BackBtn />
                </div>
                <div className="header-title">
                  <p>{t('FAQs')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Content ── */}
          <div className="verify-number-bottom" id="faq-main">
            <div className="verify-number-bottom-wrap">
              <div className="verify-number-content">

                {FAQ_DATA.map((category) => (
                  <div key={category.label}>
                    <p className="faq-category-label">{category.label}</p>

                    <div className="nested-accordion">
                      {category.items.map((item) => {
                        const isOpen = openId === item.id;
                        return (
                          <div key={item.id} className="faq-item">
                            <button
                              type="button"
                              className="faq-question-row"
                              onClick={() => toggle(item.id)}
                              aria-expanded={isOpen}
                            >
                              <span className={`faq-question-text${isOpen ? ' open' : ''}`}>
                                {item.question}
                              </span>
                              <span className="faq-icon">
                                {isOpen ? <MinusIcon /> : <PlusIcon />}
                              </span>
                            </button>

                            {isOpen && (
                              <p className="faq-answer">{item.answer}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Faq;
