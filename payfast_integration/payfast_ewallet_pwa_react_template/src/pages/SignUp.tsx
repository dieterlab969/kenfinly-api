import React, { useState } from "react";
import BackBtn from '../components/BackBtn.tsx';
import Logo from '../assets/images/let-you-screen/logo.svg'
import FbIcon from '../assets/svg/fb-icon.svg'
import GoogleIcon from '../assets/svg/google-icon.svg'
import AppleIcon from '../assets/svg/apple-icon.svg'
import WhatsappIcon from '../assets/svg/whatsapp-icon.svg'
import personIcon from '../assets/svg/person-icon.svg'
import { Link } from 'react-router-dom';
import ReactFlagsSelect from "react-flags-select";

const SignUp: React.FC = () => {
	const [selected, setSelected] = useState("");// for Flag
	return (
		<div>
			<div className="site-content">
				{/* <!-- Sign up screen content start --> */}
				<div className="let-you-page-main">
					<div className="let-you-top">
						<div className="container">
							<div className="let-you-top-wrap">
								<header className="back-btn">
									<BackBtn />
								</header>
								<div className="payfast-img_main">
									<img src={Logo} alt="logo" />
								</div>
							</div>
						</div>
					</div>
					<div className="let-you-social-sec" id="sign-up-main">
						<div className="lets_you_in_box">
							<h1 className="d-none">hidden</h1>
							<h2 className="lets_you_in_text">Sign Up</h2>
							<form className="mt-32">
								<div className="form-details-sign-in">
									<span>
										<img src={personIcon} alt="personicon" />
									</span>
									<input type="text" id="name" placeholder="Your Name" className="sign-in-custom-input" autoComplete="off" />
								</div>
								<div className="mobile-form mt-16">
									<ReactFlagsSelect
										selected={selected}
										onSelect={(code) => setSelected(code)}
										placeholder="+91"
									/>
									<input type="tel" id="mobile_code" className="sign-in-custom-input" placeholder="Enter Mobile Number" />
								</div>
							</form>
							<div className="form-sign-in-password-btn mt-24">
								<Link to="/VerifyPhoneNumber">Sign Up</Link>
							</div>
							<div className="or-section mt-32 ">
								<p>or continue with</p>
							</div>
							<div className="icons_main mt-32">
								<a href="https://www.facebook.com" target="_blank" rel='noreferrer'>
									<img src={FbIcon} alt="Icon-fb" />
								</a>
								<a href="https://www.google.com" target="_blank" rel='noreferrer'>
									<img src={GoogleIcon} alt="Icon-google" />
								</a>
								<a href="https://www.icloud.com" target="_blank" rel='noreferrer'>
									<img className="apple" src={AppleIcon} alt="Icon-apple" />
								</a>
								<a href="https://wa.me/+12345678899" target="_blank" rel='noreferrer'>
									<img src={WhatsappIcon} alt="Icon-whatsapp" />
								</a>
							</div>
						</div>
					</div>
					<footer id="let-you-footer">
						<div className="block-footer">
							<p>Already have an account? <Link to="/SignIn">Sign in</Link></p>
						</div>
					</footer>
				</div>
			</div>
		</div>
	)
}

export default SignUp