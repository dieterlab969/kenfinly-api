import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import Logo from '../assets/svg/logo.svg'
import HomeIcon from '../assets/svg/home-icon.svg'
import { Link } from 'react-router-dom'

const TransferBankReview: React.FC = () => {
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
									<p>Review Summary</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="transfer-to-bank-review">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<h1 className="d-none">Transfer Bank</h1>
								<div className="transfer-bank-success-wrap">
									<div className="transfer-bank-success-content">
										<div className="transfer-content-details">
											<p>From</p>
											<div className="content-details mt-8">
												<div className="first-content">
													<div className="transfer-logo">
														<img src={Logo} alt="logo" />
													</div>
												</div>
												<div className="first-content">
													<h2>PayFast Balance</h2>
													<p>Available: $9,807</p>
												</div>
											</div>
										</div>
										<div className="transfer-content-details mt-16 ">
											<p>To</p>
											<div className="content-details mt-8 pb-0 border-0">
												<div className="first-content">
													<div className="transfer-logo">
														<img src={HomeIcon} alt="logo" />
													</div>
												</div>
												<div className="first-content">
													<h2>Bank of America</h2>
													<p>Card Number **** 4625</p>
												</div>
											</div>
										</div>
										<div className="sendmoney-content mt-24 ">
											<div className="sendmomey-details border-0">
												<span>Transfer Amount</span>
												<span>$1,000.00</span>
											</div>
											<div className="sendmomey-details">
												<span>Fee</span>
												<span className="color-red">-$10.00</span>
											</div>
											<div className="sendmomey-details pb-0">
												<span>You will get:</span>
												<span>$990.00</span>
											</div>
										</div>
										<div className="estimated-time mt-24">
											<h2>Estimated Arrival: 3 business days</h2>
											<p className="mt-12">Transfers made after 7:00 PM ET or on weekends or holidays take longer. All transfers are subject to review & could be delayed or stopped if we identify an issue.</p>
										</div>
									</div>
								</div>
								<div className="verify-number-btn split3-btn"><Link to="/TransferBankSuccess">Transfer Now</Link></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default TransferBankReview

