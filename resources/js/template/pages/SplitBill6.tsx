import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import SplitBill7Img from '../assets/images/main-img/split-bill7-img.png'
import { Link } from 'react-router-dom'

const SplitBill6: React.FC = () => {
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
					<div className="verify-number-bottom" id="spilt7-main">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<div className="split6-screen-content">
									<div className="split7-screen-content-top">
										<img src={SplitBill7Img} alt="spilt-img" />
										<h1 className="mt-24">You’re splitting a bill of $630 USD</h1>
										<p>You can track this split from activity</p>
									</div>
									<div className="sendmoney-content mt-24">
										<div className="sendmomey-details">
											<span>You</span>
											<span>$100.00</span>
										</div>
										<div className="sendmomey-details mt-12">
											<span>Aayan Smith</span>
											<span>$100.00</span>
										</div>
										<div className="sendmomey-details mt-12">
											<span>Alan Williamson</span>
											<span>$130.00</span>
										</div>
										<div className="sendmomey-details mt-12">
											<span>Alyassa Russel</span>
											<span>$100.00</span>
										</div>
										<div className="sendmomey-details mt-12">
											<span>Anthony Robetson</span>
											<span>$100.00</span>
										</div><div className="sendmomey-details mt-12">
											<span>Arianna Cooper</span>
											<span>$100.00</span>
										</div>
									</div>
								</div>
							</div>
							<div className="verify-number-btn split3-btn"><Link to="/SplitBill7">Done</Link></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default SplitBill6