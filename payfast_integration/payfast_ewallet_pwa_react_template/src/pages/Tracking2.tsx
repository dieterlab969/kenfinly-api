import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import OrderStatusBlack from '../assets/svg/order-status-black.svg'
import { Link } from 'react-router-dom'

const Tracking2: React.FC = () => {
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
									<p>Tracking</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="tracking-main">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<h1 className="d-none">Tracking</h1>
								<h2 className="d-none">Hidden</h2>
								<div className="add-tax-content">
									<form className="feedback-form">
										<div className="form-details-pays-bill">
											<label htmlFor="customer-id" className="custom-lbl-electricity">Track Fund</label>
											<input type="text" id="customer-id" defaultValue="FP754623KL5" className="custom-input-id color-black mt-8" autoComplete="off" />
										</div>
									</form>
									<div className="track-order-third-sec mt-24">
										<div className="track-order-third-sec-full">
											<h3>Order Status Details</h3>
											<h4 className="d-none">Hidden</h4>
											<div className="order-status-sec">
												<div className="order1">
													<img src={OrderStatusBlack} alt="order-status" />
												</div>
												<div className="order2">
													<p className="order-txt1">$129.50 USD Preapproved Payment - July 15</p>
													<p className="order-txt2">15:30 PM | From Jordon Smith</p>
												</div>
											</div>
											<div className="order-status-sec mt-32">
												<div className="order1">
													<img src={OrderStatusBlack} alt="order-status" />
												</div>
												<div className="order2">
													<p className="order-txt1">Credit in Wallet </p>
													<p className="order-txt2">15:40 PM | Via UPI</p>
												</div>
											</div>
											<div className="order-status-sec mt-32">
												<div className="order1">
													<img src={OrderStatusBlack} alt="order-status" />
												</div>
												<div className="order2">
													<p className="order-txt1">$60 USD Partial Refund Created</p>
													<p className="order-txt2">20:10 PM | By Jessica Smith</p>
												</div>
											</div>
											<div className="order-status-sec mt-32">
												<div>
													<img src={OrderStatusBlack} alt="order-status" />
												</div>
												<div className="order2">
													<p className="order-txt1 color-red">Refund On The Way</p>
													<p className="order-txt2">Estimate Arrive at 20:40 PM</p>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div className="verify-number-btn"><Link to="/Home">Back To Home</Link></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Tracking2