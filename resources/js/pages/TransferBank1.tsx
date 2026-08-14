import React, { useState } from 'react';
import BackBtn from '../components/BackBtn.tsx';
import Bank1 from '../assets/images/transfer-to-bank/bank1.svg'
import Bank2 from '../assets/images/transfer-to-bank/bank2.svg'
import Bank3 from '../assets/images/transfer-to-bank/bank3.svg'
import FaqPlus from '../assets/svg/faq-plus.svg'
import { Link } from 'react-router-dom'



const bankOptions = [
	{
		id: 'shipping1',
		bankName: 'Bank of America',
		status: 'Active',
		cardNumber: '**** 4625',
		image: Bank1,
	},
	{
		id: 'shipping2',
		bankName: 'MasterCard',
		status: 'Active',
		cardNumber: '**** 7887',
		image: Bank2,
	},
	{
		id: 'shipping3',
		bankName: 'Visa',
		status: 'Inactive',
		cardNumber: '**** 2540',
		image: Bank3,
	},
	{
		id: 'shipping4',
		bankName: 'JPMorgan',
		status: 'Active',
		cardNumber: '**** 4625',
		image: Bank1,
	},
];


const TransferBank1: React.FC = () => {
	const [selectedBank, setSelectedBank] = useState('shipping1');

	return (
		<div>
			<div className="site-content">
				{/* <!-- Transfer to bank1 start --> */}
				<div className="verify-number-main">
					<div className="verify-number-top">
						<div className="container">
							<div className="verify-number-top-content">
								<div className="back-btn">
									<BackBtn />
								</div>
								<div className="header-title">
									<p>Transfers To Your Bank</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="transfer-to-bank-main">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<h1 className="d-none">Transfer Bank</h1>
								<div className="transfer-to-bank">
									{bankOptions.map((bank) => (
										<div className="transfer-first" key={bank.id}>
											<div className="bank-img">
												<img src={bank.image} alt="bank-icon" />
											</div>

											<div className="bank-details">
												<h2>{bank.bankName}</h2>
												<div className="bank-card">
													<span className={bank.status === 'Inactive' ? 'color-red' : ''}>
														{bank.status}
													</span>
													<span> | Card Number {bank.cardNumber}</span>
												</div>
											</div>

											<div className="bank-active-sec">
												<div className="form-check px-0">
													<input
														className="form-check-input"
														type="radio"
														name="shipping"
														id={bank.id}
														value={bank.id}
														checked={selectedBank === bank.id}
														onChange={() => setSelectedBank(bank.id)}
													/>
												</div>
											</div>
										</div>
									))}
									<div className="paid-button2 mt-24">
										<Link to="#">
											<span>
												<img src={FaqPlus} alt="plus-icon" />
											</span>
											Link a New Card
										</Link>
									</div>
								</div>
								<div className="verify-number-btn split3-btn"><Link to="/TransferBank2">Continue</Link></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default TransferBank1