import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import ProfileImg from '../assets/images/Qr-code-payment/profile-img.png'
import Bank2Img from '../assets/images/transfer-to-bank/bank2.svg'
import UpIconImg from '../assets/svg/up-icon.svg'
import { Link } from 'react-router-dom'

const QrcodePayment: React.FC = () => {
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
									<p>Payment</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="Qrcode-main">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<div className="qrcode-content">
									<div className="profile-img-content">
										<img src={ProfileImg} alt="profile-img" />
									</div>
									<p className="name-txt">Rashmi Chand</p>
									<p className="email-txt mt-8">rashmichand@bankname.upi</p>
									<h1 className="qr-price mt-24">$120.00</h1>
									<div className="qr-code-name mt-32">
										<input type="text" id="customer-amount" defaultValue="Photography Payment" />
									</div>
									<div className="payment-method">
										<p>Choose a card or bank for payout</p>
										<div className="transfer-first p-0 border-0 mt-8">
											<div className="bank-img">
												<img src={Bank2Img} alt="bank-icon" />
											</div>
											<div className="bank-details">
												<h2>MasterCard</h2>
												<div className="bank-card">
													<span>| Card Number **** 7887</span>
												</div>
											</div>
											<div className="bank-active-sec">
												<div>
													<Link to="#">
														<img src={UpIconImg} alt="edit-icon" />
													</Link>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div className="verify-number-btn">
									<Link to="/SendMoneyContact">Send Money</Link>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default QrcodePayment

