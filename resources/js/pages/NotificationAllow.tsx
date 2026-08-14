import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import NotificationAllowImg from '../assets/images/main-img/notification-allow-img.png'
import { Link } from 'react-router-dom';

const NotificationAllow: React.FC = () => {
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
									<p>Notification</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="notification-allow-main">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<div className="verify-number-img">
									<img src={NotificationAllowImg} alt="notification-img" />
								</div>
								<div className="verify-txt mt-24">
									<h1 className="d-none">Notification Allow</h1>
									<p>Stay notified about new payment, offer status and other updates. You can turn off any time from setting.
										Allow
									</p>
								</div>
								<div className="verify-number-btn"><Link to="/PersonalInfoSlider">Allow</Link></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default NotificationAllow

