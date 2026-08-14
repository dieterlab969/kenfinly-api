import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import friend3 from '../assets/images/invite-friend/friend3.png'
import UnfillStar from '../assets/svg/unfill-star.svg'
import { Link } from 'react-router-dom';

const SendMoneyReview: React.FC = () => {
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
									<p>Review Summary</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="send-money-review">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<h1 className="d-none">Send Money Review</h1>
								<h2 className="d-none">Hidden</h2>
								<div className="sendmoney1-bottom">
									<div className="send-money-contact-tab setting-top pt-0">
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
									<div className="sendmoney-content mt-16">
										<div className="sendmomey-details border-0">
											<span>Amount (USD)</span>
											<span>$125.00</span>
										</div>
										<div className="sendmomey-details purple-border">
											<span>Tax</span>
											<span className="red-color">-$15.00</span>
										</div>
										<div className="sendmomey-details mt-16 pb-0">
											<span>Total</span>
											<span>$115.00</span>
										</div>
									</div>
									<form className="feedback-form mt-24">
										<div className="form-details-pays-bill">
											<label htmlFor="customer-id" className="custom-lbl-electricity">Payment Type</label>
											<input type="text" id="customer-id" defaultValue="For Goods & Services" className="custom-input-id money-review-txt mt-16" autoComplete="off" />
										</div>
									</form>
									<div className="review-note mt-24">
										<h2>Notes</h2>
										<p className="mt-12">Thank you for your hard work on this project. We look forward to working with you again in the future.</p>
									</div>
								</div>
								<div className="verify-number-btn split3-btn"><Link to="/SendMoneySuccessful">Confirm & Send</Link></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default SendMoneyReview


