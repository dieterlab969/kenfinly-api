import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import { Link } from 'react-router-dom'

const SplitBill1: React.FC = () => {
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
									<p>Split The Bill</p>
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
										<p className="total-txt">How much is the total bill?</p>
										<div className="enter-amount mt-8">
											<label htmlFor="customer-amount">Enter the amount to send</label>
											<input type="text" id="customer-amount" className="mt-16 active" defaultValue="$630.00" />
										</div>
										<div className="mt-24">
											<label htmlFor="customer-id" className="custom-lbl-electricity">Add A Note (Optional)</label>
											<textarea rows={4} cols={50} id="customer-id" placeholder="Write here." className="custom-textarea mt-8"></textarea>
										</div>
									</form>
								</div>
								<div className="verify-number-btn"><Link to="/SplitBill2">Continue</Link></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default SplitBill1