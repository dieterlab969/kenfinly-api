import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import EmptyNotificationImg from '../assets/images/main-img/empty-notification-img.png'

const EmptyNotification: React.FC = () => {
	return (
		<div>
			<div className="site-content">
				<div className="verify-number-main" id="empty-notification-main">
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
					<div className="verify-number-bottom">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<div className="verify-number-img">
									<img src={EmptyNotificationImg} alt="empty-notification-img" />
								</div>
								<div className="verify-txt mt-24">
									<h1>Empty</h1>
									<p className="mt-16">You don’t have any notification at this time
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default EmptyNotification


