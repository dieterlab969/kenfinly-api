import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import InvoiceSvg from '../assets/images/sendmoney/invoice.svg'
import ContactSvg from '../assets/images/sendmoney/contact.svg'
import CopiedIconSvg from '../assets/svg/copied-icon.svg'

const RequestPayment: React.FC = () => {
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
									<p>Marvin Mckinney</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="request-payment">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<div className="sendmoney-top send-money4-top">
									<h1>$120.00</h1>
									<p className="mt-12">Payment Request - Pending</p>
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
												<img src={InvoiceSvg} alt="contact-icon" />
											</div>
											<p className="mt-8">Create Invoice</p>
										</div>
									</div>
									<div className="sendmoney-content mt-16">
										<div className="sendmomey-details">
											<span>From</span>
											<span>Marvin Mckinney</span>
										</div>
										<div className="sendmomey-details mt-12">
											<span>Email</span>
											<span>marvin12@mail.com</span>
										</div>
										<div className="sendmomey-details mt-12">
											<span>Date</span>
											<span>05 Jul, 2024 - 09:15 AM</span>
										</div>
										<div className="sendmomey-details mt-12">
											<span>Amount</span>
											<span>$120.00</span>
										</div>
										<div className="sendmomey-details mt-12">
											<span>Transaction ID</span>
											<span>FP742561KL9<img src={CopiedIconSvg} alt="copied-icon" className="copied-icon" id="copyMessage" /></span>
										</div>
									</div>
									<div className="sendmoney-content mt-16">
										<div className="sendmomey-details">
											<span>Subtotal</span>
											<span>$100.00</span>
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

export default RequestPayment
