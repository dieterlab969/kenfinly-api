import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import ProfileImg from '../assets/images/personal-info/profile-img.png';
import CameraIconImg from '../assets/svg/camera-icon.svg';
import EditIcon from '../assets/svg/edit-icon.svg';
import { Link } from 'react-router-dom';

const PersonalInfo: React.FC = () => {
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
									<p>Personal Info</p>
								</div>
							</div>
						</div>
					</div>
					<div className="verify-number-bottom" id="personal-info">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<h1 className="d-none">Personal Info</h1>
								<div className="personal-info-main">
									<div className="profile-edit-first">
										<div className="profile-edit-img">
											<img src={ProfileImg} alt="profile-img" className="profile-pic" />
											<div className="image-input">
												<input type="file" accept="image/*" id="imageInput" className="file-upload" />
												<label htmlFor="imageInput" className="image-button">
													<img src={CameraIconImg} alt="camera-icon" className="upload-button" />
												</label>
											</div>
										</div>
									</div>
									<form className="personal-info-form mt-24">
										<div className="personal-name">
											<label htmlFor="name">Name</label>
											<input type="text" name="name" id="name" autoComplete="off" />
											<Link to="#">
												<img src={EditIcon} alt="edit-icon" className="custom-icon-edit" />
											</Link>
										</div>
										<div className="personal-name mt-16">
											<label htmlFor="email">Email Address</label>
											<input type="email" name="email" id="email" autoComplete="off" />
											<Link to="#">
												<img src={EditIcon} alt="edit-icon" className="custom-icon-edit" />
											</Link>
										</div>
										<div className="personal-name mt-16">
											<label htmlFor="adddress">Address</label>
											<input type="text" name="adddress" id="adddress" />
											<Link to="#">
												<img src={EditIcon} alt="edit-icon" className="custom-icon-edit" />
											</Link>
										</div>
										<div className="personal-name mt-16">
											<label htmlFor="date-of-birth">Date of Birth</label>
											<input type="text" name="date-of-birth" id="date-of-birth" />
											<Link to="#">
												<img src={EditIcon} alt="edit-icon" className="custom-icon-edit" />
											</Link>
										</div>
										<div className="personal-name mt-16">
											<label htmlFor="gender">Gender</label>
											<input type="text" name="gender" id="gender" />
											<Link to="#">
												<img src={EditIcon} alt="edit-icon" className="custom-icon-edit" />
											</Link>
										</div>
									</form>
								</div>
								<div className="verify-number-btn"><Link to="/Home">Update Changes</Link></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
export default PersonalInfo