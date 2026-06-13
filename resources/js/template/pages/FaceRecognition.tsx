import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import FaceIcon from '../assets/images/finger-print/face-icon.png'
import { Link } from 'react-router-dom';

const FaceRecognition: React.FC = () => {
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
                  <p>Face Recognition</p>
                </div>
              </div>
            </div>
          </div>
          <div className="verify-number-bottom">
            <div className="verify-number-bottom-wrap">
              <div className="finger-print-top">
                <div className="add-fingerprint">
                  <h1 className="d-none">Finger print</h1>
                  <p>Enable Face ID to let you log in & proceed with your transactions faster</p>
                </div>
                <div className="circles">
                  <div className="concentric-circles">
                    <div className="circle outer"></div>
                    <div className="circle middle"></div>
                    <div className="circle inner">
                      <img src={FaceIcon} alt="User Icon" />
                    </div>
                  </div>
                </div>
                <div className="finger-print-bottom">
                  <div className="verify-number-btn fingerprint-btn">
                    <Link to="/FaceRecognitionRunning">Enable Face ID</Link>
                  </div>
                  <div className="skip-txt mt-24">
                    <Link to="/FaceRecognitionRunning">Skip, I’ll do this later</Link>
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

export default FaceRecognition