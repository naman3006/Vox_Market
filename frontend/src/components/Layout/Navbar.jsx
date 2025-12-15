import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import logo from '../../assets/LOGO2.jpeg';

const Navbar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, token } = useSelector((state) => state.auth);
    const { cart } = useSelector((state) => state.cart);
    const { notifications } = useSelector((state) => state.notifications);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const unreadCount = (notifications || []).filter((n) => n && !n.read).length;
    const cartCount = cart?.items?.length || 0;

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    const navLinks = [
        { name: 'Products', path: '/products' },
    ];

    const authLinks = [
        { name: `Cart (${cartCount})`, path: '/cart', badge: cartCount > 0 },
        { name: 'Wishlist', path: '/wishlist' },
        { name: 'Orders', path: '/orders' },
    ];

    const adminLinks = [
        { name: 'Dashboard', path: '/admin/dashboard' },
        { name: 'Orders', path: '/admin/orders' },
        { name: 'Products', path: '/products/manage' },
        { name: 'Categories', path: '/categories/manage' },
        { name: 'Coupons', path: '/admin/coupons' },
    ];

    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-soft transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <Link to="/" className="flex-shrink-0 group">
                        <img
                            src={logo}
                            className="h-12 w-auto transition-transform duration-300 group-hover:scale-105"
                            alt="Logo"
                        />
                    </Link>

                    {/* Search Bar */}
                    <div className="hidden md:flex flex-1 max-w-lg mx-8 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="I'm shopping for..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-full leading-5 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 sm:text-sm transition-all shadow-sm hover:shadow-md"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    navigate(`/products?search=${encodeURIComponent(e.target.value)}`);
                                }
                            }}
                        />
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center md:hidden gap-4">
                        {token && (
                            <Link
                                to="/notifications"
                                className={`relative p-2 rounded-full hover:bg-gray-100 transition-colors ${unreadCount > 0 ? 'text-primary-600' : 'text-gray-500'}`}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                                        {unreadCount}
                                    </span>
                                )}
                            </Link>
                        )}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-gray-600 hover:text-primary-600 focus:outline-none"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-8 items-center">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className="text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200"
                            >
                                {link.name}
                            </Link>
                        ))}

                        {token && (
                            <>
                                {authLinks.map((link) => (
                                    <Link
                                        key={link.name}
                                        to={link.path}
                                        className="text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200"
                                    >
                                        {link.name}
                                    </Link>
                                ))}

                                {/* Admin Dropdown */}
                                {user?.role === 'admin' && (
                                    <div className="relative group">
                                        <button className="text-gray-600 hover:text-primary-600 font-medium flex items-center gap-1 transition-colors">
                                            Admin
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </button>
                                        <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                                            <div className="py-2">
                                                {adminLinks.map((link) => (
                                                    <Link
                                                        key={link.name}
                                                        to={link.path}
                                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600"
                                                    >
                                                        {link.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Notifications */}
                                <Link
                                    to="/notifications"
                                    className={`relative p-2 rounded-full hover:bg-gray-100 transition-colors ${unreadCount > 0 ? 'text-primary-600' : 'text-gray-500'}`}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                                            {unreadCount}
                                        </span>
                                    )}
                                </Link>

                                {/* User Profile Dropdown */}
                                <div className="relative ml-4">
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="flex items-center space-x-2 focus:outline-none"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border-2 border-primary-200 overflow-hidden">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                user?.name?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                    </button>

                                    {isProfileOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-fade-in">
                                            <div className="px-4 py-2 border-b border-gray-100">
                                                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                            </div>
                                            <Link
                                                to="/profile"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600"
                                                onClick={() => setIsProfileOpen(false)}
                                            >
                                                Profile
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {!token && (
                            <div className="flex items-center space-x-4">
                                <Link to="/login" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
                                    Login
                                </Link>
                                <Link to="/register" className="bg-primary-600  px-5 py-2.5 rounded-full hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 font-medium">
                                    Register
                                </Link>
                            </div>
                        )}
                    </nav>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-100 animate-slide-in-top">
                        <div className="space-y-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className="block px-4 py-2 text-gray-600 hover:bg-primary-50 hover:text-primary-600 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {link.name}
                                </Link>
                            ))}

                            {token ? (
                                <>
                                    {authLinks.map((link) => (
                                        <Link
                                            key={link.name}
                                            to={link.path}
                                            className="block px-4 py-2 text-gray-600 hover:bg-primary-50 hover:text-primary-600 rounded-lg"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            {link.name}
                                        </Link>
                                    ))}

                                    {user?.role === 'admin' && (
                                        <>
                                            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</div>
                                            {adminLinks.map((link) => (
                                                <Link
                                                    key={link.name}
                                                    to={link.path}
                                                    className="block px-4 py-2 pl-8 text-gray-600 hover:bg-primary-50 hover:text-primary-600 rounded-lg"
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                >
                                                    {link.name}
                                                </Link>
                                            ))}
                                        </>
                                    )}

                                    <div className="pt-4 mt-4 border-t border-gray-100">
                                        <Link
                                            to="/profile"
                                            className="flex items-center px-4 py-2 gap-3 hover:bg-gray-50"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                                                {user.avatar ? <img src={user.avatar} className="w-full h-full rounded-full object-cover" /> : user.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </Link>
                                        <button
                                            onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                                            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 mt-2"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-2 p-4">
                                    <Link to="/login" className="block w-full text-center px-4 py-2 border border-primary-600 text-primary-600 rounded-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                                        Login
                                    </Link>
                                    <Link to="/register" className="block w-full text-center px-4 py-2 bg-primary-600 text-white rounded-lg font-medium shadow-md" onClick={() => setIsMobileMenuOpen(false)}>
                                        Register
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Navbar;
