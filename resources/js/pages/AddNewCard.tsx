import React, { useState } from "react";
import BackBtn from '../components/BackBtn.tsx';
import VisaLogo from '../assets/images/payment/visa-logo.png'
import { Link } from 'react-router-dom';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";


const AddNewCard: React.FC = () => {
	const [cardName, setCardName] = useState("Jessica Smith");
	const [cardNumber, setCardNumber] = useState("*** **** **** 0890");
	const [expiryDate, setExpiryDate] = useState<Date | null>(null); 
	const [cvv, setCvv] = useState("***");


	// Handle card number masking
	const handleCardNumberChange = (e) => {
		let input = e.target.value.replace(/\D/g, "");
		let maskedPart = input.substring(0, 12).replace(/./g, "*");
		let lastPart = input.substring(12);
		let formattedMasked = maskedPart.replace(/(.{4})/g, "$1 ").trim();
		let result = (formattedMasked + " " + lastPart).trim();

		setCardNumber(result || "*** **** **** 0890");
	};

	// Handle CVV input (only 3 digits)
	const handleCvvChange = (e) => {
		let input = e.target.value.replace(/\D/g, "").slice(0, 3);
		setCvv(input || "***");
	};

	// Format expiry date
	const handleDateChange = (date) => {
		setExpiryDate(date);
	};

	const formattedExpiry =
		expiryDate?.toLocaleDateString("en-US", { month: "2-digit", year: "2-digit" }) || "07/**";

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
									<p>Add New Card</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="add-new-card">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<h1 className="d-none">Add New Card</h1>
								<div className="verify-section-main">
									{/* Card Preview */}
									<div className="position-relative demo-visa">
										<div>
											<img className="hello-visa" src={VisaLogo} alt="visa" />
										</div>
										<p className="card-hidden-number">{cardNumber}</p>
										<div className="card-name-jessica-main">
											<p className="card-name-jessica">{cardName}</p>
											<div className="card-name-jessica-main-sub">
												<p className="card-date-cvv">{formattedExpiry}</p>
												<p className="card-date-cvv">{cvv}</p>
											</div>
										</div>
									</div>

									{/* Form */}
									<div className="new_password_input" id="new-card-inputs">
										<div className="personal-name mt-24">
											<label htmlFor="username">Card Name</label>
											<input
												type="text"
												id="username"
												className="px-0"
												autoComplete="off"
												required
												onChange={(e) => setCardName(e.target.value || "Jessica Smith")}
											/>
										</div>

										<div className="personal-name mt-16">
											<label htmlFor="cardNumber">Card Number</label>
											<input
												type="text"
												id="cardNumber"
												className="px-0"
												autoComplete="off"
												required
												maxLength={16}
												onChange={handleCardNumberChange}
											/>
										</div>

										<div className="expiry-date mt-16 flex gap-3">
											<div className="personal-name">
												<label htmlFor="datepicker">Expiry Date</label>
												<DatePicker
													id="datepicker"
													selected={expiryDate}
													onChange={handleDateChange}
													dateFormat="MM/yy"
													showMonthYearPicker
													placeholderText="MM/YY"
													className="px-0"
												/>
											</div>
											<div className="personal-name">
												<input
													type="text"
													id="threeDigitInput"
													className="px-0"
													maxLength={3}
													placeholder="CVV"
													onChange={handleCvvChange}
													required
												/>
											</div>
										</div>
									</div>
									<div className="verify-number-btn">
										<Link to="#">Add My Card</Link>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default AddNewCard