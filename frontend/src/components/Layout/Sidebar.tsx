import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Package, 
  BarChart3, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  RotateCcw,
  History,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Users,
  Clipboard
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { logout } from '../../store/slices/authSlice';
import socketService from '../../services/socketService';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useTypedSelector((state) => state.auth);

  const handleLogout = () => {
    // Disconnect socket
    socketService.disconnect();
    
    // Logout from Redux (also clears localStorage)
    dispatch(logout());
    
    // Navigate to login
    navigate('/login');
  };

  const managerMenuItems = [
    { path: '/app/dashboard', icon: BarChart3, label: 'Dashboard' },
    { path: '/app/products', icon: Package, label: 'Products' },
    { 
      label: 'Operations',
      isHeader: true,
      children: [
        { path: '/app/operations/receipts', icon: ArrowDownToLine, label: 'Receipts' },
        { path: '/app/operations/deliveries', icon: ArrowUpFromLine, label: 'Delivery Orders' },
        { path: '/app/operations/adjustments', icon: RotateCcw, label: 'Inventory Adjustment' },
      ]
    },
    { path: '/app/move-history', icon: History, label: 'Move History' },
    { path: '/app/settings', icon: Settings, label: 'Settings' },
    { path: '/app/staff-management', icon: Users, label: 'Staff Management' },
  ];

  const staffMenuItems = [
    { path: '/app/dashboard', icon: BarChart3, label: 'Dashboard' },
    { path: '/app/products', icon: Package, label: 'Products' },
    { 
      label: 'Operations',
      isHeader: true,
      children: [
        { path: '/app/operations/receipts', icon: ArrowDownToLine, label: 'Receipts' },
        { path: '/app/operations/deliveries', icon: ArrowUpFromLine, label: 'Delivery Orders' },
        { path: '/app/operations/adjustments', icon: RotateCcw, label: 'Inventory Adjustment' },
      ]
    },
    { path: '/app/move-history', icon: History, label: 'Move History' },
  ];

  const menuItems = user?.role === 'inventory_manager' ? managerMenuItems : staffMenuItems;
  const userName = user?.name || 'User';
  const userRole = user?.role === 'inventory_manager' ? 'Inventory Manager' : 'Warehouse Staff';

  return (
    <div className={`bg-white shadow-lg transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} flex flex-col h-full`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-purple-600">StockMaster</h1>
        )}
        <button
          onClick={onToggle}
          className="p-1 rounded-md hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        {menuItems.map((item, index) => {
          if (item.isHeader) {
            return (
              <div key={index}>
                {!isCollapsed && (
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {item.label}
                  </div>
                )}
                {item.children?.map((child) => (
                  <NavLink
                    key={child.path}
                    to={child.path}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 text-sm transition-colors ${
                        isActive
                          ? 'bg-purple-50 text-purple-600 border-r-2 border-purple-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`
                    }
                  >
                    <child.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    {!isCollapsed && <span>{child.label}</span>}
                  </NavLink>
                ))}
              </div>
            );
          }

          const Icon = item.icon!;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-purple-50 text-purple-600 border-r-2 border-purple-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Profile Section */}
      <div className="border-t border-gray-200 p-4">
        {!isCollapsed && (
          <>
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{userRole}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </>
        )}
        {isCollapsed && (
          <button
            onClick={handleLogout}
            className="w-full p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4 mx-auto" />
          </button>
        )}
      </div>
    </div>
  );
};