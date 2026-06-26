import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageContext.tsx';
import { useCurrency } from './CurrencyContext.tsx';
import profileImg from '../assets/images/setting/profile-img.png';
import purpleEditIcon from '../assets/svg/purple-edit-icon.svg';
import rightIcon from '../assets/svg/right-icon.svg';
import UpIcon from '../assets/svg/up-icon.svg';
import setting1 from '../assets/images/setting/setting1.svg';
import setting2 from '../assets/images/setting/setting2.svg';
import setting3 from '../assets/images/setting/setting3.svg';
import setting4 from '../assets/images/setting/setting4.svg';
import setting5 from '../assets/images/setting/setting5.svg';
import setting6 from '../assets/images/setting/setting6.svg';
import setting7 from '../assets/images/setting/setting7.svg';
import setting8 from '../assets/images/setting/setting8.svg';
import setting9 from '../assets/images/setting/setting9.svg';
import setting10 from '../assets/images/setting/setting10.svg';
import setting11 from '../assets/images/setting/setting11.svg';
import setting12 from '../assets/images/setting/setting12.svg';
import setting13 from '../assets/images/setting/setting13.svg';
import setting14 from '../assets/images/setting/setting14.svg';
import setting15 from '../assets/images/setting/setting15.svg';
import setting16 from '../assets/images/setting/setting16.svg';
import setting17 from '../assets/images/setting/setting17.svg';
import setting18 from '../assets/images/setting/setting18.svg';
import setting19 from '../assets/images/setting/setting19.svg';
import setting20 from '../assets/images/setting/setting20.svg';
import setting21 from '../assets/images/setting/setting21.svg';
import setting22 from '../assets/images/setting/setting22.svg';
import settingWallet from '../assets/images/setting/setting-wallet.svg';
import { useDarkMode } from './DarkModeContext.tsx';
import api from '../../utils/api.js';

// ─── Session-storage key ────────────────────────────────────────────────────
// Home.tsx reads this on mount to decide whether to re-open the drawer.
const NAV_STATE_KEY = 'kenfinly_settings_return';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserSummary {
  name: string;
  email: string;
  avatar: string | null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SettingOptionProps {
  to: string;
  icon: string;
  title: string;
  subtitle?: string;
  /** Called synchronously before React Router navigates — used to persist drawer state. */
  onBeforeNavigate?: () => void;
}

const SettingOption: React.FC<SettingOptionProps> = ({ to, icon, title, subtitle, onBeforeNavigate }) => {
  const { t } = useTranslation();

  const handleClick = () => {
    onBeforeNavigate?.();
  };

  return (
    <Link to={to} className="send-money-contact-tab setting-border" onClick={handleClick}>
      <div className="setting-icon">
        <img src={icon} alt="setting-icon" />
      </div>
      <div className="setting-title">
        <h3>{t(title)}</h3>
      </div>
      <div className="contact-star">
        <div className="star-favourite">
          {subtitle && <span className="setting-lanuage">{subtitle}</span>}
          <span>
            <img src={rightIcon} alt="right-icon" />
          </span>
        </div>
      </div>
    </Link>
  );
};

// ─── Avatar with fallback ─────────────────────────────────────────────────────

const AvatarImg: React.FC<{ src: string | null; className?: string }> = ({ src, className }) => (
  <img
    src={src ?? profileImg}
    alt="Profile"
    className={className}
    onError={(e) => { (e.target as HTMLImageElement).src = profileImg; }}
  />
);

// ─── Profile header skeleton ──────────────────────────────────────────────────

const ProfileSkeleton: React.FC = () => (
  <div className="send-money-contact-tab p-0" style={{ alignItems: 'center' }}>
    <div
      className="contact-profile"
      style={{ background: '#e5e7eb', borderRadius: '50%', width: 48, height: 48 }}
    />
    <div className="contact-details" style={{ flex: 1 }}>
      <div style={{ height: 13, width: 120, background: '#e5e7eb', borderRadius: 4, marginBottom: 6 }} />
      <div style={{ height: 11, width: 160, background: '#f3f4f6', borderRadius: 4 }} />
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const Setting: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { language } = useLanguage();
  const { currency } = useCurrency();
  const [isChartOpen, setIsChartOpen]  = useState<boolean>(false);
  const [user, setUser]                = useState<UserSummary | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(true);

  // ── Fetch real user data on mount ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Try cached user data first for instant display
      try {
        const cached = localStorage.getItem('user');
        if (cached) {
          const parsed = JSON.parse(cached) as Partial<UserSummary>;
          if (parsed.name && parsed.email && !cancelled) {
            setUser({ name: parsed.name, email: parsed.email, avatar: parsed.avatar ?? null });
          }
        }
      } catch {
        // Ignore parse errors
      }

      // Always refresh from API for up-to-date avatar and name
      try {
        const res = await api.get('/profile');
        const p   = res.data?.profile;
        if (p && !cancelled) {
          const summary: UserSummary = {
            name:   p.name  ?? '',
            email:  p.email ?? '',
            avatar: p.avatar ?? null,
          };
          setUser(summary);
          // Update localStorage cache so other components stay consistent
          try {
            const cached = JSON.parse(localStorage.getItem('user') ?? '{}');
            localStorage.setItem('user', JSON.stringify({ ...cached, ...summary }));
          } catch { /* ignore */ }
        }
      } catch {
        // Network failure — silently fall back to cached data or placeholder
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // ── Save navigation state before leaving to a child settings screen ────────
  // Home.tsx reads this flag on mount and re-opens the offcanvas drawer.
  const saveNavState = () => {
    try {
      sessionStorage.setItem(NAV_STATE_KEY, JSON.stringify({ drawerOpen: true }));
    } catch {
      // sessionStorage may be unavailable in private/restricted contexts — safe to ignore
    }
  };

  return (
    <div>
      <div className="setting-bottom-sec">

        {/* ── Profile header ── */}
        <div className="setting-top">
          {profileLoading && !user ? (
            <ProfileSkeleton />
          ) : (
            <div className="send-money-contact-tab p-0">
              <div className="contact-profile">
                <AvatarImg src={user?.avatar ?? null} />
              </div>
              <div className="contact-details">
                <h3>{user?.name ?? t('Loading…')}</h3>
                <h4>{user?.email ?? ''}</h4>
              </div>
              <div className="contact-star">
                <div className="star-favourite">
                  {/* Save drawer state before navigating to PersonalInfo from profile edit */}
                  <Link to="/PersonalInfo" onClick={saveNavState}>
                    <img src={purpleEditIcon} alt="edit-icon" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Settings list ── */}
        <div className="setting-bottom">
          {/* <SettingOption to="/AllContact"     icon={setting1}      title="All Contact" onBeforeNavigate={saveNavState} /> */}
          {/* <SettingOption to="/CustomerScreen" icon={setting2}      title="Customers"   onBeforeNavigate={saveNavState} /> */}

          {/* Chart accordion — hidden temporarily */}
          {/* <div className="Char-content">
            <div
              className="send-money-contact-tab"
              onClick={() => setIsChartOpen(!isChartOpen)}
            >
              <div className="setting-icon">
                <img src={setting3} alt="setting-icon" />
              </div>
              <div className="setting-title">
                <h3>Different Chart</h3>
              </div>
              <div className="contact-star">
                <div className="star-favourite">
                  <img
                    className={`upIconsSat ${isChartOpen ? 'rotated' : ''}`}
                    src={UpIcon}
                    alt="icon"
                  />
                </div>
              </div>
            </div>
            <ul className={`diffrent-chat-dropdown ${isChartOpen ? 'open' : ''}`}>
              <li><Link to="/AreaChart" onClick={saveNavState}>Area Chart</Link></li>
              <li><Link to="/LineChart" onClick={saveNavState}>Line Chart</Link></li>
              <li className="border-0"><Link to="/PieChart" onClick={saveNavState}>Pie Chart</Link></li>
            </ul>
          </div> */}

          <SettingOption to="/WalletManagement"        icon={settingWallet} title="Wallets & Accounts"          onBeforeNavigate={saveNavState} />
          <SettingOption to="/CategoryManagement"      icon={setting3}      title="Categories"                  onBeforeNavigate={saveNavState} />
          {/* <SettingOption to="/BankAndCard"             icon={setting4}      title="Banks & Cards"               onBeforeNavigate={saveNavState} /> */}
          {/* <SettingOption to="/Payment"                 icon={setting5}      title="Payment Methods"             onBeforeNavigate={saveNavState} /> */}
          {/* <SettingOption to="/AutomaticPayment"        icon={setting6}      title="Automatic Payments"          onBeforeNavigate={saveNavState} /> */}
          <SettingOption to="/Subscription"            icon={setting7}      title="Subscriptions"               onBeforeNavigate={saveNavState} />
          {/* <SettingOption to="/Invoicing"               icon={setting8}      title="Invoice Settings"            onBeforeNavigate={saveNavState} /> */}

          <div className="setting-center-border" />

          <SettingOption to="/PersonalInfo"            icon={setting9}      title="Personal Info"               onBeforeNavigate={saveNavState} />
          <SettingOption to="/Security"                icon={setting10}     title="Security"                    onBeforeNavigate={saveNavState} />
          <SettingOption to="/MarketingScreen"         icon={setting11}     title="Marketing Preferences"       onBeforeNavigate={saveNavState} />
          <SettingOption to="/NotificationSetting"     icon={setting12}     title="Notification Setting"        onBeforeNavigate={saveNavState} />
          <SettingOption to="/Language"                icon={setting13}     title="Language"   subtitle={language.name} onBeforeNavigate={saveNavState} />
          <SettingOption to="/Currency"                icon={setting14}     title="Currency"   subtitle={currency.code} onBeforeNavigate={saveNavState} />
          <SettingOption to="/Faq"                     icon={setting15}     title="FAQs"                        onBeforeNavigate={saveNavState} />
          <SettingOption to="/DataPrivacy"             icon={setting16}     title="Data & Privacy Policy"       onBeforeNavigate={saveNavState} />
          {/* <SettingOption to="/AboutUs"                 icon={setting17}     title="About PayFast"  subtitle="v2.0.2" onBeforeNavigate={saveNavState} /> */}
          {/* <SettingOption to="/Feedback"                icon={setting18}     title="Send Feedback"              onBeforeNavigate={saveNavState} /> */}
          <SettingOption to="/ContactUs"               icon={setting19}     title="Contact Us"                  onBeforeNavigate={saveNavState} />

          {/* Dark mode toggle */}
          <div className="send-money-contact-tab setting-border">
            <div className="setting-icon">
              <svg className="dark" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#7B51F1">
                <path d="M11.57,2.3c2.38-0.59,4.68-0.27,6.63,0.64c0.35,0.16,0.41,0.64,0.1,0.86C15.7,5.6,14,8.6,14,12s1.7,6.4,4.3,8.2 c0.32,0.22,0.26,0.7-0.09,0.86C16.93,21.66,15.5,22,14,22c-6.05,0-10.85-5.38-9.87-11.6C4.74,6.48,7.72,3.24,11.57,2.3z" />
              </svg>
            </div>
            <div className="setting-title">
              <h3 className="smith new-chat">{isDarkMode ? t('Dark Mode') : t('Light Mode')}</h3>
            </div>
            <div className="contact-star">
              <div className="notification-option-switch">
                <label className="switch" htmlFor="toggle">
                  <input
                    type="checkbox"
                    id="toggle"
                    checked={isDarkMode}
                    onChange={toggleDarkMode}
                    name="checkbox"
                  />
                  <span className="slider theme-change" />
                </label>
              </div>
            </div>
          </div>

          {/* <SettingOption to="/InviteFriend"            icon={setting20}     title="Invite Friends"              onBeforeNavigate={saveNavState} /> */}
          <SettingOption to="/DeleteDeactivateAccount" icon={setting21}     title="Delete or Deactivate Account" onBeforeNavigate={saveNavState} />

          {/* Logout — opens a different offcanvas (#offcanvasBottom), does NOT navigate away */}
          <div
            className="send-money-contact-tab setting-border border-0"
            data-bs-toggle="offcanvas"
            data-bs-target="#offcanvasBottom"
          >
            <div className="setting-icon pay-bill-img bg-2">
              <img src={setting22} alt="setting-icon" />
            </div>
            <div className="setting-title">
              <h3>{t('Logout')}</h3>
            </div>
            <div className="contact-star">
              <div className="star-favourite">
                <img src={rightIcon} alt="edit-icon" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Setting;
