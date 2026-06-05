import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import friend3 from '../assets/images/invite-friend/friend3.png'
import UnfillStar from '../assets/svg/unfill-star.svg'
import { Link } from 'react-router-dom';

const SendMoney1: React.FC = () => {
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
									<p>Send Money To</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="send-money1">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<div className="sendmoney1-bottom">
									<h1 className="d-none">Send Money</h1>
									<h2 className="d-none">Hidden</h2>
									<div className="send-money-contact-tab setting-top">
										<div className="contact-profile">
											<img src={friend3} alt="profile-img" />
										</div>
										<div className="contact-details">
											<h3>Alan Williamson</h3>
											<h4>alan_williamson@mail.com</h4>
										</div>
										<div className="contact-star">
											<div className="star-favourite">
												<Link to="#" className="item-bookmark active">
													<img src={UnfillStar} alt="unfill-star" />
												</Link>
											</div>
										</div>
									</div>
									<form>
										<div className="enter-amount mt-24">
											<label htmlFor="customer-amount">Enter the amount to send</label>
											<input type="text" id="customer-amount" className="mt-16" defaultValue="$125.00" />
										</div>
										<div className="mt-24">
											<label htmlFor="customer-id" className="custom-lbl-electricity">Add A Note (Optional)</label>
											<textarea rows={4} cols={50} id="customer-id" placeholder="Write here." className="custom-textarea mt-8"></textarea>
										</div>
									</form>
								</div>
								<div className="verify-number-btn"><Link to="/SendMoney4">Continue</Link></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default SendMoney1