import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './PaymentMethods.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBank, faPlus, faEdit, faTrash, faCheck, faSpinner, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';

const cx = classNames.bind(styles);

// Danh sách các ngân hàng phổ biến
const BANK_LIST = [
    { name: 'Vietcombank', code: 'VCB' },
    { name: 'BIDV', code: 'BIDV' },
    { name: 'VietinBank', code: 'CTG' },
    { name: 'Agribank', code: 'Agribank' },
    { name: 'VNPay', code: 'VNPAY' },
    { name: 'ABBank', code: 'ABB' },
    { name: 'Baoviet Bank', code: 'BVB' },
    { name: 'Ocean Bank', code: 'OceanBank' },
    { name: 'SCB', code: 'SCB' },
    { name: 'BIDC', code: 'BIDC' },
    { name: 'Viet A Bank', code: 'VAB' },
    { name: 'Eximbank', code: 'EXB' },
    { name: 'CoopBank', code: 'CoopBank' },
    { name: 'Vietbank', code: 'Vietbank' },
    { name: 'Public Bank', code: 'PUBLIC' },
    { name: 'Saigonbank', code: 'SGB' },
    { name: 'HDBank', code: 'HDB' },
    { name: 'IVB', code: 'IVB' },
    { name: 'Techcombank', code: 'TCB' },
    { name: 'MB', code: 'MB' },
    { name: 'VPBank', code: 'VPB' },
    { name: 'VIB', code: 'VIB' },
    { name: 'Sacombank', code: 'STB' },
    { name: 'TPBank', code: 'TPB' },
    { name: 'MSB', code: 'MSB' },
    { name: 'ACB', code: 'ACB' },
    { name: 'SHB', code: 'SHB' },
    { name: 'OCB', code: 'OCB' },
    { name: 'NCB', code: 'NCB' },
    { name: 'Ngân hàng Bản Việt', code: 'BVN' },
    { name: 'BAC A BANK', code: 'BAC' },
    { name: 'KienlongBank', code: 'KLB' },
    { name: 'PVcomBank', code: 'PVC' },
    { name: 'Woori Bank', code: 'Woori' },
    { name: 'LienVietPostBank', code: 'LVB' },
    { name: 'Shinhan Bank', code: 'Shinhan' },
    { name: 'Ting', code: 'Ting' },
    { name: 'VTC Pay', code: 'VTC' },
    { name: 'Bakim', code: 'Bakim' },
    { name: 'PayME', code: 'PayME' },
    { name: 'Viettel Money', code: 'Viettel' },
    { name: 'Viettel Money', code: 'VTM' },
    { name: 'Appota', code: 'Appota' },
    { name: 'VIMASS', code: 'VIMASS' },
    { name: 'MobiFone Money', code: 'Mobifone' },
    { name: 'Foxpay', code: 'Foxpay' },
    { name: 'Gpay', code: 'Gpay' },
];

function PaymentMethods() {
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePaymentMethodId, setDeletePaymentMethodId] = useState(null);

    // Form fields
    const [formData, setFormData] = useState({
        bankAccountNumber: '',
        bankAccountName: '',
        bankName: '',
        bankCode: '',
        isDefault: false,
    });

    const customerId = localStorage.getItem('customerId');
    const token = localStorage.getItem('token') || '';
    const refreshToken = localStorage.getItem('refreshToken') || '';

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'RefreshToken': refreshToken,
    };

    useEffect(() => {
        fetchPaymentMethods();
    }, []);

    // Fetch danh sách Tài Khoản thanh toán
    const fetchPaymentMethods = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5122/api/CustomerPaymentInfo/get-list', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    pageNo: 1,
                    pageSize: 100,
                    customerId: parseInt(customerId),
                }),
            });

            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            if (response.ok) {
                const data = await response.json();
                setPaymentMethods(data.baseDatas || []);
                setError(null);
            } else {
                setError('Không thể tải danh sách Tài Khoản thanh toán');
            }
        } catch (err) {
            console.error('Error fetching payment methods:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle form input change
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // Xử lý khi chọn ngân hàng
    const handleBankSelect = (e) => {
        const selectedBankName = e.target.value;
        const selectedBank = BANK_LIST.find(bank => bank.name === selectedBankName);
        
        if (selectedBank) {
            setFormData(prev => ({
                ...prev,
                bankName: selectedBank.name,
                bankCode: selectedBank.code,
            }));
        }
    };

    // Tạo Tài Khoản thanh toán mới
    const handleCreatePaymentMethod = async () => {
        if (!formData.bankAccountNumber.trim() || !formData.bankAccountName.trim() || !formData.bankName.trim() || !formData.bankCode.trim()) {
            setSuccessMessage('❌ Vui lòng điền đầy đủ thông tin');
            setTimeout(() => setSuccessMessage(null), 2000);
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await fetch('http://localhost:5122/api/CustomerPaymentInfo/create', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    customerId: parseInt(customerId),
                    bankAccountNumber: formData.bankAccountNumber.trim(),
                    bankAccountName: formData.bankAccountName.trim(),
                    bankName: formData.bankName.trim(),
                    bankCode: formData.bankCode.trim(),
                }),
            });

            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            const data = await response.json();

            if (data.success) {
                setSuccessMessage('✓ Thêm Tài Khoản thanh toán thành công');
                resetForm();
                await fetchPaymentMethods();
            } else {
                setSuccessMessage(`❌ ${data.message || 'Thêm Tài Khoản thanh toán thất bại'}`);
            }
        } catch (err) {
            console.error('Error creating payment method:', err);
            setSuccessMessage(`❌ Lỗi: ${err.message}`);
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    };

    // Cập nhật Tài Khoản thanh toán
    const handleUpdatePaymentMethod = async () => {
        if (!formData.bankAccountNumber.trim() || !formData.bankAccountName.trim() || !formData.bankName.trim() || !formData.bankCode.trim()) {
            setSuccessMessage('❌ Vui lòng điền đầy đủ thông tin');
            setTimeout(() => setSuccessMessage(null), 2000);
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await fetch('http://localhost:5122/api/CustomerPaymentInfo/update', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    id: editingId,
                    customerId: parseInt(customerId),
                    bankAccountNumber: formData.bankAccountNumber.trim(),
                    bankAccountName: formData.bankAccountName.trim(),
                    bankName: formData.bankName.trim(),
                    bankCode: formData.bankCode.trim(),
                    isDefault: formData.isDefault,
                }),
            });

            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            const data = await response.json();

            if (data.success) {
                setSuccessMessage('✓ Cập nhật Tài Khoản thanh toán thành công');
                resetForm();
                await fetchPaymentMethods();
            } else {
                setSuccessMessage(`❌ ${data.message || 'Cập nhật Tài Khoản thanh toán thất bại'}`);
            }
        } catch (err) {
            console.error('Error updating payment method:', err);
            setSuccessMessage(`❌ Lỗi: ${err.message}`);
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    };

    // Xóa Tài Khoản thanh toán
    const handleDeletePaymentMethod = (id) => {
        setDeletePaymentMethodId(id);
        setShowDeleteModal(true);
    };

    // Xác nhận xóa Tài Khoản thanh toán
    const confirmDelete = async () => {
        if (!deletePaymentMethodId) return;

        try {
            setIsSubmitting(true);
            const response = await fetch('http://localhost:5122/api/CustomerPaymentInfo/delete', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ id: deletePaymentMethodId }),
            });

            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            const data = await response.json();

            if (data.success) {
                setSuccessMessage('✓ Xóa Tài Khoản thanh toán thành công');
                setShowDeleteModal(false);
                setDeletePaymentMethodId(null);
                await fetchPaymentMethods();
            } else {
                setSuccessMessage(`❌ ${data.message || 'Xóa Tài Khoản thanh toán thất bại'}`);
            }
        } catch (err) {
            console.error('Error deleting payment method:', err);
            setSuccessMessage(`❌ Lỗi: ${err.message}`);
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    };

    // Bắt đầu chỉnh sửa
    const handleEditPaymentMethod = (method) => {
        setEditingId(method.id);
        setFormData({
            bankAccountNumber: method.bankAccountNumber,
            bankAccountName: method.bankAccountName,
            bankName: method.bankName,
            bankCode: method.bankCode,
            isDefault: method.isDefault || false,
        });
        setShowForm(true);
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            bankAccountNumber: '',
            bankAccountName: '',
            bankName: '',
            bankCode: '',
            isDefault: false,
        });
        setEditingId(null);
        setShowForm(false);
    };

    return (
        <div className={cx('payment-methods')}>
            {successMessage && <SuccessMessage message={successMessage} />}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <FontAwesomeIcon icon={faBank} style={{ fontSize: '28px', color: '#667eea' }} />
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e1e1e' }}>
                    Tài Khoản Thanh Toán
                </h2>
            </div>

            {/* Loading State */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <FontAwesomeIcon icon={faSpinner} style={{ fontSize: '32px', color: '#667eea', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
                    <p style={{ color: '#666' }}>Đang tải...</p>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div style={{
                    backgroundColor: '#FEF5F5',
                    border: '1px solid #E8D0D0',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '24px',
                }}>
                    <FontAwesomeIcon icon={faExclamationCircle} style={{ fontSize: '20px', color: '#C85A54', marginTop: '2px' }} />
                    <div>
                        <h4 style={{ margin: '0 0 4px 0', color: '#C85A54' }}>Lỗi</h4>
                        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{error}</p>
                    </div>
                </div>
            )}

            {!loading && (
                <>
                    {/* Add New Button */}
                    <button
                        onClick={() => {
                            if (showForm && !editingId) {
                                resetForm();
                            } else {
                                resetForm();
                                setShowForm(true);
                            }
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 20px',
                            borderRadius: '8px',
                            border: '2px solid #667eea',
                            backgroundColor: showForm && !editingId ? '#667eea' : '#fff',
                            color: showForm && !editingId ? '#fff' : '#667eea',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            marginBottom: '24px',
                        }}
                        onMouseEnter={(e) => {
                            if (!(showForm && !editingId)) {
                                e.currentTarget.style.backgroundColor = '#667eea';
                                e.currentTarget.style.color = '#fff';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!(showForm && !editingId)) {
                                e.currentTarget.style.backgroundColor = '#fff';
                                e.currentTarget.style.color = '#667eea';
                            }
                        }}
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        {showForm && !editingId ? 'Hủy Thêm Mới' : 'Thêm Tài Khoản Thanh Toán'}
                    </button>

                    {/* Form */}
                    {showForm && (
                        <div style={{
                            backgroundColor: '#FAF8FF',
                            border: '1px solid #EEE8FF',
                            borderRadius: '12px',
                            padding: '24px',
                            marginBottom: '24px',
                        }}>
                            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: '#1e1e1e' }}>
                                {editingId ? '✏️ Chỉnh Sửa Tài Khoản Thanh Toán' : '➕ Thêm Tài Khoản Thanh Toán Mới'}
                            </h3>

                            {/* Bank Name - Select Dropdown */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                                    Tên Ngân Hàng *
                                </label>
                                <select
                                    value={formData.bankName}
                                    onChange={handleBankSelect}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #DDD',
                                        fontSize: '14px',
                                        boxSizing: 'border-box',
                                        transition: 'all 0.3s ease',
                                        backgroundColor: '#fff',
                                        cursor: 'pointer',
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = '#667eea';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = '#DDD';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <option value="">-- Chọn ngân hàng --</option>
                                    {BANK_LIST.map((bank, idx) => (
                                        <option key={idx} value={bank.name}>
                                            {bank.name} ({bank.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Bank Code - Read Only (Auto-filled) */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                                    Mã Ngân Hàng (Tự động) *
                                </label>
                                <input
                                    type="text"
                                    value={formData.bankCode}
                                    readOnly
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #E0E0E0',
                                        fontSize: '14px',
                                        boxSizing: 'border-box',
                                        backgroundColor: '#F5F5F5',
                                        color: '#666',
                                        cursor: 'not-allowed',
                                    }}
                                />
                            </div>

                            {/* Account Name */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                                    Tên Chủ Tài Khoản *
                                </label>
                                <input
                                    type="text"
                                    name="bankAccountName"
                                    value={formData.bankAccountName}
                                    onChange={handleInputChange}
                                    placeholder="Tên đầy đủ tổ chức/cá nhân"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #DDD',
                                        fontSize: '14px',
                                        boxSizing: 'border-box',
                                        transition: 'all 0.3s ease',
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = '#667eea';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = '#DDD';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                            </div>

                            {/* Account Number */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                                    Số Tài Khoản *
                                </label>
                                <input
                                    type="text"
                                    name="bankAccountNumber"
                                    value={formData.bankAccountNumber}
                                    onChange={handleInputChange}
                                    placeholder="Số tài khoản ngân hàng"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #DDD',
                                        fontSize: '14px',
                                        boxSizing: 'border-box',
                                        transition: 'all 0.3s ease',
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = '#667eea';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = '#DDD';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                            </div>

                            {/* Default Checkbox */}
                            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="checkbox"
                                    name="isDefault"
                                    checked={formData.isDefault}
                                    onChange={handleInputChange}
                                    id="isDefault"
                                    style={{
                                        width: '18px',
                                        height: '18px',
                                        cursor: 'pointer',
                                        accentColor: '#667eea',
                                    }}
                                />
                                <label htmlFor="isDefault" style={{ fontSize: '14px', color: '#333', cursor: 'pointer', margin: 0 }}>
                                    Đặt làm Tài Khoản thanh toán mặc định
                                </label>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={resetForm}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #DDD',
                                        backgroundColor: '#fff',
                                        color: '#666',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#F5F5F5';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#fff';
                                    }}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={editingId ? handleUpdatePaymentMethod : handleCreatePaymentMethod}
                                    disabled={isSubmitting}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '2px solid #667eea',
                                        backgroundColor: isSubmitting ? '#E8E0FF' : '#667eea',
                                        color: isSubmitting ? '#999' : '#fff',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.3s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSubmitting) {
                                            e.currentTarget.style.backgroundColor = '#764ba2';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isSubmitting) {
                                            e.currentTarget.style.backgroundColor = '#667eea';
                                        }
                                    }}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} style={{ animation: 'spin 1s linear infinite' }} />
                                            Đang Xử Lý...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faCheck} />
                                            {editingId ? 'Cập Nhật' : 'Thêm Mới'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Payment Methods List */}
                    {paymentMethods.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {paymentMethods.map((method, index) => (
                                <div
                                    key={method.id}
                                    style={{
                                        backgroundColor: method.isDefault ? '#FAF8FF' : '#fff',
                                        border: method.isDefault ? '2px solid #667eea' : '1px solid #E8E0FF',
                                        borderRadius: '12px',
                                        padding: '20px',
                                        position: 'relative',
                                    }}
                                >
                                    {/* Default Badge */}
                                    {method.isDefault && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '12px',
                                            right: '12px',
                                            backgroundColor: '#667eea',
                                            color: '#fff',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                        }}>
                                            <FontAwesomeIcon icon={faCheck} />
                                            Mặc định
                                        </div>
                                    )}

                                    {/* Bank Info */}
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <FontAwesomeIcon icon={faBank} style={{ fontSize: '18px', color: '#667eea' }} />
                                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e1e1e' }}>
                                                {method.bankName} ({method.bankCode})
                                            </h4>
                                        </div>
                                        <div style={{ marginLeft: '26px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ fontSize: '14px', color: '#666' }}>
                                                <span style={{ fontWeight: '600' }}>Chủ tài khoản:</span> {method.bankAccountName}
                                            </div>
                                            <div style={{ fontSize: '14px', color: '#666' }}>
                                                <span style={{ fontWeight: '600' }}>Số tài khoản:</span> {method.bankAccountNumber}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                        <button
                                            onClick={() => handleEditPaymentMethod(method)}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                borderRadius: '6px',
                                                border: '1px solid #667eea',
                                                backgroundColor: '#fff',
                                                color: '#667eea',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#667eea';
                                                e.currentTarget.style.color = '#fff';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = '#fff';
                                                e.currentTarget.style.color = '#667eea';
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                            Chỉnh Sửa
                                        </button>
                                        <button
                                            onClick={() => handleDeletePaymentMethod(method.id)}
                                            disabled={method.isDefault}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                borderRadius: '6px',
                                                border: `1px solid ${method.isDefault ? '#CCC' : '#C85A54'}`,
                                                backgroundColor: method.isDefault ? '#F5F5F5' : '#fff',
                                                color: method.isDefault ? '#999' : '#C85A54',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                cursor: method.isDefault ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.3s ease',
                                                opacity: method.isDefault ? 0.6 : 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!method.isDefault) {
                                                    e.currentTarget.style.backgroundColor = '#C85A54';
                                                    e.currentTarget.style.color = '#fff';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!method.isDefault) {
                                                    e.currentTarget.style.backgroundColor = '#fff';
                                                    e.currentTarget.style.color = '#C85A54';
                                                }
                                            }}
                                            title={method.isDefault ? 'Không thể xóa Tài Khoản thanh toán mặc định' : ''}
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px 20px',
                            backgroundColor: '#FAF8FF',
                            borderRadius: '12px',
                            border: '1px dashed #EEE8FF',
                        }}>
                            <FontAwesomeIcon icon={faBank} style={{ fontSize: '40px', color: '#D8D0E8', marginBottom: '12px' }} />
                            <p style={{ fontSize: '16px', fontWeight: '600', color: '#999', margin: '8px 0' }}>
                                Chưa có Tài Khoản thanh toán
                            </p>
                            <p style={{ fontSize: '14px', color: '#BBB', margin: 0 }}>
                                Hãy thêm Tài Khoản thanh toán để có thể sử dụng các dịch vụ thanh toán
                            </p>
                        </div>
                    )}
                </>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div style={{
                        backgroundColor: '#fff',
                        borderRadius: '16px',
                        padding: '32px',
                        maxWidth: '420px',
                        width: '90%',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                        animation: 'slideIn 0.3s ease-out',
                    }}>
                        {/* Icon */}
                        <div style={{
                            textAlign: 'center',
                            marginBottom: '20px',
                        }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                backgroundColor: '#FEF5F5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto',
                                fontSize: '32px',
                            }}>
                                ⚠️
                            </div>
                        </div>

                        {/* Title */}
                        <h3 style={{
                            margin: '0 0 12px 0',
                            fontSize: '20px',
                            fontWeight: '700',
                            color: '#1e1e1e',
                            textAlign: 'center',
                        }}>
                            Xóa Tài Khoản Thanh Toán?
                        </h3>

                        {/* Message */}
                        <p style={{
                            margin: '0 0 24px 0',
                            fontSize: '14px',
                            color: '#666',
                            textAlign: 'center',
                            lineHeight: '1.6',
                        }}>
                            Bạn chắc chắn muốn xóa Tài Khoản thanh toán này? Hành động này không thể hoàn tác.
                        </p>

                        {/* Action Buttons */}
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                        }}>
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeletePaymentMethodId(null);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    border: '1px solid #E0E0E0',
                                    backgroundColor: '#fff',
                                    color: '#666',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#F5F5F5';
                                    e.currentTarget.style.borderColor = '#DDD';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#fff';
                                    e.currentTarget.style.borderColor = '#E0E0E0';
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isSubmitting}
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: isSubmitting ? '#D8D0E8' : '#C85A54',
                                    color: '#fff',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSubmitting) {
                                        e.currentTarget.style.backgroundColor = '#A84A44';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSubmitting) {
                                        e.currentTarget.style.backgroundColor = '#C85A54';
                                    }
                                }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} style={{ animation: 'spin 1s linear infinite' }} />
                                        Đang Xóa...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faTrash} />
                                        Xóa
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PaymentMethods;
