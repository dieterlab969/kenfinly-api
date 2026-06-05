import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import ScanMode from '../assets/images/finger-print/scan-code.png'
import flashlightIcon from '../assets/images/upload-id/flashlight-icon.svg'
import ScannerIcon from '../assets/images/upload-id/scanner-icon.svg'
import CameraIcon from '../assets/images/upload-id/camera-icon.svg'
import { Link } from 'react-router-dom'
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ScanQrCode: React.FC = () => {

  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/QrcodePayment');
    }, 4000);

    return () => clearTimeout(timer);
  }, [navigate]);


  return (
    <div>
      <div className="verify-number-main" id="upload-id-page">
        <div className="verify-number-top">
          <div className="container">
            <div className="verify-number-top-content">
              <div className="back-btn">
                <BackBtn />
              </div>
              <div className="header-title">
                <p>Scan QR Code</p>
              </div>
            </div>
          </div>
        </div>
        <div className="upload-id-bottom">
          <h1 className="d-none">Hidden</h1>
          <div className="frame">
            <img src={ScanMode} alt="Capitol Building" />
            <div className="overlay1"></div>
          </div>
          <div className="upload-id-content">
            <div className="upload-top">
              <p className="mt-8">Point the camera box at the QR Code to scan</p>
            </div>
            <div className="scan1">
              <div className="fingerprint1"></div>
            </div>
            <div className="upload-id-button">
              <div className="upload-id-button-content">
                <div className="flash-btn">
                  <Link to="#">
                    <img src={flashlightIcon} alt="flash-icon" />
                  </Link>
                </div>
                <div className="video-icon" id="go-to-step-4">
                  <Link to="#">
                    <img src={ScannerIcon} alt="scanner-icon" />
                  </Link>
                </div>
                <div className="flash-btn">
                  <Link to="#">
                    <img src={CameraIcon} alt="camera-icon" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScanQrCode

