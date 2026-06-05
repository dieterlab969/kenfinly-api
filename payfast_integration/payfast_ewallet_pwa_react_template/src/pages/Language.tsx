import React from 'react'
import BackBtn from '../components/BackBtn.tsx';

const Language: React.FC = () => {
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
									<p>Language</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="language-screen">
						<div className="verify-number-bottom-wrap">
							<h1 className="d-none">Language</h1>
							<div className="lang-list">
								<div className="form-check change-lan-sec language-sel">
									<input className="form-check-input custom-input" name="language" type="radio" id="language1" />
									<label className="form-check-label custom-lable" htmlFor="language1">
										English (US)
									</label>
								</div>
								<div className="form-check change-lan-sec">
									<input className="form-check-input custom-input" name="language" type="radio" id="language2" />
									<label className="form-check-label custom-lable" htmlFor="language2">
										English (UK)
									</label>
								</div>
								<div className="form-check change-lan-sec">
									<input className="form-check-input custom-input" name="language" type="radio" id="language3" />
									<label className="form-check-label custom-lable" htmlFor="language3">
										Hindi
									</label>
								</div>
								<div className="form-check change-lan-sec">
									<input className="form-check-input custom-input" name="language" type="radio" id="language4" />
									<label className="form-check-label custom-lable" htmlFor="language4">
										Spanish
									</label>
								</div>
								<div className="form-check change-lan-sec">
									<input className="form-check-input custom-input" name="language" type="radio" id="language5" />
									<label className="form-check-label custom-lable" htmlFor="language5">
										French
									</label>
								</div>
								<div className="form-check change-lan-sec">
									<input className="form-check-input custom-input" name="language" type="radio" id="language6" />
									<label className="form-check-label custom-lable" htmlFor="language6">
										Arabic
									</label>
								</div>
								<div className="form-check change-lan-sec">
									<input className="form-check-input custom-input" name="language" type="radio" id="language7" />
									<label className="form-check-label custom-lable" htmlFor="language7">
										Bengali
									</label>
								</div>
								<div className="form-check change-lan-sec">
									<input className="form-check-input custom-input" name="language" type="radio" id="language8" />
									<label className="form-check-label custom-lable" htmlFor="language8">
										Russian
									</label>
								</div>
								<div className="form-check change-lan-sec">
									<input className="form-check-input custom-input" name="language" type="radio" id="language9" />
									<label className="form-check-label custom-lable" htmlFor="language9">
										Russian
									</label>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Language