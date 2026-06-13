import React, { useRef, useEffect, useState } from 'react';
import BackBtn from '../components/BackBtn.tsx';
import ConformOtpImg from '../assets/images/main-img/confirm-otp-img.png'
import { Link } from 'react-router-dom';

const ConfirmOtp: React.FC = () => {

	const inputRefs = [
		useRef<HTMLInputElement | null>(null),
		useRef<HTMLInputElement | null>(null),
		useRef<HTMLInputElement | null>(null),
		useRef<HTMLInputElement | null>(null),
	];
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
		const value = e.target.value;

		// Only allow single character and numbers
		if (!/^[0-9]?$/.test(value)) return;

		if (value && index < inputRefs.length - 1) {
			inputRefs[index + 1].current?.focus();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
		if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
			inputRefs[index - 1].current?.focus();
		}
	};

	const [counter, setCounter] = useState<number>(60); // 60 seconds

	useEffect(() => {
		let timer: NodeJS.Timeout | undefined;

		if (counter > 0) {
			timer = setInterval(() => {
				setCounter((prev) => prev - 1);
			}, 1000);
		}

		return () => {
			if (timer) clearInterval(timer);
		};
	}, [counter]);

	return (
		<div>
			<div className="verify-number-main">
				<div className="verify-number-top">
					<div className="container">
						<div className="verify-number-top-content">
							<div className="back-btn">
								<BackBtn />
							</div>
							<div className="header-title">
								<p>Confirm OTP</p>
							</div>
						</div>
					</div>
				</div>
				<div className="verify-number-bottom" id="confirm-otp-main">
					<div className="verify-number-bottom-wrap">
						<div className="verify-number-content">
							<div className="verify-number-img">
								<img src={ConformOtpImg} alt="confirm-otp-img" />
							</div>
							<div className="verify-txt mt-24">
								<h1 className="d-none">Confirm otp</h1>
								<p>Code has been send to +1 234 *** **99</p>
							</div>
							<form className="mt-24" method="get">
								<div id="otp" className="digit-group otp-section">
									{[...Array(4)].map((_, i) => (
										<input
											key={i}
											ref={inputRefs[i]}
											className="form-control otp"
											type="text"
											name={`digit-${i + 1}`}
											id={`digit-${i + 1}`}
											maxLength={1}
											autoComplete="off"
											onChange={(e) => handleChange(e, i)}
											onKeyDown={(e) => handleKeyDown(e, i)}
										/>
									))}
								</div>
							</form>
							<div className="otp-resend mt-32">
								<span className="resend-txt1">Resend code in </span>
								<span className="resend-txt2" id="counter">
									{counter > 0 ? `${counter} Sec` : 'Resend OTP'}
								</span>
							</div>
							<div className="verify-number-btn"><Link to="/CreateNewPassword">Confirm</Link></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
export default ConfirmOtp