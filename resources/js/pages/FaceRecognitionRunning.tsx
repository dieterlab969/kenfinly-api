import React, { useEffect, useState, useRef } from 'react';
import BackBtn from '../components/BackBtn.tsx';
import SelfiBg from '../assets/images/upload-id/selfie-bg.png'
import faceRecSuccesImg from '../assets/images/main-img/face-recognition-successfull-img.png'
import { useNavigate } from 'react-router-dom';
import { Offcanvas } from 'bootstrap';


const FaceRecognitionRunning: React.FC = () => {

	const [load, setLoad] = useState(0);
	const offcanvasRef = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();

	useEffect(() => {
		let progress = 0;
		const intervalTime = 50;
		const timeoutTime = 400;

		const interval = setInterval(() => {
			if (progress <= 100) {
				setLoad(progress++);
			} else {
				clearInterval(interval);

				setTimeout(() => {
					if (offcanvasRef.current) {
						const bsOffcanvas = new Offcanvas(offcanvasRef.current);
						bsOffcanvas.show();
					}
					setTimeout(() => {
						navigate('/Home');
					}, 2000);
				}, timeoutTime);
			}
		}, intervalTime);

		return () => clearInterval(interval);
	}, [navigate]);

	return (
		<div>
			<div className="site-content">
				{/* Face recognition screen content */}
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
							<img src={SelfiBg} alt="Selfie background" />
							<div className="overlay selfie-overlay"></div>
						</div>
						<div className="upload-id-content">
							<div className="upload-top">
								<h1>Center Your Face</h1>
								<p className="mt-8">Enable Face ID to let you log in & proceed with your transactions faster</p>
							</div>
							<div className="loader-content">
								<span id="loader">{load} %</span>
								<p className="verify-txt">Verifying your face...</p>
							</div>
						</div>
					</div>
				</div>

				{/* Offcanvas modal */}
				<div className="offcanvas offcanvas-bottom face-main" id="offcanvasBottom" ref={offcanvasRef}>
					<div className="offcanvas-body p-0">
						<div className="finger-print-modal-popup">
							<div className="finger-img-sec">
								<img src={faceRecSuccesImg} alt="Congratulation-img" />
							</div>
							<div className="finger-content-sec mt-32">
								<h2>Successful!</h2>
								<p className="mt-16">Please wait a moment, we are preparing for you.</p>
								<div className="loaders mt-32">
									<div className="sk-fading-circle">
										{Array.from({ length: 12 }).map((_, i) => (
											<div key={i} className={`sk-circle${i + 1} sk-circle`}></div>
										))}
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

export default FaceRecognitionRunning