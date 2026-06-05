import React, { useState } from "react";
import BackBtn from '../components/BackBtn.tsx';
import Friend1 from '../assets/images/invite-friend/friend1.png'
import Friend2 from '../assets/images/invite-friend/friend2.png'
import Friend3 from '../assets/images/invite-friend/friend3.png'
import Friend4 from '../assets/images/invite-friend/friend4.png'
import Friend5 from '../assets/images/invite-friend/friend5.png'
import Friend6 from '../assets/images/invite-friend/friend6.png'
import Friend7 from '../assets/images/invite-friend/friend7.png'
import Friend8 from '../assets/images/invite-friend/friend8.png'
import SpiltCancel from '../assets/svg/spilt-cancel-icon.svg'
import { Link } from 'react-router-dom'

const SplitBill2: React.FC = () => {
	const [isChecked, setIsChecked] = useState(true); // initial state based on your `checked`

	const handleCheckboxChange = () => {
		setIsChecked(prev => !prev);
	};

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
									<p>Who’s Splitting This Bill?</p>
								</div>
							</div>
						</div>
						<div className="split-bill2-top mt-16">
							<div className="split-bill2-top-wrap ">
								<div className="spilt-img">
									<img src={Friend1} alt="friend-img" />
								</div>
								<div className="spilt-cancel-icon">
									<Link to="#">
										<img src={SpiltCancel} alt="spilt-cancel-icon" />
									</Link>
								</div>
							</div>
							<div className="split-bill2-top-wrap">
								<div className="spilt-img">
									<img src={Friend2} alt="friend-img" />
								</div>
								<div className="spilt-cancel-icon">
									<Link to="#">
										<img src={SpiltCancel} alt="spilt-cancel-icon" />
									</Link>
								</div>
							</div>
							<div className="split-bill2-top-wrap">
								<div className="spilt-img">
									<img src={Friend3} alt="friend-img" />
								</div>
								<div className="spilt-cancel-icon">
									<Link to="#">
										<img src={SpiltCancel} alt="spilt-cancel-icon" />
									</Link>
								</div>
							</div>
							<div className="split-bill2-top-wrap">
								<div className="spilt-img">
									<img src={Friend4} alt="friend-img" />
								</div>
								<div className="spilt-cancel-icon">
									<Link to="#"><img src={SpiltCancel} alt="spilt-cancel-icon" /></Link>
								</div>
							</div>
							<div className="split-bill2-top-wrap">
								<div className="spilt-img">
									<img src={Friend5} alt="friend-img" />
								</div>
								<div className="spilt-cancel-icon">
									<Link to="#"><img src={SpiltCancel} alt="spilt-cancel-icon" /></Link>
								</div>
							</div>
							<div className="split-bill2-top-wrap">
								<div className="spilt-img">
									<img src={Friend6} alt="friend-img" />
								</div>
								<div className="spilt-cancel-icon">
									<Link to="#"><img src={SpiltCancel} alt="spilt-cancel-icon" /></Link>
								</div>
							</div>
							<div className="split-bill2-top-wrap">
								<div className="spilt-img">
									<img src={Friend7} alt="friend-img" />
								</div>
								<div className="spilt-cancel-icon">
									<Link to="#"><img src={SpiltCancel} alt="spilt-cancel-icon" /></Link>
								</div>
							</div>
							<div className="split-bill2-top-wrap">
								<div className="spilt-img">
									<img src={Friend8} alt="friend-img" />
								</div>
								<div className="spilt-cancel-icon">
									<Link to="#"><img src={SpiltCancel} alt="spilt-cancel-icon" /></Link>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom split2-main" id="language-screen">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<h1 className="d-none">Spilt Bill</h1>
								<h2 className="d-none">Hidden</h2>
								<div className="split-bill2-content">
									<Link to="/SplitBill3" className="send-money-contact-tab spilt-bill2">
										<div className="contact-profile">
											<img src={Friend1} alt="friend-img" />
										</div>
										<div className="contact-details">
											<h3>Aayan Smith</h3>
											<h4>aayan_smith@mail.com</h4>
										</div>
										<div className="contact-star">
											<div className="form-check change-lan-sec language-sel">
												<input className="form-check-input custom-input" name="language" type="checkbox" id="language1" checked={isChecked} onChange={handleCheckboxChange} />
											</div>
										</div>
									</Link>
									<Link to="/SplitBill3" className="send-money-contact-tab spilt-bill2 mt-16">
										<div className="contact-profile">
											<img src={Friend2} alt="friend-img" />
										</div>
										<div className="contact-details">
											<h3>Abilima Vanikawa</h3>
											<h4>abi_vanikawa@mail.com</h4>
										</div>
										<div className="contact-star">
											<div className="form-check change-lan-sec language-sel">
												<input className="form-check-input custom-input" name="language" type="checkbox" id="language2" />
											</div>
										</div>
									</Link>
									<Link to="/SplitBill3" className="send-money-contact-tab spilt-bill2 mt-16">
										<div className="contact-profile">
											<img src={Friend3} alt="friend-img" />
										</div>
										<div className="contact-details">
											<h3>Alan Williamson</h3>
											<h4>alan_williamson@mail.com</h4>
										</div>
										<div className="contact-star">
											<div className="form-check change-lan-sec language-sel">
												<input className="form-check-input custom-input" name="language" type="checkbox" id="language3" checked={isChecked} onChange={handleCheckboxChange} />
											</div>
										</div>
									</Link>
									<Link to="/SplitBill3" className="send-money-contact-tab spilt-bill2 mt-16">
										<div className="contact-profile">
											<img src={Friend4} alt="friend-img" />
										</div>
										<div className="contact-details">
											<h3>Albert Alenxander</h3>
											<h4>albert_alenxander@mail.com</h4>
										</div>
										<div className="contact-star">
											<div className="form-check change-lan-sec language-sel">
												<input className="form-check-input custom-input" name="language" type="checkbox" id="language4" />
											</div>
										</div>
									</Link>
									<Link to="/SplitBill3" className="send-money-contact-tab spilt-bill2 mt-16">
										<div className="contact-profile">
											<img src={Friend5} alt="friend-img" />
										</div>
										<div className="contact-details">
											<h3>Alyassa Russel</h3>
											<h4>alyassa_russel@mail.com</h4>
										</div>
										<div className="contact-star">
											<div className="form-check change-lan-sec language-sel">
												<input className="form-check-input custom-input" name="language" type="checkbox" id="language5" checked={isChecked} onChange={handleCheckboxChange} />
											</div>
										</div>
									</Link>
									<Link to="/SplitBill3" className="send-money-contact-tab spilt-bill2 mt-16">
										<div className="contact-profile">
											<img src={Friend6} alt="friend-img" />
										</div>
										<div className="contact-details">
											<h3>Anthony Robetson</h3>
											<h4>anthony_robetson@mail.com</h4>
										</div>
										<div className="contact-star">
											<div className="form-check change-lan-sec language-sel">
												<input className="form-check-input custom-input" name="language" type="checkbox" id="language6" />
											</div>
										</div>
									</Link>
									<Link to="/SplitBill3" className="send-money-contact-tab spilt-bill2 mt-16">
										<div className="contact-profile">
											<img src={Friend7} alt="friend-img" />
										</div>
										<div className="contact-details">
											<h3>Arianna Cooper</h3>
											<h4>arianna_cooper@mail.com</h4>
										</div>
										<div className="contact-star">
											<div className="form-check change-lan-sec language-sel">
												<input className="form-check-input custom-input" name="language" type="checkbox" id="language7" />
											</div>
										</div>
									</Link>
									<Link to="/SplitBill3" className="send-money-contact-tab spilt-bill2 mt-16">
										<div className="contact-profile">
											<img src={Friend8} alt="friend-img" />
										</div>
										<div className="contact-details">
											<h3>Aayan Smith</h3>
											<h4>aayan_smith@mail.com</h4>
										</div>
										<div className="contact-star">
											<div className="form-check change-lan-sec language-sel">
												<input className="form-check-input custom-input" name="language" type="checkbox" id="language8" />
											</div>
										</div>
									</Link>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
export default SplitBill2