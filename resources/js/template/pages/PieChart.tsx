import React from 'react'
import DynamicLogo from '../components/DynamicLogo'
import NotificationIcon from '../assets/svg/notification-icon.svg'
import dotsIcon from '../assets/svg/dots-icon.svg'
import IncomeIcon from '../assets/svg/income-icon.svg'
import ExpenseIcon from '../assets/svg/expense-icon.svg'
import icon1 from '../assets/images/tabbar/icon1.svg'
import icon2 from '../assets/images/tabbar/icon2.svg'
import icon3 from '../assets/images/tabbar/icon3.svg'
import icon4 from '../assets/images/tabbar/icon4.svg'
import icon5 from '../assets/images/tabbar/icon5.svg'
import { Link } from 'react-router-dom';
import Setting from '../components/Setting.tsx';
import PieChartComponent from '../components/PieChartComponent.tsx';
import { useNavigate } from "react-router-dom";

const PieChart: React.FC = () => {
        const navigate = useNavigate();
        return (
                <div>
                        <div className="site-content">
                                <div className="verify-number-main">
                                        <div className="verify-number-top">
                                                <div className="container">
                                                        <div className="verify-number-top-content">
                                                                <div className="setting-header">
                                                                        <div className="setting-left">
                                                                                <span>
                                                                                        <DynamicLogo />
                                                                                </span>
                                                                                <span className="setting-txt">Analytics</span>
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
                                                        <div className="chat-content">
                                                                <h1 className="d-none">Area Chart</h1>
                                                                <div className="chat-income-sec">
                                                                        <div className="chat-income">
                                                                                <div>
                                                                                        <img src={IncomeIcon} alt="income-icon" />
                                                                                </div>
                                                                                <div className="chat-txt">
                                                                                        <h2 className="chat-txt1">$9,807</h2>
                                                                                        <p className="chat-txt2">Income</p>
                                                                                </div>
                                                                        </div>
                                                                        <div className="chat-expense">
                                                                                <div>
                                                                                        <img src={ExpenseIcon} alt="income-icon" />
                                                                                </div>
                                                                                <div className="chat-txt">
                                                                                        <h2 className="chat-txt1 color-red">$4,620</h2>
                                                                                        <p className="chat-txt2">Expense</p>
                                                                                </div>
                                                                        </div>
                                                                </div>
                                                        </div>
                                                </div>
                                        </div>
                                        <div className="verify-number-bottom area-chat pie-chart" id="send-money-contact">
                                                <div className="verify-number-bottom-wrap">
                                                        <div className="line-chart-content">
                                                                <div className="statistic-overview">
                                                                        <div className="statistic-overview-content">
                                                                                <div className="statistic-first">
                                                                                        <h2>Statistic Overview</h2>
                                                                                        <p>July 1, 2024 - July 31, 2024</p>
                                                                                </div>
                                                                                <div className="statistic-second">
                                                                                        <div className="custom-select-internet mt-8">
                                                                                                <select name="persons" id="select-currency" className="arrow-icon">
                                                                                                        <option>Monthly</option>
                                                                                                        <option>Half-yearly</option>
                                                                                                        <option>Yearly</option>
                                                                                                        <option>Quarterly </option>
                                                                                                </select>
                                                                                        </div>
                                                                                </div>
                                                                        </div>
                                                                </div>
                                                                <div className="chart-container mt-24">
                                                                        <PieChartComponent />
                                                                </div>
                                                                <div className="chart-border"></div>
                                                                <div className="chat-bottom-space">
                                                                        <h3 className="d-none">Hidden</h3>
                                                                        <div className="line-chart-data mt-24">
                                                                                <div className="data-details">
                                                                                        <p className="week-txt">Best Week</p>
                                                                                        <h4 className="price-txt">$8,980.86</h4>
                                                                                        <p className="date-txt">July 08 - 14</p>
                                                                                </div>
                                                                                <div className="data-details">
                                                                                        <p className="week-txt">Average Value</p>
                                                                                        <h4 className="price-txt">$3,426.24</h4>
                                                                                        <p className="date-txt">July 2024</p>
                                                                                </div>
                                                                        </div>
                                                                        <div className="line-chart-data mt-24">
                                                                                <div className="data-details">
                                                                                        <p className="week-txt">Worst Week</p>
                                                                                        <h4 className="price-txt">$1,256.36</h4>
                                                                                        <p className="date-txt">July 22 - 28</p>
                                                                                </div>
                                                                                <div className="data-details">
                                                                                        <p className="week-txt">Transactions</p>
                                                                                        <h4 className="price-txt">86</h4>
                                                                                        <p className="date-txt">July 2024</p>
                                                                                </div>
                                                                        </div>
                                                                </div>
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                                {/* <!-- Pie chart content end --> */}
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

                                {/* <!-- Bottom tabbar content start --> */}
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
                                                <li className="list">
                                                        <Link to="/Home">
                                                                <i className="icon">
                                                                        <img src={icon1} alt="tabbar-icon" />
                                                                </i>
                                                                <span className="text"></span>
                                                        </Link>
                                                </li>
                                                <li className="list">
                                                        <Link to="/Activity">
                                                                <i className="icon">
                                                                        <img src={icon2} alt="tabbar-icon" />
                                                                </i>
                                                                <span className="text"></span>
                                                        </Link>
                                                </li>
                                                <li className="list active">
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

export default PieChart

