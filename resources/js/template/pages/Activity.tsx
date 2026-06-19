import React from 'react'
import DynamicLogo from '../components/DynamicLogo'
import NotificationIcon from '../assets/svg/notification-icon.svg'
import dotsIcon from '../assets/svg/dots-icon.svg'
import icon1 from '../assets/images/tabbar/icon1.svg'
import icon2 from '../assets/images/tabbar/icon2.svg'
import icon3 from '../assets/images/tabbar/icon3.svg'
import icon4 from '../assets/images/tabbar/icon4.svg'
import icon5 from '../assets/images/tabbar/icon5.svg'
import Setting from '../components/Setting.tsx';
import { Link } from 'react-router-dom'
import { useNavigate } from "react-router-dom";

const Activity: React.FC = () => {
        const navigate = useNavigate();
        return (
                <div>
                        <div className="site-content">
                                <div className="verify-number-main" id="activity-main">
                                        <div className="verify-number-top">
                                                <div className="container">
                                                        <div className="verify-number-top-content">
                                                                <div className="setting-header">
                                                                        <div className="setting-left">
                                                                                <span><DynamicLogo /></span>
                                                                                <span className="setting-txt">Activity</span>
                                                                        </div>
                                                                        <div className="setting-right">
                                                                                <span>
                                                                                        <Link to="/Notification">
                                                                                                <img src={NotificationIcon} alt="notification-icon" />
                                                                                        </Link>
                                                                                </span>
                                                                                <span className="dots-icon">
                                                                                        <Link to="#" data-bs-toggle="offcanvas" data-bs-target="#offcanvasExample">
                                                                                                <img src={dotsIcon} alt="setting-icon" />
                                                                                        </Link>
                                                                                </span>
                                                                        </div>
                                                                </div>
                                                        </div>
                                                        <div className="nav nav-tabs custom-tab-activity" id="nav-tab" role="tablist">
                                                                <button className="nav-link active" id="nav-contact-tab" data-bs-toggle="tab" data-bs-target="#nav-all" type="button" role="tab" aria-selected="true">All</button>
                                                                <button className="nav-link" id="nav-favourite-tab" data-bs-toggle="tab" data-bs-target="#nav-received" type="button" role="tab" aria-selected="false">Received</button>
                                                                <button className="nav-link" id="nav-sent-tab" data-bs-toggle="tab" data-bs-target="#nav-sent" type="button" role="tab" aria-selected="false">Sent</button>
                                                        </div>
                                                </div>
                                        </div>
                                        <div className="verify-number-bottom" id="send-money-contact">
                                                <div className="verify-number-bottom-wrap">
                                                        <div className="send-contact-favourite">
                                                                <h1 className="d-none">Activity</h1>
                                                                <div className="favourite-list">
                                                                        <div className="tab-content" id="nav-tabContent">
                                                                                <div className="tab-pane show active" id="nav-all" role="tabpanel">
                                                                                        <div className="nav-all-content">
                                                                                                <div className="boder-bottom-activity">
                                                                                                        <h2 className="activity-date">Today - 15 July, 2024</h2>
                                                                                                        <Link to="/PreapprovedPayment1">
                                                                                                                <div className="all-details-wrap mt-16 Preapproved-redirect">
                                                                                                                        <div className="all-details-name">
                                                                                                                                <h3>Jordon Smith</h3>
                                                                                                                                <p>Preapproved Payment - Completed</p>
                                                                                                                        </div>
                                                                                                                        <div className="all-content-price">
                                                                                                                                <p>+$129.5</p>
                                                                                                                        </div>
                                                                                                                </div>
                                                                                                        </Link>
                                                                                                        <Link to="/PreapprovedPayment1">
                                                                                                                <div className="all-details-wrap Preapproved-redirect mt-16">
                                                                                                                        <div className="all-details-name">
                                                                                                                                <h3>Kitty Nguyen</h3>
                                                                                                                                <p>Transfers Bank - Completed</p>
                                                                                                                        </div>
                                                                                                                        <div className="all-content-price">
                                                                                                                                <p className="color-red">-$40.25</p>
                                                                                                                        </div>
                                                                                                                </div>
                                                                                                        </Link>
                                                                                                        <Link to="/PreapprovedPayment1">
                                                                                                                <div className="all-details-wrap mt-16 Preapproved-redirect">
                                                                                                                        <div className="all-details-name">
                                                                                                                                <h3>Green Williamson</h3>
                                                                                                                                <p>Preapproved Payment - Completed</p>
                                                                                                                        </div>
                                                                                                                        <div className="all-content-price">
                                                                                                                                <p>+$90</p>
                                                                                                                        </div>
                                                                                                                </div>
                                                                                                        </Link>
                                                                                                        <Link to="/PreapprovedPayment1">
                                                                                                                <div className="all-details-wrap mt-16 Preapproved-redirect">
                                                                                                                        <div className="all-details-name">
                                                                                                                                <h3>Dianne Russell</h3>
                                                                                                                                <p>Transfers Bank - Completed</p>
                                                                                                                        </div>
                                                                                                                        <div className="all-content-price">
                                                                                                                                <p className="color-red">-$20</p>
                                                                                                                        </div>
                                                                                                                </div>
                                                                                                        </Link>
                                                                                                </div>
                                                                                                <div className="boder-bottom-activity mt-24 border-0">
                                                                                                        <h2 className="activity-date">Yesterday - 14 July, 2024</h2>
                                                                                                        <Link to="/SendMoney">
                                                                                                                <div className="all-details-wrap mt-16 send-money-screen">
                                                                                                                        <div className="all-details-name">
                                                                                                                                <h3>Christian Dawson</h3>
                                                                                                                                <p>Send Money - Completed</p>
                                                                                                                        </div>
                                                                                                                        <div className="all-content-price">
                                                                                                                                <p className="color-red">-$225.00</p>
                                                                                                                        </div>
                                                                                                                </div>
                                                                                                        </Link>
                                                                                                        <Link to='/RequestPayment'>
                                                                                                                <div className="all-details-wrap mt-16 request-payment-redirect">
                                                                                                                        <div className="all-details-name">
                                                                                                                                <h3>Marvin Mckinney</h3>
                                                                                                                                <p>Payment Request - Pending</p>
                                                                                                                        </div>
                                                                                                                        <div className="all-content-price">
                                                                                                                                <p className="color-purple" >$120.00</p>
                                                                                                                        </div>
                                                                                                                </div>
                                                                                                        </Link>
                                                                                                        <Link to='/PreapprovedPayment1'>
                                                                                                                <div className="all-details-wrap mt-16 Preapproved-redirect ">
                                                                                                                        <div className="all-details-name">
                                                                                                                                <h3>Bank of America</h3>
                                                                                                                                <p>Transfers - Completed</p>
                                                                                                                        </div>
                                                                                                                        <div className="all-content-price">
                                                                                                                                <p className="color-red">-$1000.00</p>
                                                                                                                        </div>
                                                                                                                </div>
                                                                                                        </Link>
                                                                                                        <Link to='/RequestPayment'>
                                                                                                                <div className="all-details-wrap mt-16 request-payment-redirect">
                                                                                                                        <div className="all-details-name">
                                                                                                                                <h3>Dianne Russell</h3>
                                                                                                                                <p>Payment Request - Completed</p>
                                                                                                                        </div>
                                                                                                                        <div className="all-content-price">
                                                                                                                                <p>+$46.50</p>
                                                                                                                        </div>
                                                                                                                </div>
                                                                                                        </Link>
                                                                                                </div>
                                                                                        </div>
                                                                                </div>
                                                                                <div className="tab-pane" id="nav-received" role="tabpanel">
                                                                                        <div className="nav-received-content">
                                                                                                <div className="boder-bottom-activity">
                                                                                                        <h2 className="activity-date">Today - 15 July, 2024</h2>
                                                                                                        <Link to='/PreapprovedPayment1'>
                                                                                                                <div className="all-details-wrap mt-16 Preapproved-redirect">
                                                                                                                        <div className="all-details-name">
                                                                                                                                <h3>Jordon Smith</h3>
                                                                                                                                <p>Preapproved Payment - Completed</p>
                                                                                                                        </div>
                                                                                                                        <div className="all-content-price">
                                                                                                                                <p>+$129.5</p>
                                                                                                                        </div>
                                                                                                                </div>
                                                                                                        </Link>
                                                                                                        <Link to='/PreapprovedPayment1'>
                                                                                                                <div className="all-details-wrap mt-16 Preapproved-redirect">
                                                                                                                        <div className="all-details-name">
                                                                                                                                <h3>Green Williamson</h3>
                                                                                                                                <p>Preapproved Payment - Completed</p>
                                                                                                                        </div>
                                                                                                                        <div className="all-content-price">
                                                                                                                                <p>+$90</p>
                                                                                                                        </div>
                                                                                                                </div>
                                                                                                        </Link>
                                                                                                </div>
                                                                                                <div className="boder-bottom-activity mt-24">
                                                                                                        <h2 className="activity-date">Yesterday - 14 July, 2024</h2>
                                                                                                        <Link to='/RequestPayment'>
                                                                                                                <div className="all-details-wrap mt-16 request-payment-redirect">
                                                                                                                        <div className="all-details-name">
                                                                                                                                <h3>Dianne Russell</h3>
                                                                                                                                <p>Payment Request - Completed</p>
                                                                                                                        </div>
                                                                                                                        <div className="all-content-price">
                                                                                                                                <p>+$46.50</p>
                                                                                                                        </div>
                                                                                                                </div>
                                                                                                        </Link>
                                                                                                </div>
                                                                                                <div className="boder-bottom-activity mt-24 border-0">
                                                                                                        <h2 className="activity-date">10 July, 2024</h2>
                                                                                                        <Link to="/SendMoney">
                                                                                                                <div className="all-details-wrap mt-16 send-money1">
                                                                                                                        <div className="all-details-name">
                                                                                                                                <h3>Christian Dawson</h3>
                                                                                                                                <p>Send Money - Completed</p>
                                                                                                                        </div>
                                                                                                                        <div className="all-content-price">
                                                                                                                                <p>-$225.00</p>
                                                                                                                        </div>
                                                                                                                </div>
                                                                                                        </Link>
                                                                                                        <Link to="/RequestPayment">
                                                                                                                <div className="all-details-wrap mt-16 request-payment-redirect">
                                                                                                                        <div className="all-details-name">
                                                                                                                                <h3>Marvin Mckinney</h3>
                                                                                                                                <p>Payment Request - Completed</p>
                                                                                                                        </div>
                                                                                                                        <div className="all-content-price">
                                                                                                                                <p>$120.00</p>
                                                                                                                        </div>
                                                                                                                </div>
                                                                                                        </Link>
                                                                                                        <Link to="/PreapprovedPayment1">
                                                                                                                <div className="all-details-wrap mt-16 Preapproved-redirect">
                                                                                                                        <div className="all-details-name">
                                                                                                                                <h3>Bank of America</h3>
                                                                                                                                <p>Credit - Completed</p>
                                                                                                                        </div>
                                                                                                                        <div className="all-content-price Preapproved-redirect">
                                                                                                                                <p>+$1000.00</p>
                                                                                                                        </div>
                                                                                                                </div>
                                                                                                        </Link>
                                                                                                        <Link to="/PreapprovedPayment1">
                                                                                                                <div className="all-details-wrap mt-16 Preapproved-redirect">
                                                                                                                        <div className="all-details-name">
                                                                                                                                <h3>Floyd Miles</h3>
                                                                                                                                <p>Payment - Completed</p>
                                                                                                                        </div>
                                                                                                                        <div className="all-content-price">
                                                                                                                                <p>+$59.35</p>
                                                                                                                        </div>
                                                                                                                </div>
                                                                                                        </Link>
                                                                                                </div>
                                                                                        </div>
                                                                                </div>
                                                                                <div className="tab-pane" id="nav-sent" role="tabpanel">
                                                                                        <div className="nav-sent-content">
                                                                                                <div className="boder-bottom-activity">
                                                                                                        <h2 className="activity-date">Today - 15 July, 2024</h2>
                                                                                                        <Link to="/PreapprovedPayment1">
                                                                                                                <div className="all-details-wrap mt-16 Preapproved-redirect">
                                                                                                                        <div className="all-details-name">
                                                                                                                                <h3>Kitty Nguyen</h3>
                                                                                                                                <p>Transfers Bank - Completed</p>
                                                                                                                        </div>
                                                                                                                        <div className="all-content-price">
                                                                                                                                <p className="color-red">-$40.25</p>
                                                                                                                        </div>
                                                                                                                </div>
                                                                                                        </Link>
                                                                                                        <Link to="/PreapprovedPayment1">
                                                                                                                <div className="all-details-wrap mt-16 Preapproved-redirect">
                                                                                                                        <div className="all-details-name">
                                                                                                                                <h3>Dianne Russell</h3>
                                                                                                                                <p>Transfers Bank - Completed</p>
                                                                                                                        </div>
                                                                                                                        <div className="all-content-price">
                                                                                                                                <p className="color-red">-$20</p>
                                                                                                                        </div>
                                                                                                                </div>
                                                                                                        </Link>
                                                                                                </div>
                                                                                                <div className="boder-bottom-activity mt-24">
                                                                                                        <h2 className="activity-date">Yesterday - 14 July, 2024</h2>
                                                                                                        <Link to="/SendMoney">
                                                                                                                <div className="all-details-wrap mt-16 send-money-screen">
                                                                                                                        <div className="all-details-name">
                                                                                                                                <h3>Christian Dawson</h3>
                                                                                                                                <p>Send Money - Completed</p>
                                                                                                                        </div>
                                                                                                                        <div className="all-content-price">
                                                                                                                                <p className="color-red">-$225.00</p>
                                                                                                                        </div>
                                                                                                                </div>
                                                                                                        </Link>
                                                                                                        <Link to="/PreapprovedPayment1">
                                                                                                                <div className="all-details-wrap mt-16 Preapproved-redirect">
                                                                                                                        <div className="all-details-name">
                                                                                                                                <h3>Bank of America</h3>
                                                                                                                                <p>Transfers - Completed</p>
                                                                                                                        </div>
                                                                                                                        <div className="all-content-price">
                                                                                                                                <p className="color-red">-$1000.00</p>
                                                                                                                        </div>
                                                                                                                </div>
                                                                                                        </Link>
                                                                                                </div>
                                                                                                <div className="boder-bottom-activity mt-24 border-0">
                                                                                                        <h2 className="activity-date">06 July, 2024</h2>
                                                                                                        <Link to="/SendMoney">
                                                                                                                <div className="all-details-wrap mt-16 send-money-screen">
                                                                                                                        <div className="all-details-name">
                                                                                                                                <h3>Savannah Nguyen</h3>
                                                                                                                                <p>Send Money - Completed</p>
                                                                                                                        </div>
                                                                                                                        <div className="all-content-price">
                                                                                                                                <p className="color-red">-$78.00</p>
                                                                                                                        </div>
                                                                                                                </div>
                                                                                                        </Link>
                                                                                                        <Link to="/PreapprovedPayment1">
                                                                                                                <div className="all-details-wrap mt-16 Preapproved-redirect">
                                                                                                                        <div className="all-details-name">
                                                                                                                                <h3>JP Morgan Bank</h3>
                                                                                                                                <p>Transfers - Completed</p>
                                                                                                                        </div>
                                                                                                                        <div className="all-content-price">
                                                                                                                                <p className="color-red">-$300.00</p>
                                                                                                                        </div>
                                                                                                                </div>
                                                                                                        </Link>
                                                                                                        <Link to="/SendMoney">
                                                                                                                <div className="all-details-wrap mt-16 send-money1">
                                                                                                                        <div className="all-details-name">
                                                                                                                                <h3>Arlene McCoy</h3>
                                                                                                                                <p>Send Money - Completed</p>
                                                                                                                        </div>
                                                                                                                        <div className="all-content-price">
                                                                                                                                <p className="color-red">-$29.99</p>
                                                                                                                        </div>
                                                                                                                </div>
                                                                                                        </Link>
                                                                                                </div>
                                                                                        </div>
                                                                                </div>
                                                                        </div>
                                                                </div>
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                                {/* <!-- Activity screen content end --> */}

                                {/* Setting Side Offcanvas */}
                                <div className="offcanvas offcanvas-start menu-canvas" id="offcanvasExample" aria-labelledby="offcanvasExampleLabel">
                                        <div className="offcanvas-header">
                                                <h5 className="offcanvas-title" id="offcanvasExampleLabel">Setting</h5>
                                                <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                                        </div>
                                        <div className="offcanvas-body">
                                                <Setting />
                                        </div>
                                </div>
                                {/* Setting Side Offcanvas End */}

                                {/* <!-- Bottom tabbar start --> */}
                                <div className="bottom-menu-svg-main">
                                        <div className="bottom-menu-svg">
                                                <div className="gol3">
                                                        <div className="add-to-cart-icon">
                                                                <Link to="/ScanQrCode">
                                                                        <img src={icon5} alt="tabbar-icon" />
                                                                </Link>
                                                        </div>
                                                </div>
                                                <svg className="bottom-menu-svg-design" width="600" height="150" viewBox="0 0 375 104" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <g filter="url(#filter0_b_1_13394)">
                                                                <path d="M188 45.5313C205.673 45.5313 220 31.2045 220 13.5313C220 7.32365 224.732 0.674172 230.917 1.20338L360.364 12.2791C368.642 12.9873 375 19.913 375 28.2208V103.531H0V28.2275C0 19.9169 6.36254 12.9898 14.6432 12.2851L145.074 1.18463C151.266 0.657657 156 7.31698 156 13.5313C156 31.2045 170.327 45.5313 188 45.5313Z" fill="url(#paint0_linear_1_13394)" />
                                                        </g>
                                                        <defs>
                                                                <filter id="filter0_b_1_13394" x="-24" y="-22.8447" width="423" height="150.376" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                                                                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                                                                        <feGaussianBlur in="BackgroundImageFix" stdDeviation="12" />
                                                                        <feComposite in2="SourceAlpha" operator="in" result="effect1_backgroundBlur_1_13394" />
                                                                        <feBlend mode="normal" in="SourceGraphic" in2="effect1_backgroundBlur_1_13394" result="shape" />
                                                                </filter>
                                                                <linearGradient id="paint0_linear_1_13394" x1="187.5" y1="0" x2="188" y2="103.531" gradientUnits="userSpaceOnUse">
                                                                        <stop offset="0" stopOpacity="0.24" />
                                                                        <stop offset="1" stopOpacity="0.16" />
                                                                </linearGradient>
                                                        </defs>
                                                </svg>
                                        </div>
                                </div>
                                <div className="navigation">
                                        <ul className="listWrap">
                                                <li className="list ">
                                                        <Link to="/Home">
                                                                <i className="icon">
                                                                        <img src={icon1} alt="tabbar-icon" />
                                                                </i>
                                                                <span className="text"></span>
                                                        </Link>
                                                </li>
                                                <li className="list active">
                                                        <Link to="/Activity">
                                                                <i className="icon">
                                                                        <img src={icon2} alt="tabbar-icon" />

                                                                </i>
                                                                <span className="text"></span>
                                                        </Link>
                                                </li>
                                                <li className="list">
                                                        <Link to="/BarChart">
                                                                <i className="icon">
                                                                        <img src={icon3} alt="tabbar-icon" />

                                                                </i>
                                                                <span className="text"></span>
                                                        </Link>
                                                </li>
                                                <li className="list">
                                                        <Link to="/Invoicing">
                                                                <i className="icon">
                                                                        <img src={icon4} alt="tabbar-icon" />
                                                                </i>
                                                                <span className="text"></span>
                                                        </Link>
                                                </li>
                                        </ul>
                                </div>

                                {/* <!-- Logout screen modal content start --> */}
                                <div
                                        className="offcanvas offcanvas-bottom logout-main"
                                        id="offcanvasBottom"
                                >
                                        <button
                                                type="button"
                                                className="text-reset"
                                                data-bs-dismiss="offcanvas"
                                                aria-label="Close"
                                        >
                                                <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="24"
                                                        height="16"
                                                        viewBox="0 0 24 16"
                                                        fill="none"
                                                >
                                                        <g>
                                                                <path
                                                                        d="M22 8L12 13L2 8"
                                                                        stroke="#F2EEFE"
                                                                        strokeWidth="2"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                ></path>
                                                                <path
                                                                        d="M22 2L12 7L2 2"
                                                                        stroke="#F2EEFE"
                                                                        strokeWidth="2"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                ></path>
                                                        </g>
                                                </svg>
                                        </button>
                                        <div className="offcanvas-body small">
                                                <h2 className="logout-text-pop mt-12">Logout</h2>
                                                <p className="sm-txt mt-16">Are you sure you want to log out?</p>
                                                <div className="logout-button-main mt-32">
                                                        <button
                                                                className="logout-cancel"
                                                                data-bs-dismiss="offcanvas"
                                                                aria-label="Close"
                                                        >
                                                                Cancel
                                                        </button>
                                                        <button
                                                                className="logout-cancel yes-logot"
                                                                onClick={() => navigate("/")}
                                                        >
                                                                Yes, Logout
                                                        </button>
                                                </div>
                                        </div>
                                </div>
                        </div>
                </div>
        )
}

export default Activity