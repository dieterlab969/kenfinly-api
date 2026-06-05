import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import Facebook from '../assets/images/about-us/facebook.svg'
import Instragram from '../assets/images/about-us/instragram.svg'
import Twitter from '../assets/images/about-us/twitter.svg'
import Youtube from '../assets/images/about-us/youtube.svg'

const AboutUs: React.FC = () => {
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
									<p>About PayFast</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="about-us">
						<div className="verify-number-bottom-wrap">
							<div className="about-us-section-wrap">
								<div className="about-us-screen-full">
									<div className="privacy-first-content privacy-txt">
										<p>Fusce amet rhoncus amet duis dignissim. Vulputate ultrices eget condimentum sit ullamcorper et dolor. Mauris in velit elit egestas pellentesque. Iaculis vitae in convallis tincidunt in leo phasellus donec volutpat.</p>
										<p className="pt-10">Sed tempor consequat vivamus sagittis lorem in lorem. Mattis metus venenatis molestie risus pellentesque diam risus sit vestibulum. Molestie orci eget nunc risus egestas.</p>
										<p className="pt-10">Morbi semper sed risus velit tincidunt. In volutpat eu tortor mauris ipsum tincidunt in ut eu. Ut odio orci commodo nisl nunc lacus erat porttitor. Non sed quisque elit dignissim.Purus at sit amet tempus mauris congue id nulla. Diam aenean ullamcorper sed eros lorem libero arcu sit. Sed nunc nulla id et ornare laoreet malesuada. Ac in eu turpis vitae.</p>
									</div>
								</div>
								<div className="about-us-social-media">
									<h1 className="social-txt mt-16">Follow Us</h1>
									<div className="about-us-icon-wrapper mt-12">
										<div className="social-detail-about ">
											<div className="shape facebook-bg">
												<a href="https://www.facebook.com/">
													<img src={Facebook} alt="facebook" />
												</a>
											</div>
											<div>
												<p className="about-social-txt">Facebbok</p>
											</div>
										</div>
										<div className="social-detail-about ">
											<div className="shape instragram-bg">
												<a href="https://www.instagram.com/">
													<img src={Instragram} alt="instagram" />
												</a>
											</div>
											<div>
												<p className="about-social-txt">Instagram</p>
											</div>
										</div>
										<div className="social-detail-about ">
											<div className="shape twitter-bg">
												<a href="https://twitter.com/">
													<img src={Twitter} alt="twitter" />
												</a>
											</div>
											<div>
												<p className="about-social-txt">Twitter</p>
											</div>
										</div>
										<div className="social-detail-about ">
											<div className="shape youtube-bg">
												<a href="https://www.youtube.com/">
													<img src={Youtube} alt="youtube" />
												</a>
											</div>
											<div>
												<p className="about-social-txt">YouTube</p>
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

export default AboutUs