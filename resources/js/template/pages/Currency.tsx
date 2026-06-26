import React from 'react';
import BackBtn from '../components/BackBtn.tsx';
import { useCurrency, SUPPORTED_CURRENCIES } from '../components/CurrencyContext.tsx';
import Currency1 from '../assets/images/currency/currency1.svg';
import Currency3 from '../assets/images/currency/currency3.svg';
import Currency4 from '../assets/images/currency/currency4.svg';
import Currency5 from '../assets/images/currency/currency5.svg';
import Currency6 from '../assets/images/currency/currency6.svg';
import Currency7 from '../assets/images/currency/currency7.svg';
import Currency8 from '../assets/images/currency/currency8.svg';

// ─── Map iconAsset key → imported SVG ─────────────────────────────────────────

const ICON_MAP: Record<string, string> = {
  currency1: Currency1,
  currency3: Currency3,
  currency4: Currency4,
  currency5: Currency5,
  currency6: Currency6,
  currency7: Currency7,
  currency8: Currency8,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const Currency: React.FC = () => {
  const { currency, setCurrency } = useCurrency();

  return (
    <div>
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
                  <p>Currency</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── List ── */}
          <div className="verify-number-bottom" id="currency-page">
            <div className="verify-number-bottom-wrap">
              <h1 className="d-none">Currency</h1>
              <div className="lang-list">
                {SUPPORTED_CURRENCIES.map((cur) => (
                  <div key={cur.code} className="form-check change-lan-sec language-sel first-pt-0">
                    <input
                      className="form-check-input custom-input"
                      name="currency"
                      type="radio"
                      id={`cur-${cur.code}`}
                      checked={currency.code === cur.code}
                      onChange={() => setCurrency(cur)}
                    />
                    <label className="form-check-label custom-lable" htmlFor={`cur-${cur.code}`}>
                      <span>
                        <img
                          className="curr-icon"
                          src={ICON_MAP[cur.iconAsset] ?? Currency1}
                          alt={cur.name}
                        />
                      </span>
                      <span style={{ flex: 1 }}>{cur.name}</span>
                      <span style={{ fontWeight: 600, marginLeft: 4, opacity: 0.7 }}>
                        {cur.code}
                      </span>
                    </label>
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

export default Currency;
