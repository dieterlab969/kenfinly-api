import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import { Link } from 'react-router-dom';

const AddNewItem:React.FC = () => {
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
									<p>Add New Item</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="add-new-item">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<h1 className="d-none">Add New item</h1>
								<div className="add-new-item-content">
									<form className="feedback-form">
										<div className="form-details-pays-bill">
											<label htmlFor="item-name" className="custom-lbl-electricity">Item Name</label>
											<input type="text" id="item-name" placeholder="Web UI Design" className="custom-input-id mt-8" />
										</div>
										<div>
											<label htmlFor="select-currency" className="custom-lbl-electricity mt-24">Select Currency</label>
											<div className="custom-select-internet mt-8">
												<select name="persons" id="select-currency" className="arrow-icon">
													<option>USD - US Dollar</option>
													<option>CAD</option>
													<option>Bitcoin</option>
													<option>Euro</option>
												</select>
											</div>
										</div>
										<div className="mt-24">
											<label htmlFor="customer-description" className="custom-lbl-electricity">Description (Optional)</label>
											<textarea placeholder="Description" className="custom-textarea mt-8" id="customer-description"></textarea>
										</div>
										<div className="form-details-pays-bill mt-24">
											<label htmlFor="price" className="custom-lbl-electricity">Price</label>
											<input type="text" id="price" placeholder="$89.00" className="custom-input-id mt-8" />
										</div>
										<div>
											<label htmlFor="select-currency2" className="custom-lbl-electricity mt-24">Select Currency</label>
											<div className="custom-select-internet mt-8">
												<select name="persons" className="arrow-icon" id="select-currency2">
													<option>Japan (10%)</option>
													<option>CAD</option>
													<option>Bitcoin</option>
													<option>Euro</option>
												</select>
											</div>
										</div>
									</form>
								</div>
								<div className="verify-number-btn"><Link to="/MyItem">Add</Link></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default AddNewItem




