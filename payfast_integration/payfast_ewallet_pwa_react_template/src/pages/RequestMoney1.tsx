import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import friend5 from '../assets/images/invite-friend/friend5.png'
import UnfillStar from '../assets/svg/unfill-star.svg'
import { Link } from 'react-router-dom';

const RequestMoney1: React.FC = () => {
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
									<p>Request Money from Alyassa...</p>
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
											<img src={friend5} alt="friend-img" />
										</div>
										<div className="contact-details">
											<h3>Alyassa Russel</h3>
											<h4>alyassa_russel@mail.com</h4>
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
											<input type="text" id="customer-amount" className="mt-16 active" defaultValue="$100.00" />
										</div>
										<div className="mt-24">
											<label htmlFor="customer-id" className="custom-lbl-electricity">Add A Note (Optional)</label>
											<textarea id="customer-id" placeholder="Write here." className="custom-textarea mt-8"></textarea>
										</div>
									</form>
								</div>
								<div className="verify-number-btn" data-bs-toggle="offcanvas" data-bs-target="#offcanvasBottom">
									<Link to="#" data-bs-toggle="offcanvas" data-bs-target="#offcanvasBottom">Continue</Link>
								</div>
							</div>
						</div>
					</div>
				</div>
				{/* <!-- Request money screen content end --> */}
				{/* <!-- Request money modal screen content end --> */}
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
						<div className="request-money-modal">
							<h2 className="logout-text-pop chart-border">Review Summary</h2>
							<div className="request-content mt-16">
								<span>Your Request</span>
								<span>$100.00</span>
							</div>
							<p className="request-txt mt-16">If you are requesting money for a purchase. you will pay a seller fee when Alyassa Russel pays you. You could be covered by <span className="color-red">Seller Protection.</span></p>
							<div className="verify-number-btn request-btn mt-24"><Link to="/RequestMoney3">Request Now</Link></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default RequestMoney1