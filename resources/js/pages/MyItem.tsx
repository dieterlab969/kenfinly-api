import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import PurpleEditIcon from '../assets/svg/purple-edit-icon.svg'
import faqPlus from '../assets/svg/faq-plus.svg'
import { Link } from 'react-router-dom'

const MyItem: React.FC = () => {
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
									<p>My Items</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="taxes-main">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<h1 className="d-none">My item</h1>
								<div className="taxes-screen-content">
									<div className="sendmomey-details">
										<span>Business Card Design</span>
										<span>$60.00
											<Link to="#">
												<img src={PurpleEditIcon} alt="copied-icon" className="copied-icon" />
											</Link>
										</span>
									</div>
									<div className="sendmomey-details py-0">
										<span>Logo Design</span>
										<span>$40.00
											<Link to="#">
												<img src={PurpleEditIcon} alt="copied-icon" className="copied-icon" />
											</Link>
										</span>
									</div>
									<div className="sendmomey-details py-0">
										<span>Digital PDF</span>
										<span>$30.00
											<Link to="#">
												<img src={PurpleEditIcon} alt="copied-icon" className="copied-icon" />
											</Link>
										</span>
									</div>
									<div className="sendmomey-details py-0">
										<span>Photography</span>
										<span>$25.00
											<Link to="#">
												<img src={PurpleEditIcon} alt="copied-icon" className="copied-icon" />
											</Link>
										</span>
									</div>
									<div className="sendmomey-details py-0">
										<span>Web Design</span>
										<span>$100.00
											<Link to="#">
												<img src={PurpleEditIcon} alt="copied-icon" className="copied-icon" />
											</Link>
										</span>
									</div>
									<div className="sendmomey-details py-0">
										<span>Web Development</span>
										<span>$250.00
											<Link to="#">
												<img src={PurpleEditIcon} alt="copied-icon" className="copied-icon" />
											</Link>
										</span>
									</div>
									<div className="sendmomey-details py-0">
										<span>Digital Art</span>
										<span>$35.00
											<Link to="#">
												<img src={PurpleEditIcon} alt="copied-icon" className="copied-icon" />
											</Link>
										</span>
									</div>
									<div className="sendmomey-details py-0">
										<span>Software Development</span>
										<span>$85.00
											<Link to="#">
												<img src={PurpleEditIcon} alt="copied-icon" className="copied-icon" />
											</Link>
										</span>
									</div>
									<div className="sendmomey-details py-0">
										<span>Stock Music & Video</span>
										<span>$40.00
											<Link to="#">
												<img src={PurpleEditIcon} alt="copied-icon" className="copied-icon" />
											</Link>
										</span>
									</div>
									<div className="sendmomey-details py-0">
										<span>Graphic Design</span>
										<span>$59.00
											<Link to="#">
												<img src={PurpleEditIcon} alt="copied-icon" className="copied-icon" />
											</Link>
										</span>
									</div>
									<div className="sendmomey-details py-0">
										<span>YouTube Video</span>
										<span>$75.00
											<Link to="#">
												<img src={PurpleEditIcon} alt="copied-icon" className="copied-icon" />
											</Link>
										</span>
									</div>
									<div className="sendmomey-details py-0">
										<span>SEO</span>
										<span>$60.00
											<Link to="#">
												<img src={PurpleEditIcon} alt="copied-icon" className="copied-icon" />
											</Link>
										</span>
									</div>
								</div>
								<div className="tax-plus-btn">
									<Link to="/AddNewItem"><img src={faqPlus} alt="plus-icon" /></Link>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default MyItem