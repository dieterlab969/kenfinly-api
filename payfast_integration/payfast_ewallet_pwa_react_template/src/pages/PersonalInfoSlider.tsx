import React, { useState } from "react";
import BackBtn from '../components/BackBtn.tsx';
import FaqPlus from '../assets/svg/faq-plus.svg'
import CardDownBtn from '../assets/svg/card-down-btn.svg'
import BlackRightArrow from '../assets/svg/black-right-arrow.svg'
import { Link } from 'react-router-dom';

const PersonalInfoSlider: React.FC = () => {
	const [currentStep, setCurrentStep] = useState(0);

	const steps = [0, 1, 2];

	const setProgressBarWidth = () => {
		const percent = ((currentStep + 1) / steps.length) * 100;
		return `${percent.toFixed()}%`;
	};

	const handleNext = () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1);
		}
	};

	const handlePrevious = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};




	const [isOpen, setIsOpen] = useState(false);

	// Close when overlay clicked
	const handleOverlayClick = (e) => {
		if (e.target.classList.contains("modal-overlay")) {
			setIsOpen(false);
		}
	};

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
									<p>Information</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="personal-info-slider">
						<div className="verify-number-bottom-wrap">
							<h1 className="d-none">Hidden</h1>
							<form id="msform">
								<div className="progress">
									<div
										className="progress-bar progress-bar-animated"
										role="progressbar"
										aria-valuemin={0}
										aria-valuemax={100}
										style={{ width: setProgressBarWidth() }}
									></div>
								</div>

								{/* Step 1 */}
								{currentStep === 0 && (
									<fieldset className="mt-24">
										<div className="personal-info">
											<div className="home-address-content">
												<div className="home-address-heading">
													<h2>Personal Information</h2>
													<p>We ask for your personal information to verify your identity</p>
												</div>
												<div className="multistep-form password-form">
													<div className="form-floating mt-24">
														<input type="text" className="form-control" id="first-name" placeholder="First Name" autoComplete="off" />
														<label htmlFor="first-name">First Name</label>
													</div>
													<div className="form-floating mt-24">
														<input type="text" className="form-control" id="last-name" placeholder="Last Name" autoComplete="off" />
														<label htmlFor="last-name">Last Name</label>
													</div>
													<div className="form-floating mt-24">
														<input type="text" className="form-control" id="date-of-birth" placeholder="Date of birth (MM/DD/YYYY)" autoComplete="off" />
														<label htmlFor="date-of-birth">Date of birth (MM/DD/YYYY)</label>
													</div>
												</div>
											</div>
										</div>
										<input
											type="button"
											name="next"
											className="next action-button input-icon-next hidden-text-button"
											value="Submit"
											onClick={handleNext}
										/>
									</fieldset>
								)}

								{/* Step 2 */}
								{currentStep === 1 && (
									<fieldset className="mt-24">
										<div className="home-address">
											<div className="home-address-content">
												<div className="home-address-heading">
													<h2>Home Address</h2>
												</div>
												<div className="multistep-form password-form">
													<div className="form-floating mt-24">
														<input type="text" className="form-control" id="street-add" placeholder="Street Address" autoComplete="off" />
														<label htmlFor="street-add">Street Address</label>
													</div>
													<div className="form-floating mt-24">
														<input type="number" className="form-control" id="number-suite" placeholder="Apt / Suite Number" autoComplete="off" />
														<label htmlFor="number-suite">Apt / Suite Number</label>
													</div>
													<div className="form-floating mt-24">
														<input type="text" className="form-control" id="city" placeholder="City" />
														<label htmlFor="city">City</label>
													</div>
													<div className="form-floating mt-24">
														<input type="text" className="form-control" id="region" placeholder="Region" autoComplete="off" />
														<label htmlFor="region">Region</label>
													</div>
													<div className="form-floating mt-24">
														<input type="number" className="form-control" id="zip-code" placeholder="Zip Code" autoComplete="off" />
														<label htmlFor="zip-code">Zip Code</label>
													</div>
												</div>
											</div>
										</div>
										<input
											type="button"
											name="next"
											className="next action-button input-icon-next hidden-text-button"
											value="Submit"
											onClick={handleNext}
										/>
										<input
											type="button"
											name="previous"
											className="previous action-button-previous input-icon-previous hidden-text-button"
											value="Submit"
											onClick={handlePrevious}
										/>
									</fieldset>
								)}

								{/* Step 3 */}
								{currentStep === 2 && (
									<fieldset className="mt-24">
										<div className="verify-identity">
											<div className="home-address-content">
												<div className="home-address-heading">
													<h2>Verify Identity</h2>
												</div>
												<div className="multistep-form password-form">
													<div className="goverment-id mt-24">
														<div className="goverment-id-sec">
															<h3>Government ID</h3>
															<p>Take a driver’s license, national identity card or passport photo</p>
															<div className="select-sec-id mt-24">
																<div className="plus-id-btn">
																	<Link to="#" onClick={() => setIsOpen(true)}>
																		<img src={FaqPlus} alt="plus-icon" />
																	</Link>
																	<p className="select-txt">Select</p>
																</div>
															</div>
														</div>
														<div className="goverment-id-sec mt-16">
															<h3>Selfie Photo</h3>
															<p>It’s required by law to verify your identity as a new user</p>
															<div className="select-sec">
																<div className="plus-id-btn">
																	<Link to="/CaptureSelfie">
																		<img src={FaqPlus} alt="plus-icon" />
																	</Link>
																	<p className="select-txt">Select</p>
																</div>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
										<input
											type="button"
											name="previous"
											className="previous action-button-previous input-icon-previous hidden-text-button"
											value="Submit"
											onClick={handlePrevious}
										/>
										<div className="verify-id-btn">
											<Link to="#">Verify My Identity</Link>
										</div>
									</fieldset>
								)}
							</form>
						</div>
					</div>
				</div>
				{/* <!-- Personal info slider content end --> */}
				{/* <!-- Modal content start --> */}
				{/* Modal */}
				{isOpen && (
					<div className="modal-overlay" onClick={handleOverlayClick}>
						<div className="photo-modal">
							<div className="card-btn">
								<button type="button" onClick={() => setIsOpen(false)}>
									<img src={CardDownBtn} alt="cart-icon" />
								</button>
							</div>

							<div className="photo-type">
								<p className="mt-16">Which photo ID would you like to use?</p>

								<div
									className="photo-content-details"
									onClick={() => setIsOpen(false)}
								>
									<Link to="/UploadId">
										<div>Driver’s License</div>
										<div>
											<img src={BlackRightArrow} alt="right-icon" />
										</div>
									</Link>
								</div>

								<div
									className="photo-content-details"
									onClick={() => setIsOpen(false)}
								>
									<Link to="/UploadId">
										<div>National Identity Card</div>
										<div>
											<img src={BlackRightArrow} alt="right-icon" />
										</div>
									</Link>
								</div>

								<div
									className="photo-content-details border-0"
									onClick={() => setIsOpen(false)}
								>
									<Link to="/UploadId">
										<div>Passport</div>
										<div>
											<img src={BlackRightArrow} alt="right-icon" />
										</div>
									</Link>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default PersonalInfoSlider