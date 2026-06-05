import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import { Link } from 'react-router-dom'

const Security: React.FC = () => {
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
									<p>Security</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="security-main">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<h1 className="d-none">Security</h1>
								<div className="notification-setting">
									<div className="notification-option-wrap">
										<div className="notification-option-wrapper pt-0">
											<div className="notification-option-name">
												<p>Remember Me</p>
											</div>
											<div className="notification-option-switch">
												<label className="switch" htmlFor="switch1">
													<input type="checkbox" id="switch1" />
													<span className="slider"></span>
												</label>
											</div>
										</div>
									</div>
									<div className="notification-option-wrap">
										<div className="notification-option-wrapper">
											<div className="notification-option-name">
												<p>Biometric ID</p>
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
												<p>Face ID</p>
											</div>
											<div className="notification-option-switch">
												<label className="switch" htmlFor="switch3">
													<input type="checkbox" id="switch3" />
													<span className="slider "></span>
												</label>
											</div>
										</div>
									</div>
									<div className="notification-option-wrap border-0">
										<div className="notification-option-wrapper">
											<div className="notification-option-name">
												<p>Two-Factor Authentication</p>
											</div>
											<div className="notification-option-switch">
												<label className="switch" htmlFor="switch4">
													<input type="checkbox" id="switch4" />
													<span className="slider "></span>
												</label>
											</div>
										</div>
									</div>
									<div className="paid-button2 mt-16"><Link to="#">Change PIN</Link></div>
									<div className="paid-button2 mt-16"><Link to="/ForgetPassword">Change Password</Link></div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Security