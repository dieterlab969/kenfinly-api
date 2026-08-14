import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import SearchIcon from '../assets/svg/search-icon.svg'
import Subscription1 from '../assets/images/subscription/subscription1.png'
import Subscription2 from '../assets/images/subscription/subscription2.png'
import Subscription3 from '../assets/images/subscription/subscription3.png'
import Subscription4 from '../assets/images/subscription/subscription4.png'
import Subscription5 from '../assets/images/subscription/subscription5.png'
import EditIcon from '../assets/svg/edit-icon.svg'
import ExpiredIcon from '../assets/svg/expired-icon.svg'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next';

const Subscription: React.FC = () => {
	const { t } = useTranslation();
	return (
		<div>
			<div className="site-content">
				<div className="verify-number-main" id="subscription-main">
					<div className="verify-number-top">
						<div className="container">
							<div className="verify-number-top-content">
								<div className="back-btn">
									<BackBtn />
								</div>
								<div className="header-title">
									<p>{t('Subscriptions')}</p>
								</div>
							</div>
							<div className="contact-search">
								<div className="input-group contact-searchbar ">
									<div className="search-icon">
										<img src={SearchIcon} alt="search-icon" />
									</div>
									<div className="seach-bar">
										<input type="search" placeholder={t('Search')} className="form-control search-text" id="search-input" />
									</div>
								</div>
							</div>
							<div className="nav nav-tabs custom-tab-contact" id="nav-tab" role="tablist">
								<button className="nav-link active" id="nav-contact-tab" data-bs-toggle="tab" data-bs-target="#nav-contact" type="button" role="tab" aria-selected="true">{t('Active')}</button>
								<button className="nav-link" id="nav-favourite-tab" data-bs-toggle="tab" data-bs-target="#nav-favourite" type="button" role="tab" aria-selected="false">{t('Expired')}</button>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="send-money-contact">
						<div className="verify-number-bottom-wrap">
							<h1 className="d-none">Subscription</h1>
							<h2 className="d-none">Hidden</h2>
							<div className="send-contact-favourite">
								<div className="favourite-list">
									<div className="tab-content" id="nav-tabContent">
										<div className="tab-pane show active" id="nav-contact" role="tabpanel">
											<div className="send-money-contact">
												<div className="send-money-contact-tab p-0">
													<div className="contact-profile">
														<img src={Subscription1} alt="subscription-img" />
													</div>
													<div className="contact-details">
														<h3>Netflix</h3>
														<h4>Expired on Dec 31, 2024</h4>
													</div>
													<div className="contact-star">
														<div className="star-favourite">
															<Link to="#">
																<img src={EditIcon} alt="edit-icon" className="purple-edit-icon" />
															</Link>
														</div>
													</div>
												</div>
												<div className="send-money-contact-tab p-0 mt-16">
													<div className="contact-profile">
														<img src={Subscription2} alt="subscription-img" />
													</div>
													<div className="contact-details">
														<h3>Elementor Pro</h3>
														<h4>Expired on June 15, 2025</h4>
													</div>
													<div className="contact-star">
														<div className="star-favourite">
															<Link to="#">
																<img src={EditIcon} alt="edit-icon" className="purple-edit-icon" />
															</Link>
														</div>
													</div>
												</div>
												<div className="send-money-contact-tab p-0 mt-16">
													<div className="contact-profile">
														<img src={Subscription3} alt="subscription-img" />
													</div>
													<div className="contact-details">
														<h3>Amazon Prime</h3>
														<h4>Expired on July 14, 2025</h4>
													</div>
													<div className="contact-star">
														<div className="star-favourite">
															<Link to="#">
																<img src={EditIcon} alt="edit-icon" className="purple-edit-icon" />
															</Link>
														</div>
													</div>
												</div>
											</div>
										</div>
										<div className="tab-pane" id="nav-favourite" role="tabpanel">
											<div className="send-money-favourite">
												<div className="send-money-contact">
													<div className="send-money-contact-tab p-0">
														<div className="contact-profile">
															<img src={Subscription4} alt="subscription-img" />
														</div>
														<div className="contact-details">
															<h3>Airlink Network</h3>
															<h4>Expired on June 24, 2023</h4>
														</div>
														<div className="contact-star">
															<div className="star-favourite">
																<Link to="#">
																	<img src={ExpiredIcon} alt="expired-icon" />
																</Link>
															</div>
														</div>
													</div>
													<div className="send-money-contact-tab p-0 mt-16">
														<div className="contact-profile">
															<img src={Subscription5} alt="subscription-img" />
														</div>
														<div className="contact-details">
															<h3>Disney Hotstar</h3>
															<h4>Expired on April 10, 2023</h4>
														</div>
														<div className="contact-star">
															<div className="star-favourite">
																<Link to="#">
																	<img src={ExpiredIcon} alt="expired-icon" />
																</Link>
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
					</div>
				</div>
			</div>
		</div>
	)
}

export default Subscription
