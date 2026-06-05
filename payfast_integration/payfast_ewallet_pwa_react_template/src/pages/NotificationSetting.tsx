import React from 'react'
import BackBtn from '../components/BackBtn.tsx';

const NotificationSetting: React.FC = () => {
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
									<p>Notification </p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="notification-setting">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<h1 className="d-none">Notification Setting</h1>
								<div className="notification-setting">
									<p className="notify-txt">We will notify you when...</p>
									<div className="notification-option-wrap">
										<div className="notification-option-wrapper">
											<div className="notification-option-name">
												<p>Your invoices are paid</p>
											</div>
											<div className="notification-option-switch">
												<label className="switch" htmlFor="switch1">
													<input type="checkbox" id="switch1" />
													<span className="slider "></span>
												</label>
											</div>
										</div>
									</div>
									<div className="notification-option-wrap">
										<div className="notification-option-wrapper">
											<div className="notification-option-name">
												<p>Someone request money from you</p>
											</div>
											<div className="notification-option-switch">
												<label className="switch" htmlFor="switch2">
													<input type="checkbox" id="switch2" />
													<span className="slider "></span>
												</label>
											</div>
										</div>
									</div>
									<div className="notification-option-wrap">
										<div className="notification-option-wrapper">
											<div className="notification-option-name">
												<p>You send money to someone</p>
											</div>
											<div className="notification-option-switch">
												<label className="switch" htmlFor="switch3">
													<input type="checkbox" id="switch3" />
													<span className="slider "></span>
												</label>
											</div>
										</div>
									</div>
									<div className="notification-option-wrap">
										<div className="notification-option-wrapper">
											<div className="notification-option-name">
												<p>You receive money from someone</p>
											</div>
											<div className="notification-option-switch">
												<label className="switch" htmlFor="switch4">
													<input type="checkbox" id="switch4" />
													<span className="slider "></span>
												</label>
											</div>
										</div>
									</div>
									<div className="notification-option-wrap">
										<div className="notification-option-wrapper">
											<div className="notification-option-name">
												<p>You purchase something</p>
											</div>
											<div className="notification-option-switch">
												<label className="switch" htmlFor="switch5">
													<input type="checkbox" id="switch5" />
													<span className="slider"></span>
												</label>
											</div>
										</div>
									</div>
									<div className="notification-option-wrap">
										<div className="notification-option-wrapper">
											<div className="notification-option-name">
												<p>You receive a QR code payment</p>
											</div>
											<div className="notification-option-switch">
												<label className="switch" htmlFor="switch6">
													<input type="checkbox" id="switch6" />
													<span className="slider "></span>
												</label>
											</div>
										</div>
									</div>
									<div className="notification-option-wrap">
										<div className="notification-option-wrapper">
											<div className="notification-option-name">
												<p>You receive a direct payment</p>
											</div>
											<div className="notification-option-switch">
												<label className="switch" htmlFor="switch7">
													<input type="checkbox" id="switch7" />
													<span className="slider "></span>
												</label>
											</div>
										</div>
									</div>
									<div className="notification-option-wrap">
										<div className="notification-option-wrapper">
											<div className="notification-option-name">
												<p>You receive a subscriptions info</p>
											</div>
											<div className="notification-option-switch">
												<label className="switch" htmlFor="switch8">
													<input type="checkbox" id="switch8" />
													<span className="slider "></span>
												</label>
											</div>
										</div>
									</div>
									<div className="notification-option-wrap">
										<div className="notification-option-wrapper">
											<div className="notification-option-name">
												<p>You receive announcements & offers</p>
											</div>
											<div className="notification-option-switch">
												<label className="switch" htmlFor="switch9">
													<input type="checkbox" id="switch9" />
													<span className="slider "></span>
												</label>
											</div>
										</div>
									</div>
									<div className="notification-option-wrap border-0">
										<div className="notification-option-wrapper">
											<div className="notification-option-name">
												<p>You receive an app updates info</p>
											</div>
											<div className="notification-option-switch">
												<label className="switch" htmlFor="switch10">
													<input type="checkbox" id="switch10" />
													<span className="slider "></span>
												</label>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default NotificationSetting