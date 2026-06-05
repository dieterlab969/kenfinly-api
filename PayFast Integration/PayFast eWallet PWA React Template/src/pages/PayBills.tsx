import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import BillImg1 from '../assets/images/paybill/bill-1.svg'
import BillImg2 from '../assets/images/paybill/bill-2.svg'
import BillImg3 from '../assets/images/paybill/bill-3.svg'
import BillImg4 from '../assets/images/paybill/bill-4.svg'
import BillImg5 from '../assets/images/paybill/bill-5.svg'
import BillImg6 from '../assets/images/paybill/bill-6.svg'
import BillImg7 from '../assets/images/paybill/bill-7.svg'
import BillImg8 from '../assets/images/paybill/bill-8.svg'
import BillImg9 from '../assets/images/paybill/bill-9.svg'
import BillImg10 from '../assets/images/paybill/bill-10.svg'
import BillImg11 from '../assets/images/paybill/bill-11.svg'
import BillImg12 from '../assets/images/paybill/bill-12.svg'
import BillImg13 from '../assets/images/paybill/bill-13.svg'
import BillImg14 from '../assets/images/paybill/bill-14.svg'
import BillImg15 from '../assets/images/paybill/bill-15.svg'
import BillImg16 from '../assets/images/paybill/bill-16.svg'
import { Link } from 'react-router-dom';


const PayBills: React.FC = () => {
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
									<p>Pay Bills</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="pay-bill">
						<div className="verify-number-bottom-wrap">
							<h1 className="d-none">Pay Bills</h1>
							<div className="pay-bill-sec">
								<Link to="/Electricitybill1">
									<div className="pay-bill-content">
										<div className="pay-bill-img bg-1">
											<img src={BillImg1} alt="pay-bills" />
										</div>
										<p className="pay-bill-name">Electricity</p>
									</div>
								</Link>
								<Link to="/Internetbill1">
									<div className="pay-bill-content">
										<div className="pay-bill-img bg-2">
											<img src={BillImg2} alt="pay-bills" />
										</div>
										<p className="pay-bill-name">Internet</p>
									</div>
								</Link>
								<Link to="/Waterbill1">
									<div className="pay-bill-content">
										<div className="pay-bill-img bg-3">
											<img src={BillImg3} alt="pay-bills" />
										</div>
										<p className="pay-bill-name">Water</p>
									</div>
								</Link>
								<Link to="/Ewallet1">
									<div className="pay-bill-content">
										<div className="pay-bill-img bg-4">
											<img src={BillImg4} alt="pay-bills" />
										</div>
										<p className="pay-bill-name">E-Wallet</p>
									</div>
								</Link>
								<Link to="/Mobile1">
									<div className="pay-bill-content">
										<div className="pay-bill-img bg-5">
											<img src={BillImg5} alt="pay-bills" />
										</div>
										<p className="pay-bill-name">Mobile</p>
									</div>
								</Link>
								<Link to="/Tax1">
									<div className="pay-bill-content">
										<div className="pay-bill-img bg-6">
											<img src={BillImg6} alt="pay-bills" />
										</div>
										<p className="pay-bill-name">Tax</p>
									</div>
								</Link>
								<Link to="/Health1">
									<div className="pay-bill-content">
										<div className="pay-bill-img bg-7">
											<img src={BillImg7} alt="pay-bills" />
										</div>
										<p className="pay-bill-name">Health</p>
									</div>
								</Link>
								<Link to="/Merchant1">
									<div className="pay-bill-content">
										<div className="pay-bill-img bg-8">
											<img src={BillImg8} alt="pay-bills" />
										</div>
										<p className="pay-bill-name">Merchant</p>
									</div>
								</Link>
								<Link to="/Television1">
									<div className="pay-bill-content">
										<div className="pay-bill-img bg-9">
											<img src={BillImg9} alt="pay-bills" />
										</div>
										<p className="pay-bill-name">Television</p>
									</div>
								</Link>
								<Link to="/Mutalfund1">
									<div className="pay-bill-content">
										<div className="pay-bill-img bg-10">
											<img src={BillImg10} alt="pay-bills" />
										</div>
										<p className="pay-bill-name">Mutual Funds</p>
									</div>
								</Link>
								<Link to="/Stock1">
									<div className="pay-bill-content">
										<div className="pay-bill-img bg-11">
											<img src={BillImg11} alt="pay-bills" />
										</div>
										<p className="pay-bill-name">Stocks</p>
									</div>
								</Link>
								<Link to="/CreditCard1">
									<div className="pay-bill-content">
										<div className="pay-bill-img bg-12">
											<img src={BillImg12} alt="pay-bills" />
										</div>
										<p className="pay-bill-name">Credit Card</p>
									</div>
								</Link>
								<Link to="/Motor1">
									<div className="pay-bill-content">
										<div className="pay-bill-img bg-13">
											<img src={BillImg13} alt="pay-bills" />
										</div>
										<p className="pay-bill-name">Motor</p>
									</div>
								</Link>
								<Link to="/Car1">
									<div className="pay-bill-content">
										<div className="pay-bill-img bg-14">
											<img src={BillImg14} alt="pay-bills" />
										</div>
										<p className="pay-bill-name">Car</p>
									</div>
								</Link>
								<Link to="/Food1">
									<div className="pay-bill-content">
										<div className="pay-bill-img bg-15">
											<img src={BillImg15} alt="pay-bills" />
										</div>
										<p className="pay-bill-name">Food</p>
									</div>
								</Link>
								<Link to="/ScanQRCode">
									<div className="pay-bill-content">
										<div className="pay-bill-img bg-16">
											<img src={BillImg16} alt="pay-bills" />
										</div>
										<p className="pay-bill-name">Pay via QR</p>
									</div>
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default PayBills