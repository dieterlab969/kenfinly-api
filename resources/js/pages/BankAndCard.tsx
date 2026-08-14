import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import Bank1Img from '../assets/images/transfer-to-bank/bank1.svg'
import Bank2Img from '../assets/images/transfer-to-bank/bank2.svg'
import Bank3Img from '../assets/images/transfer-to-bank/bank3.svg'
import purpleEditIcon from '../assets/svg/purple-edit-icon.svg'
import faqPlus from '../assets/svg/faq-plus.svg'
import { Link } from 'react-router-dom'

const BankAndCard: React.FC = () => {
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
									<p>Banks & Cards</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="bank-and-card-main">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<h1 className="d-none">Bank Card</h1>
								<div className="transfer-to-bank">
									<div className="transfer-first">
										<div className="bank-img">
											<img src={Bank1Img} alt="bank-icon" />
										</div>
										<div className="bank-details">
											<h2>Bank of America</h2>
											<div className="bank-card">
												<span>Active </span>
												<span>| Card Number **** 4625</span>
											</div>
										</div>
										<div className="bank-active-sec">
											<div><Link to="#"><img src={purpleEditIcon} alt="edit-icon" /></Link></div>
										</div>
									</div>
									<div className="transfer-first">
										<div className="bank-img">
											<img src={Bank2Img} alt="bank-icon" />
										</div>
										<div className="bank-details">
											<h2>MasterCard</h2>
											<div className="bank-card">
												<span>Active </span>
												<span>| Card Number **** 7887</span>
											</div>
										</div>
										<div className="bank-active-sec">
											<div><Link to="#"><img src={purpleEditIcon} alt="edit-icon" /></Link></div>
										</div>
									</div>
									<div className="transfer-first">
										<div className="bank-img">
											<img src={Bank3Img} alt="bank-icon" />
										</div>
										<div className="bank-details">
											<h2>Visa</h2>
											<div className="bank-card">
												<span className="color-red">Inactive </span>
												<span >| Card Number **** 2540</span>
											</div>
										</div>
										<div className="bank-active-sec">
											<div><Link to="#"><img src={purpleEditIcon} alt="edit-icon" /></Link></div>
										</div>
									</div>
									<div className="transfer-first">
										<div className="bank-img">
											<img src={Bank1Img} alt="bank-icon" />
										</div>
										<div className="bank-details">
											<h2>JPMorgan</h2>
											<div className="bank-card">
												<span>Active  </span>
												<span>| Card Number **** 4625</span>
											</div>
										</div>
										<div className="bank-active-sec">
											<div><Link to="#"><img src={purpleEditIcon} alt="edit-icon" /></Link></div>
										</div>
									</div>
								</div>
								<div className="verify-number-btn">
									<Link to="#">
										<span>
											<img src={faqPlus} alt="plus-icon" />
										</span>Link a New Card
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

export default BankAndCard