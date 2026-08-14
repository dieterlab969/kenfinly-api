import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import { Link } from 'react-router-dom'

const SendInvoice1: React.FC = () => {
	return (
		<div>
			<div className="site-content">
				{/* <!-- Send qucik invoice1 screen content start --> */}
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
					<div className="verify-number-bottom" id="send-money1">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<div className="sendmoney1-bottom">
									<h1 className="d-none">Send Money</h1>
									<h2 className="d-none">Hidden</h2>
									<form>
										<div className="enter-amount">
											<label htmlFor="customer-amount">Enter the amount to send</label>
											<input type="text" id="customer-amount" className="mt-16 active" defaultValue="$150.00" />
										</div>
										<div className="mt-24">
											<label htmlFor="customer-id" className="custom-lbl-electricity">Add A Note (Optional)</label>
											<textarea id="customer-id" placeholder="Write here." className="custom-textarea mt-8"></textarea>
										</div>
									</form>
								</div>
								<div className="verify-number-btn"><Link to="/SendInvoice2">Create and Share Link</Link></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default SendInvoice1