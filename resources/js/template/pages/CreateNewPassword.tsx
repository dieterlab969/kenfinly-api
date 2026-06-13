import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import CreateNewPasswordImg from '../assets/images/main-img/create-new-password-img.png'
import { Link } from 'react-router-dom';

const CreateNewPassword: React.FC = () =>{
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
									<p>Create New Password</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="create-new-password-main">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<div className="verify-number-img">
									<img src={CreateNewPasswordImg} alt="create-new-password-img" />
								</div>
								<div className="verify-txt mt-24">
									<h1 className="d-none">Create password</h1>
									<p>Create Your New Password
									</p>
								</div>
								<form className="password-form">
									<div className="form-floating mt-24">
										<input type="password" className="form-control " id="floatingInput" placeholder="Payfastforme@123" />
										<label htmlFor="floatingInput">New Password</label>
										<i className="fas fa-eye-slash" id="eye"></i>
									</div>
									<div className="form-floating mt-12">
										<input type="password" className="form-control" id="floatingPassword" placeholder="Payfastforme@123" />
										<label htmlFor="floatingPassword">Re Enter New Password</label>
										<i className="fas fa-eye-slash" id="eye1"></i>
									</div>
								</form>
								<div className="remember-section mt-16">
									<div className="footer-checkbox-sec">
										<input className="footer-checkbox-input" id="footer-checkbox" type="checkbox" />
										<label htmlFor="footer-checkbox" className="footer-chec-txt">Remember me</label>
									</div>
								</div>
								<div className="verify-number-btn"><Link to="/SignIn">Continue</Link></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default CreateNewPassword