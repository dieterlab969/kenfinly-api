import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import { Link } from 'react-router-dom'

const AddTaxes: React.FC = () =>{
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
									<p>Add Taxes</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="add-tax-main">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<h1 className="d-none">Add taxes</h1>
								<div className="add-tax-content">
									<form className="feedback-form">
										<div className="form-details-pays-bill">
											<label htmlFor="tax-name" className="custom-lbl-electricity">Tax Name</label>
											<input type="text" id="tax-name" placeholder="United States" className="custom-input-id mt-8" autoComplete="off" />
										</div>
										<div className="form-details-pays-bill mt-24">
											<label htmlFor="tax-rate" className="custom-lbl-electricity">Tax Rate</label>
											<input type="number" id="tax-rate" placeholder="14%" className="custom-input-id mt-8" autoComplete="off" />
										</div>
									</form>
								</div>
								<div className="verify-number-btn"><Link to="/Taxes">Add</Link></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default AddTaxes
