import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import PreapprovedRefundImg from '../assets/images/main-img/preapproved-refund-img.png'
import { Link } from 'react-router-dom'

const PreapprovedPaymentRefund: React.FC = () => {
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
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="preapproved-refund">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<div className="verify-number-img">
									<img src={PreapprovedRefundImg} alt="preapprovedpayment-img" />
								</div>
								<div className="verify-txt mt-24">
									<h1>Refund has been Sent!</h1>
									<p className="mt-16">You have refunded $60 to Jordon Smith.<br />You can track this refund from activity.
									</p>
								</div>
								<div className="verify-number-btn"><Link to="/Tracking1">Done</Link></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default PreapprovedPaymentRefund