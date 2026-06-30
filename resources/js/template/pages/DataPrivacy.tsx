import React from 'react';
import BackBtn from '../components/BackBtn.tsx';
import { useTranslation } from 'react-i18next';

// ─── Scoped styles ────────────────────────────────────────────────────────────

const STYLES = `
  .dp-section-title {
    color: var(--text-color);
    font-family: Poppins, sans-serif;
    font-size: 18px;
    font-weight: 600;
    line-height: 26px;
    margin-bottom: 12px;
  }
  .dp-card {
    border-radius: 12px;
    border: 2px solid var(--border-color);
    background: var(--primary-color);
    padding: 16px;
    margin-bottom: 12px;
  }
  .dp-card h3 {
    color: var(--text-color);
    font-family: Poppins, sans-serif;
    font-size: 15px;
    font-weight: 600;
    line-height: 22px;
    margin-bottom: 6px;
  }
  .dp-card p {
    color: var(--sub-text-color);
    font-family: Satoshi, sans-serif;
    font-size: 14px;
    font-weight: 500;
    line-height: 21px;
  }
  .dp-action-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: 12px;
    border: 2px solid var(--border-color);
    background: var(--primary-color);
    padding: 16px;
    margin-bottom: 12px;
    cursor: pointer;
  }
  .dp-action-row:last-child { margin-bottom: 0; }
  .dp-action-label h3 {
    color: var(--text-color);
    font-family: Poppins, sans-serif;
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  .dp-action-label p {
    color: var(--sub-text-color);
    font-family: Satoshi, sans-serif;
    font-size: 13px;
    font-weight: 500;
  }
  .dp-badge {
    display: inline-block;
    background: rgba(123, 81, 241, 0.10);
    color: #7B51F1;
    font-family: Satoshi, sans-serif;
    font-size: 11px;
    font-weight: 700;
    border-radius: 20px;
    padding: 3px 10px;
    white-space: nowrap;
  }
  .dp-divider {
    border: none;
    border-top: 1px solid var(--border-color);
    margin: 24px 0;
  }
`;

// ─── Page ─────────────────────────────────────────────────────────────────────

const DataPrivacy: React.FC = () => {
  const { t } = useTranslation();

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
                  <p>{t('Data & Privacy')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Content ── */}
          <div className="verify-number-bottom" id="data-privacy">
            <div className="verify-number-bottom-wrap">
              <div className="verify-number-content">

                {/* ── Permissions ── */}
                <h2 className="dp-section-title">{t('Permission & Access')}</h2>

                <div className="dp-card">
                  <h3>{t('Data You Share')}</h3>
                  <p>
                    {t('Kenfinly accesses only the financial data you enter — transactions, account names, categories, and budget limits. We never access contacts, messages, or any data outside the app.')}
                  </p>
                </div>

                <div className="dp-card">
                  <h3>{t('Search Privacy')}</h3>
                  <p>
                    {t('Your search queries within the app stay on your device. They are never uploaded to our servers or used to build advertising profiles.')}
                  </p>
                </div>

                <div className="dp-card">
                  <h3>{t('Blocked Contacts')}</h3>
                  <p>
                    {t('Contacts or collaborators you block are immediately removed from shared account views. They lose all access to accounts you manage.')}
                  </p>
                </div>

                <hr className="dp-divider" />

                {/* ── Manage Your Data ── */}
                <h2 className="dp-section-title">{t('Manage Your Data')}</h2>

                <div className="dp-action-row">
                  <div className="dp-action-label">
                    <h3>{t('Download Your Data')}</h3>
                    <p>{t('Export a full copy of your transactions and settings as CSV or JSON')}</p>
                  </div>
                  <span className="dp-badge">{t('Export')}</span>
                </div>

                <div className="dp-action-row">
                  <div className="dp-action-label">
                    <h3>{t('Correct Your Data')}</h3>
                    <p>{t('Edit or remove any personal information stored in your profile')}</p>
                  </div>
                  <span className="dp-badge">{t('Edit')}</span>
                </div>

                <div className="dp-action-row">
                  <div className="dp-action-label">
                    <h3>{t('Delete All Data')}</h3>
                    <p>{t('Permanently remove all data associated with your Kenfinly account')}</p>
                  </div>
                  <span className="dp-badge" style={{ background: 'rgba(239,68,68,0.10)', color: '#ef4444' }}>
                    {t('Delete')}
                  </span>
                </div>

                <hr className="dp-divider" />

                {/* ── Policy ── */}
                <h2 className="dp-section-title">{t('Our Commitments')}</h2>

                <div className="dp-card">
                  <h3>{t('No Data Selling')}</h3>
                  <p>
                    {t('Kenfinly does not sell, rent, or share your financial data with advertisers or data brokers — ever.')}
                  </p>
                </div>

                <div className="dp-card">
                  <h3>{t('Encryption')}</h3>
                  <p>
                    {t('All data in transit is protected by TLS 1.3. Data at rest is encrypted using AES-256. JWT tokens expire within 60 minutes and are rotated on every login.')}
                  </p>
                </div>

                <div className="dp-card">
                  <h3>{t('Retention Policy')}</h3>
                  <p>
                    {t('Your data is retained for as long as your account is active. After account deletion, all data is permanently purged within 30 days in compliance with applicable privacy regulations.')}
                  </p>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DataPrivacy;
