import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import Subscription1 from '../assets/images/subscription/subscription1.png'
import Subscription2 from '../assets/images/subscription/subscription2.png'
import Subscription3 from '../assets/images/subscription/subscription3.png'
import Subscription4 from '../assets/images/subscription/subscription4.png'
import Subscription5 from '../assets/images/subscription/subscription5.png'
import Subscription6 from '../assets/images/subscription/subscription6.png'
import Subscription7 from '../assets/images/subscription/subscription7.png'
import Subscription8 from '../assets/images/subscription/subscription8.png'

const AutomaticPayment : React.FC = () =>{
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
									<p>Automatic Payments</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="automatic-payment">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<h1 className="d-none">Automatic Payment</h1>
								<h2 className="d-none">Hidden</h2>
								<div className="automatic-payment-bottom">
									<div className="send-money-contact-tab p-0">
										<div className="contact-profile">
											<img src={Subscription3} alt="subscription-img" />
										</div>
										<div className="contact-details">
											<h3>Amazon Prime</h3>
										</div>
									</div>
									<div className="send-money-contact-tab p-0 mt-16">
										<div className="contact-profile">
											<img src={Subscription1} alt="subscription-img" />
										</div>
										<div className="contact-details">
											<h3>Netflix</h3>
										</div>
									</div>
									<div className="send-money-contact-tab p-0 mt-16">
										<div className="contact-profile">
											<img src={Subscription5} alt="subscription-img" />
										</div>
										<div className="contact-details">
											<h3>Disney Hotstar</h3>
										</div>
									</div>
									<div className="send-money-contact-tab p-0 mt-16">
										<div className="contact-profile">
											<img src={Subscription2} alt="subscription-img" />
										</div>
										<div className="contact-details">
											<h3>Elementor Pro</h3>
										</div>
									</div>
									<div className="send-money-contact-tab p-0 mt-16">
										<div className="contact-profile">
											<img src={Subscription6} alt="subscription-img" />
										</div>
										<div className="contact-details">
											<h3>Envato Elements</h3>
										</div>
									</div>
									<div className="send-money-contact-tab p-0 mt-16">
										<div className="contact-profile">
											<img src={Subscription7} alt="subscription-img" />
										</div>
										<div className="contact-details">
											<h3>Vodaphone</h3>
										</div>
									</div>
									<div className="send-money-contact-tab p-0 mt-16">
										<div className="contact-profile">
											<img src={Subscription8} alt="subscription-img" />
										</div>
										<div className="contact-details">
											<h3>Toronto Electric</h3>
										</div>
									</div>
									<div className="send-money-contact-tab p-0 mt-16">
										<div className="contact-profile">
											<img src={Subscription4} alt="subscription-img" />
										</div>
										<div className="contact-details">
											<h3>Airlink Network</h3>
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

export default AutomaticPayment