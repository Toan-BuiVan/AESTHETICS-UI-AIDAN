
import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './AwaitingPayment.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faTimes, faCreditCard, faWallet, faTruck } from '@fortawesome/free-solid-svg-icons';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';

const cx = classNames.bind(styles);

function AwaitingPayment({ onCountChange }) {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [invoiceDetails, setInvoiceDetails] = useState({});
    const [expandedInvoice, setExpandedInvoice] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('Momo');
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        const fetchInvoices = async () => {
            const deviceName = localStorage.getItem('deviceName') || '';
            const refreshToken = localStorage.getItem('refreshToken') || '';
            const token = localStorage.getItem('token') || '';
            const userID = localStorage.getItem('userID') || '';

            const requestData = {
                customerID: userID,
                employeeID: null,
                invoiceID: null,
                invoiceType: 'Output',
                status: 'Pending',
                startDate: null,
                endDate: null,
                paymentMethod: null,
            };

            const headers = {
                'Content-Type': 'application/json',
                DeviceName: deviceName,
                RefreshToken: refreshToken,
                Authorization: token ? `Bearer ${token}` : '',
                UserID: userID,
            };

            try {
                const response = await fetch('http://localhost:5262/api/Invoice/GetList_SearchInvoice', {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(requestData),
                });

                if (!response.ok) {
                    throw new Error('Lỗi khi gọi API');
                }

                const result = await response.json();
                const invoiceList = result.data || [];
                setInvoices(invoiceList);
                onCountChange(invoiceList.length);
                setLoading(false);
            } catch (error) {
                setError(error.message);
                setLoading(false);
            }
        };

        fetchInvoices();
    }, [onCountChange]);

    const fetchInvoiceDetails = async (invoiceID) => {
        const requestData = {
            invoiceID: invoiceID,
            invoiceDetailType: null,
            startDate: null,
            endDate: null,
        };

        const headers = {
            'Content-Type': 'application/json',
            DeviceName: localStorage.getItem('deviceName') || '',
            RefreshToken: localStorage.getItem('refreshToken') || '',
            Authorization: localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
            UserID: localStorage.getItem('userID') || '',
        };

        try {
            const response = await fetch('http://localhost:5262/api/Invoice/GetList_SearchInvoiceDetail', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error('Lỗi khi gọi API chi tiết hóa đơn');
            }

            const result = await response.json();
            setInvoiceDetails((prev) => ({
                ...prev,
                [invoiceID]: result.data || [],
            }));
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết hóa đơn:', error);
        }
    };

    const handleToggleDetails = (invoiceID) => {
        if (expandedInvoice === invoiceID) {
            setExpandedInvoice(null);
        } else {
            setExpandedInvoice(invoiceID);
            if (!invoiceDetails[invoiceID]) {
                fetchInvoiceDetails(invoiceID);
            }
        }
    };

    const handlePayment = async (invoice, method) => {
        const userName = localStorage.getItem('userName') || '';

        const headers = {
            'Content-Type': 'application/json',
            DeviceName: localStorage.getItem('deviceName') || '',
            RefreshToken: localStorage.getItem('refreshToken') || '',
            Authorization: localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
            UserID: localStorage.getItem('userID') || '',
        };

        let apiUrl;
        let requestData;

        switch (method) {
            case 'Momo':
                apiUrl = 'http://localhost:5262/api/Payment/CreatePaymentUrl';
                requestData = {
                    orderId: String(invoice.invoiceID),
                    amount: String(invoice.totalAmountAfterDiscount),
                    fullName: userName,
                    orderInfo: 'Thanh Toán Hóa Đơn Aesthetics',
                };
                break;
            case 'BankTransfer':
                apiUrl = 'http://localhost:5262/api/Payment/CreatePaymentUrlVnPay';
                requestData = {
                    OrderID: String(invoice.invoiceID),
                    amount: invoice.totalAmountAfterDiscount,
                    name: userName,
                    orderDescription: 'Thanh Toán Hóa Đơn Aesthetics',
                };
                break;
            case 'COD':
                apiUrl = 'http://localhost:5262/api/Invoice/ProcessDirectPayment';
                requestData = { invoiceID: invoice.invoiceID };
                break;
            default:
                console.error('Phương thức thanh toán không hợp lệ');
                return;
        }

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestData),
            });

            if (method === 'COD') {
                const data = await response.json();
                const newAccessToken = response.headers.get('New-AccessToken');
                const newRefreshToken = response.headers.get('New-RefreshToken');
                if (newAccessToken) localStorage.setItem('token', newAccessToken);
                if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
                setSuccessMessage(data.resposeMessage);
                setTimeout(() => {
                    setSuccessMessage(null);
                }, 2000);
            }

            if (!response.ok) {
                const contentType = response.headers.get('Content-Type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Lỗi khi gọi API');
                } else {
                    throw new Error('Server trả về response không phải JSON');
                }
            }

            const result = await response.json();
            if (result.paymentUrl) {
                window.location.href = result.paymentUrl;
            } else if (result.message) {
                alert(result.message);
                setShowPaymentModal(false);
            }
        } catch (error) {
            console.error('Lỗi khi thực hiện thanh toán:', error);
        }
    };

    const openPaymentModal = (invoice) => {
        setSelectedInvoice(invoice);
        setShowPaymentModal(true);
        if (!invoiceDetails[invoice.invoiceID]) {
            fetchInvoiceDetails(invoice.invoiceID);
        }
    };

    if (loading) {
        return <div className={cx('loading')}>Đang tải...</div>;
    }

    if (error) {
        return <div className={cx('error')}>Lỗi: {error}</div>;
    }

    return (
        <div className={cx('awaiting-payment')}>
            {successMessage && <SuccessMessage message={successMessage} />}
            <h2>Hóa đơn chờ thanh toán</h2>
            {invoices.length === 0 ? (
                <p>Không có hóa đơn nào chờ thanh toán.</p>
            ) : (
                <div className={cx('table-wrapper')}>
                    <table className={cx('invoice-table')}>
                        <thead>
                            <tr>
                                <th>Mã Hóa Đơn</th>
                                <th>Khách Hàng</th>
                                <th>Giảm Giá</th>
                                <th>Tổng Tiền</th>
                                <th>Thanh Toán</th>
                                <th>Ngày Tạo</th>
                                <th>Trạng Thái</th>
                                <th>Chi Tiết</th>
                                <th>Thanh Toán Ngay</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((invoice) => (
                                <React.Fragment key={invoice.invoiceID}>
                                    <tr>
                                        <td>{invoice.invoiceID}</td>
                                        <td>{invoice.customerName}</td>
                                        <td>{invoice.discountValue}%</td>
                                        <td>{invoice.totalMoney.toLocaleString('vi-VN')} đ</td>
                                        <td>{invoice.totalAmountAfterDiscount.toLocaleString('vi-VN')} đ</td>
                                        <td>{new Date(invoice.dateCreated).toLocaleString('vi-VN')}</td>
                                        <td>{invoice.status}</td>
                                        <td>
                                            <FontAwesomeIcon
                                                icon={faCaretDown}
                                                className={cx('caret-icon')}
                                                onClick={() => handleToggleDetails(invoice.invoiceID)}
                                            />
                                        </td>
                                        <td>
                                            {invoice.paymentMethod !== 'Thanh Toán Khi Nhận Hàng' && (
                                                <button
                                                    className={cx('btn-Submit')}
                                                    onClick={() => openPaymentModal(invoice)}
                                                >
                                                    Thanh toán ngay
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                    {expandedInvoice === invoice.invoiceID && invoiceDetails[invoice.invoiceID] && (
                                        <tr>
                                            <td colSpan="9">
                                                <div className={cx('detail-table-wrapper')}>
                                                    <table className={cx('detail-table')}>
                                                        <thead>
                                                            <tr>
                                                                <th>Loại</th>
                                                                <th>Tên</th>
                                                                <th>Giá</th>
                                                                <th>Số Lượng</th>
                                                                <th>Tổng Tiền</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {invoiceDetails[invoice.invoiceID].map((detail) => (
                                                                <React.Fragment key={detail.invoiceDetailID}>
                                                                    {detail.productName && (
                                                                        <tr>
                                                                            <td>Sản phẩm</td>
                                                                            <td>{detail.productName}</td>
                                                                            <td>
                                                                                {detail.priceProduct.toLocaleString(
                                                                                    'vi-VN',
                                                                                )}{' '}
                                                                                đ
                                                                            </td>
                                                                            <td>{detail.totalQuantityProduct}</td>
                                                                            <td>
                                                                                {(
                                                                                    detail.priceProduct *
                                                                                    detail.totalQuantityProduct
                                                                                ).toLocaleString('vi-VN')}{' '}
                                                                                đ
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                    {detail.serviceName && (
                                                                        <tr>
                                                                            <td>Dịch vụ</td>
                                                                            <td>{detail.serviceName}</td>
                                                                            <td>
                                                                                {detail.priceService.toLocaleString(
                                                                                    'vi-VN',
                                                                                )}{' '}
                                                                                đ
                                                                            </td>
                                                                            <td>{detail.totalQuantityService}</td>
                                                                            <td>
                                                                                {(
                                                                                    detail.priceService *
                                                                                    detail.totalQuantityService
                                                                                ).toLocaleString('vi-VN')}{' '}
                                                                                đ
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </React.Fragment>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && selectedInvoice && (
                <div className={cx('payment-modal')}>
                    <div className={cx('modal-content')}>
                        <button className={cx('modal-close')} onClick={() => setShowPaymentModal(false)}>
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                        <h3>
                            Thanh toán hóa đơn <strong>#{selectedInvoice.invoiceID}</strong>
                        </h3>
                        <div className={cx('order-summary')}>
                            {invoiceDetails[selectedInvoice.invoiceID] ? (
                                <div className={cx('detail-cards')}>
                                    {invoiceDetails[selectedInvoice.invoiceID].map((detail) => (
                                        <div key={detail.invoiceDetailID} className={cx('detail-card')}>
                                            <div className={cx('detail-header')}>
                                                <span className={cx('detail-name')}>
                                                    {detail.productName || detail.serviceName}
                                                </span>
                                            </div>
                                            <div className={cx('detail-content')}>
                                                <span className={cx('detail-info')}>
                                                    <span className={cx('price')}>
                                                        {(detail.priceProduct || detail.priceService).toLocaleString(
                                                            'vi-VN',
                                                        )}{' '}
                                                        đ
                                                    </span>{' '}
                                                    x {detail.totalQuantityProduct || detail.totalQuantityService}
                                                </span>
                                                <span className={cx('detail-total')}>
                                                    {(
                                                        (detail.priceProduct || detail.priceService) *
                                                        (detail.totalQuantityProduct || detail.totalQuantityService)
                                                    ).toLocaleString('vi-VN')}{' '}
                                                    đ
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div>Đang tải chi tiết hóa đơn...</div>
                            )}

                            {selectedInvoice.code && (
                                <div className={cx('voucher-section')}>
                                    <h4>Vouchers đã sử dụng</h4>
                                    <ul>
                                        <li>
                                            {selectedInvoice.code}: Giảm {selectedInvoice.discountValue}% (
                                            <strong>
                                                -
                                                {(
                                                    selectedInvoice.totalMoney -
                                                    selectedInvoice.totalAmountAfterDiscount
                                                ).toLocaleString('vi-VN')}{' '}
                                                đ
                                            </strong>
                                            )
                                        </li>
                                    </ul>
                                </div>
                            )}

                            <div className={cx('total-amount')}>
                                <p>
                                    Thanh Toán:
                                    <del style={{ color: 'red' }}>
                                        {selectedInvoice.totalMoney.toLocaleString('vi-VN')} đ
                                    </del>
                                    <strong>
                                        {selectedInvoice.totalAmountAfterDiscount.toLocaleString('vi-VN')} đ
                                    </strong>
                                </p>
                            </div>
                        </div>
                        <div className={cx('payment-methods')}>
                            <h4>Chọn phương thức thanh toán</h4>
                            <div className={cx('payment-options')}>
                                <label className={cx('payment-option', paymentMethod === 'Momo' && 'selected')}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="Momo"
                                        checked={paymentMethod === 'Momo'}
                                        onChange={() => setPaymentMethod('Momo')}
                                    />
                                    <FontAwesomeIcon icon={faWallet} className={cx('option-icon')} />
                                    <span>Ví điện tử Momo</span>
                                </label>
                                <label className={cx('payment-option', paymentMethod === 'BankTransfer' && 'selected')}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="BankTransfer"
                                        checked={paymentMethod === 'BankTransfer'}
                                        onChange={() => setPaymentMethod('BankTransfer')}
                                    />
                                    <FontAwesomeIcon icon={faCreditCard} className={cx('option-icon')} />
                                    <span>Chuyển khoản ngân hàng</span>
                                </label>
                                <label className={cx('payment-option', paymentMethod === 'COD' && 'selected')}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="COD"
                                        checked={paymentMethod === 'COD'}
                                        onChange={() => setPaymentMethod('COD')}
                                    />
                                    <FontAwesomeIcon icon={faTruck} className={cx('option-icon')} />
                                    <span>Nhận hàng thanh toán</span>
                                </label>
                            </div>
                        </div>
                        <div className={cx('modal-actions')}>
                            <button className={cx('btn-cancel')} onClick={() => setShowPaymentModal(false)}>
                                Hủy
                            </button>
                            <button
                                className={cx('btn-confirm')}
                                onClick={() => handlePayment(selectedInvoice, paymentMethod)}
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AwaitingPayment;
