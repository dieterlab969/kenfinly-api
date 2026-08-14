import React, { useRef } from 'react';
import CreateNewPinImg from '../assets/images/main-img/create-new-pin-img.png'
import { Link } from 'react-router-dom';
import BackBtn from '../components/BackBtn.tsx';
import { useTranslation } from 'react-i18next';

const CreateNewPin: React.FC = () => {
	const { t } = useTranslation();
	const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
		const value = e.target.value;
		if (/^\d?$/.test(value)) {
			if (value && index < inputsRef.current.length - 1) {
				inputsRef.current[index + 1]?.focus();
			}
		} else {
			e.target.value = '';
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
		if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
			inputsRef.current[index - 1]?.focus();
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
									<p>{t('Create New PIN')}</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="create-new-pin-main">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<div className="verify-number-img">
									<img src={CreateNewPinImg} alt="verifyimg" />
								</div>
								<div className="verify-txt mt-24">
									<h1 className="d-none">Create pin</h1>
									<p>{t('Add a PIN Number to make your account more secure.')}</p>
								</div>
								<form className="mt-24" method="get">
									<div id="otp" className="digit-group otp-section">
										{[1, 2, 3, 4].map((digit, index) => (
											<input
												key={index}
												className="form-control otp"
												type="text"
												name={`digit-${digit}`}
												maxLength={1}
												autoComplete="off"
												ref={(el) => {
													inputsRef.current[index] = el;
												}}
												onChange={(e) => handleChange(e, index)}
												onKeyDown={(e) => handleKeyDown(e, index)}
											/>
										))}
									</div>
								</form>
								<div className="verify-number-btn"><Link to="/Fingerprint">{t('Continue')}</Link></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default CreateNewPin
