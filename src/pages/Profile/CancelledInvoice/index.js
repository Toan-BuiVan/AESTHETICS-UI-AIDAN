import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './CancelledInvoice.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle, faSpinner, faChevronRight, faCalendarAlt, faBox, faStethoscope } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function CancelledInvoice({ onCountChange }) {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedInvoice, setExpandedInvoice] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const pageSize = 6;

    // Hàm gọi API getinvoicelist với status KhachHuy
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
                type: null,
                status: 'KhachHuy',
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
            console.log('Cancelled invoice list response:', result);

            const invoiceList = result.baseDatas || [];
            setInvoices(invoiceList);
            setTotalRecords(result.totalRecordCount || 0);
            setTotalPages(result.pageCount || 1);
            setCurrentPage(result.pageIndex || 1);
            onCountChange(invoiceList.length);
            setLoading(false);
        } catch (err) {
            console.error('Lỗi khi lấy danh sách hóa đơn bị hủy:', err);
            setLoading(false);
        }
    };

    // Fetch invoices khi component mount
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

    // Hàm format tiền tệ
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    return (
        <div className={cx('cancelled-invoice')}>
            {/* Premium Header */}
            <div className={cx('header')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <FontAwesomeIcon icon={faTimesCircle} style={{ fontSize: '28px', color: '#FF6B6B' }} />
                    <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>Hóa Đơn Bị Hủy</h3>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FontAwesomeIcon icon={faTimesCircle} style={{ color: '#FF6B6B' }} />
                        <strong>{totalRecords} hóa đơn</strong> đã bị hủy
                    </span>
                </div>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className={cx('loading')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
                    <FontAwesomeIcon 
                        icon={faSpinner} 
                        className={cx('spinner')} 
                        style={{ fontSize: '48px', color: '#FF6B6B', marginBottom: '16px', animation: 'spin 1s linear infinite' }}
                    />
                    <p style={{ fontSize: '16px', color: '#666', margin: '0' }}>Đang tải dữ liệu hóa đơn...</p>
                </div>
            ) : invoices.length === 0 ? (
                <div className={cx('empty-state')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
                    <FontAwesomeIcon icon={faTimesCircle} style={{ fontSize: '56px', color: '#FF6B6B', marginBottom: '16px', opacity: 0.7 }} />
                    <p style={{ fontSize: '18px', fontWeight: '600', color: '#333', margin: '8px 0 16px 0' }}>Không có hóa đơn bị hủy</p>
                    <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>Bạn không có hóa đơn nào bị hủy để hiển thị</p>
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
                                        borderBottom: expandedInvoice === item.invoice.id ? '2px solid #FF6B6B' : '1px solid #E8E8E8',
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
                                                    <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#FFE8E8', color: '#FF6B6B', marginLeft: 'auto' }}>
                                                        ✕ Đã hủy
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
                                                <div style={{ fontSize: '18px', fontWeight: '700', color: '#FF6B6B' }}>
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
                                    <div className={cx('invoice-details')} style={{ padding: '20px', backgroundColor: '#FAFBFC', borderTop: '2px solid #FF6B6B', animation: 'slideDown 0.3s ease' }}>
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
                                                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#FF6B6B', whiteSpace: 'nowrap' }}>
                                                                    {formatCurrency(detail.finalPrice).split(' ')[0]}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Price Summary Card */}
                                        <div style={{ backgroundColor: '#FFE8E8', borderRadius: '8px', padding: '14px', border: '2px solid #FF6B6B' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #FFCCCC' }}>
                                                <span style={{ fontSize: '13px', color: '#666' }}>Tổng tiền</span>
                                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e1e1e' }}>{formatCurrency(item.invoice.totalMoney).split(' ')[0]}</span>
                                            </div>
                                            {item.invoice.discountValue > 0 && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #FFCCCC' }}>
                                                    <span style={{ fontSize: '13px', color: '#666' }}>Giảm giá</span>
                                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#FF9800' }}>-{formatCurrency(item.invoice.discountValue).split(' ')[0]}</span>
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '13px', color: '#666' }}>Thành tiền</span>
                                                <span style={{ fontSize: '16px', fontWeight: '700', color: '#FF6B6B' }}>{formatCurrency(item.invoice.finalPrice).split(' ')[0]}</span>
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
                                    color: currentPage === 1 ? '#999' : '#FF6B6B',
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
                                        e.currentTarget.style.backgroundColor = '#FF6B6B';
                                        e.currentTarget.style.color = '#fff';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (currentPage > 1) {
                                        e.currentTarget.style.backgroundColor = '#fff';
                                        e.currentTarget.style.color = '#FF6B6B';
                                    }
                                }}
                            >
                                ← Trước
                            </button>
                            <span style={{ fontSize: '14px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Trang <strong style={{ color: '#FF6B6B', fontSize: '16px' }}>{currentPage}</strong> / <strong>{totalPages}</strong>
                            </span>
                            <button
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '6px',
                                    border: '1px solid #E8E8E8',
                                    backgroundColor: currentPage === totalPages ? '#F0F0F0' : '#fff',
                                    color: currentPage === totalPages ? '#999' : '#FF6B6B',
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
                                        e.currentTarget.style.backgroundColor = '#FF6B6B';
                                        e.currentTarget.style.color = '#fff';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (currentPage < totalPages) {
                                        e.currentTarget.style.backgroundColor = '#fff';
                                        e.currentTarget.style.color = '#FF6B6B';
                                    }
                                }}
                            >
                                Sau →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default CancelledInvoice;
