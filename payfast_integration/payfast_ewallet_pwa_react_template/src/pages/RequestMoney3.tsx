import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import RequestMOney3Img from '../assets/images/main-img/request-money3-img.png'
import { Link } from 'react-router-dom';

const RequestMoney3: React.FC = () => {
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
									<img src={RequestMOney3Img} alt="bill-pay-img" />
								</div>
								<div className="verify-txt mt-24">
									<h1>You requested $100 from Alyassa Russel</h1>
									<p className="mt-16">We will Alyassa Russel know right away that you requested money. You can see the details in your activity in case you need them later.
									</p>
								</div>
								<div className="bill-paid-btn">
									<div className="paid-button1"><Link to="/Home">Done</Link></div>
									<div className="paid-button2 mt-16"><Link to="/RequestMoneyContact">New Request</Link></div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default RequestMoney3