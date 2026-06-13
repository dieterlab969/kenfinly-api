import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import ScannerImg from '../assets/images/spilt-screen/scanner.png'
import Friend1 from '../assets/images/invite-friend/friend1.png'
import Friend2 from '../assets/images/invite-friend/friend2.png'
import Friend3 from '../assets/images/invite-friend/friend3.png'
import Friend4 from '../assets/images/invite-friend/friend4.png'
import Friend5 from '../assets/images/invite-friend/friend5.png'
import Friend6 from '../assets/images/invite-friend/friend6.png'
import Facebook from '../assets/images/spilt-screen/facebook.png'
import Whatup from '../assets/images/spilt-screen/whatup.png'
import Viber from '../assets/images/spilt-screen/viber.png'
import Instrgram from '../assets/images/spilt-screen/instrgram.png'
import Wechat from '../assets/images/spilt-screen/wechat.png'
import callMe from '../assets/images/spilt-screen/call-me.png'
import Skype from '../assets/images/spilt-screen/skype.png'
import Twitter from '../assets/images/spilt-screen/twitter.png'
import { Link } from 'react-router-dom'

const GenerateQrCode: React.FC = () => {
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
									<p>Generate QR Code</p>
								</div>
							</div>
						</div>
						<div className="spilt8-img">
							<img src={ScannerImg} alt="scanner-img" />
							<Link to="#"><p className="mt-12">payfast.com/PF845620</p></Link>
						</div>
					</div>
					<div className="verify-number-bottom" id="spilt8-main" >
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<h1 className="d-none">Spilt Bill</h1>
								<h2 className="d-none">Hidden</h2>
								<div className="split-bill2-content">
									<div className="send-money-contact-tab py-0">
										<div className="contact-profile">
											<img src={Friend1} alt="friend-img" />
										</div>
										<div className="contact-details">
											<h3>You</h3>
											<h4>jessica_smith@mail.com</h4>
										</div>
									</div>
									<div className="send-money-contact-tab mt-16 py-0">
										<div className="contact-profile">
											<img src={Friend2} alt="friend-img" />
										</div>
										<div className="contact-details">
											<h3>Aayan Smith</h3>
											<h4>aayan_smith@mail.com</h4>
										</div>
										<div className="contact-star">
											<div className="form-check change-lan-sec language-sel">
												<input className="form-check-input custom-input" name="language" type="checkbox" id="language2" />
											</div>
										</div>
									</div>
									<div className="send-money-contact-tab mt-16 py-0">
										<div className="contact-profile">
											<img src={Friend3} alt="friend-img" />
										</div>
										<div className="contact-details">
											<h3>Alan Williamson</h3>
											<h4>alan_williamson@mail.com</h4>
										</div>
										<div className="contact-star">
											<div className="form-check change-lan-sec language-sel">
												<input className="form-check-input custom-input" name="language" type="checkbox" id="language3" />
											</div>
										</div>
									</div>
									<div className="send-money-contact-tab mt-16 py-0">
										<div className="contact-profile">
											<img src={Friend4} alt="friend-img" />
										</div>
										<div className="contact-details">
											<h3>Alyassa Russel</h3>
											<h4>alyassa_russel@mail.com</h4>
										</div>
										<div className="contact-star">
											<div className="form-check change-lan-sec language-sel">
												<input className="form-check-input custom-input" name="language" type="checkbox" id="language4" />
											</div>
										</div>
									</div>
									<div className="send-money-contact-tab mt-16 py-0">
										<div className="contact-profile">
											<img src={Friend5} alt="friend-img" />
										</div>
										<div className="contact-details">
											<h3>Anthony Robetson</h3>
											<h4>anthony_robetson@mail.com</h4>
										</div>
										<div className="contact-star">
											<div className="form-check change-lan-sec language-sel">
												<input className="form-check-input custom-input" name="language" type="checkbox" id="language5" />
											</div>
										</div>
									</div>
									<div className="send-money-contact-tab mt-16 py-0">
										<div className="contact-profile">
											<img src={Friend6} alt="friend-img" />
										</div>
										<div className="contact-details">
											<h3>Arianna Cooper</h3>
											<h4>arianna_cooper@mail.com</h4>
										</div>
										<div className="contact-star">
											<div className="form-check change-lan-sec language-sel">
												<input className="form-check-input custom-input" name="language" type="checkbox" id="language6" />
											</div>
										</div>
									</div>
								</div>
								<div className="spilt8-btn split3-btn mt-32">
									<div className="verify-number-btn split3-btn"><a href="split-bill8.html" data-bs-toggle="offcanvas" data-bs-target="#offcanvasBottom">Share</a></div>
								</div>
							</div>
						</div>
					</div>
				</div>
				{/* <!-- Generate qr code content end --> */}
				{/* <!-- Split8 screen modal content start --> */}
				<div className="offcanvas offcanvas-bottom logout-main" id="offcanvasBottom">
					<button type="button" className="text-reset" data-bs-dismiss="offcanvas" aria-label="Close">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" viewBox="0 0 24 16" fill="none">
							<g>
								<path d="M22 8L12 13L2 8" stroke="#F2EEFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
								<path d="M22 2L12 7L2 2" stroke="#F2EEFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
							</g>
						</svg>
					</button>
					<div className="offcanvas-body small">
						<h2 className="logout-text-pop mt-12">Share</h2>
						<div className="border-main"></div>
						<div className="mt-16">
							<div className="social-media-content">
								<div className="social-media-img">
									<a href="https://www.facebook.com/" target="_blank" rel="noreferrer">
										<img src={Facebook} alt="facebook" /></a>
									<p>Facebook</p>
								</div>
								<div className="social-media-img">
									<a href="https://web.whatsapp.com/" target="_blank" rel="noreferrer">
										<img src={Whatup} alt="whatup" /></a>
									<p>WhatsApp</p>
								</div><div className="social-media-img">
									<a href="https://account.viber.com/en/login" target="_blank" rel="noreferrer">
										<img src={Viber} alt="viber" />
									</a>
									<p>Viber</p>
								</div>
								<div className="social-media-img">
									<a href="https://www.instagram.com/accounts/login/?hl=en" target="_blank" rel="noreferrer">
										<img src={Instrgram} alt="instrgram" />
									</a>
									<p>Instagram</p>
								</div>
								<div className="social-media-img">
									<a href="https://www.wechat.com">
										<img src={Wechat} alt="wechat" />
									</a>
									<p>WeChat</p>
								</div>
								<div className="social-media-img">
									<a href="tel:1234567890">
										<img src={callMe} alt="call-me" />
									</a>
									<p>Call Me</p>
								</div>
								<div className="social-media-img">
									<a href="https://www.skype.com/en/" target="_blank" rel="noreferrer">
										<img src={Skype} alt="skype" />
									</a>
									<p>Skype</p>
								</div>
								<div className="social-media-img">
									<a href="https://twitter.com/" target="_blank" rel="noreferrer">
										<img src={Twitter} alt="twitter" />
									</a>
									<p>Twitter</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default GenerateQrCode
