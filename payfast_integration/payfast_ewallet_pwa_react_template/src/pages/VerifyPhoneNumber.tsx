import React, { useRef } from 'react';
import VerifyImg from '../assets/images/main-img/verify-phone-no-img.png';
import BackBtn from '../components/BackBtn.tsx';
import { Link } from 'react-router-dom';

const VerifyPhoneNumber: React.FC = () => {
	const inputs = [
		useRef<HTMLInputElement>(null),
		useRef<HTMLInputElement>(null),
		useRef<HTMLInputElement>(null),
		useRef<HTMLInputElement>(null),
	];

	const handleKeyUp = (
		e: React.KeyboardEvent<HTMLInputElement>,
		index: number
	) => {
		const target = e.target as HTMLInputElement;
		const value = target.value;

		// Allow only digits
		if (!/^\d?$/.test(value)) {
			target.value = '';
			return;
		}

		if (e.key === 'Backspace' || e.key === 'ArrowLeft') {
			if (index > 0) {
				inputs[index - 1].current?.focus();
			}
		} else {
			if (value && index < inputs.length - 1) {
				inputs[index + 1].current?.focus();
			}
		}
	};
	return (
		<div className="site-content">
			{/* <!-- Verify phone number content start --> */}
			<div className="verify-number-main">
				<div className="verify-number-top">
					<div className="container">
						<div className="verify-number-top-content">
							<div className="back-btn">
								<BackBtn />
							</div>
							<div className="header-title">
								<p>Verify Phone Number</p>
							</div>
						</div>
					</div>
				</div>
				<div className="verify-number-bottom" id="verify-no-main">
					<div className="verify-number-bottom-wrap">
						<div className="verify-number-content">
							<h1 className="d-none">Verfify Number</h1>
							<div className="verify-number-img">
								<img src={VerifyImg} alt="verifyimg" />
							</div>
							<div className="verify-txt mt-24"><p>Please enter the verification code we sent to your mobile *** *** **65</p></div>
							<form className="mt-24" method="get">
								<div className="digit-group otp-section">
									{inputs.map((ref, index) => (
										<input
											key={index}
											className="form-control otp"
											type="text"
											maxLength={1}
											autoComplete="off"
											ref={ref}
											onKeyUp={(e) => handleKeyUp(e, index)}
										/>
									))}
								</div>
							</form>
							<div className="otp-resend mt-32">
								<span className="resend-txt1">Not yet get?</span>
								<span className="resend-txt2"><Link to="/VerifyPhoneNumber"> Resend OTP</Link></span>
							</div>
							<div className="verify-number-btn"><Link to="/NotificationAllow"> Verify</Link></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default VerifyPhoneNumber