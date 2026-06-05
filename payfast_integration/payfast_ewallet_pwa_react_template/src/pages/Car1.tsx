import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import Bill14 from '../assets/images/paybill/bill-14.svg'
import { Link } from 'react-router-dom';

const Car1: React.FC = () =>{
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
									<p>Car Bill</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="electricity1">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<div className="electricity1-top">
									<div className="pay-bill-content">
										<div className="pay-bill-img bg-14">
											<img src={Bill14} alt="pay-bills" />
										</div>
										<h1 className="pay-txt mt-16">Pay Car Bill</h1>
										<p className="pay-bill-name mt-12">Pay Car bills safely, conveniently & easily. You can pay anytime and anywhere!</p>
									</div>
								</div>
								<div className="mt-24">
									<form>
										<div className="form-details-pays-bill">
											<label htmlFor="customer-id" className="custom-lbl-electricity">Customer ID</label>
											<input type="number" id="customer-id" placeholder="Enter ID Number" className="custom-input-id mt-16" autoComplete="off" />
										</div>
									</form>
								</div>
								<div className="verify-number-btn"><Link to="/Car2">Continue</Link></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Car1