import React, { useState } from 'react';
import BackBtn from '../components/BackBtn.tsx';
import { Link } from 'react-router-dom';

const ReasonUsingPayfast: React.FC = () => {
	const [checkedItems, setCheckedItems] = useState({
		language1: true,
		language2: false,
		language3: false,
		language4: true,
		language5: false,
		language6: false,
	});
	const handleCheckboxChange = (e) => {
		const { id, checked } = e.target;
		setCheckedItems(prev => ({
			...prev,
			[id]: checked,
		}));
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
									<p>Reason For Using PayFast</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="reason-using-payfast-main">
						<div className="verify-number-bottom-wrap">
							<h1 className="d-none">Reason payfast</h1>
							<p className="we-txt">We want to provide the best experience according to your needs.</p>
							<div className="lang-list">
								{[
									{ id: 'language1', label: 'Make online payments' },
									{ id: 'language2', label: 'Spend or save daily' },
									{ id: 'language3', label: 'Gain exposure to financial assets' },
									{ id: 'language4', label: 'Send and manage money' },
									{ id: 'language5', label: 'Spend while travelling' },
									{ id: 'language6', label: 'Others reason' },
								].map(({ id, label }, index) => (
									<div key={id} className={`form-check change-lan-sec ${index === 0 ? 'border-top mt-24' : ''}`}>
										<input
											className="form-check-input custom-input"
											name="language"
											type="checkbox"
											id={id}
											checked={checkedItems[id]}
											onChange={handleCheckboxChange}
										/>
										<label className="form-check-label custom-lable" htmlFor={id}>
											{label}
										</label>
									</div>
								))}
							</div>
							<div className="verify-number-btn"><Link to="/CreateNewPin">Continue</Link></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default ReasonUsingPayfast