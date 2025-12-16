import React, { useState, useEffect } from 'react';
import api from '../../store/api/api';
import { toast } from 'react-toastify';
import './CouponManagement.css';

const CouponManagement = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        minPurchaseAmount: '',
        maxDiscountAmount: '',
        validFrom: '',
        validUntil: '',
        usageLimit: '',
        usageLimitPerUser: '1',
        firstTimeUserOnly: false,
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const response = await api.get('/coupons');
            setCoupons(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch coupons');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                ...formData,
                discountValue: parseFloat(formData.discountValue),
                minPurchaseAmount: formData.minPurchaseAmount ? parseFloat(formData.minPurchaseAmount) : undefined,
                maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : undefined,
                usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : 0,
                usageLimitPerUser: parseInt(formData.usageLimitPerUser),
            };

            if (editingCoupon) {
                await api.patch(`/coupons/${editingCoupon._id}`, payload);
            } else {
                await api.post('/coupons', payload);
            }

            resetForm();
            fetchCoupons();
        } catch (error) {
            const errorMessage = error.response?.data?.message;
            if (Array.isArray(errorMessage)) {
                errorMessage.forEach(msg => toast.error(msg));
            } else {
                toast.error(errorMessage || 'Failed to save coupon');
            }
            console.error('Coupon save error:', error);
        }
    };

    const handleEdit = (coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            description: coupon.description,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue.toString(),
            minPurchaseAmount: coupon.minPurchaseAmount?.toString() || '',
            maxDiscountAmount: coupon.maxDiscountAmount?.toString() || '',
            validFrom: new Date(coupon.validFrom).toISOString().slice(0, 16),
            validUntil: new Date(coupon.validUntil).toISOString().slice(0, 16),
            usageLimit: coupon.usageLimit?.toString() || '',
            usageLimitPerUser: coupon.usageLimitPerUser.toString(),
            firstTimeUserOnly: coupon.firstTimeUserOnly,
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;

        try {
            await api.delete(`/coupons/${id}`);
            fetchCoupons();
        } catch (error) {
            toast.error('Failed to delete coupon');
            console.error(error);
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            description: '',
            discountType: 'percentage',
            discountValue: '',
            minPurchaseAmount: '',
            maxDiscountAmount: '',
            validFrom: '',
            validUntil: '',
            usageLimit: '',
            usageLimitPerUser: '1',
            firstTimeUserOnly: false,
        });
        setEditingCoupon(null);
        setShowForm(false);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    return (
        <div className="coupon-management">
            {loading ? (
                <div className="loading">Loading coupons...</div>
            ) : (
                <>
                    <div className="header">
                        <h1>Coupon Management</h1>
                        <button
                            className="btn-primary"
                            onClick={() => setShowForm(!showForm)}
                        >
                            {showForm ? 'Cancel' : '+ Create Coupon'}
                        </button>
                    </div>

                    {showForm && (
                        <div className="coupon-form-container">
                            <h2>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h2>
                            <form onSubmit={handleSubmit} className="coupon-form">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Coupon Code *</label>
                                        <input
                                            type="text"
                                            name="code"
                                            value={formData.code}
                                            onChange={handleChange}
                                            required
                                            placeholder="SUMMER2024"
                                            maxLength={20}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Discount Type *</label>
                                        <select
                                            name="discountType"
                                            value={formData.discountType}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="percentage">Percentage</option>
                                            <option value="fixed">Fixed Amount</option>
                                            <option value="free_shipping">Free Shipping</option>
                                            <option value="bogo">Buy One Get One</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Discount Value *</label>
                                        <input
                                            type="number"
                                            name="discountValue"
                                            value={formData.discountValue}
                                            onChange={handleChange}
                                            required
                                            min="0"
                                            step="0.01"
                                            placeholder={formData.discountType === 'percentage' ? '10' : '50'}
                                        />
                                        <small>
                                            {formData.discountType === 'percentage' ? 'Percentage (0-100)' : 'Rupee amount'}
                                        </small>
                                    </div>

                                    <div className="form-group">
                                        <label>Min Purchase Amount</label>
                                        <input
                                            type="number"
                                            name="minPurchaseAmount"
                                            value={formData.minPurchaseAmount}
                                            onChange={handleChange}
                                            min="0"
                                            step="0.01"
                                            placeholder="100"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Max Discount Amount</label>
                                        <input
                                            type="number"
                                            name="maxDiscountAmount"
                                            value={formData.maxDiscountAmount}
                                            onChange={handleChange}
                                            min="0"
                                            step="0.01"
                                            placeholder="50"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Valid From *</label>
                                        <input
                                            type="datetime-local"
                                            name="validFrom"
                                            value={formData.validFrom}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Valid Until *</label>
                                        <input
                                            type="datetime-local"
                                            name="validUntil"
                                            value={formData.validUntil}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Total Usage Limit</label>
                                        <input
                                            type="number"
                                            name="usageLimit"
                                            value={formData.usageLimit}
                                            onChange={handleChange}
                                            min="0"
                                            placeholder="0 = unlimited"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Usage Limit Per User *</label>
                                        <input
                                            type="number"
                                            name="usageLimitPerUser"
                                            value={formData.usageLimitPerUser}
                                            onChange={handleChange}
                                            required
                                            min="1"
                                        />
                                    </div>

                                    <div className="form-group full-width">
                                        <label>Description *</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            required
                                            rows="3"
                                            placeholder="Get 20% off on all products"
                                        />
                                    </div>

                                    <div className="form-group checkbox-group">
                                        <label>
                                            <input
                                                type="checkbox"
                                                name="firstTimeUserOnly"
                                                checked={formData.firstTimeUserOnly}
                                                onChange={handleChange}
                                            />
                                            <span>First-time users only</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="button" onClick={resetForm} className="btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="coupons-list">
                        <h2>All Coupons ({coupons.length})</h2>
                        {coupons.length === 0 ? (
                            <p className="no-coupons">No coupons found. Create your first coupon!</p>
                        ) : (
                            <div className="coupons-grid">
                                {coupons.map((coupon) => (
                                    <div key={coupon._id} className={`coupon-card ${coupon.status}`}>
                                        <div className="coupon-header">
                                            <div className="coupon-code">{coupon.code}</div>
                                            <span className={`status-badge ${coupon.status}`}>
                                                {coupon.status}
                                            </span>
                                        </div>

                                        <p className="coupon-description">{coupon.description}</p>

                                        <div className="coupon-details">
                                            <div className="detail-item">
                                                <strong>Discount:</strong>
                                                <span>
                                                    {coupon.discountType === 'percentage'
                                                        ? `${coupon.discountValue}%`
                                                        : `₹${coupon.discountValue}`}
                                                </span>
                                            </div>

                                            <div className="detail-item">
                                                <strong>Valid Until:</strong>
                                                <span>{new Date(coupon.validUntil).toLocaleDateString()}</span>
                                            </div>

                                            <div className="detail-item">
                                                <strong>Usage:</strong>
                                                <span>
                                                    {coupon.usedCount} / {coupon.usageLimit || '∞'}
                                                </span>
                                            </div>

                                            {coupon.minPurchaseAmount > 0 && (
                                                <div className="detail-item">
                                                    <strong>Min Purchase:</strong>
                                                    <span>₹{coupon.minPurchaseAmount}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="coupon-actions">
                                            <button
                                                onClick={() => handleEdit(coupon)}
                                                className="btn-edit"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(coupon._id)}
                                                className="btn-delete"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default CouponManagement;
