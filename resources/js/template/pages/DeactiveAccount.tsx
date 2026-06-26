import React from 'react'
import BackBtn from '../components/BackBtn.tsx';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const DeactiveAccount: React.FC = () => {
	const { t } = useTranslation();
	return (
		<div className="site-content">
			<div className="verify-number-main">
				<div className="verify-number-top">
					<div className="container">
						<div className="verify-number-top-content">
							<div className="back-btn">
								<BackBtn />
							</div>
							<div className="header-title">
								<p>{t('Deactivate Account')}</p>
							</div>
						</div>
					</div>
				</div>
				<div className="verify-number-bottom" id="deactive-main">
					<div className="verify-number-bottom-wrap">
						<div className="verify-number-content">
							<div className="deactive-account-sec">
								<h1>Jessica Smith: {t('Deactivate this account?')}</h1>
								<div className="deactivate-step mt-16">
									<p>{t('If you deactivate your account:')}</p>
									<ul className="deactivate-step-list mt-12">
										<li className="pt-0">{t('No one will see your account and content.')}</li>
										<li>{t("Information that isn't stored in your account.")}</li>
										<li>{t('Kenfinly will continue to keep your data so that you can recover it when you reactivate your account.')}</li>
										<li>{t('You can reactivate your account and recover all content anytime by using the same login details.')}</li>
									</ul>
								</div>
								<div className="verify-number-btn"><Link to="#">{t('Deactivate')}</Link></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default DeactiveAccount
