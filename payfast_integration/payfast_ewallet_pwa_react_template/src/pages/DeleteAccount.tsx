import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import { Link } from 'react-router-dom'

const DeleteAccount: React.FC = () => {
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
									<p>Delete Account</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="delete-account">
						<div className="verify-number-bottom-wrap">
							<div className="delete-account-top">
								<h1>Why are you leaving PayFast?</h1>
								<p className="mt-16">We’re sorry to see you go! We’d love to know why you want to delete your account,
									so we can improve the app and support our community.</p>
							</div>
							<div className="lang-list mt-24">
								<div className="delete-account-bottom pt-0">
									<div className="delete-txt">I’m leaving temporarily</div>
									<div className="delete-select">
										<input className="form-check-input" type="radio" name="shipping" id="shipping1"
											value="shipping1" />
									</div>
								</div>
								<div className="delete-account-bottom">
									<div className="delete-txt">I’m on PayFast too much</div>
									<div className="delete-select">
										<input className="form-check-input" type="radio" name="shipping" id="shipping2"
											value="shipping1" />
									</div>
								</div>
								<div className="delete-account-bottom">
									<div className="delete-txt">Safety or privacy concerns</div>
									<div className="delete-select">
										<input className="form-check-input" type="radio" name="shipping" id="shipping3"
											value="shipping1" />
									</div>
								</div>
								<div className="delete-account-bottom">
									<div className="delete-txt">Too many irrelevant ads</div>
									<div className="delete-select">
										<input className="form-check-input" type="radio" name="shipping" id="shipping4"
											value="shipping1" />
									</div>
								</div>
								<div className="delete-account-bottom">
									<div className="delete-txt">Trouble getting started</div>
									<div className="delete-select">
										<input className="form-check-input" type="radio" name="shipping" id="shipping5"
											value="shipping1" />
									</div>
								</div>
								<div className="delete-account-bottom">
									<div className="delete-txt">I have multiple account</div>
									<div className="delete-select">
										<input className="form-check-input" type="radio" name="shipping" id="shipping6"
											value="shipping1" />
									</div>
								</div>
								<div className="delete-account-bottom">
									<div className="delete-txt">Another reason</div>
									<div className="delete-select">
										<input className="form-check-input" type="radio" name="shipping" id="shipping7"
											value="shipping1" />
									</div>
								</div>
								<div className="delete-account-trapping">
									<p>Tapping “Delete Account” will delete PayFast account <span>Jessica Smith.</span></p>
								</div>
								<div className="verify-number-btn"><Link to="#">Delete Account</Link></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default DeleteAccount
