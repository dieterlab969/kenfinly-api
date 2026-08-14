import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import PurpleEditIcon from '../assets/svg/purple-edit-icon.svg'
import { Link } from 'react-router-dom'

const OldInvoice: React.FC = () => {
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
									<p>Invoice #0126</p>
								</div>
								<div className="old-invoice-edit">
									<Link to="#"><img src={PurpleEditIcon} alt="edit-icon" /></Link>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="old-invoice">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<h1 className="d-none">Old Invoice</h1>
								<div className="old-invoice-content">
									<form className="feedback-form">
										<div className="form-details-pays-bill">
											<label htmlFor="customer-email" className="custom-lbl-electricity">Bill To</label>
											<input type="email" id="customer-email" placeholder="kitty_smith@mail.com" className="custom-input-id mt-8" autoComplete="off" />
										</div>
										<div>
											<label htmlFor="select-currency" className="custom-lbl-electricity mt-24">Select Currency</label>
											<div className="custom-select-internet mt-8">
												<select name="persons" className="arrow-icon" id="select-currency">
													<option>USD - US Dollar</option>
													<option>CAD</option>
													<option>Bitcoin</option>
													<option>Euro</option>
												</select>
											</div>
										</div>
									</form>
									<div className="old-invoice-add-item">
										<div className="old-invoice-add-content border-0 mt-24">
											<span className="txt1">Web Development</span>
											<span className="txt1">$60.00
												<Link to="#">
													<img src={PurpleEditIcon} alt="edit-icon" className="old-invoice-icon" />
												</Link>
											</span>
										</div>
										<p className="txt2">1 x $60.00</p>
										<div className="add-item-btn mt-24">
											<Link to="/AddNewItem">
												<img src={PurpleEditIcon} alt="edit-icon" />Add Item or Services
											</Link>
										</div>
									</div>
									<div className="sendmoney-content mt-24">
										<div className="sendmomey-details border-0">
											<span>Subtotal</span>
											<span>$150.00</span>
										</div>
										<div className="sendmomey-details border-0">
											<span className="color-green">Discount</span>
											<span className="color-green">$15.00
												<Link to="#">
													<img src={PurpleEditIcon} alt="edit-icon" className="old-invoice-icon" />
												</Link>
											</span>
										</div>
										<div className="sendmomey-details border-0">
											<span className="color-red">Shipping & Handling</span>
											<span>$0.00
												<Link to="#">
													<img src={PurpleEditIcon} alt="edit-icon" className="old-invoice-icon" />
												</Link>
											</span>
										</div>
										<div className="sendmomey-details">
											<span>Japan (10%)</span>
											<span>$15.00</span>
										</div>
										<div className="sendmomey-details mt-12">
											<span>Total Amount</span>
											<span>$150.00</span>
										</div>
									</div>
								</div>
								<div className="verify-number-btn"><Link to="/Invoicing">Continue</Link></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default OldInvoice
