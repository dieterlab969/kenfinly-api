import React from 'react';
import BackBtn from '../components/BackBtn.tsx';
import { useLanguage, SUPPORTED_LANGUAGES } from '../components/LanguageContext.tsx';

const Language: React.FC = () => {
  const { language, setLanguage } = useLanguage();

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
                  <p>Language</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── List ── */}
          <div className="verify-number-bottom" id="language-screen">
            <div className="verify-number-bottom-wrap">
              <h1 className="d-none">Language</h1>
              <div className="lang-list">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <div
                    key={lang.code}
                    className={`form-check change-lan-sec language-sel${lang.code === SUPPORTED_LANGUAGES[0].code ? '' : ''}`}
                  >
                    <input
                      className="form-check-input custom-input"
                      name="language"
                      type="radio"
                      id={`lang-${lang.code}`}
                      checked={language.code === lang.code}
                      onChange={() => setLanguage(lang)}
                    />
                    <label className="form-check-label custom-lable" htmlFor={`lang-${lang.code}`}>
                      {lang.name}
                      {lang.dir === 'rtl' && (
                        <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.55 }}>RTL</span>
                      )}
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

export default Language;
