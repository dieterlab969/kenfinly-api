import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import TransferBankImg from '../assets/images/main-img/transfer-to-bank-img.png'
import { Link } from 'react-router-dom'

const TransferBankSuccess: React.FC = () => {
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
					<div className="verify-number-bottom" id="transfer-to-bank-success">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<div className="verify-number-img">
									<img src={TransferBankImg} alt="notification-img" />
								</div>
								<div className="transfer-txt mt-24">
									<h1 >Your $1,000 is on its way</h1>
									<p className="mt-16">Estimated Arrival: 3 business days
									</p>
									<p className="mt-12">You are transferring money to: Bank of America
									</p>
								</div>
								<div className="verify-number-btn"><Link to="/Home">Ok</Link></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default TransferBankSuccess

