import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import friend1 from '../assets/images/invite-friend/friend1.png'
import friend2 from '../assets/images/invite-friend/friend2.png'
import friend3 from '../assets/images/invite-friend/friend3.png'
import friend4 from '../assets/images/invite-friend/friend4.png'
import friend5 from '../assets/images/invite-friend/friend5.png'
import friend6 from '../assets/images/invite-friend/friend6.png'
import friend7 from '../assets/images/invite-friend/friend7.png'
import friend8 from '../assets/images/invite-friend/friend8.png'
import friend9 from '../assets/images/invite-friend/friend9.png'

const InviteFriend: React.FC = () => {
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
									<p>Invite Friends</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="invite-friend-main">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<h1 className="d-none">Friend</h1>
								<h2 className="d-none">Hidden</h2>
								<div className="invite-friend">
									<div className="invite-friend-wrapper">
										<div className="invite-img">
											<img src={friend1} alt="friend-img" />
										</div>
										<div className="invite-content">
											<h3 className="friend-name">Aayan Smith</h3>
											<p className="friend-no"><a href="tel:+1-200-555-0125">+1-200-555-0125</a></p>
										</div>
										<div className="friend-invite">
											<div className="friend-select">
												<input type="checkbox" id="select-friend1" name="select-language" />
												<label className="custom-radio-sel-friend" htmlFor="select-friend1">Invited</label>
											</div>
										</div>
									</div>
									<div className="invite-friend-wrapper mt-16">
										<div className="invite-img">
											<img src={friend2} alt="friend-img" />
										</div>
										<div className="invite-content">
											<h3 className="friend-name">Abilima Vanikawa</h3>
											<p className="friend-no"><a href="tel:+1-200-555-0125">+1-202-555-0365</a></p>
										</div>
										<div className="friend-invite">
											<div className="friend-select">
												<input type="checkbox" id="select-friend2" name="select-language" />
												<label className="custom-radio-sel-friend " htmlFor="select-friend2">Invite</label>
											</div>
										</div>
									</div>
									<div className="invite-friend-wrapper mt-16">
										<div className="invite-img">
											<img src={friend3} alt="friend-img" />
										</div>
										<div className="invite-content">
											<h3 className="friend-name">Alan Williamson</h3>
											<p className="friend-no"><a href="tel:+1-200-555-0125">+1-300-452-6523</a></p>
										</div>
										<div className="friend-invite">
											<div className="friend-select">
												<input type="checkbox" id="select-friend3" name="select-language" />
												<label className="custom-radio-sel-friend " htmlFor="select-friend3">Invited</label>
											</div>
										</div>
									</div>
									<div className="invite-friend-wrapper mt-16">
										<div className="invite-img">
											<img src={friend4} alt="friend-img" />
										</div>
										<div className="invite-content">
											<h3 className="friend-name">Albert Alenxander</h3>
											<p className="friend-no"><a href="tel:+1-200-555-0125">+1-202-555-0119</a></p>
										</div>
										<div className="friend-invite">
											<div className="friend-select">
												<input type="checkbox" id="select-friend4" name="select-language" />
												<label className="custom-radio-sel-friend " htmlFor="select-friend4">Invited</label>
											</div>
										</div>
									</div>
									<div className="invite-friend-wrapper mt-16">
										<div className="invite-img">
											<img src={friend5} alt="friend-img" />
										</div>
										<div className="invite-content">
											<h3 className="friend-name">Alyassa Russel</h3>
											<p className="friend-no"><a href="tel:+1-200-555-0125">+1-300-456-0123</a></p>
										</div>
										<div className="friend-invite">
											<div className="friend-select">
												<input type="checkbox" id="select-friend5" name="select-language" />
												<label className="custom-radio-sel-friend" htmlFor="select-friend5">Invite</label>
											</div>
										</div>
									</div>
									<div className="invite-friend-wrapper mt-16">
										<div className="invite-img">
											<img src={friend6} alt="friend-img" />
										</div>
										<div className="invite-content">
											<h3 className="friend-name">Anthony Robetson</h3>
											<p className="friend-no"><a href="tel:+1-200-555-0125">+1-200-555-0125</a></p>
										</div>
										<div className="friend-invite">
											<div className="friend-select">
												<input type="checkbox" id="select-friend6" name="select-language" />
												<label className="custom-radio-sel-friend " htmlFor="select-friend6">Invited</label>
											</div>
										</div>
									</div>
									<div className="invite-friend-wrapper mt-16">
										<div className="invite-img">
											<img src={friend7} alt="friend-img" />
										</div>
										<div className="invite-content">
											<h3 className="friend-name">Arianna Cooper</h3>
											<p className="friend-no"><a href="tel:+1-200-555-0125">+1-202-555-0365</a></p>
										</div>
										<div className="friend-invite">
											<div className="friend-select">
												<input type="checkbox" id="select-friend7" name="select-language" />
												<label className="custom-radio-sel-friend " htmlFor="select-friend7">Invite</label>
											</div>
										</div>
									</div>
									<div className="invite-friend-wrapper mt-16">
										<div className="invite-img">
											<img src={friend8} alt="friend-img" />
										</div>
										<div className="invite-content">
											<h3 className="friend-name">Aayan Smith</h3>
											<p className="friend-no"><a href="tel:+1-200-555-0125">+1-202-555-0395</a></p>
										</div>
										<div className="friend-invite">
											<div className="friend-select">
												<input type="checkbox" id="select-friend8" name="select-language" />
												<label className="custom-radio-sel-friend" htmlFor="select-friend8">Invite</label>
											</div>
										</div>
									</div>
									<div className="invite-friend-wrapper mt-16">
										<div className="invite-img">
											<img src={friend9} alt="friend-img" />
										</div>
										<div className="invite-content">
											<h3 className="friend-name">Pedro Huard</h3>
											<p className="friend-no"><a href="tel:+1-200-555-0125">+1-200-555-0125</a></p>
										</div>
										<div className="friend-invite">
											<div className="friend-select">
												<input type="checkbox" id="select-friend9" name="select-language" />
												<label className="custom-radio-sel-friend" htmlFor="select-friend9">Invited</label>
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

export default InviteFriend