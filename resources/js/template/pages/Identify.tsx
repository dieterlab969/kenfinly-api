import React, { useState } from "react";
import RightTickIcon from '../assets/svg/right-tick-icon.svg'
import personalInfoSubmitImg from '../assets/images/main-img/personal-info-submit-img.png'
import { Link, useNavigate } from 'react-router-dom';
import BackBtn from '../components/BackBtn.tsx';

const Identify: React.FC = () => {
	const navigate = useNavigate();

	const handlePreviousClick = () => {
		navigate("/UploadId");
	};


	const [currentStep, setCurrentStep] = useState(0);

	const steps = [0, 1]; // Update based on number of fieldsets

	const setProgressBarWidth = () => {
		const percent = ((currentStep + 1) / steps.length) * 100;
		return `${percent.toFixed()}%`;
	};

	const handleNext = () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1);
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
									<div className="progress-bar progress-bar-animated"
										role="progressbar"
										aria-valuemin={0}
										aria-valuemax={100}
										style={{ width: setProgressBarWidth() }}
									>
									</div>
								</div>
								{/* Step 1 */}
								{currentStep === 0 && (
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
																	<Link to="#photo-id-modal" data-bs-toggle="modal" className="bg-green">
																		<img src={RightTickIcon} alt="plus-icon" />
																	</Link>
																	<p className="select-txt">Select</p>
																</div>
															</div>
														</div>
														<div className="goverment-id-sec mt-16">
															<h3>Selfie Photo</h3>
															<p>It’s required by law to verify your identity as a new user</p>
															<div className="select-sec">
																<input id="files" />
																<label htmlFor="files" className="select-img bg-green ">
																	<img src={RightTickIcon} alt="right-icon" />
																</label>
																<p className="select-txt">Select</p>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
										<input type="button" name="previous" className="previous action-button-previous input-icon-previous hidden-text-button" onClick={handlePreviousClick} value="submit" />
										<div className="verify-id-btn verify-my-btn" onClick={handleNext}>
											<Link to="#" className="next">Verify My Identity</Link>
										</div>
									</fieldset>
								)}
								{/* Step 2 */}
								{currentStep === 1 && (
									<fieldset className="mt-24">
										<div className="verify-identity">
											<div className="home-address-content">
												<div className="verify-number-img">
													<img src={personalInfoSubmitImg} alt="notification-img" />
												</div>
												<div className="verify-txt mt-24">
													<h2>Congrats!</h2>
													<p>Your account will be activated in 3 business days</p>
												</div>
												<div className="verify-number-btn"><Link to="/ReasonUsingPayfast">Got It</Link></div>
											</div>
										</div>
									</fieldset>
								)}
							</form>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Identify