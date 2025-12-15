import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from "../store/api/api";
import OrderTimeline from '../components/Order/OrderTimeline';
import { toast } from 'react-toastify';
import { useSocket } from '../contexts/SocketContext';
import { motion } from 'framer-motion';

const OrderDetails = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const socket = useSocket();

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data } = await api.get(`/orders/${id}`);
                console.log('Fetched Order Data:', data);
                setOrder(data);
            } catch (err) {
                toast.error('Failed to load order details');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    useEffect(() => {
        if (socket) {
            const handleUpdate = (payload) => {
                if (payload.orderId === id) {
                    setOrder(payload.order);
                    toast.success(`Order status updated to ${payload.status || payload.newStatus || payload.order.orderStatus}`);
                }
            };

            // Listen for both user-specific and admin-broadcast events
            socket.on('order_update', handleUpdate);
            socket.on('order.status.updated', handleUpdate);

            return () => {
                socket.off('order_update', handleUpdate);
                socket.off('order.status.updated', handleUpdate);
            };
        }
    }, [socket, id]);


    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading details...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 text-center p-4">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Order not found</h2>
                <p className="text-gray-500 mb-8 max-w-md">We couldn't find the order you're looking for. It might have been removed or the ID is incorrect.</p>
                <Link to="/orders" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all shadow-indigo-200">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Back to My Orders
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto"
            >
                {/* Header & Breadcrumb */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <nav className="flex mb-3 text-sm font-medium">
                            <Link to="/" className="text-gray-400 hover:text-indigo-600 transition-colors">Home</Link>
                            <span className="mx-2 text-gray-300">/</span>
                            <Link to="/orders" className="text-gray-400 hover:text-indigo-600 transition-colors">My Orders</Link>
                            <span className="mx-2 text-gray-300">/</span>
                            <span className="text-gray-900">Order Details</span>
                        </nav>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                            Order <span className="text-gray-400">#{(order._id || '').slice(-8)}</span>
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Placed on {new Date(order.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div>
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border shadow-sm
                            ${(order.orderStatus || 'pending') === 'delivered' ? 'bg-green-50 text-green-700 border-green-100' :
                                (order.orderStatus || 'pending') === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                                    'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                            {((order.orderStatus || 'pending').charAt(0).toUpperCase() + (order.orderStatus || 'pending').slice(1))}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Timeline & Items */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Timeline Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 overflow-hidden"
                        >
                            <h2 className="text-xl font-bold text-gray-900 mb-8">Order Progress</h2>
                            <OrderTimeline
                                status={order.orderStatus}
                                history={order.statusHistory}
                            />
                        </motion.div>

                        {/* Items Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                    Items Ordered ({order.items?.length || 0})
                                </h2>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {(order.items || []).map((item, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 + index * 0.1 }}
                                        className="p-6 flex flex-col sm:flex-row gap-6 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="w-24 h-24 rounded-xl bg-gray-100 p-2 flex-shrink-0 border border-gray-200">
                                            {item.productImage || item.productId?.images?.[0] ? (
                                                <img
                                                    src={item.productImage || item.productId?.images?.[0]}
                                                    alt={item.productName}
                                                    className="w-full h-full object-contain mix-blend-multiply"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                        {item.productName || item.productId?.name || 'Product Application'}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        Item ID: {item._id || item.productId?._id}
                                                    </p>
                                                </div>
                                                <p className="text-lg font-bold text-gray-900">
                                                    ₹{((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="mt-4 flex items-center justify-between">
                                                <div className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-sm font-medium text-gray-700">
                                                    Qty: {item.quantity || 0}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Price per unit: ₹{(item.price || 0).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Address & Summary */}
                    <div className="space-y-8">
                        {/* Shipping Address */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                        >
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Delivery Address</h3>
                            <div className="text-gray-600 leading-relaxed">
                                {order.shippingAddress && typeof order.shippingAddress === 'object' ? (
                                    <>
                                        <p className="font-bold text-gray-900 text-lg mb-1">{order.shippingAddress.fullName}</p>
                                        <p>{order.shippingAddress.addressLine}</p>
                                        <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                                        <p>{order.shippingAddress.postalCode}</p>
                                        <p>{order.shippingAddress.country}</p>
                                        <div className="flex items-center mt-3 text-sm text-indigo-600">
                                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                            {order.shippingAddress.phone}
                                        </div>
                                    </>
                                ) : (
                                    <p className="italic text-gray-400">Address formatting unavailable</p>
                                )}
                            </div>
                        </motion.div>

                        {/* Price Breakdown */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                        >
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Order Summary</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span className="font-medium text-gray-900">
                                        ₹{order.subtotal ? order.subtotal.toFixed(2) : ((order.totalAmount || 0) - (order.shippingCost || 0)).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping</span>
                                    <span className="text-green-600 font-medium">
                                        {(order.shippingCost || 0) === 0 ? 'Free' : `₹${(order.shippingCost || 0).toFixed(2)}`}
                                    </span>
                                </div>
                                {(order.discount || 0) > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount</span>
                                        <span>-₹{(order.discount || 0).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="pt-4 mt-4 border-t border-gray-100 flex justify-between items-baseline">
                                    <span className="font-bold text-gray-900">Total</span>
                                    <span className="font-bold text-xl text-indigo-600">₹{(order.totalAmount || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Help Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200"
                        >
                            <h3 className="font-bold text-lg mb-2">Need Help?</h3>
                            <p className="text-indigo-100 text-sm mb-4">
                                If you have issues with this order, our support team is ready to assist you.
                            </p>
                            <button className="w-full py-2.5 bg-white text-indigo-600 font-bold rounded-xl shadow-sm hover:bg-indigo-50 transition-colors">
                                Contact Support
                            </button>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default OrderDetails;