import React, { useState } from 'react';
import BackBtn from '../components/BackBtn.tsx';
import Search from '../assets/svg/search-icon.svg'
import VoiceM from '../assets/svg/voice.svg'
import friend1 from '../assets/images/invite-friend/friend1.png'
import friend2 from '../assets/images/invite-friend/friend2.png'
import friend3 from '../assets/images/invite-friend/friend3.png'
import friend4 from '../assets/images/invite-friend/friend4.png'
import friend5 from '../assets/images/invite-friend/friend5.png'
import friend6 from '../assets/images/invite-friend/friend6.png'
import friend7 from '../assets/images/invite-friend/friend7.png'
import UnfillStar from '../assets/svg/unfill-star.svg'
import { Link } from 'react-router-dom';


const initialContacts = [
	{ id: 1, name: 'Aayan Smith', email: 'aayan_smith@mail.com', image: friend1, isFavorite: true },
	{ id: 2, name: 'Abilima Vanikawa', email: 'abi_vanikawa@mail.com', image: friend2, isFavorite: false },
	{ id: 3, name: 'Alan Williamson', email: 'alan_williamson@mail.com', image: friend3, isFavorite: true },
	{ id: 4, name: 'Albert Alenxander', email: 'albert_alenxander@mail.com', image: friend4, isFavorite: false },
	{ id: 5, name: 'Alyassa Russel', email: 'alyassa_russel@mail.com', image: friend5, isFavorite: true },
	{ id: 6, name: 'Anthony Robetson', email: 'anthony_robetson@mail.com', image: friend6, isFavorite: false },
	{ id: 7, name: 'Arianna Cooper', email: 'arianna_cooper@mail.com', image: friend7, isFavorite: false },
];


const RequestMoneyContact: React.FC = () => {
	const [contacts, setContacts] = useState(initialContacts);

	const toggleFavorite = (id) => {
		setContacts(prev =>
			prev.map(contact =>
				contact.id === id ? { ...contact, isFavorite: !contact.isFavorite } : contact
			)
		);
	};
	return (
		<div>
			<div className="verify-number-main">
				<div className="verify-number-top">
					<div className="container">
						<div className="verify-number-top-content">
							<div className="back-btn">
								<BackBtn />
							</div>
							<div className="header-title">
								<p>Request Money From</p>
							</div>
						</div>
						<div className="contact-search">
							<div className="input-group contact-searchbar ">
								<div className="search-icon">
									<img src={Search} alt="search-icon" />
								</div>
								<div className="seach-bar">
									<input type="search" placeholder="Search name, username or email" className="form-control search-text" id="search-input" />
								</div>
								<div className="voice-icon">
									<img src={VoiceM} alt="voice-icon" />
								</div>
							</div>
						</div>
						<div className="nav nav-tabs custom-tab-contact" id="nav-tab" role="tablist">
							<button className="nav-link active" id="nav-contact-tab" data-bs-toggle="tab" data-bs-target="#nav-contact" type="button" role="tab" aria-selected="true">All Contact</button>
							<button className="nav-link" id="nav-favourite-tab" data-bs-toggle="tab" data-bs-target="#nav-favourite" type="button" role="tab" aria-selected="false">Favorite</button>
						</div>
					</div>
				</div>
				<div className="verify-number-bottom" id="send-money-contact">
					<div className="verify-number-bottom-wrap">
						<h1 className="d-none">Send money</h1>
						<h2 className="d-none">Hidden</h2>
						<div className="send-contact-favourite">
							<div className="favourite-list">
								<div className="tab-content" id="nav-tabContent">
									<div className="tab-pane show active" id="nav-contact" role="tabpanel">
										<div className="send-money-contact">
											{contacts.map((contact) => (
												<Link to='/RequestMoney1' className="send-money-contact-tab send-money1 p-0 mt-16" key={contact.id}>
													<div className="contact-profile">
														<img src={contact.image} alt="profile-img" />
													</div>
													<div className="contact-details">
														<h3>{contact.name}</h3>
														<h4>{contact.email}</h4>
													</div>
													<div className="contact-star">
														<div className="star-favourite">
															<div
																className={`item-bookmark ${contact.isFavorite ? 'active' : ''}`}
																onClick={(e) => {
																	e.preventDefault();
																	toggleFavorite(contact.id);
																}}
															>
																<img src={UnfillStar} alt="unfill-star" />
															</div>
														</div>
													</div>
												</Link>
											))}
										</div>
									</div>
									<div className="tab-pane" id="nav-favourite" role="tabpanel">
										<div className="send-money-favourite">
											<div className="send-money-favourite-tab">
												<div className="send-money-contact-tab send-money1 p-0">
													<div className="contact-profile">
														<img src={friend1} alt="profile-img" />
													</div>
													<div className="contact-details">
														<h3>Aayan Smith</h3>
														<h4>aayan_smith@mail.com</h4>
													</div>
													<div className="contact-star">
														<div className="star-favourite">
															<Link to="#" className="item-bookmark active">
																<img src={UnfillStar} alt="unfill-star" />
															</Link>
														</div>
													</div>
												</div>
												<div className="send-money-contact-tab send-money1 p-0 mt-16">
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
												<div className="send-money-contact-tab send-money1 p-0 mt-16">
													<div className="contact-profile">
														<img src={friend5} alt="profile-img" />
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
												<div className="send-money-contact-tab send-money1 p-0 mt-16">
													<div className="contact-profile">
														<img src={friend6} alt="profile-img" />
													</div>
													<div className="contact-details">
														<h3>Benjamin Franklin</h3>
														<h4>anthony_robetson@mail.com</h4>
													</div>
													<div className="contact-star">
														<div className="star-favourite">
															<Link to="#" className="item-bookmark active">
																<img src={UnfillStar} alt="unfill-star" />
															</Link>
														</div>
													</div>
												</div>
												<div className="send-money-contact-tab send-money1 p-0 mt-16">
													<div className="contact-profile">
														<img src={friend7} alt="profile-img" />
													</div>
													<div className="contact-details">
														<h3>Brianna Morales</h3>
														<h4>arianna_cooper@mail.com</h4>
													</div>
													<div className="contact-star">
														<div className="star-favourite">
															<Link to="#" className="item-bookmark active">
																<img src={UnfillStar} alt="unfill-star" />
															</Link>
														</div>
													</div>
												</div>
												<div className="send-money-contact-tab send-money1 p-0 mt-16">
													<div className="contact-profile">
														<img src={friend2} alt="profile-img" />
													</div>
													<div className="contact-details">
														<h3>Charlotte Hanlin</h3>
														<h4>aayan_smith@mail.com</h4>
													</div>
													<div className="contact-star">
														<div className="star-favourite">
															<Link to="#" className="item-bookmark active">
																<img src={UnfillStar} alt="unfill-star" />
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
	)
}
export default RequestMoneyContact