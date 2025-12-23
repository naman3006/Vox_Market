import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile, uploadAvatar, deleteAccount, getProfile } from '../store/slices/authSlice';
import { toast } from 'react-toastify';
import api from '../store/api/api';
import UserActivityLog from '../components/profile/UserActivityLog';

const Profile = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error('Name and Email are required');
      return;
    }

    // Phone validation: Allows optional +, then 10-15 digits
    const phoneRegex = /^(\+?\d{10,15})?$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/\s+/g, ''))) {
      toast.error('Invalid phone number format');
      return;
    }

    try {
      await dispatch(updateProfile({
        id: user._id || user.id,
        data: {
          ...formData,
          phone: formData.phone.replace(/\s+/g, '') // Send numeric only
        }
      })).unwrap();

      setIsEditing(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    }
  };

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [secret, setSecret] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [debugUrl, setDebugUrl] = useState('');
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);

  const handleEnable2FA = async () => {
    try {
      const response = await api.post('/auth/2fa/generate');
      console.log('2FA Generate Response:', response.data);
      setQrCodeUrl(response.data.qrCodeUrl);
      setSecret(response.data.secret);
      setOtpauthUrl(response.data.otpauthUrl);
      setDebugUrl(response.data.debugUrl);
      setShowTwoFactorSetup(true);
    } catch (err) {
      toast.error('Failed to generate 2FA QR Code');
    }
  };
  const handleVerify2FA = async () => {
    try {
      await api.post('/auth/2fa/turn-on', { twoFactorAuthenticationCode: twoFactorCode });
      toast.success('Two-factor authentication enabled!');
      setShowTwoFactorSetup(false);
      // Refresh profile to update UI
      dispatch(getProfile());
    } catch (err) {
      toast.error('Invalid code. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl shadow-soft overflow-hidden border border-gray-100 group hover:shadow-lg transition-all duration-300">
        <div className="h-48 bg-gradient-to-r from-primary-600 to-primary-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        <div className="px-8 pb-8 relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end -mt-16 mb-6 gap-6">
            <div className="flex items-end gap-6">
              <div className="relative group">
                <div className="w-36 h-36 rounded-full bg-white p-1.5 shadow-xl ring-4 ring-white/50 relative z-10 transition-transform duration-300 hover:scale-105">
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover bg-gray-50"
                  />

                  {/* Avatar Upload Overlay */}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer z-20 backdrop-blur-sm">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          try {
                            await dispatch(uploadAvatar({ id: user._id || user.id, file })).unwrap();
                            toast.success('Profile picture updated!');
                          } catch (err) {
                            toast.error(err.message || 'Failed to upload image');
                          }
                        }
                      }}
                    />
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </label>
                </div>
                {user.avatar && (
                  <button
                    onClick={async () => {
                      try {
                        await dispatch(updateProfile({ id: user._id || user.id, data: { avatar: null } })).unwrap();
                        toast.success('Profile picture removed');
                      } catch (err) {
                        toast.error('Failed to remove picture');
                      }
                    }}
                    className="absolute bottom-1 right-1 bg-red-50 text-red-600 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all z-30 hover:bg-red-100 transform hover:scale-110"
                    title="Remove photo"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>

              <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900 font-display flex items-center gap-3">
                  {user.name}
                  {user.role === 'admin' && (
                    <span className="bg-purple-100 text-purple-700 text-xs px-2.5 py-1 rounded-full border border-purple-200 uppercase tracking-wide font-bold">Admin</span>
                  )}
                  {user.role === 'seller' && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full border border-blue-200 uppercase tracking-wide font-bold">Seller</span>
                  )}
                </h1>
                <p className="text-gray-500 font-medium flex items-center gap-2">
                  {user.email}
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span className="text-sm">Member since {new Date(user.createdAt || Date.now()).getFullYear()}</span>
                </p>
              </div>
            </div>

            <div className="flex gap-3 mb-4 w-full md:w-auto">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${isEditing
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-primary-600  hover:bg-primary-700 shadow-lg shadow-primary-600/30 hover:shadow-primary-600/40 hover:-translate-y-0.5'
                  }`}
              >
                {isEditing ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    Cancel
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Edit Profile
                  </>
                )}
              </button>
            </div>
          </div>

          {!isEditing ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12 animate-slide-up">
              {/* Personal Info Card */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Personal Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                    <div className="group">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1 group-hover:text-primary-600 transition-colors">Full Name</label>
                      <p className="text-gray-900 font-semibold text-lg">{user.name}</p>
                    </div>
                    <div className="group">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1 group-hover:text-primary-600 transition-colors">Email Address</label>
                      <p className="text-gray-900 font-semibold text-lg">{user.email}</p>
                    </div>
                    <div className="group">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1 group-hover:text-primary-600 transition-colors">Phone Number</label>
                      <p className={`font-semibold text-lg ${user.phone ? 'text-gray-900' : 'text-gray-400 italic'}`}><span className="text-gray-500 px-2">+91</span>
                        {user.phone || 'Not provided'}
                      </p>
                    </div>
                    <div className="group">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1 group-hover:text-primary-600 transition-colors">User ID</label>
                      <p className="text-gray-500 font-mono text-sm bg-gray-100 inline-block px-2 py-1 rounded">{user._id || user.id}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loyalty & Rewards Card */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 border border-indigo-500 shadow-lg text-white">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-sm font-bold text-indigo-100 uppercase tracking-wider flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                        Loyalty & Rewards
                      </h3>
                      <p className="text-indigo-200 text-sm mt-1">Earn points with every purchase!</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30">
                      <span className="font-bold text-sm uppercase tracking-wide">{user.loyaltyTier || 'Bronze'} Member</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                      <p className="text-indigo-200 text-xs uppercase font-bold tracking-wider mb-1">Current Balance</p>
                      <p className="text-4xl font-bold">{user.loyaltyPoints || 0} <span className="text-lg font-medium text-indigo-200">Points</span></p>
                    </div>
                    <div>
                      {/* Simple tier progress logic for display */}
                      {(!user.loyaltyTier || user.loyaltyTier === 'Bronze') && (
                        <>
                          <div className="flex justify-between text-xs font-medium mb-2 text-indigo-100">
                            <span>Bronze</span>
                            <span>Silver (500 pts)</span>
                          </div>
                          <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${Math.min(100, ((user.totalPointsEarned || 0) / 500) * 100)}%` }}></div>
                          </div>
                          <p className="text-xs mt-2 text-indigo-200">
                            {Math.max(0, 500 - (user.totalPointsEarned || 0))} points to Silver
                          </p>
                        </>
                      )}
                      {user.loyaltyTier === 'Silver' && (
                        <>
                          <div className="flex justify-between text-xs font-medium mb-2 text-indigo-100">
                            <span>Silver</span>
                            <span>Gold (2000 pts)</span>
                          </div>
                          <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                            <div className="h-full bg-gray-300 rounded-full" style={{ width: `${Math.min(100, ((user.totalPointsEarned || 0) / 2000) * 100)}%` }}></div>
                          </div>
                          <p className="text-xs mt-2 text-indigo-200">
                            {Math.max(0, 2000 - (user.totalPointsEarned || 0))} points to Gold
                          </p>
                        </>
                      )}
                      {user.loyaltyTier === 'Gold' && (
                        <div className="flex items-center gap-2 text-yellow-300 font-bold">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.181a1 1 0 011.827.954L17.18 7.51l3.979 1.79a1 1 0 01-1.42 1.638l-4.223-1.9-1.517 2.84zm0 0L8.418 5.717l-4.223 1.9a1 1 0 01-1.42-1.638l3.98-1.79L5.32 3.86a1 1 0 011.826-.954l1.7 3.18L10 3.323V3a1 1 0 011-1z" clipRule="evenodd" /></svg>
                          <span>Top Tier Status Achieved!</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Card */}
              <div className="space-y-6">
                <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 h-full">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Account Status
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                      <span className="text-gray-600 font-medium text-sm">Verification</span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Verified
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                      <span className="text-gray-600 font-medium text-sm">Status</span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Active
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                      <span className="text-gray-600 font-medium text-sm">Role</span>
                      <span className="font-mono text-xs text-gray-500 uppercase">{user.role}</span>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      Security
                    </h3>
                    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-700 font-medium">Two-Factor Auth</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${user.isTwoFactorEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {user.isTwoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      {!user.isTwoFactorEnabled ? (
                        <button
                          onClick={handleEnable2FA}
                          className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-semibold text-sm transition-colors"
                        >
                          Enable 2FA
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            try {
                              await api.post('/auth/2fa/turn-off');
                              toast.success('Two-factor authentication disabled');
                              dispatch(getProfile());
                            } catch (err) {
                              toast.error('Failed to disable 2FA');
                            }
                          }}
                          className="w-full py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-semibold text-sm transition-colors"
                        >
                          Disable 2FA
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Activity Log */}
              <div className="lg:col-span-3">
                <UserActivityLog />
              </div>
            </div>

          ) : (
            <div className="max-w-2xl mx-auto mt-12 animate-fade-in">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all pl-12 bg-gray-50 focus:bg-white"
                        placeholder="John Doe"
                      />
                      <svg className="w-5 h-5 text-gray-400 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all pl-12 bg-gray-50 focus:bg-white disabled:bg-gray-100 disabled:text-gray-500"
                        placeholder="john@example.com"
                      />
                      <svg className="w-5 h-5 text-gray-400 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all pl-12 bg-gray-50 focus:bg-white"
                        placeholder="+1 234 567 8900"
                      />
                      <svg className="w-5 h-5 text-gray-400 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 ml-1">Optional. Standard charges may apply.</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-6 py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || (
                      formData.name === (user.name || '') &&
                      formData.email === (user.email || '') &&
                      formData.phone === (user.phone || '')
                    )}
                    className="flex-[1] px-6 py-3.5 bg-primary-600  rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/30 hover:shadow-primary-600/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-3xl border border-red-100 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Danger Zone
            </h3>
            <p className="text-gray-600">Permanently delete your account and all associated data. This action cannot be undone.</p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-6 py-3 bg-white border-2 border-red-100 text-red-600 rounded-xl font-bold hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all whitespace-nowrap"
          >
            Delete Account
          </button>
        </div>
      </div>

      {
        showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scale-up border border-gray-100">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">Delete Account?</h3>
              <p className="text-gray-500 mb-8 text-center leading-relaxed">
                This will permanently delete your account, orders, and preferences. To confirm, please enter your password below.
              </p>

              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none mb-6 transition-all"
                autoFocus
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                  }}
                  className="flex-1 px-5 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!deletePassword) {
                      toast.error('Password is required');
                      return;
                    }
                    try {
                      await dispatch(deleteAccount({
                        id: user._id || user.id,
                        password: deletePassword
                      })).unwrap();
                      toast.info('Account deleted');
                    } catch (err) {
                      toast.error(err.message || 'Failed to delete account');
                    }
                  }}
                  disabled={loading}
                  className="flex-1 px-5 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete It'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {
        showTwoFactorSetup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-scale-up border border-gray-100 text-center">
              <h3 className="text-xl font-bold mb-4">Setup 2FA</h3>
              <p className="text-sm text-gray-500 mb-4">Scan the QR code with Google Authenticator</p>
              {/* QR Code */}
              {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="mx-auto mb-4 w-48 h-48" />}

              {/* Links Block */}
              {otpauthUrl && (
                <a
                  href={otpauthUrl}
                  className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-bold text-sm transition-colors border border-blue-200"
                >
                  Open in Authenticator App ↗
                </a>
              )}

              {secret && (
                <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide font-bold">Manual Entry Secret</p>
                  <p className="font-mono text-sm font-bold text-gray-700 break-all select-all">{secret}</p>
                </div>
              )}

              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full px-4 py-2 border rounded-lg mb-4 text-center tracking-widest"
                maxLength={6}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowTwoFactorSetup(false)}
                  className="flex-1 py-2 bg-gray-100 rounded-lg font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerify2FA}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold"
                >
                  Verify
                </button>
              </div>

              {/* Debug Link Moved Here */}
              {debugUrl && (
                <div className="mt-4">
                  <a
                    href={debugUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 font-bold text-sm transition-colors border border-purple-200"
                  >
                    View 2FA Code on Ethereal Email ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        )
      }
    </div >
  );
};

export default Profile;