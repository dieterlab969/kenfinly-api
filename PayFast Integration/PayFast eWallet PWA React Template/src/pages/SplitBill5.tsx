import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import { Link } from 'react-router-dom'

const SplitBill5: React.FC = () => {
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
									<p>Review Summery</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="spilt6-main">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<div className="split6-screen-content">
									<div className="split6-screen-content-top">
										<h1>$630</h1>
										<p>We’re only helping with the math. Your account will not be charged.</p>
									</div>
									<div className="sendmoney-content mt-24">
										<div className="sendmomey-details pt-0">
											<span>You</span>
											<span>$100.00</span>
										</div>
										<div className="sendmomey-details">
											<span>Aayan Smith</span>
											<span>$100.00</span>
										</div>
										<div className="sendmomey-details">
											<span>Alan Williamson</span>
											<span>$130.00</span>
										</div>
										<div className="sendmomey-details">
											<span>Alyassa Russel</span>
											<span>$100.00</span>
										</div>
										<div className="sendmomey-details">
											<span>Anthony Robetson</span>
											<span>$100.00</span>
										</div><div className="sendmomey-details pb-0">
											<span>Arianna Cooper</span>
											<span>$100.00</span>
										</div>
									</div>
								</div>
							</div>
							<div className="verify-number-btn split3-btn"><Link to="/SplitBill6">Request Now</Link></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default SplitBill5