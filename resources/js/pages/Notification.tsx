import React from 'react';
import { useTranslation } from 'react-i18next';
import VerifyImg from '../assets/images/notification-allow/notification1-icon.svg';
import VerifyImg2 from '../assets/images/notification-allow/notification2-icon.svg';
import VerifyImg3 from '../assets/images/notification-allow/notification3-icon.svg';
import VerifyImg4 from '../assets/images/notification-allow/notification4-icon.svg';
import BackBtn from '../components/BackBtn.tsx';
import { Link } from 'react-router-dom';

const Notification: React.FC = () => {
        const { t } = useTranslation();

        return (
                <div>
                        <div className="site-content">
                                <div className="verify-number-main">
                                        <div className="verify-number-top">
                                                <div className="container">
                                                        <div className="verify-number-top-content">
                                                                <div className="back-btn">
                                                                        <BackBtn />
                                                                </div>
                                                                <div className="header-title">
                                                                        <p>{t('Notification')}</p>
                                                                </div>
                                                        </div>
                                                </div>
                                        </div>
                                        <div className="verify-number-bottom" id="notification-main">
                                                <div className="verify-number-bottom-wrap">
                                                        <div className="verify-number-content">
                                                                <h1 className="d-none">{t('Notification')}</h1>
                                                                <h2 className="d-none">Hidden</h2>
                                                                <div className="notification-details">
                                                                        <div className="nofication-content">
                                                                                <div className="notification-icon">
                                                                                        <div className="notification-icon-img icon1">
                                                                                                <img src={VerifyImg} alt="notification-icon" />
                                                                                        </div>
                                                                                </div>
                                                                                <div className="notification-content">
                                                                                        <h3>{t('Security Updates!')}</h3>
                                                                                        <p>{t('Today |  09:24 AM')}</p>
                                                                                </div>
                                                                                <div className="notification-new">
                                                                                        <div className="new">
                                                                                                <Link to="#">{t('New')}</Link>
                                                                                        </div>
                                                                                </div>
                                                                        </div>
                                                                        <p className="now-txt mt-12">{t('Now PayFast has a Two-Factor Authentication. Try it now to make your account more secure.')}</p>
                                                                </div>
                                                                <div className="notification-details mt-12">
                                                                        <div className="nofication-content">
                                                                                <div className="notification-icon">
                                                                                        <div className="notification-icon-img icon2">
                                                                                                <img src={VerifyImg2} alt="notification-icon" />
                                                                                        </div>
                                                                                </div>
                                                                                <div className="notification-content">
                                                                                        <h3>{t('Multiple Card Features!')}</h3>
                                                                                        <p>{t('1 day ago | 14:43 PM')}</p>
                                                                                </div>
                                                                                <div className="notification-new">
                                                                                        <div className="new">
                                                                                                <Link to="#">{t('New')}</Link>
                                                                                        </div>
                                                                                </div>
                                                                        </div>
                                                                        <p className="now-txt mt-12">{t('Now you can also connect PayFast with multiple MasterCard & Visa. Try the service now.')}</p>
                                                                </div>
                                                                <div className="notification-details mt-12">
                                                                        <div className="nofication-content">
                                                                                <div className="notification-icon">
                                                                                        <div className="notification-icon-img icon3">
                                                                                                <img src={VerifyImg3} alt="notification-icon" />
                                                                                        </div>
                                                                                </div>
                                                                                <div className="notification-content">
                                                                                        <h3>{t('New Updates Available!')}</h3>
                                                                                        <p>{t('2 days ago |  10:24 AM')}</p>
                                                                                </div>
                                                                        </div>
                                                                        <p className="now-txt mt-12">{t('Update PayFast now to get access to the latest features for easier in making online payments.')}</p>
                                                                </div>
                                                                <div className="notification-details mt-12">
                                                                        <div className="nofication-content">
                                                                                <div className="notification-icon">
                                                                                        <div className="notification-icon-img icon4">
                                                                                                <img src={VerifyImg4} alt="notification-icon" />
                                                                                        </div>
                                                                                </div>
                                                                                <div className="notification-content">
                                                                                        <h3>{t('Account Setup Successful!')}</h3>
                                                                                        <p>{t('10 Dec, 2023 |  14:24 AM')}</p>
                                                                                </div>
                                                                        </div>
                                                                        <p className="now-txt mt-12">{t('Your account creation is successful, you can now experience our services.')}</p>
                                                                </div>
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        </div>
                </div>
        );
};

export default Notification;
