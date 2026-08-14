
import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import ContactSvg from '../assets/images/sendmoney/contact.svg'
import TrackingSvg from '../assets/images/sendmoney/tracking.svg'
import InvoiceSvg from '../assets/images/sendmoney/invoice.svg'
import CopiedIconSvg from '../assets/svg/copied-icon.svg'

const SendMoney: React.FC = () => {
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
									<p>Christian Dawson</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="send-money-main">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<div className="sendmoney-top send-money4-top">
									<h1>$225.00</h1>
									<p className="mt-12">Send Money - Completed</p>
								</div>
								<div className="sendmoney-bottom">
									<div className="sendmoney-bottom-wrap mt-16">
										<div className="send-money">
											<div className="contact-icon">
												<img src={ContactSvg} alt="contact-icon" />
											</div>
											<p className="mt-8">Contact</p>
										</div>
										<div className="send-money">
											<div className="contact-icon">
												<img src={TrackingSvg} alt="contact-icon" />
											</div>
											<p className="mt-8">Tracking</p>
										</div>
										<div className="send-money">
											<div className="contact-icon">
												<img src={InvoiceSvg} alt="contact-icon" />
											</div>
											<p className="mt-8">Create Invoice</p>
										</div>
									</div>
									<div className="sendmoney-content mt-16">
										<div className="sendmomey-details">
											<span>From</span>
											<span>Christian Dawson</span>
										</div>
										<div className="sendmomey-details mt-12">
											<span>Email</span>
											<span>christian.daw@mail.com</span>
										</div>
										<div className="sendmomey-details mt-12">
											<span>Date</span>
											<span>14 Jul, 2024 - 15:45 PM</span>
										</div>
										<div className="sendmomey-details mt-12">
											<span>Amount</span>
											<span>$225.00</span>
										</div>
										<div className="sendmomey-details mt-12">
											<span>Transaction ID</span>
											<span>FP845612PL8<img src={CopiedIconSvg} alt="copied-icon" className="copied-icon" /></span>
										</div>
									</div>
									<div className="sendmoney-content mt-16">
										<div className="sendmomey-details border-0">
											<span>Subtotal</span>
											<span>$225.00</span>
										</div>
										<div className="sendmomey-details mt-12">
											<span>Fees</span>
											<span>-$10.50</span>
										</div>
										<div className="sendmomey-details mt-12">
											<span>Net Total</span>
											<span>$115.50</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default SendMoney