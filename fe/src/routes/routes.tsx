import { Routes, Route } from "react-router-dom"
import Login from "../pages/Login/Login.tsx"
import Register from "../pages/Register/Register"
import Me from "../pages/Me/Me"
import CheckoutPage from "../pages/CheckoutPage/CheckoutPage.tsx"
import ProfilePage from "../pages/Profile/ProfilePage.tsx"
import CourtSearch from "../pages/CourtSearch/CourtSearch"
import PaymentSuccess from "../pages/Payment/PaymentSuccess.tsx"
import PaymentFailed from "../pages/Payment/PaymentFailed.tsx"
import HomePage from "../pages/HomePage/HomePage.tsx"
import CourtInfo from "../pages/CourtInfo/CourtInfo.tsx"
import ManagementPage from "../pages/ManagementPage/ManagementPage.tsx"
import ComplexMapPage from "../pages/Map/ComplexMapPage.tsx"
import VerifyEmail from "../pages/VerifyEmail/VerifyEmail.tsx"
import BookingDetail from "../pages/BookingDetail/BookingDetail.tsx"
import RegisterSuccess from "../pages/Register/RegisterSuccess.tsx"

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/me" element={<Me />} />

      <Route path="/profile" element={<ProfilePage />} /> {/* Đổi URL thành /profile */}
      {/* ================================ */}
      {/* <Route path="/complexes/:complexId" element={<CourtDetailGalleryDemo />} /> */}
      <Route path="/complexes/:slug" element={<CourtInfo />} />
      <Route path="/complexes/:complexId/booking/confirm" element={<CheckoutPage />} />
      <Route path="/search" element={<CourtSearch />} />
      <Route path="/complexes/search" element={<CourtSearch />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/failed" element={<PaymentFailed />} />
      <Route path="/management" element={<ManagementPage />} />
      <Route path="/map" element={<ComplexMapPage />} />
      <Route path="/booking-detail/:id" element={<BookingDetail />} />
      <Route path="/register-success" element={<RegisterSuccess />}/>


    </Routes>
  )
}

export default AppRoutes
