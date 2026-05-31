import react, { useState } from 'react';
import "./SideBar.css";
import { LayoutDashboard, LogOut, Settings, Ticket, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logoutApi } from '../../../services/auth.api';
import { useAuth } from '../../../contexts/AuthContext';
const SideBar: React.FC = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const navItems = [
    // {
    //   icon: LayoutDashboard,
    //   label: 'Dashboard'
    //   path: '/Dashbord',
    // },
    {
      icon: Ticket,
      label: 'My Bookings',
      path: '/management',
    },
    {
      icon: User,
      label: 'Profile',
      path: '/profile',
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/settings',
    },
  ];
  const [activeTab, setActiveTab] = useState(
    navItems.find((item) => item.path === location.pathname)?.label ||
    'My Bookings'
  );

  const handleLogout = async () => {
      if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
        try { await logoutApi(); } catch (e) {}
        sessionStorage.clear();
        setUser(null);
        document.cookie = "csrf_token_fe=; path=/; max-age=0; SameSite=None; Secure=true";
        navigate("/login");
      }
    };

  const handleNavigate = (label: string, path: string) => {
    setActiveTab(label);
    navigate(path);
  };


  return (

    <aside className="sidebar">
      <div className="sidebar-logo-section">
        <h1 className="sidebar-title">Booking Management</h1>
        <p className="sidebar-subtitle">Help Desk</p>
      </div>

      <nav className="nav-menu">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => handleNavigate(item.label, item.path)}
            className={`nav-item ${activeTab === item.label ? 'nav-item-active' : 'nav-item-inactive'
              }`}
          >
            <item.icon size={20} />
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <button className="sign-out-btn" onClick={() => handleLogout()}>
        <LogOut size={20} />
        <span className="nav-label">Đăng xuất</span>
      </button>
    </aside>

  );
};

export default SideBar;