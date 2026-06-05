import React, { useState } from 'react';
import BackBtn from '../components/BackBtn.tsx';
import { Link } from 'react-router-dom';

const SendMoney4: React.FC = () => {
	const [selectedOption, setSelectedOption] = useState('deactivate');


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
								<p>Send Money To</p>
							</div>
						</div>
					</div>
				</div>
				<div className="verify-number-bottom" id="delete-deactivate-main">
					<div className="verify-number-bottom-wrap">
						<div className="verify-number-content">
							<div className="delete-deactivate-content">
								<div className="delete-content send-money4">
									<h1>Choose a Payment Type</h1>
									<p className="mt-16">We will save this for all payments to Alan Williamson. You can change this on the review screen.</p>
								</div>
								<form id="deleteDeactivateForm">
									<div
										className={`form-check px-0 custom-radio mt-24 ${selectedOption === 'deactivate' ? 'active' : ''
											}`}
										onClick={() => setSelectedOption('deactivate')}
									>
										<input
											className="form-check-input"
											type="radio"
											name="action"
											id="shipping1"
											value="deactivate"
											checked={selectedOption === 'deactivate'}
											onChange={() => { }}
										/>
										<label className="form-check-label checkout-modal-lbl pt-0 pb-0" htmlFor="shipping1">
											For Goods & Services
											<span className="mt-8">
												Thank you for your hard work on this project. We look forward to working with you again in the future.
											</span>
										</label>
									</div>

									<div
										className={`form-check px-0 custom-radio mt-16 ${selectedOption === 'delete' ? 'active' : ''
											}`}
										onClick={() => setSelectedOption('delete')}
									>
										<input
											className="form-check-input"
											type="radio"
											name="action"
											id="shipping2"
											value="delete"
											checked={selectedOption === 'delete'}
											onChange={() => { }}
										/>
										<label className="form-check-label checkout-modal-lbl pt-0 pb-0" htmlFor="shipping2">
											For Friends & Family
											<span className="mt-8">
												Purchase protection doesn’t apply for this payment.
											</span>
										</label>
									</div>
								</form>
							</div>
							<div className="verify-number-btn">
								<Link to="/SendMoneyReview">Continue</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default SendMoney4