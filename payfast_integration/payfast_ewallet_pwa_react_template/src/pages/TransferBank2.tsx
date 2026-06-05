import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import { Link } from 'react-router-dom'

const TransferBank2: React.FC = () => {
	return (
		<div>
			<div className="site-content">
				{/* <!-- Transfer to bank2 start --> */}
				<div className="verify-number-main">
					<div className="verify-number-top">
						<div className="container">
							<div className="verify-number-top-content">
								<div className="back-btn">
									<BackBtn />
								</div>
								<div className="header-title">
									<p>Transfers To Your Bank</p>
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
											<label htmlFor="customer-amount">Enter the amount to transfer</label>
											<input type="text" id="customer-amount" className="mt-16 active" defaultValue="$1,000.00" />
										</div>
									</form>
									<div className="transfer-to-bank2">
										<p className="available-txt mt-16 chart-border">Available balance: $9,807</p>
										<p className="fee-txt mt-24 ">Fee: USD $2.00 for transfers every $100.00</p>

									</div>
								</div>
								<div className="verify-number-btn"><Link to="/TransferBankReview">Continue</Link></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default TransferBank2