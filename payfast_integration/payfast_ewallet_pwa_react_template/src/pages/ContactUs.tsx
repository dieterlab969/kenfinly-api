import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import ContactUsImg from '../assets/images/main-img/contact-us-img.png'
import CallIcon from '../assets/svg/call-icon.svg'
import MailIcon from '../assets/svg/mail-icon.svg'
import WebIcon from '../assets/svg/web-icon.svg'

const ContactUs: React.FC = () =>{
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
									<p>Contact Us</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="contact-us-main">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<div className="verify-number-img">
									<img src={ContactUsImg} alt="notification-img" />
								</div>
								<div className="verify-txt mt-24">
									<h1>Contact Us</h1>
									<p className="mt-12">If you face any trouble for item ordering feel free to contact us.
									</p>
								</div>
								<div className="contact-screen">
									<div className="contact-us-mobile-btn mt-24">
										<a href="tel:+12223334455">
											<span>
												<img src={CallIcon} alt="call-icon" />
											</span>
											<span className="contact-us-no">+1 222 333 4455</span>
										</a>
									</div>
									<div className="contact-us-mobile-btn mt-8">
										<a href="mailto:help@payfast.com">
											<span>
												<img src={MailIcon} alt="call-icon" />
											</span>
											<span className="contact-us-no">help@payfast.com</span>
										</a>
									</div>
									<div className="contact-us-mobile-btn mt-8">
										<a href="https://www.google.com/">
											<span>
												<img src={WebIcon} alt="call-icon" />
											</span>
											<span className="contact-us-no">www.payfast.com</span>
										</a>
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

export default ContactUs
