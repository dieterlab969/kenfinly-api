import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import SearchIcon from '../assets/svg/search-icon.svg'
import VoiceIcon from '../assets/svg/voice.svg'
import friend1 from '../assets/images/invite-friend/customer1.png'
import friend2 from '../assets/images/invite-friend/customer2.png'
import friend3 from '../assets/images/invite-friend/customer3.png'
import friend4 from '../assets/images/invite-friend/customer4.png'
import friend5 from '../assets/images/invite-friend/customer5.png'
import friend6 from '../assets/images/invite-friend/customer6.png'
import friend7 from '../assets/images/invite-friend/customer7.png'

const CustomerScreen: React.FC = () =>{
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
									<p>Customers</p>
								</div>
							</div>
							<div className="contact-search">
								<div className="input-group contact-searchbar ">
									<div className="search-icon">
										<img src={SearchIcon} alt="search-icon" />
									</div>
									<div className="seach-bar">
										<input type="search" placeholder="Search name, username or email" className="form-control search-text" id="search-input" />
									</div>
									<div className="voice-icon">
										<img src={VoiceIcon} alt="voice-icon" />
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="customer-main">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<h1 className="d-none">Customer</h1>
								<h2 className="d-none">Hidden</h2>
								<div className="customer-screen-bottom">
									<div className="send-money-contact-tab p-0">
										<div className="contact-profile">
											<img src={friend1} alt="customer-img" />
										</div>
										<div className="contact-details">
											<h3>Marci Senter</h3>
											<h4>marci_senter@mail.com</h4>
										</div>
									</div>
									<div className="send-money-contact-tab p-0 mt-16">
										<div className="contact-profile">
											<img src={friend2} alt="customer-img" />
										</div>
										<div className="contact-details">
											<h3>Darron Chenail</h3>
											<h4>Darron Chenail@mail.com</h4>
										</div>
									</div>
									<div className="send-money-contact-tab p-0 mt-16">
										<div className="contact-profile">
											<img src={friend3} alt="customer-img" />
										</div>
										<div className="contact-details">
											<h3>Daryl Nehals</h3>
											<h4>Daryl_nehals@mail.com</h4>
										</div>
									</div>
									<div className="send-money-contact-tab p-0 mt-16">
										<div className="contact-profile">
											<img src={friend4} alt="customer-img" />
										</div>
										<div className="contact-details">
											<h3>Lauralee Quintero</h3>
											<h4>lauralee_quintero@mail.com</h4>
										</div>
									</div>
									<div className="send-money-contact-tab p-0 mt-16">
										<div className="contact-profile">
											<img src={friend5} alt="customer-img" />
										</div>
										<div className="contact-details">
											<h3>Sanjuanita Ordonez</h3>
											<h4>sanjuanita_ordonez@mail.com</h4>
										</div>
									</div>
									<div className="send-money-contact-tab p-0 mt-16">
										<div className="contact-profile">
											<img src={friend6} alt="customer-img" />
										</div>
										<div className="contact-details">
											<h3>Chieko Chute</h3>
											<h4>chieko_chute@mail.com</h4>
										</div>
									</div>
									<div className="send-money-contact-tab p-0 mt-16">
										<div className="contact-profile">
											<img src={friend7} alt="customer-img" />
										</div>
										<div className="contact-details">
											<h3>Sanjunita_Ordona</h3>
											<h4>sanjunita_ordona@mail.com</h4>
										</div>
									</div>
									<div className="send-money-contact-tab p-0 mt-16">
										<div className="contact-profile">
											<img src={friend2} alt="customer-img" />
										</div>
										<div className="contact-details">
											<h3>Janetta Roboto</h3>
											<h4>janetta_roboto@mail.com</h4>
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

export default CustomerScreen