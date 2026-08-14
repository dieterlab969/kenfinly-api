import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import ForgetPasswordImg from '../assets/images/main-img/forget-password-img.png'
import smsIcon from '../assets/svg/sms-icon.svg'
import mailIcon from '../assets/svg/mail-icon.svg'
import { Link } from 'react-router-dom';

const ForgetPassword: React.FC = () => {
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
									<p>Forget Password</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="forget-password-main">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<div className="verify-number-img">
									<img src={ForgetPasswordImg} alt="forget-password-img" />
								</div>
								<div className="verify-txt mt-24">
									<h1 className="d-none">Forget password</h1>
									<p>Select which contact details should we use to reset your password.</p>
								</div>
								<form className="password-form forget-password-form">
									<div className="form-floating mt-24">
										<input type="text" className="form-control " id="floatingInput" placeholder="Payfastforme@123" />
										<label htmlFor="floatingInput">via SMS</label>
										<div className="mobile-message-main">
											<img src={smsIcon} alt="sms-icon" />
										</div>
									</div>
									<div className="form-floating mt-12">
										<input type="text" className="form-control" id="floatingPassword" placeholder="Payfastforme@123" />
										<label htmlFor="floatingPassword">via Email</label>
										<div className="mobile-message-main">
											<img src={mailIcon} alt="sms-icon" />
										</div>
									</div>
								</form>
							</div>
							<div className="verify-number-btn"><Link to="/ConfirmOtp">Continue</Link></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
export default ForgetPassword