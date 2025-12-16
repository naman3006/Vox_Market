// src/pages/AdminDashboard.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getDashboard } from '../store/slices/adminSlice';
import { findAllOrders, findSellerOrders } from '../store/slices/ordersSlice';
import { selectUser } from '../store/slices/authSlice';
import { findAllUsers, updateUser, removeUser } from '../store/slices/usersSlice';
import { findAllProducts } from '../store/slices/productsSlice';
import { toast } from 'react-toastify';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { dashboard, loading } = useSelector((state) => state.admin);
  const { allOrders, sellerOrders } = useSelector((state) => state.orders);
  const user = useSelector((state) => state.auth.user);
  const { users } = useSelector((state) => state.users);
  const { products } = useSelector((state) => state.products);

  useEffect(() => {
    dispatch(getDashboard());
    dispatch(findAllUsers());
    dispatch(findAllProducts({ limit: 10 }));
    if (user?.role === 'admin') {
      dispatch(findAllOrders());
    } else if (user?.role === 'seller') {
      dispatch(findSellerOrders());
    }
  }, [dispatch, user]);

  // Filter users based on search
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredUsers = users?.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700 ring-purple-600/20';
      case 'seller': return 'bg-blue-100 text-blue-700 ring-blue-600/20';
      default: return 'bg-gray-100 text-gray-700 ring-gray-600/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-display">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
            System Operational
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100 relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Users</h3>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-gray-900 font-display">{users?.length || 0}</p>
              {/* <span className="text-green-600 text-sm font-medium">+12%</span> */}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100 relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Orders</h3>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-gray-900 font-display">
                {user?.role === 'seller' ? (sellerOrders?.length || 0) : (allOrders?.length || 0)}
              </p>
              {/* <span className="text-blue-600 text-sm font-medium">New</span> */}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100 relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-purple-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Products</h3>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-gray-900 font-display">
                {products?.products?.length || products?.length || 0}
              </p>
              <span className="text-purple-600 text-sm font-medium">In Stock</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Revenue Chart */}
        {/* <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Trend</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboard?.revenueByMonth?.map(d => ({
                name: `${d._id.month}/${d._id.year}`,
                revenue: d.revenue
              })) || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value) => [`$${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div> */}


        {/* Order Status & Top Products */}
        <div className="grid grid-cols-1 gap-8">

          {/* Top Products Bar Chart */}
          {/* <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Top Selling Products</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard?.topSellingProducts || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="title" type="category" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="soldCount" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div> */}

          {/* Order Status Pie Chart */}
          {/* <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Order Status</h3>
            <div className="h-64 w-full flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboard?.ordersByStatus?.map(s => ({ name: s._id, value: s.count })) || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(dashboard?.ordersByStatus || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#10B981', '#F59E0B', '#EF4444', '#3B82F6'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div> */}

        </div>

      </div>

      {/* User Management Section */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">User Management</h2>
            <p className="text-sm text-gray-500">Manage system access and permissions</p>
          </div>
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div >

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 text-left border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user._id || user.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 p-0.5 shadow-sm">
                          <img
                            src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">ID: {(user._id || user.id).slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-700 flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          {user.email}
                        </span>
                        {user.phone && (
                          <span className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            {user.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        className="text-gray-400 hover:text-primary-600 transition-colors mr-3"
                        title="Edit User Role"
                        onClick={() => {
                          const newRole = prompt('Enter new role (user/seller/admin):', user.role);
                          if (newRole && ['user', 'seller', 'admin'].includes(newRole.toLowerCase())) {
                            dispatch(updateUser({ id: user._id || user.id, updateData: { role: newRole.toLowerCase() } }))
                              .unwrap()
                              .then(() => {
                                toast.success('User role updated successfully');
                                dispatch(findAllUsers());
                              })
                              .catch(err => toast.error(err.message || 'Failed to update role'));
                          } else if (newRole) {
                            toast.error('Invalid role. Please enter user, seller, or admin.');
                          }
                        }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete User"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                            dispatch(removeUser(user._id || user.id))
                              .unwrap()
                              .then(() => {
                                toast.success('User deleted successfully');
                                dispatch(findAllUsers());
                              })
                              .catch(err => toast.error(err.message || 'Failed to delete user'));
                          }
                        }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      <p className="text-lg font-medium text-gray-900">No users found</p>
                      <p className="text-sm text-gray-500">Try adjusting your search terms</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500">
          <span>Showing {filteredUsers.length} of {users?.length || 0} users</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded-md bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 rounded-md bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div >
    </div >
  );
};

export default AdminDashboard;