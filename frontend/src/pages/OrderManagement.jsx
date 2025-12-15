// src/pages/OrderManagement.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { findAllOrders, updateOrderStatus } from '../store/slices/ordersSlice';
import { selectUser } from '../store/slices/authSlice';
import { toast } from 'react-toastify';
import OrderStatusModal from '../components/Admin/OrderStatusModal';
import { useSocket } from '../contexts/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';

const OrderManagement = () => {
    const dispatch = useDispatch();
    const { allOrders, loading } = useSelector((state) => state.orders);
    const user = useSelector(selectUser);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [orderToUpdate, setOrderToUpdate] = useState(null);
    const socket = useSocket();

    // Local state to handle real-time updates optimistically or before redux refetch
    // For simplicity, we will trigger a refetch on socket event, or update local list if we were efficiently managing state.
    // Given the architecture, dispatching findAllOrders() again is safest to keep Redux in sync.
    // Ideally we would update the redux store directly via an action, but refetching is robust.

    useEffect(() => {
        if (user?.role === 'admin') {
            dispatch(findAllOrders());
        }
    }, [dispatch, user]);

    useEffect(() => {
        if (socket && user?.role === 'admin') {
            const handleOrderCreated = (data) => {
                toast.info(`New Order #${data.orderId.slice(-6)} received!`);
                dispatch(findAllOrders());
            };

            const handleStatusUpdated = (data) => {
                // If another admin updates it, or system updates it
                dispatch(findAllOrders());
            };

            socket.on('order.created', handleOrderCreated); // Ensure backend emits this exact event name
            socket.on('order.status.updated', handleStatusUpdated);

            return () => {
                socket.off('order.created', handleOrderCreated);
                socket.off('order.status.updated', handleStatusUpdated);
            };
        }
    }, [socket, dispatch, user]);

    const openStatusModal = (order) => {
        setOrderToUpdate(order);
        setStatusModalOpen(true);
    };

    const handleStatusUpdate = async (newStatus, note, trackingNumber, courierService) => {
        if (!orderToUpdate) return;
        try {
            await dispatch(updateOrderStatus({
                id: orderToUpdate._id,
                statusData: {
                    orderStatus: newStatus,
                    note: note,
                    ...(trackingNumber && { trackingNumber }),
                    ...(courierService && { courierService })
                }
            })).unwrap();
            dispatch(findAllOrders());
            setStatusModalOpen(false);
            setOrderToUpdate(null);
            toast.success('Order status updated successfully');
        } catch (error) {
            toast.error('Failed to update order status');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-100',
            confirmed: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-100',
            processing: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-100',
            shipped: 'bg-violet-50 text-violet-700 border-violet-200 ring-violet-100',
            delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100',
            cancelled: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-100',
        };
        return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    const getStatusDot = (status) => {
        const colors = {
            pending: 'bg-amber-500',
            confirmed: 'bg-blue-500',
            processing: 'bg-indigo-500',
            shipped: 'bg-violet-500',
            delivered: 'bg-emerald-500',
            cancelled: 'bg-rose-500',
        };
        return colors[status] || 'bg-gray-500';
    }

    const filteredOrders = allOrders.filter((order) => {
        const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter;
        const matchesSearch =
            order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    if (loading && allOrders.length === 0) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Order Management</h1>
                    <p className="text-gray-500 mt-1">Monitor and manage store orders in real-time.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 text-sm font-medium text-gray-600 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        Live Updates Active
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Orders', value: allOrders.length, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
                    { label: 'Pending', value: allOrders.filter(o => o.orderStatus === 'pending').length, color: 'text-amber-600', bg: 'bg-amber-50', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                    { label: 'Processing', value: allOrders.filter(o => o.orderStatus === 'processing').length, color: 'text-blue-600', bg: 'bg-blue-50', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
                    { label: 'Delivered', value: allOrders.filter(o => o.orderStatus === 'delivered').length, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: 'M5 13l4 4L19 7' },
                ].map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between hover:shadow-md transition-shadow"
                    >
                        <div>
                            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-full ${stat.bg}`}>
                            <svg className={`w-6 h-6 ${stat.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                            </svg>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Filters Bar */}
                <div className="p-6 border-b border-gray-100 bg-white">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search orders..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Advanced Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <AnimatePresence>
                                {filteredOrders.map((order, index) => (
                                    <motion.tr
                                        key={order._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-gray-50/80 transition-colors group"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-mono text-sm font-medium text-gray-600">#{order._id?.slice(-8)}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm">
                                                    {(order.userId?.name || order.userId?.email || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-gray-900">{order.userId?.name || 'Guest User'}</div>
                                                    <div className="text-xs text-gray-500">{order.customerEmail || order.userId?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.orderStatus)}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${getStatusDot(order.orderStatus)}`}></span>
                                                {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-600">
                                                {order.items?.length} items
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">
                                                ₹{order.totalAmount?.toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => openStatusModal(order)}
                                                    className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                                                    title="Update Status"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {filteredOrders.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
                        <p className="text-gray-500 mt-1">Try adjusting your search or filters.</p>
                    </div>
                )}
            </div>

            {/* Order Details Modal - Enhanced */}
            <AnimatePresence>
                {selectedOrder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                                        <p className="text-gray-500 font-mono text-sm mt-1">#{selectedOrder._id}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left Panel */}
                                    <div className="lg:col-span-2 space-y-8">
                                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                            <h3 className="text-lg font-bold text-gray-900 mb-4">Items Ordered</h3>
                                            <div className="space-y-4">
                                                {selectedOrder.items?.map((item, index) => (
                                                    <div key={index} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                                                        <img
                                                            src={item.productImage || item.productId?.images?.[0] || 'https://via.placeholder.com/80'}
                                                            alt={item.productName}
                                                            className="w-20 h-20 object-cover rounded-lg bg-gray-50"
                                                        />
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold text-gray-900">{item.productName || item.productId?.title}</h4>
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Panel */}
                                    <div className="space-y-6">
                                        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Customer</h3>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                                    {(selectedOrder.userId?.name || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{selectedOrder.userId?.name}</p>
                                                    <p className="text-sm text-gray-500">{selectedOrder.customerEmail || selectedOrder.userId?.email}</p>
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-600 space-y-1">
                                                {selectedOrder.customerPhone && <p>{selectedOrder.customerPhone}</p>}
                                                <p className="pt-2 border-t border-gray-100 mt-2">{selectedOrder.shippingAddress && typeof selectedOrder.shippingAddress === 'object' ?
                                                    `${selectedOrder.shippingAddress.addressLine}, ${selectedOrder.shippingAddress.city}`
                                                    : selectedOrder.shippingAddress}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Payment & Totals</h3>
                                            <div className="space-y-3 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Subtotal</span>
                                                    <span className="font-medium">₹{selectedOrder.subtotal?.toFixed(2) || '0.00'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Shipping</span>
                                                    <span className="font-medium">₹{selectedOrder.shippingCost?.toFixed(2) || '0.00'}</span>
                                                </div>
                                                <div className="pt-3 border-t border-gray-100 flex justify-between">
                                                    <span className="font-bold text-gray-900">Total</span>
                                                    <span className="font-bold text-xl text-indigo-600">₹{selectedOrder.totalAmount?.toFixed(2)}</span>
                                                </div>
                                                <div className="mt-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${selectedOrder.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        Payment: {selectedOrder.paymentStatus?.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Status Update Modal */}
            <OrderStatusModal
                isOpen={statusModalOpen}
                onClose={() => setStatusModalOpen(false)}
                currentStatus={orderToUpdate?.orderStatus}
                onUpdate={handleStatusUpdate}
                loading={loading}
            />
        </div>
    );
};

export default OrderManagement;
