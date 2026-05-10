import { Routes, Route } from "react-router-dom"
// import Home from "../pages/Home"
import Login from "../pages/Login/Login.tsx"
import Register from "../pages/Register/Register"
import Me from "../pages/Me/Me"
import CourtDetailGalleryDemo from "../pages/CourtDetail/CourtDetailGalleryDemo"
import BookingTest from "../pages/BookingForm/BookingTest.tsx"
import CheckoutPage from "../pages/CheckoutPage/CheckoutPage.tsx"
import CourtSearch from "../pages/CourtSearch/CourtSearch"
import ManagementPage from "../pages/ManagementPage/ManagementPage.tsx"

function AppRoutes() {
  return (
    <Routes>
      {/* <Route path="/" element={<Home />} /> */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/me" element={<Me />} />
      <Route path="/court-detail-demo" element={<CourtDetailGalleryDemo />} />
      <Route path="/BookingTest" element={<BookingTest />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/courts/search" element={<CourtSearch />} />
      <Route path="/management" element={<ManagementPage />} />
    </Routes>
  )
}

export default AppRoutes
