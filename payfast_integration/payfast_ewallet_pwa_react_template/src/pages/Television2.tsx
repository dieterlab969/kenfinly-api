import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import Bill9 from '../assets/images/paybill/bill-9.svg'
import { Link } from 'react-router-dom'

const Television2: React.FC = () => {
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
									<p>Television Bill</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="electricity1">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<div className="electricity1-top">
									<div className="pay-bill-content">
										<div className="pay-bill-img bg-9">
											<img src={Bill9} alt="pay-bills" />
										</div>
										<h1 className="pay-txt mt-16">Pay Television Bill</h1>
										<p className="pay-bill-name mt-12">Pay Television bills safely, conveniently & easily. You can pay anytime and anywhere!</p>
									</div>
								</div>
								<div className="electricity1-bottom mt-24">
									<div className="bill-amount">
										<div className="bill-amount-content">
											<span>Bill Amount</span>
											<span>$146.70</span>
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

export default Television2