import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './assets/css/swap.css';
import './assets/css/style.css';
import './assets/css/media-query.css';
import type { ReactElement } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DarkModeProvider } from "./components/DarkModeContext";
import Loader from "./components/Loader";
import Splashscreen from "./pages/Splashscreen";
import LetYouScreen from "./pages/LetYouScreen";
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import VerifyPhoneNumber from './pages/VerifyPhoneNumber';
import NotificationAllow from './pages/NotificationAllow';
import Notification from './pages/Notification';
import PersonalInfoSlider from './pages/PersonalInfoSlider';
import UploadId from './pages/UploadId';
import Identify from './pages/Identify';
import ReasonUsingPayfast from './pages/ReasonUsingPayfast';
import CaptureSelfie from './pages/CaptureSelfie';
import CreateNewPin from './pages/CreateNewPin';
import Fingerprint from './pages/Fingerprint';
import FaceRecognition from './pages/FaceRecognition';
import FaceRecognitionRunning from './pages/FaceRecognitionRunning';
import ForgetPassword from './pages/ForgetPassword';
import ConfirmOtp from './pages/ConfirmOtp';
import CreateNewPassword from './pages/CreateNewPassword';
import SendMoneyContact from './pages/SendMoneyContact';
import SendMoney1 from './pages/SendMoney1';
import SendMoney4 from './pages/SendMoney4';
import SendMoneyReview from './pages/SendMoneyReview';
import SendMoneySuccessful from './pages/SendMoneySuccessful';
import RequestMoneyContact from './pages/RequestMoneyContact';
import RequestMoney1 from './pages/RequestMoney1';
import RequestMoney3 from './pages/RequestMoney3';
import ScanQrCode from './pages/ScanQrCode';
import QrcodePayment from './pages/QrcodePayment';
import TransferBank1 from './pages/TransferBank1';
import TransferBank2 from './pages/TransferBank2';
import TransferBankReview from './pages/TransferBankReview';
import TransferBankSuccess from './pages/TransferBankSuccess';
import SendInvoice1 from './pages/SendInvoice1';
import SendInvoice2 from './pages/SendInvoice2';
import PayBills from './pages/PayBills';
import Electricitybill1 from './pages/Electricitybill1';
import Electricitybill2 from './pages/Electricitybill2';
import BillPaid from './pages/BillPaid';
import Internetbill1 from './pages/Internetbill1';
import Internetbill2 from './pages/Internetbill2';
import Waterbill1 from './pages/Waterbill1';
import Waterbill2 from './pages/Waterbill2';
import Ewallet1 from './pages/Ewallet1';
import Ewallet2 from './pages/Ewallet2';
import Mobile1 from './pages/Mobile1';
import Mobile2 from './pages/Mobile2';
import Tax1 from './pages/Tax1';
import Tax2 from './pages/Tax2';
import Health1 from './pages/Health1';
import Health2 from './pages/Health2';
import Merchant1 from './pages/Merchant1';
import Merchant2 from './pages/Merchant2';
import Television1 from './pages/Television1';
import Television2 from './pages/Television2';
import MutalFund1 from './pages/MutalFund1';
import MutalFund2 from './pages/MutalFund2';
import Stock1 from './pages/Stock1';
import Stock2 from './pages/Stock2';
import CreditCard1 from './pages/CreditCard1';
import CreditCard2 from './pages/CreditCard2';
import Motor1 from './pages/Motor1';
import Motor2 from './pages/Motor2';
import Car1 from './pages/Car1';
import Car2 from './pages/Car2';
import Food1 from './pages/Food1';
import Food2 from './pages/Food2';
import SplitBill1 from './pages/SplitBill1';
import SplitBill2 from './pages/SplitBill2';
import SplitBill3 from './pages/SplitBill3';
import SplitBill4 from './pages/SplitBill4';
import SplitBill5 from './pages/SplitBill5';
import SplitBill6 from './pages/SplitBill6';
import SplitBill7 from './pages/SplitBill7';
import Activity from './pages/Activity';
import PreapprovedPayment1 from './pages/PreapprovedPayment1';
import PreapprovedPaymentRefund from './pages/PreapprovedPaymentRefund';
import PreapprovedPaymentPartial from './pages/PreapprovedPaymentPartial';
import Tracking1 from './pages/Tracking1';
import Tracking2 from './pages/Tracking2';
import SendMoney from './pages/SendMoney';
import RequestPayment from './pages/RequestPayment';
import AreaChart from './pages/AreaChart';
import BarChart from './pages/BarChart';
import PieChart from './pages/PieChart';
import LineChart from './pages/LineChart';
import Invoicing from './pages/Invoicing';
import NewInvoice from './pages/NewInvoice';
import OldInvoice from './pages/OldInvoice';
import MyItem from './pages/MyItem';
import AddNewItem from './pages/AddNewItem';
import Taxes from './pages/Taxes';
import AddTaxes from './pages/AddTaxes';
import AllContact from './pages/AllContact';
import ShareInvoice from './pages/ShareInvoice';
import GenerateQrCode from './pages/GenerateQrCode';
import SaveAsDraft from './pages/SaveAsDraft';
import CustomerScreen from './pages/CustomerScreen';
import BankAndCard from './pages/BankAndCard';
import ContactUs from './pages/ContactUs';
import Subscription from './pages/Subscription';
import Security from './pages/Security';
import AboutUs from './pages/AboutUs';
import AutomaticPayment from './pages/AutomaticPayment';
import Currency from './pages/Currency';
import Language from './pages/Language';
import MarketingScreen from './pages/MarketingScreen';
import EmptyNotification from './pages/EmptyNotification';
import DataPrivacy from './pages/DataPrivacy';
import Feedback from './pages/Feedback';
import Payment from './pages/Payment';
import NotificationSetting from './pages/NotificationSetting';
import AddNewCard from './pages/AddNewCard';
import DeactiveAccount from './pages/DeactiveAccount';
import DeleteAccount from './pages/DeleteAccount';
import DeleteDeactivateAccount from './pages/DeleteDeactivateAccount';
import InviteFriend from './pages/InviteFriend';
import PersonalInfo from './pages/PersonalInfo';

function App(): ReactElement {
  return (
    <DarkModeProvider>
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
        </Routes>
      </BrowserRouter>
    </DarkModeProvider>
  );
}

export default App;
