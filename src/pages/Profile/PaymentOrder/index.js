import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './PaymentOrder.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTruck, faSpinner, faBox, faStethoscope, faChevronRight, 
    faCalendarAlt, faCheckCircle, faClock, faTimesCircle, faTasks 
} from '@fortawesome/free-solid-svg-icons';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';

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
    const pageSize = 6;

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
                orderStatuses: ['DangXuLy', 'DangGiao', 'DaGiao', 'DaHuy'],
                type: '',
                status: '',
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
        </div>
    );
}

export default PaymentOrder;
