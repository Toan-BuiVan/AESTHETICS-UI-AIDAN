
import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './AwaitingPayment.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faTimes, faCreditCard, faWallet, faTruck, faMoneyBill, faSpinner, faBox, faStethoscope, faClock, faCheckCircle, faExclamationCircle, faChevronRight, faCalendarAlt, faUndo, faImage } from '@fortawesome/free-solid-svg-icons';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';
import useDebounce from '~/hooks/useDebounce';

const cx = classNames.bind(styles);

function AwaitingPayment({ onCountChange }) {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedInvoice, setExpandedInvoice] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [selectedType, setSelectedType] = useState(null); // null, 'BanHang', 'DichVu'
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const pageSize = 6;
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [invoiceIdToCancel, setInvoiceIdToCancel] = useState(null);
    const debouncedPaymentMethod = useDebounce(selectedPaymentMethod, 3000);

    // Refund states
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [selectedInvoiceForRefund, setSelectedInvoiceForRefund] = useState(null);
    const [refundReason, setRefundReason] = useState('');
    const [refundImages, setRefundImages] = useState([]);
    const [refundMethod, setRefundMethod] = useState('TienMat');
    const [isProcessingRefund, setIsProcessingRefund] = useState(false);
    const refundFormData = {
        reason: refundReason,
        images: refundImages.length,
        method: refundMethod,
        timestamp: Date.now(),
    };
    const debouncedRefundData = useDebounce(refundFormData, 3000);

    // Hàm gọi API getinvoicelist
    const fetchInvoices = async (type, page = 1, status = 'ChuaThanhToan') => {
        try {
            setLoading(true);
            const customerId = localStorage.getItem('customerId');
            const token = localStorage.getItem('token') || '';
            const refreshToken = localStorage.getItem('refreshToken') || '';

            if (!customerId) {
                setLoading(false);
                return;
            }

            const requestData = {
                pageNo: page,
                pageSize: pageSize,
                customerId: parseInt(customerId),
                staffId: null,
                type: type,
                status: status,
                startDate: null,
                endDate: null,
            };

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
                'RefreshToken': refreshToken,
            };

            const response = await fetch('http://localhost:5122/api/Invoice/getinvoicelist', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error('Lỗi khi gọi API');
            }

            const result = await response.json();
            console.log('Invoice list response:', result);

            const invoiceList = result.baseDatas || [];
            setInvoices(invoiceList);
            setTotalRecords(result.totalRecordCount || 0);
            setTotalPages(result.pageCount || 1);
            setCurrentPage(result.pageIndex || 1);
            onCountChange(invoiceList.length);
            setLoading(false);
        } catch (err) {
            console.error('Lỗi khi lấy danh sách hóa đơn:', err);
            setLoading(false);
        }
    };

    // Fetch invoices khi component mount hoặc type thay đổi
    useEffect(() => {
        fetchInvoices(selectedType, 1, 'ChuaThanhToan');
    }, [selectedType]);

    // Effect để gọi API khi payment method được chọn
    useEffect(() => {
        if (debouncedPaymentMethod && selectedInvoice) {
            handlePaymentSubmit();
        }
    }, [debouncedPaymentMethod]);

    // Refund Effect - Auto-submit refund after 3 seconds of typing
    useEffect(() => {
        if (!showReturnModal || !selectedInvoiceForRefund || !refundReason.trim() || !refundMethod || refundImages.length === 0 || isProcessingRefund) {
            return;
        }

        const submitRefund = async () => {
            try {
                setIsProcessingRefund(true);
                const token = localStorage.getItem('token') || '';
                const refreshToken = localStorage.getItem('refreshToken') || '';
                const customerId = localStorage.getItem('customerId');

                const headers = {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                    'RefreshToken': refreshToken,
                };

                const requestData = {
                    invoiceId: selectedInvoiceForRefund.invoice.id,
                    customerId: parseInt(customerId),
                    refundReason: refundReason.trim(),
                    refundImages: refundImages.join(';'),
                    refundMethod: refundMethod,
                };

                const response = await fetch('http://localhost:5122/api/Refund/create', {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(requestData),
                });

                if (!response.ok) {
                    throw new Error('Lỗi khi gửi yêu cầu hoàn tiền');
                }

                const result = await response.json();
                console.log('Refund response:', result);

                // Reset form and close modal
                if (result.success) {
                    setRefundReason('');
                    setRefundImages([]);
                    setRefundMethod('TienMat');
                    setShowReturnModal(false);
                    setSelectedInvoiceForRefund(null);
                    setSuccessMessage('✓ Yêu cầu hoàn tiền đã được gửi thành công');
                    setTimeout(() => setSuccessMessage(null), 3000);
                    
                    // Refresh invoices list
                    fetchInvoices(selectedType, currentPage, 'ChuaThanhToan');
                } else {
                    setSuccessMessage(`❌ ${result.message || 'Gửi yêu cầu hoàn tiền thất bại'}`);
                }
                setIsProcessingRefund(false);
            } catch (err) {
                console.error('Lỗi khi hoàn tiền:', err);
                setSuccessMessage(`❌ Lỗi: ${err.message}`);
                setIsProcessingRefund(false);
                setTimeout(() => setSuccessMessage(null), 3000);
            }
        };

        submitRefund();
    }, [debouncedRefundData, showReturnModal, selectedInvoiceForRefund]);

    // Xử lý click button "Sản phẩm"
    const handleFilterProduct = () => {
        setSelectedType(selectedType === 'BanHang' ? null : 'BanHang');
        setCurrentPage(1);
    };

    // Xử lý click button "Dịch vụ"
    const handleFilterService = () => {
        setSelectedType(selectedType === 'DichVu' ? null : 'DichVu');
        setCurrentPage(1);
    };



    // Xử lý toggle expand details
    const handleToggleDetails = (invoiceID) => {
        setExpandedInvoice(expandedInvoice === invoiceID ? null : invoiceID);
    };

    // Phân trang - trang trước
    const handlePrevPage = () => {
        if (currentPage > 1) {
            fetchInvoices(selectedType, currentPage - 1, 'ChuaThanhToan');
        }
    };

    // Phân trang - trang sau
    const handleNextPage = () => {
        if (currentPage < totalPages) {
            fetchInvoices(selectedType, currentPage + 1, 'ChuaThanhToan');
        }
    };

    // Xử lý mở payment modal
    const handleOpenPaymentModal = (invoice) => {
        setSelectedInvoice(invoice);
        setShowPaymentModal(true);
        setSelectedPaymentMethod(null);
    };

    // Xử lý đóng payment modal
    const handleClosePaymentModal = () => {
        setShowPaymentModal(false);
        setSelectedInvoice(null);
        setSelectedPaymentMethod(null);
        setPaymentLoading(false);
    };

    // Xử lý chọn phương thức thanh toán
    const handleSelectPaymentMethod = (method) => {
        setSelectedPaymentMethod(method);
    };

    // Xử lý gọi API thanh toán
    const handlePaymentSubmit = async () => {
        if (!selectedPaymentMethod || !selectedInvoice) return;

        try {
            setPaymentLoading(true);
            const token = localStorage.getItem('token') || '';
            const refreshToken = localStorage.getItem('refreshToken') || '';

            // Xử lý thanh toán khi nhận hàng (COD)
            if (selectedPaymentMethod === 'cod') {
                setSuccessMessage('Đơn hàng của bạn sẽ được giao. Thanh toán khi nhận hàng!');
                setPaymentLoading(false);
                handleClosePaymentModal();
                setTimeout(() => {
                    setSuccessMessage(null);
                    fetchInvoices(selectedType, currentPage, 'ChuaThanhToan');
                }, 2000);
                return;
            }

            const apiUrl = selectedPaymentMethod === 'vnpay'
                ? 'http://localhost:5122/api/InvoicePayment/vnpay/create-payment-url'
                : 'http://localhost:5122/api/InvoicePayment/momo/create-payment-url';

            const requestData = {
                invoiceId: selectedInvoice.invoice.id,
            };

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
                'RefreshToken': refreshToken,
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error('Lỗi khi gọi API thanh toán');
            }

            const result = await response.json();
            console.log('Payment response:', result);

            // Nếu API trả về URL, điều hướng đến đó
            if (result.data && result.data.paymentUrl) {
                window.location.href = result.data.paymentUrl;
            } else if (result.paymentUrl) {
                window.location.href = result.paymentUrl;
            } else {
                console.error('Không có URL thanh toán trong response');
            }

            setPaymentLoading(false);
            handleClosePaymentModal();
        } catch (err) {
            console.error('Lỗi khi xử lý thanh toán:', err);
            setPaymentLoading(false);
        }
    };

    // Xử lý mở refund modal
    const handleReturnProduct = (invoice) => {
        setSelectedInvoiceForRefund(invoice);
        setShowReturnModal(true);
        setRefundReason('');
    };

    // Xử lý đóng refund modal
    const handleCloseReturnModal = () => {
        setShowReturnModal(false);
        setSelectedInvoiceForRefund(null);
        setRefundReason('');
        setRefundImages([]);
        setRefundMethod('TienMat');
        setIsProcessingRefund(false);
    };

    // Xử lý chọn hình ảnh hoàn tiền
    const handleRefundImageSelect = (e) => {
        const files = Array.from(e.target.files || []);
        const newImages = [];
        let processedCount = 0;

        files.forEach((file) => {
            if (!file.type.startsWith('image/')) {
                console.warn(`Tệp ${file.name} không phải là hình ảnh, sẽ bị bỏ qua`);
                processedCount++;
                if (processedCount === files.length) {
                    setRefundImages(newImages);
                }
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                newImages.push(reader.result);
                processedCount++;
                if (processedCount === files.length) {
                    setRefundImages(newImages);
                }
            };
            reader.onerror = () => {
                console.error(`Lỗi đọc tệp ${file.name}`);
                processedCount++;
                if (processedCount === files.length) {
                    setRefundImages(newImages);
                }
            };
            reader.readAsDataURL(file);
        });

        if (files.length === 0) {
            setRefundImages([]);
        }
    };

    // Xóa hình ảnh hoàn tiền
    const handleRemoveRefundImage = (index) => {
        setRefundImages((prev) => prev.filter((_, i) => i !== index));
    };

    // Hàm kiểm tra xem có sản phẩm trong đơn hàng không
    const hasProducts = (invoiceDetails) => {
        return invoiceDetails && invoiceDetails.some(detail => detail.type === 'BanHang' && detail.productId);
    };

    // Hàm kiểm tra xem có thể hiển thị button hoàn tiền
    const canShowRefundButton = (invoice, invoiceDetails) => {
        // AwaitingPayment: Hiển thị button nếu có serviceId
        const hasServiceId = invoiceDetails && invoiceDetails.some(detail => detail.serviceId);
        return hasServiceId;
    };

    const isRefundDisabled = (invoice) => {
        // Disable button khi isRefund = true hoặc paidAmount <= 0
        return invoice.isRefund === true || invoice.paidAmount <= 0;
    };

    // Xử lý hủy thanh toán hóa đơn
    const handleCancelInvoice = (invoiceId) => {
        setInvoiceIdToCancel(invoiceId);
        setShowCancelConfirm(true);
    };

    // Xác nhận hủy hóa đơn
    const handleConfirmCancel = async () => {
        if (!invoiceIdToCancel) return;

        try {
            const token = localStorage.getItem('token') || '';
            const refreshToken = localStorage.getItem('refreshToken') || '';

            const requestData = {
                invoiceId: invoiceIdToCancel,
                newStatus: 'KhachHuy',
            };

            const response = await fetch('http://localhost:5122/api/Invoice/updatestatus', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                    'RefreshToken': refreshToken,
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error('Lỗi khi hủy hóa đơn');
            }

            setSuccessMessage('Hủy hóa đơn thành công!');
            setShowCancelConfirm(false);
            setInvoiceIdToCancel(null);
            setTimeout(() => {
                setSuccessMessage(null);
                fetchInvoices(selectedType, currentPage, 'ChuaThanhToan');
            }, 2000);
        } catch (err) {
            console.error('Lỗi khi hủy hóa đơn:', err);
            setErrorMessage('Hủy hóa đơn thất bại. Vui lòng thử lại sau!');
            setShowCancelConfirm(false);
            setInvoiceIdToCancel(null);
            setTimeout(() => {
                setErrorMessage(null);
            }, 3000);
        }
    };

    // Đóng cancel confirmation modal
    const handleCloseCancelConfirm = () => {
        setShowCancelConfirm(false);
        setInvoiceIdToCancel(null);
    };

    // Hàm format tiền tệ
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    return (
        <div className={cx('awaiting-payment')}>
            {successMessage && <SuccessMessage message={successMessage} />}
            
            {/* Error Message Notification */}
            {errorMessage && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    backgroundColor: '#FF6B6B',
                    color: '#fff',
                    padding: '16px 20px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    zIndex: 1001,
                    animation: 'slideInRight 0.3s ease',
                }}>
                    <FontAwesomeIcon icon={faExclamationCircle} style={{ fontSize: '18px' }} />
                    <span style={{ fontWeight: '500', fontSize: '14px' }}>{errorMessage}</span>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
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
                    zIndex: 1002,
                    animation: 'fadeIn 0.3s ease',
                }}>
                    <div style={{
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        padding: '32px',
                        maxWidth: '420px',
                        width: '90%',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                        textAlign: 'center',
                    }}>
                        <div style={{
                            fontSize: '48px',
                            color: '#FF6B6B',
                            marginBottom: '16px',
                            display: 'flex',
                            justifyContent: 'center',
                        }}>
                            <FontAwesomeIcon icon={faExclamationCircle} />
                        </div>
                        
                        <h3 style={{
                            margin: '0 0 12px 0',
                            fontSize: '20px',
                            fontWeight: '700',
                            color: '#1e1e1e',
                        }}>
                            Xác nhận hủy hóa đơn
                        </h3>
                        
                        <p style={{
                            margin: '0 0 24px 0',
                            fontSize: '14px',
                            color: '#666',
                            lineHeight: '1.6',
                        }}>
                            Bạn chắc chắn muốn hủy hóa đơn này? <br />
                            <strong style={{ color: '#FF6B6B' }}>Hành động này không thể hoàn tác</strong>
                        </p>

                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'center',
                        }}>
                            <button
                                onClick={handleCloseCancelConfirm}
                                style={{
                                    padding: '10px 24px',
                                    backgroundColor: '#E8E8E8',
                                    color: '#1e1e1e',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#D0D0D0';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#E8E8E8';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <FontAwesomeIcon icon={faTimes} style={{ marginRight: '6px' }} />
                                Hủy
                            </button>
                            
                            <button
                                onClick={handleConfirmCancel}
                                style={{
                                    padding: '10px 24px',
                                    backgroundColor: '#FF6B6B',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#E85555';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#FF6B6B';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <FontAwesomeIcon icon={faExclamationCircle} style={{ marginRight: '6px' }} />
                                Xác nhận hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Header with Tabs */}
            <div className={cx('header')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <FontAwesomeIcon icon={faMoneyBill} style={{ fontSize: '28px', color: '#6B63B5' }} />
                    <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>Hóa Đơn Thanh Toán</h3>
                </div>
                
                {/* Title */}
                <div style={{ fontSize: '14px', color: '#999', marginTop: '12px' }}>
                    <FontAwesomeIcon icon={faExclamationCircle} style={{ marginRight: '6px' }} />
                    Danh sách hóa đơn chờ thanh toán ({totalRecords})
                </div>
            </div>

            {/* Smart Filter Buttons */}
            <div className={cx('filter-buttons')}>
                    <button
                        className={cx('filter-btn', { active: selectedType === 'BanHang' })}
                        onClick={handleFilterProduct}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: selectedType === 'BanHang' ? '600' : '500',
                            transition: 'all 0.3s ease',
                        }}
                    >
                        <FontAwesomeIcon icon={faBox} />
                        <span>Sản phẩm</span>
                        {selectedType === 'BanHang' && <FontAwesomeIcon icon={faCheckCircle} style={{ marginLeft: '4px' }} />}
                    </button>
                    <button
                        className={cx('filter-btn', { active: selectedType === 'DichVu' })}
                        onClick={handleFilterService}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: selectedType === 'DichVu' ? '600' : '500',
                            transition: 'all 0.3s ease',
                        }}
                    >
                        <FontAwesomeIcon icon={faStethoscope} />
                        <span>Dịch vụ</span>
                        {selectedType === 'DichVu' && <FontAwesomeIcon icon={faCheckCircle} style={{ marginLeft: '4px' }} />}
                    </button>
                </div>

            {/* Loading State */}
            {loading ? (
                <div className={cx('loading')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
                    <FontAwesomeIcon 
                        icon={faSpinner} 
                        className={cx('spinner')} 
                        style={{ fontSize: '48px', color: '#6B63B5', marginBottom: '16px', animation: 'spin 1s linear infinite' }}
                    />
                    <p style={{ fontSize: '16px', color: '#666', margin: '0' }}>Đang tải dữ liệu hóa đơn...</p>
                </div>
            ) : invoices.length === 0 ? (
                <div className={cx('empty-state')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
                    <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '56px', color: '#4CAF50', marginBottom: '16px', opacity: 0.7 }} />
                    <p style={{ fontSize: '18px', fontWeight: '600', color: '#333', margin: '8px 0 16px 0' }}>Tuyệt vời!</p>
                    <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>Bạn không có hóa đơn nào chờ thanh toán</p>
                </div>
            ) : (
                <>
                    {/* Invoice List with Grid */}
                    <div className={cx('invoice-list')} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100%, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        {invoices.map((item) => (
                            <div key={item.invoice.id} className={cx('invoice-card')} style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'all 0.3s ease', backgroundColor: '#fff' }}>
                                {/* Premium Invoice Header */}
                                <div
                                    className={cx('invoice-header')}
                                    onClick={() => handleToggleDetails(item.invoice.id)}
                                    style={{
                                        padding: '18px 20px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        borderBottom: expandedInvoice === item.invoice.id ? '2px solid #6B63B5' : '1px solid #E8E8E8',
                                        transition: 'all 0.3s ease',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8F8FA'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <div className={cx('invoice-info')} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: '20px' }}>
                                        {/* Left: Invoice ID & Type */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '4px', height: '40px', backgroundColor: item.invoice.type === 'BanHang' ? '#3498db' : '#9b59b6', borderRadius: '2px' }}></div>
                                            <div>
                                                <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e1e1e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    #{item.invoice.id}
                                                    <span style={{ fontSize: '12px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px', backgroundColor: item.invoice.type === 'BanHang' ? '#DBF0FE' : '#EDD5FF', color: item.invoice.type === 'BanHang' ? '#0066CC' : '#7C3AED' }}>
                                                        {item.invoice.type === 'BanHang' ? 'Sản phẩm' : 'Dịch vụ'}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <FontAwesomeIcon icon={faCalendarAlt} style={{ fontSize: '11px' }} />
                                                    {new Date(item.invoice.dateCreated).toLocaleDateString('vi-VN')}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Middle: Customer Info */}
                                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '2px' }}>Khách hàng</div>
                                            <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e1e1e' }}>{item.invoice.customerName}</div>
                                        </div>

                                        {/* Right: Amount & Status */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>Thanh toán</div>
                                                <div style={{ fontSize: '18px', fontWeight: '700', color: '#FF6B6B' }}>
                                                    {formatCurrency(item.invoice.finalPrice).split(' ')[0]}
                                                </div>
                                            </div>
                                            <button
                                                style={{
                                                    padding: '8px 16px',
                                                    backgroundColor: '#6B63B5',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    transition: 'all 0.3s ease',
                                                    whiteSpace: 'nowrap',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#5754A8';
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(107, 99, 181, 0.3)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#6B63B5';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faCreditCard} />
                                                <span>Thanh toán</span>
                                            </button>
                                            <FontAwesomeIcon 
                                                icon={faChevronRight} 
                                                style={{ 
                                                    fontSize: '16px', 
                                                    color: '#999',
                                                    transform: expandedInvoice === item.invoice.id ? 'rotate(90deg)' : 'rotate(0deg)',
                                                    transition: 'transform 0.3s ease'
                                                }} 
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Expandable Details */}
                                {expandedInvoice === item.invoice.id && (
                                    <div className={cx('invoice-details')} style={{ padding: '20px', backgroundColor: '#FAFBFC', borderTop: '2px solid #6B63B5', animation: 'slideDown 0.3s ease' }}>
                                        {/* Invoice Info Grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E8E8E8' }}>
                                                <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Khách hàng</div>
                                                <div style={{ fontSize: '13px', color: '#1e1e1e', fontWeight: '500' }}>{item.invoice.customerName}</div>
                                            </div>
                                            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E8E8E8' }}>
                                                <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>Điện thoại</div>
                                                <div style={{ fontSize: '13px', color: '#1e1e1e', fontWeight: '500' }}>{item.invoice.customerPhone}</div>
                                            </div>
                                        </div>

                                        {/* Status & Payment Method */}
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '12px 0', borderTop: '1px solid #E8E8E8', borderBottom: '1px solid #E8E8E8', marginBottom: '16px' }}>
                                            <div>
                                                <span style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', marginRight: '8px' }}>Trạng thái</span>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', padding: '4px 10px', borderRadius: '6px', backgroundColor: '#FFE8E8', color: '#CC0000' }}>
                                                    <FontAwesomeIcon icon={faClock} style={{ fontSize: '12px' }} />
                                                    Chưa thanh toán
                                                </span>
                                            </div>
                                            <div style={{ marginLeft: 'auto' }}>
                                                <span style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', marginRight: '8px' }}>Phương thức</span>
                                                <span style={{ fontSize: '13px', color: '#1e1e1e', fontWeight: '600' }}>
                                                    {item.invoice.paymentMethod || 'Chưa xác định'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Invoice Items */}
                                        {item.invoiceDetails && item.invoiceDetails.length > 0 && (
                                            <div style={{ marginBottom: '16px' }}>
                                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#333', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Chi tiết hóa đơn</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {item.invoiceDetails.map((detail, idx) => (
                                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #E8E8E8' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e1e1e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    {detail.type === 'SanPham' ? (
                                                                        <>
                                                                            <FontAwesomeIcon icon={faBox} style={{ fontSize: '12px', color: '#3498db' }} />
                                                                            {detail.productName} (x{detail.quantity})
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <FontAwesomeIcon icon={faStethoscope} style={{ fontSize: '12px', color: '#9b59b6' }} />
                                                                            {detail.serviceName}
                                                                        </>
                                                                    )}
                                                                </div>
                                                                {detail.type === 'DichVu' && detail.treatmentPlanName && (
                                                                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{detail.treatmentPlanName}</div>
                                                                )}
                                                            </div>
                                                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#FF6B6B', marginLeft: '12px', whiteSpace: 'nowrap' }}>
                                                                {formatCurrency(detail.finalPrice).split(' ')[0]}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Price Summary Card */}
                                        <div style={{ backgroundColor: '#F0F0FF', borderRadius: '8px', padding: '14px', border: '2px solid #6B63B5' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #D0D0E8' }}>
                                                <span style={{ fontSize: '13px', color: '#666' }}>Tổng tiền</span>
                                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e1e1e' }}>{formatCurrency(item.invoice.totalMoney).split(' ')[0]}</span>
                                            </div>
                                            {item.invoice.discountValue > 0 && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #D0D0E8' }}>
                                                    <span style={{ fontSize: '13px', color: '#666' }}>Giảm giá</span>
                                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#4CAF50' }}>-{formatCurrency(item.invoice.discountValue).split(' ')[0]}</span>
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '8px', borderBottom: '2px solid #D0D0E8' }}>
                                                <span style={{ fontSize: '13px', color: '#666' }}>Còn lại</span>
                                                <span style={{ fontSize: '16px', fontWeight: '700', color: '#FF6B6B' }}>{formatCurrency(item.invoice.outstandingBalance).split(' ')[0]}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                                <button 
                                                    className={cx('btn-pay')} 
                                                    onClick={() => handleOpenPaymentModal(item)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '12px',
                                                        backgroundColor: '#6B63B5',
                                                        color: '#fff',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        fontSize: '14px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px',
                                                        transition: 'all 0.3s ease',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#5754A8';
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(107, 99, 181, 0.3)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#6B63B5';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = 'none';
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faCreditCard} />
                                                    <span>Thanh toán ngay</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleCancelInvoice(item.invoice.id)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '12px',
                                                        backgroundColor: '#FF6B6B',
                                                        color: '#fff',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        fontSize: '14px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px',
                                                        transition: 'all 0.3s ease',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#E85555';
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.3)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#FF6B6B';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = 'none';
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faTimes} />
                                                    <span>Hủy thanh toán</span>
                                                </button>

                                                {/* Refund Button - Show if has serviceId and no products */}
                                                {canShowRefundButton(item.invoice, item.invoiceDetails) && (
                                                    <button
                                                        onClick={() => handleReturnProduct(item)}
                                                        disabled={isRefundDisabled(item.invoice)}
                                                        style={{
                                                            flex: 1,
                                                            padding: '12px',
                                                            backgroundColor: isRefundDisabled(item.invoice) ? '#CCCCCC' : '#FF9800',
                                                            color: isRefundDisabled(item.invoice) ? '#999' : '#fff',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            cursor: isRefundDisabled(item.invoice) ? 'not-allowed' : 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '8px',
                                                            transition: 'all 0.3s ease',
                                                            opacity: isRefundDisabled(item.invoice) ? 0.5 : 1,
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!isRefundDisabled(item.invoice)) {
                                                                e.currentTarget.style.backgroundColor = '#F57C00';
                                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 152, 0, 0.3)';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (!isRefundDisabled(item.invoice)) {
                                                                e.currentTarget.style.backgroundColor = '#FF9800';
                                                                e.currentTarget.style.transform = 'translateY(0)';
                                                                e.currentTarget.style.boxShadow = 'none';
                                                            }
                                                        }}
                                                        title={item.invoice.isRefund === true ? 'Hóa đơn đã hoàn tiền' : item.invoice.paidAmount <= 0 ? 'Chỉ có thể hoàn tiền khi đã thanh toán' : ''}
                                                    >
                                                        <FontAwesomeIcon icon={faUndo} />
                                                        <span>Hoàn Tiền</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className={cx('pagination')} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #E8E8E8' }}>
                            <button
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '6px',
                                    border: '1px solid #E8E8E8',
                                    backgroundColor: currentPage === 1 ? '#F0F0F0' : '#fff',
                                    color: currentPage === 1 ? '#999' : '#6B63B5',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    opacity: currentPage === 1 ? 0.6 : 1,
                                }}
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                                onMouseEnter={(e) => {
                                    if (currentPage > 1) {
                                        e.currentTarget.style.backgroundColor = '#6B63B5';
                                        e.currentTarget.style.color = '#fff';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (currentPage > 1) {
                                        e.currentTarget.style.backgroundColor = '#fff';
                                        e.currentTarget.style.color = '#6B63B5';
                                    }
                                }}
                            >
                                ← Trước
                            </button>
                            <span style={{ fontSize: '14px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Trang <strong style={{ color: '#6B63B5', fontSize: '16px' }}>{currentPage}</strong> / <strong>{totalPages}</strong>
                            </span>
                            <button
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '6px',
                                    border: '1px solid #E8E8E8',
                                    backgroundColor: currentPage === totalPages ? '#F0F0F0' : '#fff',
                                    color: currentPage === totalPages ? '#999' : '#6B63B5',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    opacity: currentPage === totalPages ? 0.6 : 1,
                                }}
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                onMouseEnter={(e) => {
                                    if (currentPage < totalPages) {
                                        e.currentTarget.style.backgroundColor = '#6B63B5';
                                        e.currentTarget.style.color = '#fff';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (currentPage < totalPages) {
                                        e.currentTarget.style.backgroundColor = '#fff';
                                        e.currentTarget.style.color = '#6B63B5';
                                    }
                                }}
                            >
                                Sau →
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Payment Method Modal */}
            {showPaymentModal && (
                <div className={cx('modal-overlay')} style={{
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
                    <div className={cx('modal-content')} style={{
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        padding: '32px',
                        maxWidth: '500px',
                        width: '90%',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                        animation: 'slideUp 0.3s ease',
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '24px',
                            paddingBottom: '16px',
                            borderBottom: '2px solid #F0F0F0',
                        }}>
                            <h2 style={{
                                margin: 0,
                                fontSize: '20px',
                                fontWeight: '700',
                                color: '#1e1e1e',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}>
                                <FontAwesomeIcon icon={faCreditCard} style={{ color: '#6B63B5' }} />
                                Chọn Phương Thức Thanh Toán
                            </h2>
                            <button
                                onClick={handleClosePaymentModal}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#999',
                                    transition: 'all 0.3s ease',
                                    padding: 0,
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = '#FF6B6B';
                                    e.currentTarget.style.backgroundColor = '#FFE8E8';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = '#999';
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        {/* Invoice Info */}
                        {selectedInvoice && (
                            <div style={{
                                backgroundColor: '#F8F8FA',
                                borderRadius: '8px',
                                padding: '14px',
                                marginBottom: '24px',
                                border: '1px solid #E8E8E8',
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}>
                                    <div>
                                        <div style={{
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            color: '#999',
                                            textTransform: 'uppercase',
                                            marginBottom: '4px',
                                        }}>
                                            Hóa đơn
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            fontWeight: '700',
                                            color: '#1e1e1e',
                                        }}>
                                            #{selectedInvoice.invoice.id}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            color: '#999',
                                            textTransform: 'uppercase',
                                            marginBottom: '4px',
                                        }}>
                                            Số tiền
                                        </div>
                                        <div style={{
                                            fontSize: '16px',
                                            fontWeight: '700',
                                            color: '#FF6B6B',
                                        }}>
                                            {formatCurrency(selectedInvoice.invoice.outstandingBalance).split(' ')[0]}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payment Methods */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#666',
                                marginBottom: '12px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}>
                                Chọn phương thức thanh toán
                            </div>

                            {/* VNpay Option */}
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '14px 16px',
                                marginBottom: '12px',
                                border: selectedPaymentMethod === 'vnpay' ? '2px solid #6B63B5' : '1px solid #E8E8E8',
                                borderRadius: '8px',
                                backgroundColor: selectedPaymentMethod === 'vnpay' ? '#F5F3FF' : '#fff',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                            }}
                            onMouseEnter={(e) => {
                                if (selectedPaymentMethod !== 'vnpay') {
                                    e.currentTarget.style.backgroundColor = '#F8F8FA';
                                    e.currentTarget.style.borderColor = '#D0D0E8';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedPaymentMethod !== 'vnpay') {
                                    e.currentTarget.style.backgroundColor = '#fff';
                                    e.currentTarget.style.borderColor = '#E8E8E8';
                                }
                            }}
                            >
                                <input
                                    type="radio"
                                    name="payment-method"
                                    value="vnpay"
                                    checked={selectedPaymentMethod === 'vnpay'}
                                    onChange={(e) => handleSelectPaymentMethod(e.target.value)}
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        cursor: 'pointer',
                                        accentColor: '#6B63B5',
                                        marginRight: '12px',
                                    }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#1e1e1e',
                                    }}>
                                        VNPay
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#999',
                                        marginTop: '2px',
                                    }}>
                                        Thanh toán qua cổng VNPay
                                    </div>
                                </div>
                            </label>

                            {/* Momo Option */}
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '14px 16px',
                                border: selectedPaymentMethod === 'momo' ? '2px solid #6B63B5' : '1px solid #E8E8E8',
                                borderRadius: '8px',
                                backgroundColor: selectedPaymentMethod === 'momo' ? '#F5F3FF' : '#fff',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                            }}
                            onMouseEnter={(e) => {
                                if (selectedPaymentMethod !== 'momo') {
                                    e.currentTarget.style.backgroundColor = '#F8F8FA';
                                    e.currentTarget.style.borderColor = '#D0D0E8';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedPaymentMethod !== 'momo') {
                                    e.currentTarget.style.backgroundColor = '#fff';
                                    e.currentTarget.style.borderColor = '#E8E8E8';
                                }
                            }}
                            >
                                <input
                                    type="radio"
                                    name="payment-method"
                                    value="momo"
                                    checked={selectedPaymentMethod === 'momo'}
                                    onChange={(e) => handleSelectPaymentMethod(e.target.value)}
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        cursor: 'pointer',
                                        accentColor: '#6B63B5',
                                        marginRight: '12px',
                                    }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#1e1e1e',
                                    }}>
                                        Momo
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#999',
                                        marginTop: '2px',
                                    }}>
                                        Thanh toán qua ví điện tử Momo
                                    </div>
                                </div>
                            </label>

                            {/* Cash on Delivery Option - Only for Products */}
                            {selectedInvoice && selectedInvoice.invoice.type === 'BanHang' && (
                                <label className={cx('payment-method-cod')} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '14px 16px',
                                    marginTop: '12px',
                                    border: selectedPaymentMethod === 'cod' ? '2px solid #FF9800' : '1px solid #E8E8E8',
                                    borderRadius: '8px',
                                    backgroundColor: selectedPaymentMethod === 'cod' ? '#FFF3E0' : '#fff',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                }}
                                onMouseEnter={(e) => {
                                    if (selectedPaymentMethod !== 'cod') {
                                        e.currentTarget.style.backgroundColor = '#FFF8F0';
                                        e.currentTarget.style.borderColor = '#FFD699';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (selectedPaymentMethod !== 'cod') {
                                        e.currentTarget.style.backgroundColor = '#fff';
                                        e.currentTarget.style.borderColor = '#E8E8E8';
                                    }
                                }}
                                >
                                    <input
                                        type="radio"
                                        name="payment-method"
                                        value="cod"
                                        checked={selectedPaymentMethod === 'cod'}
                                        onChange={(e) => handleSelectPaymentMethod(e.target.value)}
                                        style={{
                                            width: '20px',
                                            height: '20px',
                                            cursor: 'pointer',
                                            accentColor: '#FF9800',
                                            marginRight: '12px',
                                        }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#1e1e1e',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                        }}>
                                            <FontAwesomeIcon icon={faTruck} style={{ color: '#FF9800', fontSize: '15px' }} />
                                            Thanh toán khi nhận hàng
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#999',
                                            marginTop: '2px',
                                        }}>
                                            Thanh toán tiền mặt khi nhận đơn hàng
                                        </div>
                                    </div>
                                </label>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            paddingTop: '16px',
                            borderTop: '1px solid #E8E8E8',
                        }}>
                            <button
                                onClick={handleClosePaymentModal}
                                disabled={paymentLoading}
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    border: '1px solid #E8E8E8',
                                    borderRadius: '8px',
                                    backgroundColor: '#fff',
                                    color: '#6B63B5',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: paymentLoading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    opacity: paymentLoading ? 0.6 : 1,
                                }}
                                onMouseEnter={(e) => {
                                    if (!paymentLoading) {
                                        e.currentTarget.style.backgroundColor = '#F8F8FA';
                                        e.currentTarget.style.borderColor = '#6B63B5';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!paymentLoading) {
                                        e.currentTarget.style.backgroundColor = '#fff';
                                        e.currentTarget.style.borderColor = '#E8E8E8';
                                    }
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handlePaymentSubmit}
                                disabled={!selectedPaymentMethod || paymentLoading}
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    backgroundColor: !selectedPaymentMethod ? '#DDD' : '#6B63B5',
                                    color: '#fff',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: !selectedPaymentMethod || paymentLoading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    opacity: paymentLoading ? 0.8 : 1,
                                }}
                                onMouseEnter={(e) => {
                                    if (selectedPaymentMethod && !paymentLoading) {
                                        e.currentTarget.style.backgroundColor = '#5754A8';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(107, 99, 181, 0.3)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (selectedPaymentMethod && !paymentLoading) {
                                        e.currentTarget.style.backgroundColor = '#6B63B5';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }
                                }}
                            >
                                {paymentLoading ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} style={{ animation: 'spin 1s linear infinite' }} />
                                        <span>Đang xử lý...</span>
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faCreditCard} />
                                        <span>Xác Nhận Thanh Toán</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Refund Modal */}
            {showReturnModal && (
                <div className={cx('modal-overlay')} style={{
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
                    <div className={cx('modal-content')} style={{
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        padding: '32px',
                        maxWidth: '500px',
                        width: '90%',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                        animation: 'slideUp 0.3s ease',
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '24px',
                            paddingBottom: '16px',
                            borderBottom: '2px solid #F0F0F0',
                        }}>
                            <h2 style={{
                                margin: 0,
                                fontSize: '20px',
                                fontWeight: '700',
                                color: '#1e1e1e',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}>
                                <FontAwesomeIcon icon={faUndo} style={{ color: '#FF9800' }} />
                                Yêu Cầu Hoàn Tiền
                            </h2>
                            <button
                                onClick={handleCloseReturnModal}
                                disabled={isProcessingRefund}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: isProcessingRefund ? 'not-allowed' : 'pointer',
                                    color: '#999',
                                    transition: 'all 0.3s ease',
                                    padding: 0,
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: isProcessingRefund ? 0.5 : 1,
                                }}
                                onMouseEnter={(e) => {
                                    if (!isProcessingRefund) {
                                        e.currentTarget.style.color = '#FF6B6B';
                                        e.currentTarget.style.backgroundColor = '#FFE8E8';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isProcessingRefund) {
                                        e.currentTarget.style.color = '#999';
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        {/* Invoice Info */}
                        {selectedInvoiceForRefund && (
                            <div style={{
                                backgroundColor: '#FFF0F0',
                                borderRadius: '8px',
                                padding: '14px',
                                marginBottom: '24px',
                                border: '1px solid #FFD6D6',
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}>
                                    <div>
                                        <div style={{
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            color: '#999',
                                            textTransform: 'uppercase',
                                            marginBottom: '4px',
                                        }}>
                                            Hóa đơn
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            fontWeight: '700',
                                            color: '#1e1e1e',
                                        }}>
                                            #{selectedInvoiceForRefund.invoice.id}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Refund Reason */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#666',
                                marginBottom: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                display: 'block',
                            }}>
                                Lý Do Hoàn Tiền *
                            </label>

                            <textarea
                                value={refundReason}
                                onChange={(e) => setRefundReason(e.target.value)}
                                placeholder="Vui lòng nhập lý do hoàn tiền..."
                                disabled={isProcessingRefund}
                                style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    border: '1px solid #E8E8E8',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontFamily: 'inherit',
                                    resize: 'vertical',
                                    minHeight: '100px',
                                    backgroundColor: isProcessingRefund ? '#F5F5F5' : '#fff',
                                    color: '#1e1e1e',
                                    cursor: isProcessingRefund ? 'not-allowed' : 'text',
                                    transition: 'all 0.3s ease',
                                    boxSizing: 'border-box',
                                }}
                                onFocus={(e) => {
                                    if (!isProcessingRefund) {
                                        e.currentTarget.style.borderColor = '#FF9800';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 152, 0, 0.1)';
                                    }
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = '#E8E8E8';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                            <div style={{
                                fontSize: '11px',
                                color: '#999',
                                marginTop: '6px',
                            }}>
                                Tự động gửi sau 3 giây khi bạn dừng nhập
                            </div>
                        </div>

                        {/* Refund Method */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#666',
                                marginBottom: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                display: 'block',
                            }}>
                                Phương Thức Hoàn Tiền *
                            </label>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {/* Tiền Mặt Option */}
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '14px 16px',
                                    border: refundMethod === 'TienMat' ? '2px solid #FF9800' : '1px solid #E8E8E8',
                                    borderRadius: '8px',
                                    backgroundColor: refundMethod === 'TienMat' ? '#FFF3E0' : '#fff',
                                    cursor: isProcessingRefund ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    opacity: isProcessingRefund ? 0.6 : 1,
                                }}
                                onMouseEnter={(e) => {
                                    if (refundMethod !== 'TienMat' && !isProcessingRefund) {
                                        e.currentTarget.style.backgroundColor = '#F8F8FA';
                                        e.currentTarget.style.borderColor = '#FFD699';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (refundMethod !== 'TienMat' && !isProcessingRefund) {
                                        e.currentTarget.style.backgroundColor = '#fff';
                                        e.currentTarget.style.borderColor = '#E8E8E8';
                                    }
                                }}
                                >
                                    <input
                                        type="radio"
                                        name="refund-method"
                                        value="TienMat"
                                        checked={refundMethod === 'TienMat'}
                                        onChange={(e) => setRefundMethod(e.target.value)}
                                        disabled={isProcessingRefund}
                                        style={{
                                            width: '18px',
                                            height: '18px',
                                            cursor: isProcessingRefund ? 'not-allowed' : 'pointer',
                                            accentColor: '#FF9800',
                                            marginRight: '10px',
                                            flexShrink: 0,
                                        }}
                                    />
                                    <div>
                                        <div style={{
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            color: '#1e1e1e',
                                        }}>
                                            Tiền Mặt
                                        </div>
                                        <div style={{
                                            fontSize: '11px',
                                            color: '#999',
                                            marginTop: '2px',
                                        }}>
                                            Nhận trực tiếp
                                        </div>
                                    </div>
                                </label>

                                {/* Chuyển Khoán Option */}
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '14px 16px',
                                    border: refundMethod === 'ChuyenKhoan' ? '2px solid #FF9800' : '1px solid #E8E8E8',
                                    borderRadius: '8px',
                                    backgroundColor: refundMethod === 'ChuyenKhoan' ? '#FFF3E0' : '#fff',
                                    cursor: isProcessingRefund ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    opacity: isProcessingRefund ? 0.6 : 1,
                                }}
                                onMouseEnter={(e) => {
                                    if (refundMethod !== 'ChuyenKhoan' && !isProcessingRefund) {
                                        e.currentTarget.style.backgroundColor = '#F8F8FA';
                                        e.currentTarget.style.borderColor = '#FFD699';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (refundMethod !== 'ChuyenKhoan' && !isProcessingRefund) {
                                        e.currentTarget.style.backgroundColor = '#fff';
                                        e.currentTarget.style.borderColor = '#E8E8E8';
                                    }
                                }}
                                >
                                    <input
                                        type="radio"
                                        name="refund-method"
                                        value="ChuyenKhoan"
                                        checked={refundMethod === 'ChuyenKhoan'}
                                        onChange={(e) => setRefundMethod(e.target.value)}
                                        disabled={isProcessingRefund}
                                        style={{
                                            width: '18px',
                                            height: '18px',
                                            cursor: isProcessingRefund ? 'not-allowed' : 'pointer',
                                            accentColor: '#FF9800',
                                            marginRight: '10px',
                                            flexShrink: 0,
                                        }}
                                    />
                                    <div>
                                        <div style={{
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            color: '#1e1e1e',
                                        }}>
                                            Chuyển Khoán
                                        </div>
                                        <div style={{
                                            fontSize: '11px',
                                            color: '#999',
                                            marginTop: '2px',
                                        }}>
                                            Vào tài khoản
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Refund Images Upload */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#666',
                                marginBottom: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                display: 'block',
                            }}>
                                Tải Lên Hình Ảnh Chứng Minh *
                            </label>

                            <label
                                style={{
                                    display: 'block',
                                    padding: '20px',
                                    border: '2px dashed #FF9800',
                                    borderRadius: '8px',
                                    backgroundColor: '#FFF9F5',
                                    cursor: isProcessingRefund ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    textAlign: 'center',
                                    opacity: isProcessingRefund ? 0.6 : 1,
                                }}
                                onMouseEnter={(e) => {
                                    if (!isProcessingRefund) {
                                        e.currentTarget.style.backgroundColor = '#FFE8D0';
                                        e.currentTarget.style.borderColor = '#F57C00';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isProcessingRefund) {
                                        e.currentTarget.style.backgroundColor = '#FFF9F5';
                                        e.currentTarget.style.borderColor = '#FF9800';
                                    }
                                }}
                            >
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleRefundImageSelect}
                                    disabled={isProcessingRefund}
                                    style={{
                                        display: 'none',
                                    }}
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                    <FontAwesomeIcon icon={faImage} style={{ fontSize: '28px', color: '#FF9800' }} />
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e1e1e' }}>
                                            Nhấp để tải lên hoặc kéo thả các tệp
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                            PNG, JPG, GIF tối đa 10MB mỗi tệp
                                        </div>
                                    </div>
                                </div>
                            </label>

                            {/* Selected Images Preview */}
                            {refundImages.length > 0 && (
                                <div style={{ marginTop: '16px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
                                        Hình ảnh đã chọn ({refundImages.length})
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
                                        {refundImages.map((image, index) => (
                                            <div
                                                key={index}
                                                style={{
                                                    position: 'relative',
                                                    width: '80px',
                                                    height: '80px',
                                                    borderRadius: '6px',
                                                    overflow: 'hidden',
                                                    border: '1px solid #E8E8E8',
                                                    backgroundColor: '#F5F5F5',
                                                }}
                                            >
                                                <img
                                                    src={image}
                                                    alt={`Preview ${index + 1}`}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                                <button
                                                    onClick={() => handleRemoveRefundImage(index)}
                                                    disabled={isProcessingRefund}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '2px',
                                                        right: '2px',
                                                        width: '24px',
                                                        height: '24px',
                                                        padding: 0,
                                                        backgroundColor: '#FF6B6B',
                                                        color: '#fff',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        fontSize: '14px',
                                                        cursor: isProcessingRefund ? 'not-allowed' : 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.2s ease',
                                                        opacity: isProcessingRefund ? 0.5 : 0.8,
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!isProcessingRefund) {
                                                            e.currentTarget.style.opacity = '1';
                                                            e.currentTarget.style.transform = 'scale(1.1)';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!isProcessingRefund) {
                                                            e.currentTarget.style.opacity = '0.8';
                                                            e.currentTarget.style.transform = 'scale(1)';
                                                        }
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faTimes} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            paddingTop: '16px',
                            borderTop: '1px solid #E8E8E8',
                        }}>
                            <button
                                onClick={handleCloseReturnModal}
                                disabled={isProcessingRefund}
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    border: '1px solid #E8E8E8',
                                    borderRadius: '8px',
                                    backgroundColor: '#fff',
                                    color: '#FF9800',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: isProcessingRefund ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    opacity: isProcessingRefund ? 0.6 : 1,
                                }}
                                onMouseEnter={(e) => {
                                    if (!isProcessingRefund) {
                                        e.currentTarget.style.backgroundColor = '#FFF3E0';
                                        e.currentTarget.style.borderColor = '#FF9800';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isProcessingRefund) {
                                        e.currentTarget.style.backgroundColor = '#fff';
                                        e.currentTarget.style.borderColor = '#E8E8E8';
                                    }
                                }}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AwaitingPayment;
