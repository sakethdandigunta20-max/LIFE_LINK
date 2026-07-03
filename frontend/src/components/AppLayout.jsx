import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Droplet, HeartPulse, Building2, Warehouse, Search,
  Bell, User, LogOut, Menu, X, BarChart3, Users, FileText, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const NAV_BY_ROLE = {
  donor: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/donor/profile', label: 'My Donor Profile', icon: Droplet },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/profile', label: 'Account Settings', icon: User },
  ],
  recipient: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/recipient/requests', label: 'My Requests', icon: HeartPulse },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/profile', label: 'Account Settings', icon: User },
  ],
  bloodbank: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/bloodbank/inventory', label: 'Inventory', icon: Warehouse },
    { to: '/bloodbank/requests', label: 'Blood Requests', icon: Droplet },
    { to: '/profile', label: 'Account Settings', icon: User },
  ],
  hospital: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/hospital/requests', label: 'Patient Requests', icon: HeartPulse },
    { to: '/search', label: 'Search Donors', icon: Search },
    { to: '/profile', label: 'Account Settings', icon: User },
  ],
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/verifications', label: 'Verifications', icon: ShieldCheck },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/reports', label: 'Reports', icon: FileText },
    { to: '/profile', label: 'Account Settings', icon: User },
  ],
};

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  const nav = NAV_BY_ROLE[user?.role] || [];

  useEffect(() => {
    let interval;
    const fetchNotifs = () => {
      api.get('/notifications').then((res) => {
        setNotifications(res.data.data.notifications);
        setUnread(res.data.data.unreadCount);
      }).catch(() => {});
    };
    fetchNotifs();
    interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications((n) => n.map((x) => ({ ...x, is_read: 1 })));
    setUnread(0);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-30 inset-y-0 left-0 w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center gap-2 px-6 border-b border-gray-100">
          <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <HeartPulse size={18} className="text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight">LifeLink</span>
        </div>
        <nav className="p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full p-3 border-t border-gray-100">
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 w-full"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="hidden lg:block text-sm text-gray-500">
            Welcome back, <span className="font-semibold text-gray-800">{user?.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button onClick={() => setNotifOpen((o) => !o)} className="relative p-2 rounded-lg hover:bg-gray-100">
                <Bell size={20} />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-brand-600 text-white text-[10px] flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-soft border border-gray-100 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <span className="font-semibold text-sm">Notifications</span>
                    <button onClick={markAllRead} className="text-xs text-brand-600 font-medium">Mark all read</button>
                  </div>
                  {notifications.length === 0 && <p className="p-4 text-sm text-gray-500">No notifications yet.</p>}
                  {notifications.map((n) => (
                    <div key={n.id} className={`px-4 py-3 border-b last:border-0 text-sm ${!n.is_read ? 'bg-brand-50/50' : ''}`}>
                      <p className="font-medium text-gray-800">{n.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="h-9 w-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-semibold text-sm overflow-hidden">
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt="" className="h-full w-full object-cover" />
              ) : (
                user?.name?.[0]?.toUpperCase()
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
