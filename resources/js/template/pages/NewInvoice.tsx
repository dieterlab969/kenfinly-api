import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import PurpleEditIcon from '../assets/svg/purple-edit-icon.svg'
import SendIcon from '../assets/svg/send-icon.svg'
import LeftIconBlack from '../assets/svg/left-icon-black.svg'
import shareIcon from '../assets/svg/share-icon.svg'
import QrIcon from '../assets/svg/qr-icon.svg'
import draftIcon from '../assets/svg/draft-icon.svg'
import { Link } from 'react-router-dom'


const NewInvoice: React.FC = () => {
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
									<p>New Invoice #0127</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="old-invoice">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<h1 className="d-none">New Invoice</h1>
								<div className="old-invoice-content">
									<form className="feedback-form">
										<div className="form-details-pays-bill">
											<label htmlFor="customer-email" className="custom-lbl-electricity">Bill To</label>
											<input type="email" id="customer-email" placeholder="killy_william@mail.com" className="custom-input-id mt-8" autoComplete="off" />
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
											<span className="txt1">Graphic Design</span>
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
											<span>$60.00</span>
										</div>
										<div className="sendmomey-details border-0">
											<span className="color-green">Discount</span>
											<span>$0.00
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
											<span>$6.00</span>
										</div>
										<div className="sendmomey-details mt-12">
											<span>Total Amount</span>
											<span>$66.00</span>
										</div>
									</div>
								</div>
								<div className="verify-number-btn">
									<Link to="#" data-bs-toggle="offcanvas" data-bs-target="#offcanvasBottom">Continue</Link>
								</div>
							</div>
						</div>
					</div>
				</div>
				{/* <!-- New invoice screen end --> */}
				{/* <!-- New invoice modal content start --> */}
				<div className="offcanvas offcanvas-bottom logout-main" id="offcanvasBottom">
					<button type="button" className="text-reset" data-bs-dismiss="offcanvas" aria-label="Close">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 16" fill="none">
							<g>
								<path d="M22 8L12 13L2 8" stroke="#F2EEFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
								<path d="M22 2L12 7L2 2" stroke="#F2EEFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
							</g>
						</svg>
					</button>
					<div className="offcanvas-body small">
						<h2 className="continue-txt mt-12">Continue to</h2>
						<div className="new-invoice-modal">
							<Link to="/AllContact">
								<div className="new-invoice-modal-content" >
									<div className="new-invoice-icon">
										<img src={SendIcon} alt="send-icon" />
									</div>
									<div className="new-invoice-title">
										<p>Send Invoice</p>
									</div>
									<div className="new-invoive-pre-bnt">
										<img src={LeftIconBlack} alt="left-icon" />
									</div>
								</div>
							</Link>
							<Link to="/ShareInvoice">
								<div className="new-invoice-modal-content" >
									<div className="new-invoice-icon">
										<img src={shareIcon} alt="send-icon" />
									</div>
									<div className="new-invoice-title">
										<p>Share Invoice</p>
									</div>
									<div className="new-invoive-pre-bnt">
										<img src={LeftIconBlack} alt="left-icon" />
									</div>
								</div>
							</Link>
							<Link to="/GenerateQrCode">
								<div className="new-invoice-modal-content" >
									<div className="new-invoice-icon">
										<img src={QrIcon} alt="send-icon" />
									</div>
									<div className="new-invoice-title">
										<p>Generate QR Code</p>
									</div>
									<div className="new-invoive-pre-bnt">
										<img src={LeftIconBlack} alt="left-icon" />
									</div>
								</div>
							</Link>
							<Link to="/SaveAsDraft">
								<div className="new-invoice-modal-content border-0" >
									<div className="new-invoice-icon">
										<img src={draftIcon} alt="send-icon" />
									</div>
									<div className="new-invoice-title">
										<p>Save as Draft</p>
									</div>
									<div className="new-invoive-pre-bnt">
										<img src={LeftIconBlack} alt="left-icon" />
									</div>
								</div>
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default NewInvoice