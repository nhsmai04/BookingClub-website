import { useState } from 'react';
import { 
  LayoutDashboard, 
  Ticket, 
  User, 
  Settings, 
  LogOut, 
  Search, 
  Bell, 
  HelpCircle, 
  ChevronRight, 
  Calendar, 
  History, 
  PlusCircle, 
  Download, 
  Eye, 
  ChevronLeft,
  Smartphone,
  ArrowRight,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import './ManagementPage.css';

interface Booking {
  id: string;
  sport: string;
  venue: string;
  court: string;
  date: string;
  time: string;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
  price: string;
}

const bookings: Booking[] = [
  { id: '1', sport: 'Tennis', venue: 'Grand Slam Arena', court: 'Court #4 (Clay)', date: 'Oct 24, 2023', time: '10:00 AM - 12:00 PM', status: 'Confirmed', price: '$45.00' },
  { id: '2', sport: 'Basketball', venue: 'Urban Hoops Center', court: 'Full Court B', date: 'Oct 22, 2023', time: '06:00 PM - 07:30 PM', status: 'Completed', price: '$30.00' },
  { id: '3', sport: 'Futsal', venue: 'Elite Sports Club', court: 'Indoor Pitch 2', date: 'Oct 18, 2023', time: '08:00 PM - 10:00 PM', status: 'Completed', price: '$60.00' },
  { id: '4', sport: 'Swimming', venue: 'Aqua Splash Center', court: 'Lane 3 (Lap Pool)', date: 'Oct 15, 2023', time: '07:00 AM - 08:00 AM', status: 'Cancelled', price: '$15.00' },
];


const ManagementPage = () => {
  const [activeTab, setActiveTab] = useState('My Bookings');
  const [filter, setFilter] = useState('All');

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: Ticket, label: 'My Bookings' },
    { icon: User, label: 'Profile' },
    { icon: Settings, label: 'Settings' },
  ];
  
    return (
    <div className="app-container">
       {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo-section">
          <h1 className="sidebar-title">CourtMaster</h1>
          <p className="sidebar-subtitle">Player Portal</p>
        </div>

        <nav className="nav-menu">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.label)}
              className={`nav-item ${
                activeTab === item.label ? 'nav-item-active' : 'nav-item-inactive'
              }`}
            >
              <item.icon size={20} />
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <button className="sign-out-btn">
          <LogOut size={20} />
          <span className="nav-label">Đăng xuất</span>
        </button>
      </aside>

        {/* Main Content Area */}
        <main className="main-content">
            {/* Top App Bar */}
        <header className="top-header">
          <div className="search-container">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm lịch sử..." 
              className="search-input"
            />
          </div>

          <div className="header-actions">
            <div className="action-buttons">
              <button className="icon-btn">
                <Bell size={20} />
                <span className="notification-badge"></span>
              </button>
              <button className="icon-btn">
                <HelpCircle size={20} />
              </button>
            </div>

            <div className="user-profile">
              <div className="user-info">
                <p className="user-name">Alex Rivera</p>
                <p className="user-tier">Premium Member</p>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop" 
                alt="Profile" 
                className="profile-img"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </header>

        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <span>Dashboard</span>
          <ChevronRight size={14} />
          <span className="breadcrumb-current">Lịch sử đặt sân</span>
        </div>

         {/* Header */}
        <div className="page-header">
          <h2 className="page-title">Lịch sử đặt sân</h2>
          <p className="page-desc">Theo dõi lịch đặt sân của bạn trong quá khứ và sắp tới.</p>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="stats-card stats-card-accent"
          >
            <div className="card-bg-circle" />
            <div className="stats-content">
              <p className="stats-label">Active Bookings</p>
              <h3 className="stats-value">03</h3>
              <div className="stats-meta">
                <Calendar size={16} />
                <span>Next: Tomorrow, 10:00 AM</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="stats-card stats-card-gray"
          >
            <div className="card-bg-circle" />
            <div className="stats-content">
              <p className="stats-label">Completed Bookings</p>
              <h3 className="stats-value">28</h3>
              <div className="stats-meta">
                <History size={16} />
                <span>Last played: 3 days ago</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="promo-card"
          >
            <img 
              src="https://images.unsplash.com/photo-1541250848049-b4f71413cc30?q=80&w=600&auto=format&fit=crop" 
              className="promo-bg-img"
              alt="Tennis court"
              referrerPolicy="no-referrer"
            />
            <div className="promo-content">
              <p className="promo-tag">Ready for a match?</p>
              <h3 className="promo-title">Đặt sân nhanh</h3>
              <button className="quick-book-btn">
                <PlusCircle size={18} />
                Quick Book
              </button>
            </div>
          </motion.div>
        </div>

        {/* Booking Table Section */}
        <section className="content-section">
          <div className="section-header">
            <div className="section-title-group">
              <h4 className="section-title">Booking Logs</h4>
              <div className="filter-tabs">
                {['Tất cả', 'Sắp tới', 'Hoàn thành'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setFilter(opt)}
                    className={`filter-tab ${
                      filter === opt ? 'filter-tab-active' : 'filter-tab-inactive'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <button className="download-btn">
              <Download size={14} />
              Download PDF Report
            </button>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Sport</th>
                  <th>Tên Sân</th>
                  <th>Ngày đặt</th>
                  <th>Trạng thái</th>
                  <th>Số tiền</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {bookings.map((booking, idx) => (
                    <motion.tr 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      key={booking.id} 
                    >
                      <td className="font-semibold">{booking.sport}</td>
                      <td>
                        <p className="font-semibold text-sm">{booking.venue}</p>
                        <p className="text-xs">{booking.court}</p>
                      </td>
                      <td>
                        <p className="font-semibold text-sm">{booking.date}</p>
                        <p className="text-xs">{booking.time}</p>
                      </td>
                      <td>
                        <span className={`status-pill ${
                          booking.status === 'Confirmed' ? 'status-confirmed' :
                          booking.status === 'Completed' ? 'status-completed' :
                          'status-cancelled'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td>
                        <span className={booking.status === 'Cancelled' ? 'price-canceled' : 'price-active'}>
                          {booking.price}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="row-actions">
                          <button className="action-eye-btn">
                            <Eye size={16} />
                          </button>
                          <button className="rebook-btn">
                            Rebook
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="pagination">
            <p className="text-xs font-medium">Showing 4 of 28 bookings</p>
            <div className="pagination-controls">
              <button className="page-arrow">
                <ChevronLeft size={16} />
              </button>
              <button className="page-num page-num-active">1</button>
              <button className="page-num page-num-inactive">2</button>
              <button className="page-num page-num-inactive">3</button>
              <button className="page-arrow">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* Promo Grid */}
        <div className="promo-grid">
          <div className="promo-item">
            <img 
              src="https://images.unsplash.com/photo-1593079831268-3381b0db4a77?q=80&w=200&auto=format&fit=crop" 
              className="promo-item-img"
              alt="Reward Program"
              referrerPolicy="no-referrer"
            />
            <div className="promo-item-content">
              <h5 className="promo-item-title">Join our Reward Program</h5>
              <p className="promo-item-desc">Earn points for every hour you play and unlock exclusive discounts.</p>
              <button className="learn-more-btn">
                Learn More
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="promo-item">
            <div className="promo-item-icon-box">
              <Smartphone size={40} />
            </div>
            <div className="promo-item-content">
              <h5 className="promo-item-title">Download the App</h5>
              <p className="promo-item-desc">Get instant notifications for your bookings and digital passes.</p>
              <div className="store-buttons">
                <button className="store-btn">App Store</button>
                <button className="store-btn">Google Play</button>
              </div>
            </div>
          </div>
        </div>
        {/* Floating Action Button */}
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fab"
        >
          <Plus size={32} />
          <span className="fab-tooltip">New Booking</span>
        </motion.button>

        </main>

    </div>
  );
}

export default ManagementPage;