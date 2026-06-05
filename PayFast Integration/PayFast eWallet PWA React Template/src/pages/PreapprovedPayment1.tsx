import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import Refund from '../assets/svg/refund.svg'
import ContactSvg from '../assets/images/sendmoney/contact.svg'
import TrackingSvg from '../assets/svg/tracking.svg'
import InvoiceSvg from '../assets/images/sendmoney/invoice.svg'
import CopiedIconSvg from '../assets/svg/copied-icon.svg'
import LeftIconBlackSvg from '../assets/svg/left-icon-black.svg'
import { Link } from 'react-router-dom'

const PreapprovedPayment1: React.FC = () => {
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
									<p>Jordon Smith</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="preapproved-payment1">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<div className="sendmoney-top send-money4-top">
									<h1>$129.50</h1>
									<p className="mt-12">Preapproved Payment - Completed</p>
								</div>
								<div className="sendmoney-bottom">
									<div className="sendmoney-bottom-wrap mt-16">
										<div className="send-money">
											<Link to="#" data-bs-toggle="offcanvas" data-bs-target="#offcanvasBottom">
												<div className="contact-icon">
													<img src={Refund} alt="refund-icon" />
												</div>
												<p className="mt-8">Refund</p>
											</Link>
										</div>
										<div className="send-money ">
											<div className="contact-icon">
												<img src={ContactSvg} alt="contact-icon" />
											</div>
											<p className="mt-8">Contact</p>
										</div>
										<div className="send-money">
											<div className="contact-icon tracking">
												<img src={TrackingSvg} alt="tracking-icon" />
											</div>
											<p className="mt-8">Tracking</p>
										</div>
										<div className="send-money">
											<div className="contact-icon">
												<img src={InvoiceSvg} alt="invoice-icon" />
											</div>
											<p className="mt-8">Create Invoice</p>
										</div>
									</div>
									<div className="sendmoney-content mt-16">
										<div className="sendmomey-details">
											<span>From</span>
											<span>Jordon Smith</span>
										</div>
										<div className="sendmomey-details mt-12">
											<span>Email</span>
											<span>jordon.smith@mail.com</span>
										</div>
										<div className="sendmomey-details mt-12">
											<span>Date</span>
											<span>15 Jul, 2024 - 15:45 PM</span>
										</div>
										<div className="sendmomey-details mt-12">
											<span>Amount</span>
											<span>$129.50</span>
										</div>
										<div className="sendmomey-details mt-12">
											<span>Item</span>
											<span>Apps Develop</span>
										</div>
										<div className="sendmomey-details mt-12">
											<span>Transaction ID</span>
											<span>FP754623KL5<img src={CopiedIconSvg} alt="copied-icon" className="copied-icon" /></span>
										</div>
									</div>
									<div className="sendmoney-content mt-16">
										<div className="sendmomey-details border-0">
											<span>Subtotal</span>
											<span>$140.00</span>
										</div>
										<div className="sendmomey-details mt-12 border-0">
											<span>Gross  Amount</span>
											<span>$140.00</span>
										</div>
										<div className="sendmomey-details mt-12">
											<span>Fees</span>
											<span>-$10.50</span>
										</div>
										<div className="sendmomey-details mt-12">
											<span>Net Total</span>
											<span>$129.50</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				{/* <!-- Preapproved payment screen content end --> */}
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
						<h2 className="refund-txt mt-12">Refund</h2>
						<div className="new-invoice-modal">
							<Link to="/PreapprovedPaymentRefund">
								<div className="new-invoice-modal-content" >
									<div className="new-invoice-title">
										<p>Full Refund</p>
									</div>
									<div className="new-invoive-pre-bnt">
										<img src={LeftIconBlackSvg} alt="left-icon" />
									</div>
								</div>
							</Link>
							<Link to="/PreapprovedPaymentPartial">
								<div className="new-invoice-modal-content border-0 pb-0" >
									<div className="new-invoice-title">
										<p>Partial Refund</p>
									</div>
									<div className="new-invoive-pre-bnt">
										<img src={LeftIconBlackSvg} alt="left-icon" />
									</div>
								</div>
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default PreapprovedPayment1