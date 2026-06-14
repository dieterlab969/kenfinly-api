import React from 'react'
import BackBtn from '../components/BackBtn.tsx';

const MarketingScreen: React.FC = () => {
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
									<p>Marketing Preferences</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<h1 className="d-none">Hidden</h1>
								<div className="marketing-wrap">
									<div className="marketing-content">
										<p>We’ll send info that’s relevant to you. You can choose what you’d like to get from us and how we should send it.</p>
									</div>
									<div className="marketing-content mt-16">
										<h2 >News</h2>
										<p className="mt-8">we’ll send important info about our products and benefits to help you get the most from your account.</p>
										<div className="notification-option-wrapper mt-8">
											<div className="notification-option-name">
												<p>Email me</p>
											</div>
											<div className="notification-option-switch">
												<label className="switch" htmlFor="switch1">
													<input type="checkbox" id="switch1" />
													<span className="slider"></span>
												</label>
											</div>
										</div>
									</div>
									<div className="marketing-content mt-16">
										<h2>Offers</h2>
										<p className="mt-8">From travel to technology and fashion to food. we’ll send discounts and offers from our partner brands.</p>
										<div className="notification-option-wrapper mt-8">
											<div className="notification-option-name">
												<p>Email me</p>
											</div>
											<div className="notification-option-switch">
												<label className="switch" htmlFor="switch2">
													<input type="checkbox" id="switch2" />
													<span className="slider"></span>
												</label>
											</div>
										</div>
									</div>
									<div className="marketing-content mt-16 border-0">
										<h2>Surveys</h2>
										<p className="mt-8">From time to time, we’ll invite you to share your opinions. By taking part, you can help us create an even better PayFast.</p>
										<div className="notification-option-wrapper mt-8">
											<div className="notification-option-name">
												<p>Email me</p>
											</div>
											<div className="notification-option-switch">
												<label className="switch" htmlFor="switch3">
													<input type="checkbox" id="switch3" />
													<span className="slider"></span>
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

export default MarketingScreen