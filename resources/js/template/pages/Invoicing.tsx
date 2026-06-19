import React from 'react'
import DynamicLogo from '../components/DynamicLogo'
import NotificationIcon from '../assets/svg/notification-icon.svg'
import dotsIcon from '../assets/svg/dots-icon.svg'
import LeftIconBlack from '../assets/svg/left-icon-black.svg'
import icon1 from '../assets/images/tabbar/icon1.svg'
import icon2 from '../assets/images/tabbar/icon2.svg'
import icon3 from '../assets/images/tabbar/icon3.svg'
import icon4 from '../assets/images/tabbar/icon4.svg'
import icon5 from '../assets/images/tabbar/icon5.svg'
import InvoiceIcon from '../assets/svg/invoice-icon.svg'
import { Link } from 'react-router-dom';
import Setting from '../components/Setting.tsx';

const Invoicing: React.FC = () => {
        return (
                <div>
                        <div className="site-content">
                                <div className="verify-number-main" id="invoice-main">
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
                                                        <div className="nav nav-tabs custom-tab-activity custom-tab-invoice" id="nav-tab" role="tablist">
                                                                <button className="nav-link active" id="nav-contact-tab" data-bs-toggle="tab" data-bs-target="#nav-all" type="button" role="tab" aria-selected="true">All</button>
                                                                <button className="nav-link" id="nav-favourite-tab" data-bs-toggle="tab" data-bs-target="#nav-received" type="button" role="tab" aria-selected="false">Draft</button>
                                                                <button className="nav-link" id="nav-sent-tab" data-bs-toggle="tab" data-bs-target="#nav-sent" type="button" role="tab" aria-selected="false">Paid</button>
                                                                <button className="nav-link" id="nav-unpaid-tab" data-bs-toggle="tab" data-bs-target="#nav-unpaid" type="button" role="tab" aria-selected="false">Unpaid</button>
                                                        </div>
                                                </div>
                                        </div>
                                        <div className="verify-number-bottom" id="send-money-contact">
                                                <div className="verify-number-bottom-wrap">
                                                        <div className="send-contact-favourite">
                                                                <h1 className="d-none">Invoicing</h1>
                                                                <div className="favourite-list">
                                                                        <div className="tab-content" id="nav-tabContent">
                                                                                <div className="tab-pane show active" id="nav-all" role="tabpanel">
                                                                                        <div className="nav-all-content">
                                                                                                <div className="boder-bottom-activity">
                                                                                                        <h2 className="activity-date">Today - 15 July, 2024</h2>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0126 - Kitty</span>
                                                                                                                        <span>$150.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0126 - Unpaid</span>
                                                                                                                        <span>No due date</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0125 - Martin</span>
                                                                                                                        <span>$45.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0125 - Draft</span>
                                                                                                                        <span>15 Jul 2024</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                </div>
                                                                                                <div className="boder-bottom-activity mt-24">
                                                                                                        <h2 className="activity-date">Yesterday - 14 July, 2024</h2>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0124 - Robert</span>
                                                                                                                        <span>$225.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0124 - Paid</span>
                                                                                                                        <span>12 July 2024</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0123 - Jenny</span>
                                                                                                                        <span>$120.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0123 - Unpaid</span>
                                                                                                                        <span>No due date</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0122 - Kiara</span>
                                                                                                                        <span>$65.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0122 - Draft</span>
                                                                                                                        <span>No due date</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                </div>
                                                                                                <div className="boder-bottom-activity mt-24 border-0">
                                                                                                        <h2 className="activity-date">13 July, 2024</h2>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0121 - Gimmy</span>
                                                                                                                        <span>$225.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0121 - Paid</span>
                                                                                                                        <span>13 July 2024</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0120 - Jenny</span>
                                                                                                                        <span>$120.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0120 - Unpaid</span>
                                                                                                                        <span>No due date</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                </div>
                                                                                        </div>
                                                                                </div>
                                                                                <div className="tab-pane" id="nav-received" role="tabpanel">
                                                                                        <div className="nav-received-content">
                                                                                                <div className="boder-bottom-activity">
                                                                                                        <h2 className="activity-date">Today - 15 July, 2024</h2>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0126 - Kitty</span>
                                                                                                                        <span>$150.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0126 - Unpaid</span>
                                                                                                                        <span>No due date</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0125 - Martin</span>
                                                                                                                        <span>$45.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0125 - Draft</span>
                                                                                                                        <span>15 Jul 2024</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                </div>
                                                                                                <div className="boder-bottom-activity mt-24">
                                                                                                        <h2 className="activity-date">Yesterday - 14 July, 2024</h2>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0124 - Robert</span>
                                                                                                                        <span>$225.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0124 - Paid</span>
                                                                                                                        <span>12 July 2024</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0123 - Jenny</span>
                                                                                                                        <span>$120.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0123 - Unpaid</span>
                                                                                                                        <span>No due date</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0122 - Kiara</span>
                                                                                                                        <span>$65.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0122 - Draft</span>
                                                                                                                        <span>No due date</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                </div>
                                                                                                <div className="boder-bottom-activity mt-24 border-0">
                                                                                                        <h2 className="activity-date">13 July, 2024</h2>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0121 - Gimmy</span>
                                                                                                                        <span>$225.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0121 - Paid</span>
                                                                                                                        <span>13 July 2024</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0120 - Jenny</span>
                                                                                                                        <span>$120.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0120 - Unpaid</span>
                                                                                                                        <span>No due date</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                </div>
                                                                                        </div>
                                                                                </div>
                                                                                <div className="tab-pane" id="nav-sent" role="tabpanel">
                                                                                        <div className="nav-sent-content">
                                                                                                <div className="boder-bottom-activity">
                                                                                                        <h2 className="activity-date">Today - 15 July, 2024</h2>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0126 - Kitty</span>
                                                                                                                        <span>$150.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0126 - Unpaid</span>
                                                                                                                        <span>No due date</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0125 - Martin</span>
                                                                                                                        <span>$45.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0125 - Draft</span>
                                                                                                                        <span>15 Jul 2024</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                </div>
                                                                                                <div className="boder-bottom-activity mt-24">
                                                                                                        <h2 className="activity-date">Yesterday - 14 July, 2024</h2>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0124 - Robert</span>
                                                                                                                        <span>$225.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0124 - Paid</span>
                                                                                                                        <span>12 July 2024</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0123 - Jenny</span>
                                                                                                                        <span>$120.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0123 - Unpaid</span>
                                                                                                                        <span>No due date</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0122 - Kiara</span>
                                                                                                                        <span>$65.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0122 - Draft</span>
                                                                                                                        <span>No due date</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                </div>
                                                                                                <div className="boder-bottom-activity mt-24 border-0">
                                                                                                        <h2 className="activity-date">13 July, 2024</h2>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0121 - Gimmy</span>
                                                                                                                        <span>$225.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0121 - Paid</span>
                                                                                                                        <span>13 July 2024</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0120 - Jenny</span>
                                                                                                                        <span>$120.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0120 - Unpaid</span>
                                                                                                                        <span>No due date</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                </div>
                                                                                        </div>
                                                                                </div>
                                                                                <div className="tab-pane" id="nav-unpaid" role="tabpanel">
                                                                                        <div className="nav-unpaid-content">
                                                                                                <div className="boder-bottom-activity">
                                                                                                        <h2 className="activity-date">Today - 15 July, 2024</h2>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0126 - Kitty</span>
                                                                                                                        <span>$150.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0126 - Unpaid</span>
                                                                                                                        <span>No due date</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0125 - Martin</span>
                                                                                                                        <span>$45.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0125 - Draft</span>
                                                                                                                        <span>15 Jul 2024</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                </div>
                                                                                                <div className="boder-bottom-activity mt-24">
                                                                                                        <h2 className="activity-date">Yesterday - 14 July, 2024</h2>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0124 - Robert</span>
                                                                                                                        <span>$225.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0124 - Paid</span>
                                                                                                                        <span>12 July 2024</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0123 - Jenny</span>
                                                                                                                        <span>$120.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0123 - Unpaid</span>
                                                                                                                        <span>No due date</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0122 - Kiara</span>
                                                                                                                        <span>$65.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0122 - Draft</span>
                                                                                                                        <span>No due date</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                </div>
                                                                                                <div className="boder-bottom-activity mt-24 border-0">
                                                                                                        <h2 className="activity-date">13 July, 2024</h2>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0121 - Gimmy</span>
                                                                                                                        <span>$225.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0121 - Paid</span>
                                                                                                                        <span>13 July 2024</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                        <div className="mt-16">
                                                                                                                <div className="all-details-name-invoice">
                                                                                                                        <span>Invoice #0120 - Jenny</span>
                                                                                                                        <span>$120.00</span>
                                                                                                                </div>
                                                                                                                <div className="all-content-price-invoice">
                                                                                                                        <span>0120 - Unpaid</span>
                                                                                                                        <span>No due date</span>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                </div>
                                                                                        </div>
                                                                                </div>
                                                                        </div>
                                                                </div>
                                                                <div className="tax-plus-btn">
                                                                        <Link to="#" data-bs-toggle="offcanvas" data-bs-target="#offcanvasBottom">
                                                                                <img src={InvoiceIcon} alt="invoice-icon" />
                                                                        </Link>
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
                                {/* <!-- Invoice screen modal content start --> */}
                                <div className="offcanvas offcanvas-bottom logout-main" id="offcanvasBottom">
                                        <button type="button" className="text-reset" data-bs-dismiss="offcanvas" aria-label="Close">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 16" fill="none">
                                                        <g>
                                                                <path d="M22 8L12 13L2 8" stroke="#F2EEFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                                                                <path d="M22 2L12 7L2 2" stroke="#F2EEFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                                                        </g>
                                                </svg>
                                        </button>
                                        <div className="offcanvas-body small">
                                                <h2 className="continue-txt mt-12">Invoice Settings</h2>
                                                <div className="new-invoice-modal">
                                                        <Link to="/NewInvoice">
                                                                <div className="new-invoice-modal-content" >
                                                                        <div className="new-invoice-title">
                                                                                <p>Create New Invoice</p>
                                                                        </div>
                                                                        <div className="new-invoive-pre-bnt">
                                                                                <img src={LeftIconBlack} alt="left-icon" />
                                                                        </div>
                                                                </div>
                                                        </Link>
                                                        <Link to="/OldInvoice">
                                                                <div className="new-invoice-modal-content" >
                                                                        <div className="new-invoice-title">
                                                                                <p>Old Invoice</p>
                                                                        </div>
                                                                        <div className="new-invoive-pre-bnt">
                                                                                <img src={LeftIconBlack} alt="left-icon" />
                                                                        </div>
                                                                </div>
                                                        </Link>
                                                        <Link to="/MyItem">
                                                                <div className="new-invoice-modal-content" >
                                                                        <div className="new-invoice-title">
                                                                                <p>My Items</p>
                                                                        </div>
                                                                        <div className="new-invoive-pre-bnt">
                                                                                <img src={LeftIconBlack} alt="left-icon" />
                                                                        </div>
                                                                </div>
                                                        </Link>
                                                        <Link to="/Taxes">
                                                                <div className="new-invoice-modal-content border-0" >
                                                                        <div className="new-invoice-title">
                                                                                <p>Country Taxes</p>
                                                                        </div>
                                                                        <div className="new-invoive-pre-bnt">
                                                                                <img src={LeftIconBlack} alt="left-icon" />
                                                                        </div>
                                                                </div>
                                                        </Link>
                                                </div>
                                        </div>
                                </div>
                                {/* <!-- Invoice screen modal content end --> */}
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
                                                <li className="list">
                                                        <Link to="/BarChart">
                                                                <i className="icon">
                                                                        <img src={icon3} alt="tabbar-icon" />
                                                                </i>
                                                                <span className="text"></span>
                                                        </Link>
                                                </li>
                                                <li className="list  active">
                                                        <Link to="/Invoicing">
                                                                <i className="icon">
                                                                        <img src={icon4} alt="tabbar-icon" />
                                                                </i>
                                                                <span className="text"></span>
                                                        </Link>
                                                </li>
                                        </ul>
                                </div>
                        </div>
                </div>
        )
}

export default Invoicing



