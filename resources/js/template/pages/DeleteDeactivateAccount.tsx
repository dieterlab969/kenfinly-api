import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BackBtn from '../components/BackBtn.tsx';
import { useTranslation } from 'react-i18next';

const DeleteDeactivateAccount: React.FC = () => {
	const [action, setAction] = useState("");
	const navigate = useNavigate();
	const { t } = useTranslation();

	const continueAction = (e) => {
		e.preventDefault();

		if (action === "delete") {
			navigate("/DeleteAccount");
		} else if (action === "deactivate") {
			navigate("/DeactiveAccount");
		} else {
			alert(t("Please select an option first."));
		}
	};


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
									<p>{t('Delete or Deactivate')}</p>
								</div>
							</div>
						</div>
					</div>

					<div className="verify-number-bottom" id="delete-deactivate-main">
						<div className="verify-number-bottom-wrap">
							<div className="verify-number-content">
								<h1 className="d-none">Delete or Deactivate</h1>

								<div className="delete-deactivate-content">
									<div className="delete-content">
										<p>
											{t("If you want to leave Kenfinly temporarily, simply deactivate your account. If you choose to delete your account instead, you won't be able to recover it after 30 days.")}
										</p>
									</div>

									{/* Form */}
									<form>
										<div
											className={`form-check px-0 custom-radio mt-24 ${action === "deactivate" ? "active" : ""
												}`}
										>
											<input
												className="form-check-input"
												type="radio"
												name="action"
												id="shipping1"
												value="deactivate"
												checked={action === "deactivate"}
												onChange={(e) => setAction(e.target.value)}
											/>
											<label
												className="form-check-label checkout-modal-lbl pt-0 pb-0"
												htmlFor="shipping1"
											>
												{t('Deactivate Account')}
												<span className="mt-8">
													{t('No one can see your account, including all content that is stored in it. Reactivate your account and recover all content anytime.')}
												</span>
											</label>
										</div>

										<div
											className={`form-check px-0 custom-radio mt-16 ${action === "delete" ? "active" : ""
												}`}
										>
											<input
												className="form-check-input"
												type="radio"
												name="action"
												id="shipping2"
												value="delete"
												checked={action === "delete"}
												onChange={(e) => setAction(e.target.value)}
											/>
											<label
												className="form-check-label checkout-modal-lbl pt-0 pb-0"
												htmlFor="shipping2"
											>
												{t('Delete Account Permanently')}
												<span className="mt-8">
													{t('Your account and content will be deleted permanently. You may cancel the deletion request by reactivating your account within 30 days.')}
												</span>
											</label>
										</div>
									</form>
								</div>

								{/* Continue Button */}
								<div className="verify-number-btn">
									<Link to="#" onClick={continueAction}>
										{t('Continue')}
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

export default DeleteDeactivateAccount
