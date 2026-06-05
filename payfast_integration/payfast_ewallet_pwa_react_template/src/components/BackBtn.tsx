import React from 'react'
import BackBtnIcon from '../assets/svg/backBtn.svg'
import { useNavigate, Link } from 'react-router-dom';

const BackBtn: React.FC = () => {
    const navigate = useNavigate();

    const handleGoBack = () => {
        navigate(-1);
    };
    return (
        <div>
            <Link to="#" onClick={handleGoBack}>
                <img src={BackBtnIcon} alt="back-btn" />
            </Link>
        </div>
    )
}

export default BackBtn