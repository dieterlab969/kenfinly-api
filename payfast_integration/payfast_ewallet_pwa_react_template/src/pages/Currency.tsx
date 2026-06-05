import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import Currency1 from '../assets/images/currency/currency1.svg'
import Currency3 from '../assets/images/currency/currency3.svg'
import Currency4 from '../assets/images/currency/currency4.svg'
import Currency5 from '../assets/images/currency/currency5.svg'
import Currency6 from '../assets/images/currency/currency6.svg'
import Currency7 from '../assets/images/currency/currency7.svg'
import Currency8 from '../assets/images/currency/currency8.svg'

const Currency: React.FC = () =>{
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
									<p>Currency</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="currency-page">
						<div className="verify-number-bottom-wrap">
							<div className="lang-list">
								<h1 className="d-none">Currency Page</h1>
								<div className="form-check change-lan-sec language-sel first-pt-0">
									<input className="form-check-input custom-input" name="language" type="radio" id="language1" />
									<label className="form-check-label custom-lable" htmlFor="language1">
										<span>
											<img className="curr-icon" src={Currency1} alt="currency-icon" />
										</span>
										USD
									</label>
								</div>
								<div className="form-check change-lan-sec">
									<input className="form-check-input custom-input" name="language" type="radio" id="language2" />
									<label className="form-check-label custom-lable" htmlFor="language2">
										<span>
											<img className="curr-icon" src={Currency1} alt="currency-icon" />
										</span>
										CAD
									</label>
								</div>
								<div className="form-check change-lan-sec">
									<input className="form-check-input custom-input" name="language" type="radio" id="language3" />
									<label className="form-check-label custom-lable" htmlFor="language3">
										<span>
											<img className="curr-icon" src={Currency1} alt="currency-icon" />
										</span>
										AUD
									</label>
								</div>
								<div className="form-check change-lan-sec">
									<input className="form-check-input custom-input" name="language" type="radio" id="language4" />
									<label className="form-check-label custom-lable" htmlFor="language4">
										<span>
											<img className="curr-icon" src={Currency1} alt="currency-icon" />
										</span>
										NZD
									</label>
								</div>
								<div className="form-check change-lan-sec">
									<input className="form-check-input custom-input" name="language" type="radio" id="language5" />
									<label className="form-check-label custom-lable" htmlFor="language5">
										<span>
											<img className="curr-icon" src={Currency1} alt="currency-icon" />
										</span>
										Bitcoin
									</label>
								</div>
								<div className="form-check change-lan-sec">
									<input className="form-check-input custom-input" name="language" type="radio" id="language6" />
									<label className="form-check-label custom-lable" htmlFor="language6">
										<span>
											<img className="curr-icon" src={Currency3} alt="currency-icon" />
										</span>
										Ethereum
									</label>
								</div>
								<div className="form-check change-lan-sec">
									<input className="form-check-input custom-input" name="language" type="radio" id="language7" />
									<label className="form-check-label custom-lable" htmlFor="language7">
										<span>
											<img className="curr-icon" src={Currency4} alt="currency-icon" />
										</span>
										Euro
									</label>
								</div>
								<div className="form-check change-lan-sec">
									<input className="form-check-input custom-input" name="language" type="radio" id="language8" />
									<label className="form-check-label custom-lable" htmlFor="language8">
										<span>
											<img className="curr-icon" src={Currency5} alt="currency-icon" />
										</span>
										Pound
									</label>
								</div>
								<div className="form-check change-lan-sec">
									<input className="form-check-input custom-input" name="language" type="radio" id="language9" />
									<label className="form-check-label custom-lable" htmlFor="language9">
										<span>
											<img className="curr-icon" src={Currency6} alt="currency-icon" />
										</span>
										Ruble
									</label>
								</div>
								<div className="form-check change-lan-sec">
									<input className="form-check-input custom-input" name="language" type="radio" id="language10" />
									<label className="form-check-label custom-lable" htmlFor="language10">
										<span>
											<img className="curr-icon" src={Currency7} alt="currency-icon" />
										</span>
										Rupee
									</label>
								</div>
								<div className="form-check change-lan-sec">
									<input className="form-check-input custom-input" name="language" type="radio" id="language11" />
									<label className="form-check-label custom-lable" htmlFor="language11">
										<span>
											<img className="curr-icon" src={Currency8} alt="currency-icon" />
										</span>
										Yen
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

export default Currency
