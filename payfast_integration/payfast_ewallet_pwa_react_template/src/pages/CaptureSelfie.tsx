import React from 'react'
import SelfieBg from '../assets/images/upload-id/selfie-bg.png';
import flashlightIcon from '../assets/images/upload-id/flashlight-icon.svg';
import videoIcon from '../assets/images/upload-id/video-icon.svg';
import cameraIcon from '../assets/images/upload-id/camera-icon.svg';
import { Link } from 'react-router-dom';
import BackBtn from '../components/BackBtn.tsx';

const CaptureSelfie: React.FC = () =>{
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
									<p>Selfie</p>
								</div>
							</div>
						</div>
					</div>
					<div className="upload-id-bottom">
						<div className="frame">
							<img src={SelfieBg} alt="Capitol Building" />
							<div className="overlay selfie-overlay"></div>
						</div>
						<div className="upload-id-content">
							<div className="upload-top">
								<h1>Center Your Face</h1>
								<p className="mt-8">Align your face to the center of the selfie area and then take a photo</p>
							</div>
							<div className="upload-id-button">
								<div className="upload-id-button-content">
									<div className="flash-btn">
										<Link to="#">
											<img src={flashlightIcon} alt="flash-icon" />
										</Link>
									</div>
									<div className="video-icon">
										<Link to="/Identify"><img src={videoIcon} alt="video-icon" /></Link>
									</div>
									<div className="flash-btn">
										<Link to="#"><img src={cameraIcon} alt="camera-icon" /></Link>
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

export default CaptureSelfie