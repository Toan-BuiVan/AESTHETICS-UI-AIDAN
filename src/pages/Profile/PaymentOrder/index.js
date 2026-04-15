import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './PaymentOrder.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTruck, faSpinner, faBox, faStethoscope, faChevronRight, 
    faCalendarAlt, faCheckCircle, faClock, faTimesCircle, faTasks,
    faUndo, faStar, faImage, faTimes
} from '@fortawesome/free-solid-svg-icons';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';
import { useDebounce } from '~/hooks';

const cx = classNames.bind(styles);

function PaymentOrder() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedInvoice, setExpandedInvoice] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedInvoiceForAction, setSelectedInvoiceForAction] = useState(null);
    const [refundReason, setRefundReason] = useState('');
    const [refundImages, setRefundImages] = useState([]);
    const [refundMethod, setRefundMethod] = useState('TienMat');
    const [isProcessingRefund, setIsProcessingRefund] = useState(false);
    const pageSize = 6;

    // Debounce refund data (reason only) for auto-submission after 3 seconds
    const refundFormData = {
        reason: refundReason,
        images: refundImages.length,
        method: refundMethod,
        timestamp: Date.now(),
    };
    const debouncedRefundData = useDebounce(refundFormData, 3000);

    // Hàm gọi API lấy danh sách đơn hàng
    const fetchInvoices = async (page = 1) => {
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
                staffId: 0,
                orderStatuses: ['DangXuLy', 'DangGiao', 'DaGiao', 'DaHuy', 'HoanHang'],
                type: null,
                status: null,
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
            console.log('Order status response:', result);

            const invoiceList = result.baseDatas || [];
            setInvoices(invoiceList);
            setTotalRecords(result.totalRecordCount || 0);
            setTotalPages(result.pageCount || 1);
            setCurrentPage(result.pageIndex || 1);
            setLoading(false);
        } catch (err) {
            console.error('Lỗi khi lấy danh sách đơn hàng:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices(1);
    }, []);

    // Xử lý toggle expand details
    const handleToggleDetails = (invoiceID) => {
        setExpandedInvoice(expandedInvoice === invoiceID ? null : invoiceID);
    };

    // Phân trang - trang trước
    const handlePrevPage = () => {
        if (currentPage > 1) {
            fetchInvoices(currentPage - 1);
        }
    };

    // Phân trang - trang sau
    const handleNextPage = () => {
        if (currentPage < totalPages) {
            fetchInvoices(currentPage + 1);
        }
    };

    // Xử lý yêu cầu hoàn hàng
    const handleReturnProduct = (invoice) => {
        setSelectedInvoiceForAction(invoice);
        setShowReturnModal(true);
    };

    // Xử lý đánh giá sản phẩm
    const handleEvaluateProduct = (invoice) => {
        setSelectedInvoiceForAction(invoice);
        setShowReviewModal(true);
    };

    // Xử lý hoàn hàng tự động khi debounce data thay đổi
    useEffect(() => {
        // Check if modal is open and we have required fields
        if (!showReturnModal) return;
        if (!selectedInvoiceForAction?.invoice?.id) return;
        if (!debouncedRefundData.reason?.trim()) return;
        if (!refundMethod || refundImages.length === 0) return;

        // Prevent multiple submissions
        if (isProcessingRefund) return;

        // Auto-submit refund after debounce
        const submitRefund = async () => {
            try {
                if (!selectedInvoiceForAction?.invoice?.id || !refundReason.trim() || !refundMethod || refundImages.length === 0) {
                    return;
                }

                setIsProcessingRefund(true);

                const token = localStorage.getItem('token') || '';
                const refreshToken = localStorage.getItem('refreshToken') || '';
                const customerId = localStorage.getItem('customerId');

                const headers = {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                    'RefreshToken': refreshToken,
                };

                const requestBody = {
                    invoiceId: selectedInvoiceForAction.invoice.id,
                    customerId: parseInt(customerId),
                    refundReason: refundReason.trim(),
                    refundImages: refundImages.join(';'),
                    refundMethod: refundMethod,
                };

                console.log('Auto-submitting refund after debounce - invoiceId:', selectedInvoiceForAction.invoice.id, 'reason:', refundReason);

                const response = await fetch('http://localhost:5122/api/Refund/create', {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(requestBody),
                });

                // Handle token refresh
                const newAccessToken = response.headers.get('New-AccessToken');
                const newRefreshToken = response.headers.get('New-RefreshToken');
                if (newAccessToken) localStorage.setItem('token', newAccessToken);
                if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

                if (response.ok) {
                    const data = await response.json();
                    console.log('✓ Refund response:', data);

                    if (data.success) {
                        setSuccessMessage(`✓ Hoàn hàng thành công!`);
                        setShowReturnModal(false);
                        setRefundReason('');
                        setRefundImages([]);
                        setRefundMethod('TienMat');
                        setSelectedInvoiceForAction(null);
                        setIsProcessingRefund(false);

                        // Refresh invoice list after 2 seconds
                        setTimeout(() => {
                            fetchInvoices(currentPage);
                        }, 2000);
                    } else {
                        setSuccessMessage(`❌ ${data.message || 'Hoàn hàng thất bại'}`);
                        setIsProcessingRefund(false);
                    }
                } else {
                    setSuccessMessage('❌ Lỗi khi gửi yêu cầu hoàn hàng');
                    setIsProcessingRefund(false);
                }
                setTimeout(() => setSuccessMessage(null), 3000);
            } catch (err) {
                console.error('Lỗi khi hoàn hàng:', err);
                setSuccessMessage(`❌ Lỗi: ${err.message}`);
                setIsProcessingRefund(false);
                setTimeout(() => setSuccessMessage(null), 3000);
            }
        };

        submitRefund();
    }, [debouncedRefundData, showReturnModal, selectedInvoiceForAction, refundReason, refundMethod, refundImages, currentPage]);

    // Hàm kiểm tra xem có sản phẩm trong đơn hàng không
    const hasProducts = (invoiceDetails) => {
        return invoiceDetails && invoiceDetails.some(detail => detail.type === 'BanHang' && detail.productId);
    };

    // Hàm kiểm tra xem có thể hiển thị button hoàn tiền
    const canShowRefundButton = (invoice, invoiceDetails) => {
        // PaymentOrder: Hiển thị button nếu orderStatus = 'DaGiao'
        const isDelivered = invoice.orderStatus === 'DaGiao';
        return isDelivered;
    };

    const isRefundDisabled = (invoice) => {
        // Disable button khi isRefund = true hoặc paidAmount <= 0
        return invoice.isRefund === true || invoice.paidAmount <= 0;
    };

    // Xử lý chọn hình ảnh hoàn hàng
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

    // Xóa hình ảnh hoàn hàng
    const handleRemoveRefundImage = (index) => {
        setRefundImages((prev) => prev.filter((_, i) => i !== index));
    };

    // Hàm format tiền tệ
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    // Hàm lấy màu và icon cho status
    const getStatusStyle = (status) => {
        const statusMap = {
            'DangXuLy': { color: '#FF9800', icon: faClock, text: '⏳ Đang Xử Lý' },
            'DangGiao': { color: '#2196F3', icon: faTruck, text: '🚚 Đang Giao' },
            'DaGiao': { color: '#4CAF50', icon: faCheckCircle, text: '✓ Đã Giao' },
            'DaHuy': { color: '#F44336', icon: faTimesCircle, text: '✕ Đã Hủy' },
        };
        return statusMap[status] || { color: '#999', icon: faTasks, text: status };
    };

    if (loading && invoices.length === 0) {
        return (
            <div className={cx('payment-order')}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
                    <FontAwesomeIcon 
                        icon={faSpinner} 
                        className={cx('spinner')} 
                        style={{ fontSize: '48px', color: '#FF9800', marginBottom: '16px', animation: 'spin 1s linear infinite' }}
                    />
                    <p style={{ fontSize: '16px', color: '#666', margin: '0' }}>Đang tải danh sách đơn hàng...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cx('payment-order')}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
                    <FontAwesomeIcon icon={faTimesCircle} style={{ fontSize: '48px', color: '#F44336', marginBottom: '16px' }} />
                    <p style={{ fontSize: '16px', color: '#666' }}>Lỗi: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cx('payment-order')}>
            {successMessage && <SuccessMessage message={successMessage} />}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <FontAwesomeIcon icon={faTruck} style={{ fontSize: '28px', color: '#FF9800' }} />
                <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>Trạng Thái Đơn Hàng</h3>
            </div>
            <div style={{ fontSize: '14px', color: '#999', marginTop: '12px', marginBottom: '24px' }}>
                Danh sách đơn hàng với trạng thái: Đang xử lý, Đang giao, Đã giao, Đã hủy ({totalRecords} đơn hàng)
            </div>

            {/* Empty State */}
            {invoices.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
                    <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '56px', color: '#FF9800', marginBottom: '16px', opacity: 0.7 }} />
                    <p style={{ fontSize: '18px', fontWeight: '600', color: '#333', margin: '8px 0 16px 0' }}>Không có đơn hàng</p>
                    <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>Bạn không có đơn hàng nào cần theo dõi</p>
                </div>
            ) : (
                <>
                    {/* Invoice List */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100%, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        {invoices.map((item) => {
                            const statusStyle = getStatusStyle(item.invoice.orderStatus);
                            return (
                                <div key={item.invoice.id} style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'all 0.3s ease', backgroundColor: '#fff' }}>
                                    {/* Invoice Header */}
                                    <div
                                        onClick={() => handleToggleDetails(item.invoice.id)}
                                        style={{
                                            padding: '18px 20px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            borderBottom: expandedInvoice === item.invoice.id ? '2px solid #FF9800' : '1px solid #E8E8E8',
                                            transition: 'all 0.3s ease',
                                            backgroundColor: expandedInvoice === item.invoice.id ? '#FFF8F0' : '#fff',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8F8FA'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = expandedInvoice === item.invoice.id ? '#FFF8F0' : '#fff'}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: '20px' }}>
                                            {/* Left: Invoice ID & Type */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '4px', height: '40px', backgroundColor: statusStyle.color, borderRadius: '2px' }}></div>
                                                <div>
                                                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e1e1e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        #{item.invoice.id}
                                                        <span style={{ fontSize: '12px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#DBF0FE', color: '#0066CC' }}>
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
                                                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>Tổng tiền</div>
                                                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#FF9800' }}>
                                                        {formatCurrency(item.invoice.finalPrice).split(' ')[0]}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'center', minWidth: '120px' }}>
                                                    <div style={{ 
                                                        display: 'inline-flex', 
                                                        alignItems: 'center', 
                                                        gap: '6px', 
                                                        fontSize: '13px', 
                                                        fontWeight: '600', 
                                                        padding: '6px 12px', 
                                                        borderRadius: '6px', 
                                                        backgroundColor: statusStyle.color + '15',
                                                        color: statusStyle.color
                                                    }}>
                                                        <FontAwesomeIcon icon={statusStyle.icon} />
                                                        {statusStyle.text}
                                                    </div>
                                                </div>
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
                                        <div style={{ padding: '20px', backgroundColor: '#FAFBFC', borderTop: '2px solid #FF9800', animation: 'slideDown 0.3s ease' }}>
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

                                            {/* Status & Payment */}
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '12px 0', borderTop: '1px solid #E8E8E8', borderBottom: '1px solid #E8E8E8', marginBottom: '16px' }}>
                                                <div>
                                                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', marginRight: '8px' }}>Trạng thái đơn</span>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', padding: '4px 10px', borderRadius: '6px', backgroundColor: statusStyle.color + '15', color: statusStyle.color }}>
                                                        <FontAwesomeIcon icon={statusStyle.icon} />
                                                        {statusStyle.text}
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
                                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#333', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Chi tiết đơn hàng</div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {item.invoiceDetails.map((detail, idx) => (
                                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #E8E8E8' }}>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e1e1e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                        {detail.type === 'BanHang' ? (
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
                                                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#FF9800', marginLeft: '12px', whiteSpace: 'nowrap' }}>
                                                                    {formatCurrency(detail.finalPrice).split(' ')[0]}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Price Summary */}
                                            <div style={{ backgroundColor: '#FFE8D0', borderRadius: '8px', padding: '14px', border: '2px solid #FF9800' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #FFCC99' }}>
                                                    <span style={{ fontSize: '13px', color: '#666' }}>Tổng tiền</span>
                                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e1e1e' }}>{formatCurrency(item.invoice.totalMoney).split(' ')[0]}</span>
                                                </div>
                                                {item.invoice.discountValue > 0 && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #FFCC99' }}>
                                                        <span style={{ fontSize: '13px', color: '#666' }}>Giảm giá</span>
                                                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#FF9800' }}>-{formatCurrency(item.invoice.discountValue).split(' ')[0]}</span>
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '13px', color: '#666' }}>Thành tiền</span>
                                                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#FF9800' }}>{formatCurrency(item.invoice.finalPrice).split(' ')[0]}</span>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            {/* Show refund button if: serviceId = null AND has products AND orderStatus = 'DaGiao' */}
                                            {canShowRefundButton(item.invoice, item.invoiceDetails) && (
                                                <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                                                    {/* Refund Button - Show when conditions met */}
                                                    <button
                                                        onClick={() => handleReturnProduct(item)}
                                                        disabled={isRefundDisabled(item.invoice)}
                                                        style={{
                                                            flex: hasProducts(item.invoiceDetails) ? 1 : 0,
                                                            minWidth: hasProducts(item.invoiceDetails) ? 'auto' : '100%',
                                                            padding: '12px 16px',
                                                            borderRadius: '8px',
                                                            border: '2px solid #FF6B6B',
                                                            backgroundColor: isRefundDisabled(item.invoice) ? '#E8E8E8' : '#FFF0F0',
                                                            color: isRefundDisabled(item.invoice) ? '#999' : '#FF6B6B',
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            cursor: isRefundDisabled(item.invoice) ? 'not-allowed' : 'pointer',
                                                            transition: 'all 0.3s ease',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '8px',
                                                            opacity: isRefundDisabled(item.invoice) ? 0.5 : 1,
                                                            borderColor: isRefundDisabled(item.invoice) ? '#DDD' : '#FF6B6B',
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!isRefundDisabled(item.invoice)) {
                                                                e.currentTarget.style.backgroundColor = '#FF6B6B';
                                                                e.currentTarget.style.color = '#fff';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (!isRefundDisabled(item.invoice)) {
                                                                e.currentTarget.style.backgroundColor = '#FFF0F0';
                                                                e.currentTarget.style.color = '#FF6B6B';
                                                            }
                                                        }}
                                                        title={item.invoice.isRefund === true ? 'Đơn hàng đã hoàn hàng' : item.invoice.paidAmount <= 0 ? 'Chỉ có thể hoàn hàng khi đã thanh toán' : ''}
                                                    >
                                                        <FontAwesomeIcon icon={faUndo} style={{ fontSize: '14px' }} />
                                                        Hoàn Hàng
                                                    </button>

                                                    {/* Evaluate Button - Show if has products */}
                                                    {hasProducts(item.invoiceDetails) && (
                                                        <button
                                                            onClick={() => handleEvaluateProduct(item)}
                                                            style={{
                                                                flex: 1,
                                                                padding: '12px 16px',
                                                                borderRadius: '8px',
                                                                border: '2px solid #FFD700',
                                                                backgroundColor: '#FFFAF0',
                                                                color: '#FFD700',
                                                                fontSize: '14px',
                                                                fontWeight: '600',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.3s ease',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '8px',
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#FFD700';
                                                                e.currentTarget.style.color = '#fff';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#FFFAF0';
                                                                e.currentTarget.style.color = '#FFD700';
                                                            }}
                                                        >
                                                            <FontAwesomeIcon icon={faStar} style={{ fontSize: '14px' }} />
                                                            Đánh Giá Sản Phẩm
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #E8E8E8' }}>
                            <button
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '6px',
                                    border: '1px solid #E8E8E8',
                                    backgroundColor: currentPage === 1 ? '#F0F0F0' : '#fff',
                                    color: currentPage === 1 ? '#999' : '#FF9800',
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
                                        e.currentTarget.style.backgroundColor = '#FF9800';
                                        e.currentTarget.style.color = '#fff';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (currentPage > 1) {
                                        e.currentTarget.style.backgroundColor = '#fff';
                                        e.currentTarget.style.color = '#FF9800';
                                    }
                                }}
                            >
                                ← Trước
                            </button>
                            <span style={{ fontSize: '14px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Trang <strong style={{ color: '#FF9800', fontSize: '16px' }}>{currentPage}</strong> / <strong>{totalPages}</strong>
                            </span>
                            <button
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '6px',
                                    border: '1px solid #E8E8E8',
                                    backgroundColor: currentPage === totalPages ? '#F0F0F0' : '#fff',
                                    color: currentPage === totalPages ? '#999' : '#FF9800',
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
                                        e.currentTarget.style.backgroundColor = '#FF9800';
                                        e.currentTarget.style.color = '#fff';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (currentPage < totalPages) {
                                        e.currentTarget.style.backgroundColor = '#fff';
                                        e.currentTarget.style.color = '#FF9800';
                                    }
                                }}
                            >
                                Sau →
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Return/Refund Modal */}
            {showReturnModal && selectedInvoiceForAction && (
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
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <div style={{
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        padding: '28px',
                        maxWidth: '500px',
                        width: '90%',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                        animation: 'slideUp 0.3s ease'
                    }}>
                        {/* Modal Header */}
                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: '#1e1e1e' }}>
                                🔄 Yêu Cầu Hoàn Hàng
                            </h3>
                            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                                Hóa đơn #{selectedInvoiceForAction.invoice.id}
                            </p>
                        </div>

                        {/* Invoice Info */}
                        <div style={{
                            backgroundColor: '#F5F5F5',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '16px',
                            border: '1px solid #E8E8E8'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ fontSize: '13px', color: '#666' }}>Khách hàng:</span>
                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e1e1e' }}>
                                    {selectedInvoiceForAction.invoice.customerName}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '13px', color: '#666' }}>Tổng tiền:</span>
                                <span style={{ fontSize: '14px', fontWeight: '700', color: '#FF9800' }}>
                                    {formatCurrency(selectedInvoiceForAction.invoice.finalPrice).split(' ')[0]}
                                </span>
                            </div>
                        </div>

                        {/* Refund Reason Input */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#333',
                                marginBottom: '8px'
                            }}>
                                Lý Do Hoàn Hàng *
                            </label>
                            <textarea
                                value={refundReason}
                                onChange={(e) => setRefundReason(e.target.value)}
                                placeholder="Vui lòng nhập lý do hoàn hàng..."
                                style={{
                                    width: '100%',
                                    height: '100px',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #DDD',
                                    fontSize: '13px',
                                    fontFamily: 'inherit',
                                    resize: 'vertical',
                                    boxSizing: 'border-box',
                                    transition: 'all 0.3s ease',
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = '#FF9800';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 152, 0, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = '#DDD';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        {/* Warning Message */}
                        <div style={{
                            backgroundColor: '#FFF3E0',
                            border: '1px solid #FFB74D',
                            borderRadius: '6px',
                            padding: '10px',
                            marginBottom: '20px',
                            fontSize: '12px',
                            color: '#E65100',
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'flex-start'
                        }}>
                            <span>ℹ️</span>
                            <div>
                                <strong>Tự động xử lý:</strong> Sau khi bạn nhập lý do hoàn hàng, hệ thống sẽ tự động chờ 3 giây rồi gửi yêu cầu. Bạn không cần nhấn nút.
                            </div>
                        </div>

                        {/* Refund Method */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#333',
                                marginBottom: '8px'
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

                                {/* Chuyển Khoản Option */}
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
                                            Chuyển Khoản
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
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#333',
                                marginBottom: '8px'
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
                                <div style={{ marginTop: '12px' }}>
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

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => {
                                    setShowReturnModal(false);
                                    setRefundReason('');
                                    setRefundImages([]);
                                    setRefundMethod('TienMat');
                                    setSelectedInvoiceForAction(null);
                                    setIsProcessingRefund(false);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
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
                                    e.currentTarget.style.borderColor = '#999';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#fff';
                                    e.currentTarget.style.borderColor = '#DDD';
                                }}
                            >
                                Hủy
                            </button>
                            <div
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    border: '2px solid #FF9800',
                                    backgroundColor: isProcessingRefund ? '#FF9800' : refundReason.trim() ? '#4CAF50' : '#FFE8D0',
                                    color: '#fff',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'default',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                }}
                            >
                                {isProcessingRefund ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} style={{ animation: 'spin 1s linear infinite' }} />
                                        Đang Xử Lý...
                                    </>
                                ) : refundReason.trim() ? (
                                    <>
                                        <span>✓</span>
                                        Sẵn sàng gửi (3s)
                                    </>
                                ) : (
                                    <>
                                        <span>⏳</span>
                                        Nhập lý do hoàn hàng
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PaymentOrder;
