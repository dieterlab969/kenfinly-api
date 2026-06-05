import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import Bill3 from '../assets/images/paybill/bill-3.svg'
import { Link } from 'react-router-dom'

const Waterbill2: React.FC = () => {
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
									<p>Water Bill</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="electricity1">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<div className="electricity1-top">
									<div className="pay-bill-content">
										<div className="pay-bill-img bg-3">
											<img src={Bill3} alt="pay-bills" />
										</div>
										<h1 className="pay-txt mt-16">Pay water Bill</h1>
										<p className="pay-bill-name mt-12">Pay water bills safely, conveniently & easily. You can pay anytime and anywhere!</p>
									</div>
								</div>
								<div className="electricity1-bottom mt-24">
									<div className="bill-amount">
										<div className="bill-amount-content">
											<span>Bill Amount</span>
											<span>$76.50</span>
										</div>
									</div>
									<div className="bill-amount mt-16">
										<div className="bill-amount-content">
											<span>Name</span>
											<span>Jessica Smith</span>
										</div>
									</div>
									<div className="bill-amount mt-16">
										<div className="bill-amount-content">
											<span>Zone Area</span>
											<span>YN125</span>
										</div>
									</div>
									<div className="bill-amount mt-16">
										<div className="bill-amount-content">
											<span>Customer ID</span>
											<span>456235789456</span>
										</div>
									</div>
									<div className="bill-amoun mt-16">
										<div className="bill-amount-content">
											<span>Status</span>
											<span className="color-red">Unpaid</span>
										</div>
									</div>
								</div>
								<div className="verify-number-btn"><Link to="/Billpaid">Confirm & Pay Now</Link></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Waterbill2
