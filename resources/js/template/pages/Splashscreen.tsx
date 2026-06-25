import React, { useEffect, useState } from "react";
import logo from '../assets/images/splashscreen/logo.png'
import onboarding1 from '../assets/images/main-img/onboarding1-img.png'
import onboarding2 from '../assets/images/main-img/onboarding2-img.png'
import onboarding3 from '../assets/images/main-img/onboarding3-img.png'
import { Link } from 'react-router-dom';


const Splashscreen: React.FC = () => {
        // Loader Mask
        const [showSplash, setShowSplash] = useState(true);
        useEffect(() => {
                const splashTimer = setTimeout(() => {
                        setShowSplash(false);
                }, 500 + 1000);
                return () => clearTimeout(splashTimer);
        }, []);

        // Splash Slider Data And Code
        const slides = [
                {
                        id: 1,
                        image: onboarding1,
                        title: 'Streamlining Online Payments Process',
                        description: 'Odio venenatis egestas dignissim ante duis amet mauris nunc mauris.',
                },
                {
                        id: 2,
                        image: onboarding2,
                        title: 'Safe & Reliable Anytime. Anywhere.',
                        description: 'Elevate Your Transaction Experience with Absolute Security and Dependability',
                },
                {
                        id: 3,
                        image: onboarding3,
                        title: 'Let’s Manage Your Financials Now!',
                        description: 'Sollicitudin nibh id aliquam at a non. Facilisis convallis sed ultrices fermentum.',
                },
        ];

        const [activeSlide, setActiveSlide] = useState(0);

        const nextSlide = () => {
                if (activeSlide < slides.length - 1) {
                        setActiveSlide(activeSlide + 1);
                }
        };

        const goToSlide = (index) => {
                setActiveSlide(index);
        };

        return (
                <div>
                        <div className="site-content">
                                {/* <!-- Splash screen start --> */}
                                {showSplash && (
                                        <div className="loader-mask-splash">
                                                <div id="splash-screen-page">
                                                        <div className="splash-screen-content">
                                                                <img className="logo_img" src={logo} alt="logo" />
                                                                <h1 className="payfast-txt mt-16"><span>Ken</span>Finly</h1>
                                                                <p className="payfast-title mt-16">Every transaction matters</p>
                                                        </div>
                                                </div>
                                        </div>
                                )}
                                {/* <!-- Onboarding screen start --> */}
                                <div className="splash-slider">
                                        <div className="container">
                                                <div className="onboarding-slider">
                                                        <div className="carousel-inner">
                                                                {slides.map((slide, index) => (
                                                                        <div
                                                                                key={slide.id}
                                                                                className="Onboarding-Screen-1"
                                                                                style={{ display: index === activeSlide ? 'block' : 'none' }}
                                                                        >
                                                                                <div className={`slide${index + 1}`}>
                                                                                        <div className="slider-content">
                                                                                                <div className="slider-img">
                                                                                                        <img src={slide.image} alt="onboarding-img" />
                                                                                                </div>
                                                                                                <div className="slider-txt">
                                                                                                        <h2>{slide.title}</h2>
                                                                                                        <p className="mt-16">{slide.description}</p>
                                                                                                </div>
                                                                                                <div className="slider-btn">
                                                                                                        <div className="slider-sec-btn next-btn">
                                                                                                                {index < slides.length - 1 ? (
                                                                                                                        <Link to="#" onClick={nextSlide} className="w-100">
                                                                                                                                Next
                                                                                                                        </Link>
                                                                                                                ) : (
                                                                                                                        <Link to="/SignIn" className="w-100">
                                                                                                                                Get started
                                                                                                                        </Link>
                                                                                                                )}
                                                                                                        </div>
                                                                                                </div>
                                                                                        </div>
                                                                                </div>
                                                                        </div>
                                                                ))}
                                                        </div>
                                                        {/* Dots/Indicators */}
                                                        <div className="carousel-indicators custom-slider-btn">
                                                                {slides.map((_, index) => (
                                                                        <button
                                                                                key={index}
                                                                                type="button"
                                                                                onClick={() => goToSlide(index)}
                                                                                className={`custom-slider-dots ${index === activeSlide ? 'active' : ''}`}
                                                                        />
                                                                ))}
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        </div>
                </div>
        )
}

export default Splashscreen