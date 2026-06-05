import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import sendMoneyImg from '../assets/images/main-img/send-money-success-img.png'
import { Link } from 'react-router-dom';

const SendMoneySuccessful: React.FC = () => {
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
					<div className="verify-number-bottom" id="send-money-successfull">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<div className="verify-number-img">
									<img src={sendMoneyImg} alt="notification-img" />
								</div>
								<div className="verify-txt mt-24">
									<h1>Successful Sent!</h1>
									<p className="mt-16">Your money has been successfully sent to Alan Williamson.
									</p>
								</div>
								<div className="verify-number-btn"><Link to="/Home">OK</Link></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default SendMoneySuccessful


