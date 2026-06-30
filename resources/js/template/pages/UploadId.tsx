import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import BgIMg from '../assets/images/upload-id/bg-img.png'
import flashlightIcon from '../assets/images/upload-id/flashlight-icon.svg'
import videoIcon from '../assets/images/upload-id/video-icon.svg'
import cameraIcon from '../assets/images/upload-id/camera-icon.svg'
import { Link } from 'react-router-dom';

const UploadId: React.FC = () => {
	return (
		<div>
			<div className="site-content">
				<div className="verify-number-main" id="upload-id-page">
					<div className="verify-number-top">
						<div className="container">
							<div className="verify-number-top-content">
								<div className="back-btn">
									<BackBtn />
								</div>
								<div className="header-title">
									<p>Driver’s License</p>
								</div>
							</div>
						</div>
					</div>
					<div className="upload-id-bottom">
						<div className="frame">
							<img src={BgIMg} alt="Capitol Building" />
							<div className="overlay"></div>
						</div>
						<div className="upload-id-content">
							<div className="upload-top">
								<h1>Front Side of License</h1>
								<p className="mt-8">Position all 4 corners of the front clearly in the frame</p>
							</div>
							<div className="upload-id-button">
								<div className="upload-id-button-content">
									<div className="flash-btn">
										<Link to="#">
											<img src={flashlightIcon} alt="flash-icon" />
										</Link>
									</div>
									<div className="video-icon" id="go-to-step-4">
										<Link to="/Identify">
											<img src={videoIcon} alt="video-icon" />
										</Link>
									</div>
									<div className="flash-btn">
										<Link to="#">
											<img src={cameraIcon} alt="camera-icon" />
										</Link>
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

export default UploadId