import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import BillPay from '../assets/images/main-img/bill-pay-img.png'
import { Link } from 'react-router-dom'

const BillPaid: React.FC = () =>{
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
					<div className="verify-number-bottom" id="bill-paid">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<div className="verify-number-img">
									<img src={BillPay} alt="bill-pay-img" />
								</div>
								<div className="verify-txt mt-24">
									<h1>Bill Paid Successfully!</h1>
									<p className="mt-16">You can view your payment history through the activity menu.
									</p>
								</div>
								<div className="bill-paid-btn">
									<div className="paid-button1"><Link to="/Home">Done</Link></div>
									<div className="paid-button2 mt-16"><Link to="/PayBills">Pay Another Bills</Link></div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default BillPaid
