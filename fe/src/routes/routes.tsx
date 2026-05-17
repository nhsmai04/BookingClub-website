import { Routes, Route } from "react-router-dom"
import Login from "../pages/Login/Login.tsx"
import Register from "../pages/Register/Register"
import Me from "../pages/Me/Me"
import CourtDetailGalleryDemo from "../pages/CourtDetail/CourtDetailGalleryDemo"
import CheckoutPage from "../pages/CheckoutPage/CheckoutPage.tsx" 
import ProfilePage from "../pages/Profile/ProfilePage.tsx"
import CourtSearch from "../pages/CourtSearch/CourtSearch"
import Booking from "../pages/BookingTest/Booking.tsx"
import PaymentSuccess from "../pages/Payment/PaymentSuccess.tsx"
import PaymentFailed from "../pages/Payment/PaymentFailed.tsx"
import HomePage from "../pages/HomePage/HomePage.tsx"
import CourtInfo from "../pages/CourtInfo/CourtInfo.tsx"

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/me" element={<Me />} />

      <Route path="/profile" element={<ProfilePage />} /> {/* Đổi URL thành /profile */}
      {/* ================================ */}
      <Route path="/complexes/:complexId" element={<CourtDetailGalleryDemo />} />
      {/* <Route path="/Booking" element={<Booking />} /> */}
      <Route path="/complexes/:slug" element={<CourtInfo />} />
      {/* <Route path="/checkout" element={<CheckoutPage />} /> */}
      <Route path="/complexes/:complexId/booking" element={<Booking />} />
      <Route path="/complexes/:complexId/booking/confirm" element={<CheckoutPage />} />
      <Route path="/search" element={<CourtSearch />} />
      <Route path="/courts/search" element={<CourtSearch />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/failed" element={<PaymentFailed />} />
    </Routes>
  )
}

export default AppRoutes
