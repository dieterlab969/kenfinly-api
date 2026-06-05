import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import { Link } from 'react-router-dom';

const Fingerprint: React.FC = () => {
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
                  <p>Set Your Finger Print</p>
                </div>
              </div>
            </div>
          </div>
          <div className="verify-number-bottom">
            <div className="verify-number-bottom-wrap">
              <div className="finger-print-top">
                <div className="add-fingerprint">
                  <h1 className="d-none">Finger print</h1>
                  <p>Add a finger print to make your account more secure.</p>
                </div>
                <div className="scanner_main ">
                  <div className="scan">
                    <div className="fingerprint"></div>
                  </div>
                  <div>
                    <p className="sub-text mt-24">Please put your finger on the finger print scanner to get started.</p>
                  </div>
                </div>
                <div className="finger-print-bottom">
                  <div className="verify-number-btn fingerprint-btn">
                    <Link to="/FaceRecognition">Continue</Link>
                  </div>
                  <div className="skip-txt mt-24">
                    <Link to="/FaceRecognition">Skip, I’ll do this later</Link>
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

export default Fingerprint