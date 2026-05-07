import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './RefundedInvoice.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faSpinner, faChevronRight, faCalendarAlt, faBox, faStethoscope, faTimes, faInfoCircle, faImage } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function RefundedInvoice({ onCountChange }) {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedInvoice, setExpandedInvoice] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [showRefundDetailsModal, setShowRefundDetailsModal] = useState(false);
    const [selectedInvoiceForRefund, setSelectedInvoiceForRefund] = useState(null);
    const [refundDetails, setRefundDetails] = useState([]);
    const [loadingRefundDetails, setLoadingRefundDetails] = useState(false);
    const pageSize = 6;

    // Hàm gọi API getinvoicelist với status DaHoanTien
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
                staffId: null,
                type: 'DichVu',
                status: 'DaHoanTien',
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
            console.log('Refunded invoice list response:', result);

            const invoiceList = result.baseDatas || [];
            setInvoices(invoiceList);
            setTotalRecords(result.totalRecordCount || 0);
            setTotalPages(result.pageCount || 1);
            setCurrentPage(result.pageIndex || 1);
            onCountChange(invoiceList.length);
            setLoading(false);
        } catch (err) {
            console.error('Lỗi khi lấy danh sách hóa đơn đã hoàn tiền:', err);
            setLoading(false);
        }
    };

    // Fetch invoices khi component mount
    useEffect(() => {
        fetchInvoices(1);
    }, []);

    // Hàm gọi API lấy chi tiết hoàn tiền
    const fetchRefundDetails = async (invoiceId) => {
        try {
            setLoadingRefundDetails(true);
            const token = localStorage.getItem('token') || '';
            const refreshToken = localStorage.getItem('refreshToken') || '';

            const requestData = {
                invoiceId: invoiceId,
            };

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
                'RefreshToken': refreshToken,
            };

            const response = await fetch('http://localhost:5122/api/Refund/get-list', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error('Lỗi khi gọi API');
            }

            const result = await response.json();
            console.log('Refund details response:', result);

            setRefundDetails(result.data || []);
            setLoadingRefundDetails(false);
        } catch (err) {
            console.error('Lỗi khi lấy chi tiết hoàn tiền:', err);
            setLoadingRefundDetails(false);
        }
    };

    // Xử lý click button chi tiết hoàn tiền
    const handleShowRefundDetails = (invoiceId) => {
        setSelectedInvoiceForRefund(invoiceId);
        setShowRefundDetailsModal(true);
        fetchRefundDetails(invoiceId);
    };

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

    // Hàm format tiền tệ
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    return (
        <div className={cx('refunded-invoice')}>
            {/* Premium Header */}
            <div className={cx('header')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '28px', color: '#4CAF50' }} />
                    <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>Hóa Đơn Đã Hoàn Tiền</h3>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#4CAF50' }} />
                        <strong>{totalRecords} hóa đơn</strong> đã hoàn tiền
                    </span>
                </div>
            </div>

            {/* Quy định hoàn tiền VNPay */}
            <div style={{ 
                backgroundColor: '#F0F9FF', 
                border: '2px solid #4CAF50', 
                borderRadius: '12px', 
                padding: '20px', 
                marginBottom: '24px',
                color: '#1e1e1e'
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <FontAwesomeIcon icon={faInfoCircle} style={{ fontSize: '20px', color: '#4CAF50', marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '700', color: '#1e1e1e' }}>
                            2.3. Quy định về thời gian xử lý hoàn tiền
                        </h4>
                        <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#333' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <strong>a. Thời gian xử lý:</strong>
                                <p style={{ margin: '4px 0 0 0' }}>
                                    Trong trường hợp đơn hàng đủ điều kiện hoàn tiền, thời gian xử lý hoàn tiền sẽ phụ thuộc vào phương thức thanh toán ban đầu của Khách hàng và quy trình của ngân hàng/tổ chức cung cấp dịch vụ thanh toán.
                                </p>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <strong>b. Thời gian hoàn tiền dự kiến:</strong>
                                <ul style={{ margin: '6px 0 0 20px', paddingLeft: '0' }}>
                                    <li style={{ marginBottom: '6px' }}>Thanh toán qua thẻ ngân hàng: <strong>5 – 15 ngày làm việc</strong> tùy vào ngân hàng phát hành thẻ.</li>
                                    <li style={{ marginBottom: '6px' }}>Thanh toán qua ví điện tử: <strong>3 – 7 ngày làm việc</strong></li>
                                    <li>Thanh toán bằng các phương thức khác: Theo thỏa thuận cụ thể với Khách hàng.</li>
                                </ul>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <strong>c. Trách nhiệm:</strong>
                                <p style={{ margin: '4px 0 0 0' }}>
                                    VNPay không chịu trách nhiệm đối với các khoản phí phát sinh từ phía ngân hàng hoặc tổ chức cung cấp dịch vụ thanh toán trong quá trình hoàn tiền (nếu có).
                                </p>
                            </div>
                            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #C8E6C9' }}>
                                <a 
                                    href="https://vnpay.vn/chinh-sach/chinh-sach-thanh-toan-va-hoan-huy-doi-tra-giao-dich.html" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'inline-block',
                                        color: '#4CAF50',
                                        textDecoration: 'none',
                                        fontWeight: '600',
                                        fontSize: '13px',
                                        padding: '6px 12px',
                                        borderRadius: '4px',
                                        transition: 'all 0.3s ease',
                                        backgroundColor: '#E8F5E9',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#4CAF50';
                                        e.currentTarget.style.color = '#fff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#E8F5E9';
                                        e.currentTarget.style.color = '#4CAF50';
                                    }}
                                >
                                    Chính sách thanh toán và hoàn hủy VNPay →
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className={cx('loading')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
                    <FontAwesomeIcon 
                        icon={faSpinner} 
                        className={cx('spinner')} 
                        style={{ fontSize: '48px', color: '#4CAF50', marginBottom: '16px', animation: 'spin 1s linear infinite' }}
                    />
                    <p style={{ fontSize: '16px', color: '#666', margin: '0' }}>Đang tải dữ liệu hóa đơn...</p>
                </div>
            ) : invoices.length === 0 ? (
                <div className={cx('empty-state')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
                    <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '56px', color: '#4CAF50', marginBottom: '16px', opacity: 0.7 }} />
                    <p style={{ fontSize: '18px', fontWeight: '600', color: '#333', margin: '8px 0 16px 0' }}>Không có hóa đơn đã hoàn tiền</p>
                    <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>Bạn không có hóa đơn nào đã hoàn tiền để hiển thị</p>
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
                                        borderBottom: expandedInvoice === item.invoice.id ? '2px solid #4CAF50' : '1px solid #E8E8E8',
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
                                                    <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#E8F5E9', color: '#4CAF50', marginLeft: 'auto' }}>
                                                        ✓ Đã Phê Duyệt
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
                                                <div style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>Hóa đơn</div>
                                                <div style={{ fontSize: '18px', fontWeight: '700', color: '#4CAF50' }}>
                                                    {formatCurrency(item.invoice.finalPrice).split(' ')[0]}
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
                                    <div className={cx('invoice-details')} style={{ padding: '20px', backgroundColor: '#FAFBFC', borderTop: '2px solid #4CAF50', animation: 'slideDown 0.3s ease' }}>
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

                                        {/* Invoice Items */}
                                        {item.invoiceDetails && item.invoiceDetails.length > 0 && (
                                            <div style={{ marginBottom: '16px' }}>
                                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#333', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Chi tiết hóa đơn</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {item.invoiceDetails.map((detail, idx) => (
                                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #E8E8E8' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e1e1e', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                                    {detail.type === 'BanHang' ? (
                                                                        <>
                                                                            <FontAwesomeIcon icon={faBox} style={{ fontSize: '12px', color: '#3498db' }} />
                                                                            <span>{detail.productName}</span>
                                                                            <span style={{ fontSize: '12px', color: '#999', fontWeight: '500' }}>x{detail.quantity}</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <FontAwesomeIcon icon={faStethoscope} style={{ fontSize: '12px', color: '#9b59b6' }} />
                                                                            <span>{detail.serviceName}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                {detail.treatmentPlanName && (
                                                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                                                        Gói: {detail.treatmentPlanName}
                                                                    </div>
                                                                )}
                                                                <div style={{ fontSize: '12px', color: '#999' }}>
                                                                    Đơn giá: {formatCurrency(detail.price).split(' ')[0]}
                                                                </div>
                                                            </div>
                                                            <div style={{ textAlign: 'right', marginLeft: '12px' }}>
                                                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#4CAF50', whiteSpace: 'nowrap' }}>
                                                                    {formatCurrency(detail.finalPrice).split(' ')[0]}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Price Summary Card */}
                                        <div style={{ backgroundColor: '#E8F5E9', borderRadius: '8px', padding: '14px', border: '2px solid #4CAF50' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #C8E6C9' }}>
                                                <span style={{ fontSize: '13px', color: '#666' }}>Tổng tiền</span>
                                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e1e1e' }}>{formatCurrency(item.invoice.totalMoney).split(' ')[0]}</span>
                                            </div>
                                            {item.invoice.discountValue > 0 && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #C8E6C9' }}>
                                                    <span style={{ fontSize: '13px', color: '#666' }}>Giảm giá</span>
                                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#FF9800' }}>-{formatCurrency(item.invoice.discountValue).split(' ')[0]}</span>
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '13px', color: '#666' }}>Thành tiền</span>
                                                <span style={{ fontSize: '16px', fontWeight: '700', color: '#4CAF50' }}>{formatCurrency(item.invoice.finalPrice).split(' ')[0]}</span>
                                            </div>
                                        </div>

                                        {/* Chi tiết hoàn tiền Button */}
                                        <button
                                            onClick={() => handleShowRefundDetails(item.invoice.id)}
                                            style={{
                                                width: '100%',
                                                marginTop: '16px',
                                                padding: '12px 16px',
                                                border: '2px solid #4CAF50',
                                                borderRadius: '8px',
                                                backgroundColor: '#E8F5E9',
                                                color: '#4CAF50',
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
                                                e.currentTarget.style.backgroundColor = '#4CAF50';
                                                e.currentTarget.style.color = '#fff';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = '#E8F5E9';
                                                e.currentTarget.style.color = '#4CAF50';
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faInfoCircle} style={{ fontSize: '14px' }} />
                                            Chi tiết hoàn tiền
                                        </button>
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
                                    color: currentPage === 1 ? '#999' : '#4CAF50',
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
                                        e.currentTarget.style.backgroundColor = '#4CAF50';
                                        e.currentTarget.style.color = '#fff';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (currentPage > 1) {
                                        e.currentTarget.style.backgroundColor = '#fff';
                                        e.currentTarget.style.color = '#4CAF50';
                                    }
                                }}
                            >
                                ← Trước
                            </button>
                            <span style={{ fontSize: '14px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Trang <strong style={{ color: '#4CAF50', fontSize: '16px' }}>{currentPage}</strong> / <strong>{totalPages}</strong>
                            </span>
                            <button
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '6px',
                                    border: '1px solid #E8E8E8',
                                    backgroundColor: currentPage === totalPages ? '#F0F0F0' : '#fff',
                                    color: currentPage === totalPages ? '#999' : '#4CAF50',
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
                                        e.currentTarget.style.backgroundColor = '#4CAF50';
                                        e.currentTarget.style.color = '#fff';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (currentPage < totalPages) {
                                        e.currentTarget.style.backgroundColor = '#fff';
                                        e.currentTarget.style.color = '#4CAF50';
                                    }
                                }}
                            >
                                Sau →
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Modal Chi tiết hoàn tiền */}
            {showRefundDetailsModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '20px',
                }}>
                    <div style={{
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        maxWidth: '800px',
                        width: '100%',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '20px',
                            borderBottom: '1px solid #E8E8E8',
                            position: 'sticky',
                            top: 0,
                            backgroundColor: '#fff',
                            zIndex: 1,
                        }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e1e1e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FontAwesomeIcon icon={faInfoCircle} style={{ color: '#4CAF50' }} />
                                Chi tiết hoàn tiền - Hóa đơn #{selectedInvoiceForRefund}
                            </h3>
                            <button
                                onClick={() => setShowRefundDetailsModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#999',
                                    padding: 0,
                                    transition: 'color 0.3s ease',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#333'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#999'}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '20px' }}>
                            {loadingRefundDetails ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center', gap: '16px' }}>
                                    <FontAwesomeIcon 
                                        icon={faSpinner} 
                                        style={{ fontSize: '40px', color: '#4CAF50', animation: 'spin 1s linear infinite' }}
                                    />
                                    <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Đang tải thông tin hoàn tiền...</p>
                                </div>
                            ) : refundDetails.length === 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center', gap: '12px' }}>
                                    <FontAwesomeIcon icon={faInfoCircle} style={{ fontSize: '48px', color: '#4CAF50', opacity: 0.6 }} />
                                    <p style={{ fontSize: '16px', fontWeight: '600', color: '#333', margin: '8px 0' }}>Không có dữ liệu hoàn tiền</p>
                                    <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>Hóa đơn này hiện không có thông tin hoàn tiền</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {refundDetails.map((refund, idx) => (
                                        <div key={idx} style={{
                                            border: '1px solid #E8E8E8',
                                            borderRadius: '8px',
                                            padding: '16px',
                                            backgroundColor: '#FAFBFC',
                                        }}>
                                            {/* Header */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                marginBottom: '16px',
                                                paddingBottom: '12px',
                                                borderBottom: '1px solid #E8E8E8',
                                            }}>
                                                <div>
                                                    <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>ID Yêu cầu hoàn tiền</div>
                                                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e1e1e' }}>#{refund.id}</div>
                                                </div>
                                                <span style={{
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    padding: '4px 12px',
                                                    borderRadius: '20px',
                                                    backgroundColor: refund.status === 'Approved' ? '#E8F5E9' : '#FFF3E0',
                                                    color: refund.status === 'Approved' ? '#4CAF50' : '#FF9800',
                                                }}>
                                                    {refund.status === 'Approved' ? '✓ Đã phê duyệt' : refund.status}
                                                </span>
                                            </div>

                                            {/* Thông tin hoàn tiền */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                                <div>
                                                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', marginBottom: '6px' }}>Số tiền hoàn</div>
                                                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#4CAF50' }}>
                                                        {formatCurrency(refund.refundAmount).split(' ')[0]}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', marginBottom: '6px' }}>Lý do hoàn tiền</div>
                                                    <div style={{ fontSize: '13px', color: '#1e1e1e', fontWeight: '500' }}>
                                                        {refund.refundReason || 'N/A'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', marginBottom: '6px' }}>Phương thức hoàn</div>
                                                    <div style={{ fontSize: '13px', color: '#1e1e1e', fontWeight: '500' }}>
                                                        {refund.refundMethod === 'TIENMAT' ? 'Tiền mặt' : refund.refundMethod === 'ChuyenKhoan' ? 'Chuyển khoản' : refund.refundMethod}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', marginBottom: '6px' }}>Ngày tạo</div>
                                                    <div style={{ fontSize: '13px', color: '#1e1e1e', fontWeight: '500' }}>
                                                        {new Date(refund.createdDate).toLocaleDateString('vi-VN')}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Thông tin ngân hàng (nếu có) */}
                                            {refund.bankAccount && (
                                                <div style={{
                                                    backgroundColor: '#fff',
                                                    border: '1px solid #E8E8E8',
                                                    borderRadius: '6px',
                                                    padding: '12px',
                                                    marginBottom: '16px',
                                                }}>
                                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#333', marginBottom: '8px' }}>Thông tin tài khoản ngân hàng</div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                                                        <div>
                                                            <span style={{ color: '#999' }}>Số tài khoản:</span>
                                                            <div style={{ fontWeight: '600', color: '#1e1e1e' }}>{refund.bankAccount}</div>
                                                        </div>
                                                        <div>
                                                            <span style={{ color: '#999' }}>Chủ tài khoản:</span>
                                                            <div style={{ fontWeight: '600', color: '#1e1e1e' }}>{refund.bankAccountName}</div>
                                                        </div>
                                                        <div style={{ gridColumn: '1 / -1' }}>
                                                            <span style={{ color: '#999' }}>Ngân hàng:</span>
                                                            <div style={{ fontWeight: '600', color: '#1e1e1e' }}>{refund.bankName}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                            

                                            {/* Timeline hoàn tiền */}
                                            <div style={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #E8E8E8',
                                                borderRadius: '6px',
                                                padding: '12px',
                                                fontSize: '13px',
                                            }}>
                                                <div style={{ fontWeight: '700', color: '#333', marginBottom: '8px' }}>Lịch sử xử lý</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid #E8E8E8' }}>
                                                        <span style={{ color: '#666' }}>Ngày tạo:</span>
                                                        <span style={{ fontWeight: '600', color: '#1e1e1e' }}>{new Date(refund.createdDate).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    {refund.approvedDate && (
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid #E8E8E8' }}>
                                                            <span style={{ color: '#666' }}>Ngày phê duyệt:</span>
                                                            <span style={{ fontWeight: '600', color: '#4CAF50' }}>{new Date(refund.approvedDate).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    )}
                                                    {refund.completedDate && (
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span style={{ color: '#666' }}>Ngày hoàn thành:</span>
                                                            <span style={{ fontWeight: '600', color: '#4CAF50' }}>{new Date(refund.completedDate).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RefundedInvoice;
