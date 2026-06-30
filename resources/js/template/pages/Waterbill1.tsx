import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import Bill3 from '../assets/images/paybill/bill-3.svg'
import { Link } from 'react-router-dom'

const Waterbill1: React.FC = () => {
	return (
		<div className="site-content">
			<div className="verify-number-main">
				<div className="verify-number-top">
					<div className="container">
						<div className="verify-number-top-content">
							<div className="back-btn">
								<BackBtn />
							</div>
							<div className="header-title">
								<p>Water Bill</p>
							</div>
						</div>
					</div>
				</div>
				<div className="verify-number-bottom" id="electricity1">
					<div className="verify-number-bottom-wrap">
						<div className="verify-number-content">
							<div className="electricity1-top">
								<div className="pay-bill-content">
									<div className="pay-bill-img bg-3">
										<img src={Bill3} alt="pay-bills" />
									</div>
									<h1 className="pay-txt mt-16">Pay Water Bill</h1>
									<p className="pay-bill-name mt-12">Pay water bills safely, conveniently & easily. You can pay anytime and anywhere!</p>
								</div>
							</div>
							<div className="internet-bill1-bottom">
								<form className="internet-form">
									<div>
										<label htmlFor="select-zone" className="custom-lbl-electricity mt-24">Select Zone Area</label>
										<div className="custom-select-internet mt-16">
											<select name="persons" className="arrow-icon" id="select-zone">
												<option>Select Your Area</option>
												<option>Area 1</option>
												<option>Area 2</option>
												<option>Area 3</option>
											</select>
										</div>
									</div>
									<div className="form-details-pays-bill mt-24">
										<label htmlFor="customer-id" className="custom-lbl-electricity">Customer ID</label>
										<input type="number" id="customer-id" placeholder="Enter ID Number" className="custom-input-id mt-16" autoComplete="off" />
									</div>
								</form>
							</div>
							<div className="verify-number-btn"><Link to="/Waterbill2">Continue</Link></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Waterbill1