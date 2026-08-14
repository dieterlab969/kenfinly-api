import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import { Link } from 'react-router-dom'

const Tracking1: React.FC = () => {
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
									<p>Tracking</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="tracking-main">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<h1 className="d-none">Tracking</h1>
								<div className="add-tax-content">
									<form className="feedback-form">
										<div className="form-details-pays-bill">
											<label htmlFor="customer-id" className="custom-lbl-electricity">Track Fund</label>
											<input type="text" id="customer-id" placeholder="Paste Transaction ID" className="custom-input-id mt-8" autoComplete="off" />
										</div>
									</form>
								</div>
								<div className="verify-number-btn"><Link to="/Tracking2">What’s The Status</Link></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Tracking1