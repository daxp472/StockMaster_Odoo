import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  Zap,
  TrendingUp,
  Users,
  Shield,
  Clock,
  Bell,
  BarChart3,
  Activity,
  CheckCircle,
  Sparkles,
  Radio
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Radio className="w-8 h-8 text-purple-500" />,
      title: 'Real-Time Updates',
      description: 'Dynamic WebSocket connections ensure instant synchronization across all devices. See changes happen live!'
    },
    {
      icon: <Package className="w-8 h-8 text-blue-500" />,
      title: 'Smart Product Management',
      description: 'Track SKUs, quantities, reorder points, and get automatic low-stock alerts in real-time.'
    },
    {
      icon: <ArrowDownToLine className="w-8 h-8 text-green-500" />,
      title: 'Receipt Processing',
      description: 'Manage incoming stock with multi-step workflow: Waiting → Ready → Completed. Auto-updates inventory.'
    },
    {
      icon: <ArrowUpFromLine className="w-8 h-8 text-orange-500" />,
      title: 'Delivery Management',
      description: 'Track outgoing orders with intelligent stock validation. Prevents over-selling automatically.'
    },
    {
      icon: <RotateCcw className="w-8 h-8 text-indigo-500" />,
      title: 'Stock Adjustments',
      description: 'Handle corrections, damages, and physical counts with full audit trail and movement history.'
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-pink-500" />,
      title: 'Live Dashboard',
      description: 'Monitor KPIs, pending tasks, low stock alerts, and recent movements - all updating in real-time.'
    },
    {
      icon: <Users className="w-8 h-8 text-cyan-500" />,
      title: 'Role-Based Access',
      description: 'Managers get full control, warehouse staff can process operations. Perfect permission separation.'
    },
    {
      icon: <Activity className="w-8 h-8 text-red-500" />,
      title: 'Movement History',
      description: 'Complete audit trail of every stock change with timestamps, users, and operation details.'
    },
    {
      icon: <Bell className="w-8 h-8 text-yellow-500" />,
      title: 'Instant Notifications',
      description: 'WebSocket-powered alerts for low stock, completed operations, and critical inventory events.'
    }
  ];

  const workflow = [
    {
      step: '01',
      title: 'Create Product',
      description: 'Add products with SKU, name, description, and reorder points',
      icon: <Package className="w-12 h-12 text-purple-600" />
    },
    {
      step: '02',
      title: 'Receive Stock',
      description: 'Create receipt → Process (Ready) → Complete (Stock increases)',
      icon: <ArrowDownToLine className="w-12 h-12 text-green-600" />
    },
    {
      step: '03',
      title: 'Deliver Orders',
      description: 'Create delivery → Process (Ready) → Complete (Stock decreases)',
      icon: <ArrowUpFromLine className="w-12 h-12 text-orange-600" />
    },
    {
      step: '04',
      title: 'Track Everything',
      description: 'All changes logged with full movement history and real-time updates',
      icon: <Activity className="w-12 h-12 text-blue-600" />
    }
  ];

  const benefits = [
    {
      icon: <Zap className="w-5 h-5 text-purple-600" />,
      text: 'Lightning-fast real-time synchronization'
    },
    {
      icon: <Shield className="w-5 h-5 text-purple-600" />,
      text: 'Secure JWT authentication & role management'
    },
    {
      icon: <Clock className="w-5 h-5 text-purple-600" />,
      text: 'Eliminate manual stock counting errors'
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-purple-600" />,
      text: 'Auto-prevent overselling with stock validation'
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
      text: 'Reduce stockouts with smart reorder alerts'
    },
    {
      icon: <Users className="w-5 h-5 text-purple-600" />,
      text: 'Collaborate across teams with live updates'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-blue-50 opacity-60"></div>

        {/* Navigation */}
        <nav className="relative z-10 container mx-auto px-6 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-600 p-2 rounded-lg shadow-sm">
                <Package className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">StockMaster</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 text-gray-700 font-medium hover:text-purple-600 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm hover:shadow-md"
              >
                Get Started
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 py-20">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-purple-50 border border-purple-200 rounded-full px-5 py-2 mb-8">
              <Radio className="w-4 h-4 text-purple-600" />
              <span className="text-purple-700 font-medium text-sm">Real-Time Inventory Management</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Smart Inventory Management
              <br />
              <span className="text-purple-600">
                Powered With Live WebSockets
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Professional inventory system with real-time synchronization across all devices.
              Track products, manage operations, and monitor stock levels with instant updates.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-3.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg flex items-center space-x-2"
              >
                <span>Start Free Trial</span>
                <Zap className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-3.5 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:border-purple-300 hover:text-purple-600 transition-colors shadow-sm flex items-center space-x-2"
              >
                <span>Login to Dashboard</span>
                <BarChart3 className="w-5 h-5" />
              </button>
            </div>

            {/* Real-Time Indicator */}
            <div className="flex items-center justify-center space-x-3 text-green-600">
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping absolute"></div>
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-sm font-medium">Live Connection Active</span>
            </div>
          </div>
        </div>

        {/* Floating Cards Preview */}
        <div className="relative z-10 container mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Radio, label: 'Real-Time Sync', value: '< 50ms', color: 'text-purple-600' },
              { icon: Activity, label: 'Active Operations', value: 'Live', color: 'text-blue-600' },
              { icon: Users, label: 'Team Collaboration', value: 'Instant', color: 'text-green-600' }
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-md transition-all"
              >
                <stat.icon className={`w-10 h-10 ${stat.color} mb-3`} />
                <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                <p className="text-gray-900 text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white border-y border-gray-200 py-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-center space-x-3 text-gray-700">
                <div className="flex-shrink-0">{benefit.icon}</div>
                <span className="text-sm font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="container mx-auto px-6 py-20 bg-gray-50">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How StockMaster Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Simple, powerful workflow designed for modern warehouses
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {workflow.map((item, idx) => (
            <div key={idx} className="relative">
              <div className="bg-white border border-gray-200 rounded-xl p-8 hover:border-purple-300 hover:shadow-lg transition-all">
                <div className="text-5xl font-bold text-purple-100 mb-4">
                  {item.step}
                </div>
                <div className="mb-4">{item.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
              {idx < workflow.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                  <div className="w-6 h-0.5 bg-purple-200"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage inventory efficiently in real-time
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-xl p-8 hover:border-purple-300 hover:shadow-md transition-all"
              >
                <div className="mb-5">{feature.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Role-Based Access Section */}
      <div className="container mx-auto px-6 py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Role-Based Permissions
            </h2>
            <p className="text-lg text-gray-600">
              Perfect separation of duties for your team
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Manager Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-10 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Inventory Manager</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Create, edit, and delete products',
                  'Create new receipts, deliveries, adjustments',
                  'Process all operations',
                  'View complete dashboard and analytics',
                  'Manage warehouse staff',
                  'Access all system settings'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Staff Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-10 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Warehouse Staff</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'View all products (read-only)',
                  'View all operations and orders',
                  'Process receipts (mark as ready/completed)',
                  'Process deliveries (pick and pack)',
                  'Process adjustments (physical counts)',
                  'See assigned tasks on dashboard'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-6 py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Ready to Transform Your Inventory?
            </h2>
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
              Join modern warehouses using real-time inventory management. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/register')}
                className="px-10 py-3.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg flex items-center space-x-2"
              >
                <span>Create Free Account</span>
                <Sparkles className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-10 py-3.5 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:border-purple-300 hover:text-purple-600 transition-colors shadow-sm flex items-center space-x-2"
              >
                <span>Login Now</span>
                <CheckCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-10 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="bg-purple-600 p-2 rounded-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">StockMaster</span>
            </div>
            <p className="text-gray-600 text-sm">
              © 2025 StockMaster. Real-time inventory management powered by WebSockets.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
