import './App.css';
import './assets/css/swap.css';
import './assets/css/bootstrap.min.css';
import './assets/css/style.css';
import './assets/css/media-query.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Splashscreen from "./pages/Splashscreen.tsx";
import Loader from "./components/Loader.tsx";
import LetYouScreen from "./pages/LetYouScreen.tsx";
import SignIn from './pages/SignIn.tsx';
import SignUp from './pages/SignUp.tsx';
import Home from './pages/Home.tsx';
import VerifyPhoneNumber from './pages/VerifyPhoneNumber.tsx';
import NotificationAllow from './pages/NotificationAllow.tsx';
import Notification from './pages/Notification.tsx';
import PersonalInfoSlider from './pages/PersonalInfoSlider.tsx';
import UploadId from './pages/UploadId.tsx';
import Identify from './pages/Identify.tsx';
import ReasonUsingPayfast from './pages/ReasonUsingPayfast.tsx';
import CaptureSelfie from './pages/CaptureSelfie.tsx';
import CreateNewPin from './pages/CreateNewPin.tsx';
import Fingerprint from './pages/Fingerprint.tsx';
import FaceRecognition from './pages/FaceRecognition.tsx';
import FaceRecognitionRunning from './pages/FaceRecognitionRunning.tsx';
import ForgetPassword from './pages/ForgetPassword.tsx';
import ConfirmOtp from './pages/ConfirmOtp.tsx';
import CreateNewPassword from './pages/CreateNewPassword.tsx';
import SendMoneyContact from './pages/SendMoneyContact.tsx';
import SendMoney1 from './pages/SendMoney1.tsx';
import SendMoney4 from './pages/SendMoney4.tsx';
import SendMoneyReview from './pages/SendMoneyReview.tsx';
import SendMoneySuccessful from './pages/SendMoneySuccessful.tsx';
import RequestMoneyContact from './pages/RequestMoneyContact.tsx';
import RequestMoney1 from './pages/RequestMoney1.tsx';
import RequestMoney3 from './pages/RequestMoney3.tsx';
import ScanQrCode from './pages/ScanQrCode.tsx';
import QrcodePayment from './pages/QrcodePayment.tsx';
import TransferBank1 from './pages/TransferBank1.tsx';
import TransferBank2 from './pages/TransferBank2.tsx';
import TransferBankReview from './pages/TransferBankReview.tsx';
import TransferBankSuccess from './pages/TransferBankSuccess.tsx';
import SendInvoice1 from './pages/SendInvoice1.tsx';
import SendInvoice2 from './pages/SendInvoice2.tsx';
import PayBills from './pages/PayBills.tsx';
import Electricitybill1 from './pages/Electricitybill1.tsx';
import Electricitybill2 from './pages/Electricitybill2.tsx';
import BillPaid from './pages/BillPaid.tsx';
import Internetbill1 from './pages/Internetbill1.tsx';
import Internetbill2 from './pages/Internetbill2.tsx';
import Waterbill1 from './pages/Waterbill1.tsx';
import Waterbill2 from './pages/Waterbill2.tsx';
import Ewallet1 from './pages/Ewallet1.tsx';
import Ewallet2 from './pages/Ewallet2.tsx';
import Mobile1 from './pages/Mobile1.tsx';
import Mobile2 from './pages/Mobile2.tsx';
import Tax1 from './pages/Tax1.tsx';
import Tax2 from './pages/Tax2.tsx';
import Health1 from './pages/Health1.tsx';
import Health2 from './pages/Health2.tsx';
import Merchant1 from './pages/Merchant1.tsx';
import Merchant2 from './pages/Merchant2.tsx';
import Television1 from './pages/Television1.tsx';
import Television2 from './pages/Television2.tsx';
import MutalFund1 from './pages/MutalFund1.tsx';
import MutalFund2 from './pages/MutalFund2.tsx';
import Stock1 from './pages/Stock1.tsx';
import Stock2 from './pages/Stock2.tsx';
import CreditCard1 from './pages/CreditCard1.tsx';
import CreditCard2 from './pages/CreditCard2.tsx';
import Motor1 from './pages/Motor1.tsx';
import Motor2 from './pages/Motor2.tsx';
import Car1 from './pages/Car1.tsx';
import Car2 from './pages/Car2.tsx';
import Food1 from './pages/Food1.tsx';
import Food2 from './pages/Food2.tsx';
import SplitBill1 from './pages/SplitBill1.tsx';
import SplitBill2 from './pages/SplitBill2.tsx';
import SplitBill3 from './pages/SplitBill3.tsx';
import SplitBill4 from './pages/SplitBill4.tsx';
import SplitBill5 from './pages/SplitBill5.tsx';
import SplitBill6 from './pages/SplitBill6.tsx';
import SplitBill7 from './pages/SplitBill7.tsx';
import Activity from './pages/Activity.tsx';
import PreapprovedPayment1 from './pages/PreapprovedPayment1.tsx';
import PreapprovedPaymentRefund from './pages/PreapprovedPaymentRefund.tsx';
import PreapprovedPaymentPartial from './pages/PreapprovedPaymentPartial.tsx';
import Tracking1 from './pages/Tracking1.tsx';
import Tracking2 from './pages/Tracking2.tsx';
import SendMoney from './pages/SendMoney.tsx';
import RequestPayment from './pages/RequestPayment.tsx';
import AreaChart from './pages/AreaChart.tsx'
import BarChart from './pages/BarChart.tsx';
import PieChart from './pages/PieChart.tsx';
import LineChart from './pages/LineChart.tsx';
import Invoicing from './pages/Invoicing.tsx';
import NewInvoice from './pages/NewInvoice.tsx';
import OldInvoice from './pages/OldInvoice.tsx';
import MyItem from './pages/MyItem.tsx';
import AddNewItem from './pages/AddNewItem.tsx';
import Taxes from './pages/Taxes.tsx';
import AddTaxes from './pages/AddTaxes.tsx';
import AllContact from './pages/AllContact.tsx';
import ShareInvoice from './pages/ShareInvoice.tsx';
import GenerateQrCode from './pages/GenerateQrCode.tsx';
import SaveAsDraft from './pages/SaveAsDraft.tsx';
import CustomerScreen from './pages/CustomerScreen.tsx';
import BankAndCard from './pages/BankAndCard.tsx';
import ContactUs from './pages/ContactUs.tsx';
import Subscription from './pages/Subscription.tsx';
import Security from './pages/Security.tsx';
import AboutUs from './pages/AboutUs.tsx';
import AutomaticPayment from './pages/AutomaticPayment.tsx';
import Currency from './pages/Currency.tsx';
import Language from './pages/Language.tsx';
import MarketingScreen from './pages/MarketingScreen.tsx';
import EmptyNotification from './pages/EmptyNotification.tsx';
import DataPrivacy from './pages/DataPrivacy.tsx';
import Feedback from './pages/Feedback.tsx';
import Payment from './pages/Payment.tsx';
import NotificationSetting from './pages/NotificationSetting.tsx';
import AddNewCard from './pages/AddNewCard.tsx';
import DeactiveAccount from './pages/DeactiveAccount.tsx';
import DeleteAccount from './pages/DeleteAccount.tsx';
import DeleteDeactivateAccount from './pages/DeleteDeactivateAccount.tsx';
import InviteFriend from './pages/InviteFriend.tsx';
import PersonalInfo from './pages/PersonalInfo.tsx';



function App() {
  return (
    <BrowserRouter>
      <Loader />
      <Routes>
        <Route path="/" element={<Splashscreen />} />
        <Route path="/LetYouScreen" element={<LetYouScreen />} />
        <Route path="/SignIn" element={<SignIn />} />
        <Route path="/SignUp" element={<SignUp />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/VerifyPhoneNumber" element={<VerifyPhoneNumber />} />
        <Route path="/NotificationAllow" element={<NotificationAllow />} />
        <Route path="/Notification" element={<Notification />} />
        <Route path="/PersonalInfoSlider" element={<PersonalInfoSlider />} />
        <Route path="/UploadId" element={<UploadId />} />
        <Route path="/Identify" element={<Identify />} />
        <Route path="/ReasonUsingPayfast" element={<ReasonUsingPayfast />} />
        <Route path="/CaptureSelfie" element={<CaptureSelfie />} />
        <Route path="/CreateNewPin" element={<CreateNewPin />} />
        <Route path="/Fingerprint" element={<Fingerprint />} />
        <Route path="/FaceRecognition" element={<FaceRecognition />} />
        <Route path="/FaceRecognitionRunning" element={<FaceRecognitionRunning />} />
        <Route path="/ForgetPassword" element={<ForgetPassword />} />
        <Route path="/ConfirmOtp" element={<ConfirmOtp />} />
        <Route path="/CreateNewPassword" element={<CreateNewPassword />} />
        <Route path="/SendMoneyContact" element={<SendMoneyContact />} />
        <Route path="/SendMoney1" element={<SendMoney1 />} />
        <Route path="/SendMoney4" element={<SendMoney4 />} />
        <Route path="/SendMoneyReview" element={<SendMoneyReview />} />
        <Route path="/SendMoneySuccessful" element={<SendMoneySuccessful />} />
        <Route path="/RequestMoneyContact" element={<RequestMoneyContact />} />
        <Route path="/RequestMoney1" element={<RequestMoney1 />} />
        <Route path="/RequestMoney3" element={<RequestMoney3 />} />
        <Route path="/ScanQrCode" element={<ScanQrCode />} />
        <Route path="/QrcodePayment" element={<QrcodePayment />} />
        <Route path="/TransferBank1" element={<TransferBank1 />} />
        <Route path="/TransferBank2" element={<TransferBank2 />} />
        <Route path="/TransferBankReview" element={<TransferBankReview />} />
        <Route path="/TransferBankSuccess" element={<TransferBankSuccess />} />
        <Route path="/SendInvoice1" element={<SendInvoice1 />} />
        <Route path="/SendInvoice2" element={<SendInvoice2 />} />
        <Route path="/PayBills" element={<PayBills />} />
        <Route path="/Electricitybill1" element={<Electricitybill1 />} />
        <Route path="/Electricitybill2" element={<Electricitybill2 />} />
        <Route path="/BillPaid" element={<BillPaid />} />
        <Route path="/Internetbill1" element={<Internetbill1 />} />
        <Route path="/Internetbill2" element={<Internetbill2 />} />
        <Route path="/Waterbill1" element={<Waterbill1 />} />
        <Route path="/Waterbill2" element={<Waterbill2 />} />
        <Route path="/Ewallet1" element={<Ewallet1 />} />
        <Route path="/Ewallet2" element={<Ewallet2 />} />
        <Route path="/Mobile1" element={<Mobile1 />} />
        <Route path="/Mobile2" element={<Mobile2 />} />
        <Route path="/Tax1" element={<Tax1 />} />
        <Route path="/Tax2" element={<Tax2 />} />
        <Route path="/Health1" element={<Health1 />} />
        <Route path="/Health2" element={<Health2 />} />
        <Route path="/Merchant1" element={<Merchant1 />} />
        <Route path="/Merchant2" element={<Merchant2 />} />
        <Route path="/Television1" element={<Television1 />} />
        <Route path="/Television2" element={<Television2 />} />
        <Route path="/MutalFund1" element={<MutalFund1 />} />
        <Route path="/MutalFund2" element={<MutalFund2 />} />
        <Route path="/Stock1" element={<Stock1 />} />
        <Route path="/Stock2" element={<Stock2 />} />
        <Route path="/CreditCard1" element={<CreditCard1 />} />
        <Route path="/CreditCard2" element={<CreditCard2 />} />
        <Route path="/Motor1" element={<Motor1 />} />
        <Route path="/Motor2" element={<Motor2 />} />
        <Route path="/Car1" element={<Car1 />} />
        <Route path="/Car2" element={<Car2 />} />
        <Route path="/Food1" element={<Food1 />} />
        <Route path="/Food2" element={<Food2 />} />
        <Route path="/SplitBill1" element={<SplitBill1 />} />
        <Route path="/SplitBill2" element={<SplitBill2 />} />
        <Route path="/SplitBill3" element={<SplitBill3 />} />
        <Route path="/SplitBill4" element={<SplitBill4 />} />
        <Route path="/SplitBill5" element={<SplitBill5 />} />
        <Route path="/SplitBill6" element={<SplitBill6 />} />
        <Route path="/SplitBill7" element={<SplitBill7 />} />
        <Route path="/Activity" element={<Activity />} />
        <Route path="/PreapprovedPayment1" element={<PreapprovedPayment1 />} />
        <Route path="/PreapprovedPaymentRefund" element={<PreapprovedPaymentRefund />} />
        <Route path="/PreapprovedPaymentPartial" element={<PreapprovedPaymentPartial />} />
        <Route path="/Tracking1" element={<Tracking1 />} />
        <Route path="/Tracking2" element={<Tracking2 />} />
        <Route path="/SendMoney" element={<SendMoney />} />
        <Route path="/RequestPayment" element={<RequestPayment />} />
        <Route path="/AreaChart" element={<AreaChart />} />
        <Route path="/BarChart" element={<BarChart />} />
        <Route path="/PieChart" element={<PieChart />} />
        <Route path="/LineChart" element={<LineChart />} />
        <Route path="/Invoicing" element={<Invoicing />} />
        <Route path="/NewInvoice" element={<NewInvoice />} />
        <Route path="/OldInvoice" element={<OldInvoice />} />
        <Route path="/MyItem" element={<MyItem />} />
        <Route path="/AddNewItem" element={<AddNewItem />} />
        <Route path="/Taxes" element={<Taxes />} />
        <Route path="/AddTaxes" element={<AddTaxes />} />
        <Route path="/AllContact" element={<AllContact />} />
        <Route path="/ShareInvoice" element={<ShareInvoice />} />
        <Route path="/GenerateQrCode" element={<GenerateQrCode />} />
        <Route path="/SaveAsDraft" element={<SaveAsDraft />} />
        <Route path="/CustomerScreen" element={<CustomerScreen />} />
        <Route path="/BankAndCard" element={<BankAndCard />} />
        <Route path="/ContactUs" element={<ContactUs />} />
        <Route path="/Subscription" element={<Subscription />} />
        <Route path="/Security" element={<Security />} />
        <Route path="/AboutUs" element={<AboutUs />} />
        <Route path="/AutomaticPayment" element={<AutomaticPayment />} />
        <Route path="/Currency" element={<Currency />} />
        <Route path="/Language" element={<Language />} />
        <Route path="/MarketingScreen" element={<MarketingScreen />} />
        <Route path="/EmptyNotification" element={<EmptyNotification />} />
        <Route path="/DataPrivacy" element={<DataPrivacy />} />
        <Route path="/Feedback" element={<Feedback />} />
        <Route path="/Payment" element={<Payment />} />
        <Route path="/NotificationSetting" element={<NotificationSetting />} />
        <Route path="/AddNewCard" element={<AddNewCard />} />
        <Route path="/DeactiveAccount" element={<DeactiveAccount />} />
        <Route path="/DeleteDeactivateAccount" element={<DeleteDeactivateAccount />} />
        <Route path="/DeleteAccount" element={<DeleteAccount />} />
        <Route path="/InviteFriend" element={<InviteFriend />} />
        <Route path="/PersonalInfo" element={<PersonalInfo />} />

        {/* <Route path="*" element={<NoPage />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;