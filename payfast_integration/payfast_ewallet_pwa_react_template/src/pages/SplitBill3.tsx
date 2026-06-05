import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import Friend1 from '../assets/images/invite-friend/friend1.png'
import Friend2 from '../assets/images/invite-friend/friend2.png'
import Friend3 from '../assets/images/invite-friend/friend3.png'
import Friend5 from '../assets/images/invite-friend/friend5.png'
import Friend6 from '../assets/images/invite-friend/friend6.png'
import Friend7 from '../assets/images/invite-friend/friend7.png'
import EditIcon from '../assets/svg/edit-icon.svg'
import spiltCancelIcon from '../assets/svg/spilt-cancel-icon.svg'
import { Link } from 'react-router-dom'

const SplitBill3: React.FC = () => {
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
									<p>Split USD $630</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="spilt5-main">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<h1 className="d-none">Spilt Bill</h1>
								<h2 className="d-none">Hidden</h2>
								<div className="split3-screen-wrap">
									<div className="split3-screen-content">
										<div className="contact-profile">
											<img src={Friend2} alt="friend-img" />
										</div>
										<div className="contact-details">
											<h3>You</h3>
											<h4>$105.00</h4>
										</div>
										<div className="split3-edit">
											<Link to="/SplitBill4"><span>
												<img className='spilt3-editIcon' src={EditIcon} alt="edit-icon" /></span>
											</Link>
											<span><img src={spiltCancelIcon} alt="spilt-cancel-icon" /></span>
										</div>
									</div>
									<div className="split3-screen-content mt-16">
										<div className="contact-profile">
											<img src={Friend1} alt="friend-img" />
										</div>
										<div className="contact-details">
											<h3>Aayan Smith</h3>
											<h4>$105.00</h4>
										</div>
										<div className="split3-edit">
											<Link to="/SplitBill4"><span>
												<img className='spilt3-editIcon' src={EditIcon} alt="edit-icon" /></span>
											</Link>
											<span><img src={spiltCancelIcon} alt="spilt-cancel-icon" /></span>
										</div>
									</div>
									<div className="split3-screen-content mt-16">
										<div className="contact-profile">
											<img src={Friend3} alt="friend-img" />
										</div>
										<div className="contact-details">
											<h3>Alan Williamson</h3>
											<h4>$105.00</h4>
										</div>
										<div className="split3-edit">
											<Link to="/SplitBill4"><span>
												<img className='spilt3-editIcon' src={EditIcon} alt="edit-icon" /></span>
											</Link>
											<span><img src={spiltCancelIcon} alt="spilt-cancel-icon" /></span>
										</div>
									</div>
									<div className="split3-screen-content mt-16">
										<div className="contact-profile">
											<img src={Friend5} alt="friend-img" />
										</div>
										<div className="contact-details">
											<h3>Alyassa Russel</h3>
											<h4>$105.00</h4>
										</div>
										<div className="split3-edit">
											<Link to="/SplitBill4"><span>
												<img className='spilt3-editIcon' src={EditIcon} alt="edit-icon" /></span>
											</Link>
											<span><img src={spiltCancelIcon} alt="spilt-cancel-icon" /></span>
										</div>
									</div>
									<div className="split3-screen-content mt-16">
										<div className="contact-profile">
											<img src={Friend6} alt="friend-img" />
										</div>
										<div className="contact-details">
											<h3>Anthony Robetson</h3>
											<h4>$105.00</h4>
										</div>
										<div className="split3-edit">
											<Link to="/SplitBill4"><span>
												<img className='spilt3-editIcon' src={EditIcon} alt="edit-icon" /></span>
											</Link>
											<span><img src={spiltCancelIcon} alt="spilt-cancel-icon" /></span>
										</div>
									</div>
									<div className="split3-screen-content mt-16">
										<div className="contact-profile">
											<img src={Friend7} alt="friend-img" />
										</div>
										<div className="contact-details">
											<h3>Arianna Cooper</h3>
											<h4>$105.00</h4>
										</div>
										<div className="split3-edit">
											<Link to="/SplitBill4"><span>
												<img className='spilt3-editIcon' src={EditIcon} alt="edit-icon" /></span>
											</Link>
											<span><img src={spiltCancelIcon} alt="spilt-cancel-icon" /></span>
										</div>
									</div>
								</div>
							</div>
							<div className="verify-number-btn split3-btn"><Link to="/SplitBill5">Review</Link></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default SplitBill3