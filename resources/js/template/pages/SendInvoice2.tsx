import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import SendInvoiceIMg from '../assets/images/main-img/send-quick-invoice2-img.png'
import { Link } from 'react-router-dom'

const SendInvoice2: React.FC = () => {
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
									<p>Send a Quick Invoice</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="bill-paid">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<div className="verify-number-img">
									<img src={SendInvoiceIMg} alt="bill-pay-img" />
								</div>
								<div className="verify-txt mt-24">
									<h1>Your invoice link is ready to share</h1>
									<p className="mt-16">Share your invoice link via the share link button below.
									</p>
								</div>
								<div className="bill-paid-btn">
									<div className="paid-button1"><Link to="#">Share Link</Link></div>
									<div className="paid-button2 mt-16"><Link to="/Home">Done</Link></div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default SendInvoice2