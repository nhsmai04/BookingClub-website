import { Link } from "react-router-dom"
import "./Navbar.css"

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/">Home</Link>
      <Link to="/courts/search">Tìm kiếm sân</Link>
      <Link to="/login">Login</Link>
      <Link to="/register">Register</Link>
      <Link to="/me">Me</Link>
      <Link to="/court-detail-demo">Court Detail</Link>
      <Link to="/BookingTest"> BookingTest</Link>
      <Link to="/management">Management</Link>
    </nav>
  )
}

export default Navbar
