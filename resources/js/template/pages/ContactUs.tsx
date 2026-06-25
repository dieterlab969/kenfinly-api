import React from 'react';
import BackBtn from '../components/BackBtn.tsx';
import ContactUsImg from '../assets/images/main-img/contact-us-img.png';
import CallIcon from '../assets/svg/call-icon.svg';
import MailIcon from '../assets/svg/mail-icon.svg';
import WebIcon from '../assets/svg/web-icon.svg';
import FacebookIcon from '../assets/images/about-us/facebook.svg';
import YoutubeIcon from '../assets/images/about-us/youtube.svg';

// ─── Inline SVG Icons (no existing asset for LinkedIn / X) ───────────────────

const LinkedInSVG: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#0077B5" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
);

const XSocialSVG: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="#000000" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.26 5.632 5.904-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

// ─── Scoped styles (new atoms only; no override of existing design-system classes) ──

const STYLES = `
    /* Primary email badge */
    .cu-primary-badge {
        display: inline-block;
        background: #7B51F1;
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        border-radius: 4px;
        padding: 2px 8px;
        margin-bottom: 8px;
        font-family: Satoshi, sans-serif;
    }

    /* Email button — visually elevated above regular contact buttons */
    .cu-primary-btn a {
        background: rgb(123 81 241 / 14%);
        border: 1.5px solid rgb(123 81 241 / 30%);
        color: #7B51F1;
        font-weight: 700;
        font-size: 16px;
        padding: 14px;
    }

    /* Social icon backgrounds for platforms not in the existing design system */
    .linkedin-bg { background: rgb(0 119 181 / 9%); }
    .x-bg        { background: rgb(0 0 0 / 6%); }

    /* Section heading — matches .social-txt weight but scoped */
    .cu-section-heading {
        color: var(--text-color);
        font-family: Poppins;
        font-size: 16px;
        font-weight: 600;
        line-height: 24px;
        margin: 0;
    }

    /* Thin rule between sections */
    .cu-divider {
        border: none;
        border-top: 1px solid var(--border-color, #E8E8E8);
        margin: 28px 0 0;
    }
`;

// ─── Reusable ContactItem ──────────────────────────────────────────────────────

interface ContactItemProps {
    href: string;
    icon: string;
    iconAlt: string;
    label: string;
    wrapperClass?: string;
}

const ContactItem: React.FC<ContactItemProps> = ({
    href,
    icon,
    iconAlt,
    label,
    wrapperClass = 'contact-us-mobile-btn',
}) => (
    <div className={wrapperClass}>
        <a href={href} target="_blank" rel="noopener noreferrer">
            <span>
                <img src={icon} alt={iconAlt} />
            </span>
            <span className="contact-us-no">{label}</span>
        </a>
    </div>
);

// ─── Reusable SocialItem ───────────────────────────────────────────────────────

interface SocialItemProps {
    href: string;
    bgClass: string;
    label: string;
    icon: React.ReactNode;
}

const SocialItem: React.FC<SocialItemProps> = ({ href, bgClass, label, icon }) => (
    <div className="social-detail-about">
        <div className={`shape ${bgClass}`}>
            <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Follow us on ${label}`}>
                {icon}
            </a>
        </div>
        <div>
            <p className="about-social-txt">{label}</p>
        </div>
    </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const ContactUs: React.FC = () => {
    return (
        <div>
            <style>{STYLES}</style>

            <div className="site-content">
                <div className="verify-number-main">

                    {/* ── Top bar ── */}
                    <div className="verify-number-top">
                        <div className="container">
                            <div className="verify-number-top-content">
                                <div className="back-btn">
                                    <BackBtn />
                                </div>
                                <div className="header-title">
                                    <p>Contact Us</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Body ── */}
                    <div className="verify-number-bottom" id="contact-us-main">
                        <div className="verify-number-bottom-wrap">
                            <div className="verify-number-content">

                                {/* Hero image */}
                                <div className="verify-number-img">
                                    <img src={ContactUsImg} alt="Contact us" />
                                </div>

                                {/* Intro */}
                                <div className="verify-txt mt-24">
                                    <h1>Get In Touch</h1>
                                    <p className="mt-12">
                                        Have a question or need support? We're happy to help.
                                        Reach out through any channel below.
                                    </p>
                                </div>

                                {/* ── Contact methods ── */}
                                <div className="contact-screen">

                                    {/* Email — primary channel */}
                                    <div className="mt-24">
                                        <span className="cu-primary-badge">✉ Primary Channel</span>
                                        <ContactItem
                                            href="mailto:purchasevn@getkenka.com"
                                            icon={MailIcon}
                                            iconAlt="email icon"
                                            label="purchasevn@getkenka.com"
                                            wrapperClass="contact-us-mobile-btn cu-primary-btn"
                                        />
                                    </div>

                                    {/* Phone */}
                                    <ContactItem
                                        href="tel:+840941069969"
                                        icon={CallIcon}
                                        iconAlt="phone icon"
                                        label="(+84) 0941069969"
                                        wrapperClass="contact-us-mobile-btn mt-12"
                                    />

                                    {/* Website */}
                                    <ContactItem
                                        href="https://www.kenfinly.com"
                                        icon={WebIcon}
                                        iconAlt="website icon"
                                        label="www.kenfinly.com"
                                        wrapperClass="contact-us-mobile-btn mt-12"
                                    />
                                </div>

                                {/* ── Social media ── */}
                                <hr className="cu-divider" />

                                <div className="about-us-social-media mt-16">
                                    <h2 className="cu-section-heading">Follow &amp; Connect</h2>
                                    <div className="about-us-icon-wrapper mt-12">
                                        <SocialItem
                                            href="https://www.linkedin.com/in/dieter-entrepreneur/"
                                            bgClass="linkedin-bg"
                                            label="LinkedIn"
                                            icon={<LinkedInSVG />}
                                        />
                                        <SocialItem
                                            href="https://www.facebook.com/profile.php?id=61573603022542"
                                            bgClass="facebook-bg"
                                            label="Fanpage"
                                            icon={<img src={FacebookIcon} alt="facebook" />}
                                        />
                                        <SocialItem
                                            href="https://x.com/hoangpv3"
                                            bgClass="x-bg"
                                            label="X"
                                            icon={<XSocialSVG />}
                                        />
                                        <SocialItem
                                            href="https://www.youtube.com/@DieterLab"
                                            bgClass="youtube-bg"
                                            label="YouTube"
                                            icon={<img src={YoutubeIcon} alt="youtube" />}
                                        />
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ContactUs;
