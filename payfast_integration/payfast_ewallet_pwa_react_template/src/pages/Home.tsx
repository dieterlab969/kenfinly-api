import React from 'react'
import Logo from '../assets/images/setting/logo.png'
import { useNavigate } from "react-router-dom";
import NotificationIcon from '../assets/svg/notification-icon.svg'
import dotsIcon from '../assets/svg/dots-icon.svg'
import Send from '../assets/images/home/send.svg'
import Request from '../assets/images/home/request.svg'
import Transfer from '../assets/images/home/transfer.svg'
import Invoice from '../assets/images/home/invoice.svg'
import payBills from '../assets/images/home/pay-bills.svg'
import Tracking from '../assets/svg/tracking.svg'
import SendmoneyInvoice from '../assets/images/sendmoney/invoice.svg'
import ButtonIcons from '../assets/images/home/button-icon.svg'
import icon1 from '../assets/images/tabbar/icon1.svg'
import icon2 from '../assets/images/tabbar/icon2.svg'
import icon3 from '../assets/images/tabbar/icon3.svg'
import icon4 from '../assets/images/tabbar/icon4.svg'
import icon5 from '../assets/images/tabbar/icon5.svg'
import { Link } from 'react-router-dom';
import Setting from '../components/Setting.tsx';


const Home: React.FC = () => {
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
										<span><img src={Logo} alt="logo" /></span>
										<span className="setting-txt">PayFast</span>
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
							<div className="home-top-content">
								<div className="person-details">
									<p className="name">Hi Jessica,</p>
									<p className="balance mt-8">Your available balance is</p>
								</div>
								<div className="balance-data">
									<h1>$9,807</h1>
								</div>
							</div>
						</div>
					</div>

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

					<div className="verify-number-bottom" id="homepage">
						<div className="verify-number-bottom-wrap">
							<div className="homepage-bottom-content">
								<div className="homepage-first">
									<Link to="/SendMoneyContact">
										<div className="first-details">
											<img src={Send} alt="send-icon" />
											<p>Send</p>
										</div>
									</Link>
									<Link to="/RequestMoneyContact">
										<div className="first-details">
											<img src={Request} alt="send-icon" />
											<p>Request</p>
										</div>
									</Link>
									<Link to="/TransferBank1">
										<div className="first-details">
											<img src={Transfer} alt="send-icon" />
											<p>Transfer</p>
										</div>
									</Link>
								</div>
								<div className="sendmoney-bottom-wrap mt-24 split6-screen-content-top">
									<div className="send-money">
										<Link to="/SendInvoice1">
											<div className="contact-icon">
												<img src={Invoice} alt="send-icon" />
											</div>
											<p className="mt-8">Send Invoice</p>
										</Link>
									</div>
									<div className="send-money">
										<Link to="/PayBills">
											<div className="contact-icon">
												<img src={payBills} alt="send-icon" />
											</div>
											<p className="mt-8">Pay Bills</p>
										</Link>
									</div>
									<div className="send-money">
										<Link to="/SplitBill1">
											<div className="contact-icon">
												<img src={Tracking} alt="tracking-icon" />
											</div>
											<p className="mt-8">Split Bill</p>
										</Link>
									</div>
									<div className="send-money">
										<Link to="/SplitBill7">
											<div className="contact-icon">
												<img src={SendmoneyInvoice} alt="invoice-icon" />
											</div>
											<p className="mt-8">Share Payment Info</p>
										</Link>
									</div>
								</div>
								<div className="home-activity mt-24">
									<div className="home-activity-top">
										<span>Recent Activity</span>
										<span>
											<Link to="/Activity">
												<img src={ButtonIcons} alt="button-icon" />
											</Link>
										</span>
									</div>
									<h2 className="d-none">Hidden</h2>
									<div className="home-activity-bottom mt-16">
										<div className="home-activity-bottom-wrap">
											<div className="home-first">
												<h3>Jordon Smith</h3>
												<p>Preapproved Payment - Completed</p>
											</div>
											<div className="home-second">
												<h4>+$129.5</h4>
											</div>
										</div>
										<div className="home-activity-bottom-wrap mt-16">
											<div className="home-first">
												<h3>Kitty Nguyen</h3>
												<p>Transfers Bank - Completed</p>
											</div>
											<div className="home-second">
												<h4 className="color-red">+$129.5</h4>
											</div>
										</div>
										<div className="home-activity-bottom-wrap mt-16">
											<div className="home-first">
												<h3>Green Williamson</h3>
												<p>Preapproved Payment - Completed</p>
											</div>
											<div className="home-second">
												<h4>+$90</h4>
											</div>
										</div>
										<div className="home-activity-bottom-wrap mt-16">
											<div className="home-first">
												<h3>Dianne Russell</h3>
												<p>Transfers Bank - Completed</p>
											</div>
											<div className="home-second">
												<h4 className="color-red">-$20</h4>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				{/* <!-- Home screen content end --> */}
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
						<li className="list active">
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

export default Home