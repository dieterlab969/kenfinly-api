import React from 'react'
import DynamicLogo from '../components/DynamicLogo'
import FbIcon from '../assets/svg/fb-icon.svg'
import GoogleIcon from '../assets/svg/google-icon.svg'
import AppleIcon from '../assets/svg/apple-icon.svg'
import WhatsappIcon from '../assets/svg/whatsapp-icon.svg'
import { Link } from 'react-router-dom';
import BackBtn from '../components/BackBtn.tsx';


const LetYouScreen: React.FC = () => {

        return (
                <div>
                        <div className="site-content">
                                {/* <!-- Let you screen content start --> */}
                                <div className="let-you-page-main">
                                        <div className="let-you-top">
                                                <div className="container">
                                                        <div className="let-you-top-wrap">
                                                                <header className="back-btn">
                                                                        <BackBtn />
                                                                </header>
                                                                <div className="payfast-img_main">
                                                                        <DynamicLogo />
                                                                </div>
                                                        </div>
                                                </div>
                                        </div>
                                        <div className="let-you-social-sec" id="let-you-main">
                                                <div className="lets_you_in_box">
                                                        <h1 className="d-none">hidden</h1>
                                                        <h2 className="lets_you_in_text">Let’s You In</h2>
                                                        <div className="icons_main mt-32">
                                                                <a href="https://www.facebook.com" target="_blank" rel='noreferrer'>
                                                                        <img src={FbIcon} alt="Icon-fb" />
                                                                </a>
                                                                <a href="https://www.google.com" target="_blank" rel='noreferrer'>
                                                                        <img src={GoogleIcon} alt="Icon-google" />
                                                                </a>
                                                                <a href="https://www.icloud.com" target="_blank" rel='noreferrer'>
                                                                        <img className="apple" src={AppleIcon} alt="Icon-apple" />
                                                                </a>
                                                                <a href="https://wa.me/+12345678899" target="_blank" rel='noreferrer'>
                                                                        <img src={WhatsappIcon} alt="Icon-whatsapp" />
                                                                </a>
                                                        </div>
                                                        <div className="or-section mt-32">
                                                                <p>or</p>
                                                        </div>
                                                        <div className="form-sign-in-password-btn mt-32">
                                                                <Link to="/SignIn">Sign In With Mobile </Link>
                                                        </div>
                                                </div>
                                        </div>
                                        <footer id="let-you-footer">
                                                <div className="block-footer">
                                                        <p>Don’t have an account? <Link to="/SignUp">Sign up</Link></p>
                                                </div>
                                        </footer>
                                </div>
                        </div>
                </div>
        )
}

export default LetYouScreen