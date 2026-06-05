import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import Payment1 from '../assets/images/payment/payment1.svg'
import Payment2 from '../assets/images/payment/payment2.svg'
import Payment3 from '../assets/images/payment/payment3.svg'
import Payment4 from '../assets/images/payment/payment4.svg'
import Payment5 from '../assets/images/payment/payment5.svg'
import Payment6 from '../assets/images/payment/payment6.svg'
import purpleEditIcon from '../assets/svg/purple-edit-icon.svg'
import { Link } from 'react-router-dom'

const Payment: React.FC = () => {
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
									<p>Payment Method</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="payment-main">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<h1 className="d-none">Payment</h1>
								<div className="transfer-to-bank">
									<div className="transfer-first">
										<div className="bank-img">
											<img src={Payment1} alt="payment-icon" />
										</div>
										<div className="bank-details">
											<h2>PayPal</h2>
										</div>
										<div className="bank-active-sec">
											<p className="pay-txt1">Connected</p>
										</div>
									</div>
									<div className="transfer-first">
										<div className="bank-img">
											<img className='ApplyPay' src={Payment2} alt="payment-icon" />
										</div>
										<div className="bank-details ">
											<h2>Apply Pay</h2>
										</div>
										<div className="bank-active-sec">
											<p className="pay-txt1">Connected</p>
										</div>
									</div>
									<div className="transfer-first">
										<div className="bank-img">
											<img src={Payment3} alt="payment-icon" />
										</div>
										<div className="bank-details">
											<h2>Google Pay</h2>
										</div>
										<div className="bank-active-sec">
											<p className="pay-txt1">Connected</p>
										</div>
									</div>
									<div className="transfer-first">
										<div className="bank-img">
											<img src={Payment4} alt="payment-icon" />
										</div>
										<div className="bank-details">
											<h2>Amazon Pay</h2>
										</div>
										<div className="bank-active-sec">
											<p className="pay-txt1 not-connect">Not Connected</p>
										</div>
									</div>
									<div className="transfer-first">
										<div className="bank-img">
											<img src={Payment5} alt="payment-icon" />
										</div>
										<div className="bank-details">
											<h2>MasterCard</h2>
											<p>**** **** **** 7887</p>
										</div>
										<div className="bank-active-sec">
											<div>
												<Link to="#">
													<img src={purpleEditIcon} alt="edit-icon" />
												</Link>
											</div>
										</div>
									</div>
									<div className="transfer-first border-0">
										<div className="bank-img">
											<img src={Payment6} alt="payment-icon" />
										</div>
										<div className="bank-details">
											<h2>Visa</h2>
											<p>**** **** **** 0890</p>
										</div>
										<div className="bank-active-sec">
											<div>
												<Link to="#">
													<img src={purpleEditIcon} alt="edit-icon" />
												</Link>
											</div>
										</div>
									</div>
								</div>
								<div className="verify-number-btn"><Link to="#">Add New Payment</Link></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Payment