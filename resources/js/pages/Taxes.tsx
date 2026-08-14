import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import faqPlus from '../assets/svg/faq-plus.svg'
import PurpleEditIcon from '../assets/svg/purple-edit-icon.svg'
import { Link } from 'react-router-dom'

const Taxes: React.FC = () => {
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
									<p>Taxes</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="taxes-main">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<h1 className="d-none">Taxes</h1>
								<div className="taxes-screen-content">
									<div className="sendmomey-details">
										<span>Australia</span>
										<span>12%
											<Link to="#">
												<img src={PurpleEditIcon} alt="copied-icon" className="copied-icon" />
											</Link>
										</span>
									</div>
									<div className="sendmomey-details py-0">
										<span>Africa</span>
										<span>20%
											<Link to="#">
												<img src={PurpleEditIcon} alt="copied-icon" className="copied-icon" />
											</Link>
										</span>
									</div>
									<div className="sendmomey-details py-0">
										<span>Bangladesh</span>
										<span>10%
											<Link to="#">
												<img src={PurpleEditIcon} alt="copied-icon" className="copied-icon" />
											</Link>
										</span>
									</div>
									<div className="sendmomey-details py-0">
										<span>Canada</span>
										<span>17%
											<Link to="#">
												<img src={PurpleEditIcon} alt="copied-icon" className="copied-icon" />
											</Link>
										</span>
									</div>
									<div className="sendmomey-details py-0">
										<span>Chili</span>
										<span>10%
											<Link to="#">
												<img src={PurpleEditIcon} alt="copied-icon" className="copied-icon" />
											</Link>
										</span>
									</div>
									<div className="sendmomey-details py-0">
										<span>Denmark</span>
										<span>24%
											<Link to="#">
												<img src={PurpleEditIcon} alt="copied-icon" className="copied-icon" />
											</Link>
										</span>
									</div>
									<div className="sendmomey-details py-0">
										<span>Finland</span>
										<span>19%
											<Link to="#">
												<img src={PurpleEditIcon} alt="copied-icon" className="copied-icon" />
											</Link>
										</span>
									</div>
									<div className="sendmomey-details py-0">
										<span>France</span>
										<span>27%
											<Link to="#">
												<img src={PurpleEditIcon} alt="copied-icon" className="copied-icon" />
											</Link>
										</span>
									</div>
									<div className="sendmomey-details py-0">
										<span>Germany</span>
										<span>18%
											<Link to="#">
												<img src={PurpleEditIcon} alt="copied-icon" className="copied-icon" />
											</Link>
										</span>
									</div>
									<div className="sendmomey-details py-0">
										<span>India</span>
										<span>18%
											<Link to="#">
												<img src={PurpleEditIcon} alt="copied-icon" className="copied-icon" />
											</Link>
										</span>
									</div>
									<div className="sendmomey-details py-0">
										<span>Indonesia</span>
										<span>11%
											<Link to="#">
												<img src={PurpleEditIcon} alt="copied-icon" className="copied-icon" />
											</Link>
										</span>
									</div>
									<div className="sendmomey-details py-0">
										<span>Italy</span>
										<span>14%
											<Link to="#">
												<img src={PurpleEditIcon} alt="copied-icon" className="copied-icon" />
											</Link>
										</span>
									</div>
								</div>
								<div className="tax-plus-btn">
									<Link to="/AddTaxes"><img src={faqPlus} alt="plus-icon" /></Link>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Taxes