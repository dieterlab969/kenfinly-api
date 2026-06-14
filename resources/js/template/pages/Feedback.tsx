import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import { Link } from 'react-router-dom'

const Feedback: React.FC = () => {
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
									<p>Your Feedback</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="feedback-main">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<h1 className="d-none">Feedback</h1>
								<div className="feedback-top">
									<form className="feedback-form">
										<div className="form-details-pays-bill">
											<label htmlFor="email" className="custom-lbl-electricity">Your Email Address</label>
											<input type="email" id="email" placeholder="Write here" className="custom-input-id mt-8" autoComplete="off" />
										</div>
										<div>
											<label htmlFor="subject" className="custom-lbl-electricity mt-24">Select Subject (Optional)</label>
											<div className="custom-select-internet mt-8">
												<select name="persons" className="arrow-icon" id="subject">
													<option>Choose Your Subject</option>
													<option>Subject 1</option>
													<option>Subject 2</option>
													<option>Subject 3</option>
												</select>
											</div>
										</div>
										<div className="mt-24">
											<label htmlFor="textarea" className="custom-lbl-electricity">Description</label>
											<textarea placeholder="Write here..." className="custom-textarea mt-8" id="textarea"></textarea>
										</div>
									</form>
								</div>
								<div className="verify-number-btn"><Link to="#">Submit</Link></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Feedback