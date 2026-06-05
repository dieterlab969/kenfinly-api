import React from 'react'
import BackBtn from '../components/BackBtn.tsx';

const DataPrivacy: React.FC = () =>{
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
									<p>Data & Privacy</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="data-privacy">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<div className="data-privacy-content">
									<h1>Manage Your Privacy Settings</h1>
									<div className="privacy-content mt-16">
										<h2>Permission Given</h2>
										<p className="mt-8">Keep track of the data & permissions you’re sharing with the apps & sites you use.</p>
									</div>
									<div className="privacy-content mt-16">
										<h2>Search Privacy</h2>
										<p className="mt-8">Control how people can find you on PayFast.</p>
									</div>
									<div className="privacy-content mt-16">
										<h2>Blocked Contacts</h2>
										<p className="mt-8">Review & edit the people you previously blocked.</p>
									</div>
									<h2 className="manage-txt mt-24">Manage Your Data</h2>
									<div className="manage-data-sec mt-16">
										<div className="delete-account-bottom border-0 p-0">
											<div className="manage-data-title">
												<h3>Download Your Data</h3>
												<p className="mt-8">Get a copy of your account data</p>
											</div>
											<div className="delete-select">
												<input className="form-check-input" type="radio" name="shipping" id="shipping1" value="shipping1" />
											</div>
										</div>
									</div>
									<div className="manage-data-sec mt-16">
										<div className="delete-account-bottom border-0 p-0">
											<div className="manage-data-title">
												<h3>Correct Your Data</h3>
												<p className="mt-8">You can correct data any time, any where.</p>
											</div>
											<div className="delete-select">
												<input className="form-check-input" type="radio" name="shipping" id="shipping2" value="shipping1" />
											</div>
										</div>
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

export default DataPrivacy