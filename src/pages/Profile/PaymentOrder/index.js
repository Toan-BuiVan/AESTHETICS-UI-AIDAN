import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './PaymentOrder.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';

const cx = classNames.bind(styles);

function PaymentOrder() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [invoiceDetails, setInvoiceDetails] = useState({});
    const [expandedInvoice, setExpandedInvoice] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [ratingForm, setRatingForm] = useState({
        isOpen: false,
        itemType: '',
        itemID: '',
        itemName: '',
        invoiceDetailID: '',
    });
    const [ratingContent, setRatingContent] = useState('');
    const [ratedItems, setRatedItems] = useState([]);

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
                status: 'Paid',
                startDate: null,
                endDate: null,
                paymentMethod: 'Thanh Toán Khi Nhận Hàng',
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
                setInvoices(result.data || []);
                setLoading(false);
            } catch (error) {
                setError(error.message);
                setLoading(false);
            }
        };

        fetchInvoices();
    }, []);

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

    const handleCompleteOrder = async (invoiceID) => {
        const invoice = invoices.find((inv) => inv.invoiceID === invoiceID);
        if (!invoice) {
            console.error('Không tìm thấy hóa đơn');
            return;
        }

        const deviceName = localStorage.getItem('deviceName') || '';
        const refreshToken = localStorage.getItem('refreshToken') || '';
        const token = localStorage.getItem('token') || '';
        const userID = localStorage.getItem('userID') || '';

        const headers = {
            'Content-Type': 'application/json',
            DeviceName: deviceName,
            RefreshToken: refreshToken,
            Authorization: token ? `Bearer ${token}` : '',
            UserID: userID,
        };

        try {
            let response;
            if (invoice.paymentMethod === 'Thanh Toán Khi Nhận Hàng') {
                const requestData = {
                    invoiceID: invoiceID,
                };
                response = await fetch('http://localhost:5262/api/Invoice/ConfirmCodPaymentSuccess', {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(requestData),
                });
            } else {
                const requestData = {
                    invoiceID: invoiceID,
                    status: 'Đã Nhận Hàng',
                };
                response = await fetch('http://localhost:5262/api/Invoice/UpdateOrderStatus', {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(requestData),
                });
            }

            const data = await response.json();
            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
            setSuccessMessage(data.resposeMessage);
            setTimeout(() => {
                setSuccessMessage(null);
            }, 2000);

            if (!response.ok) {
                throw new Error('Lỗi khi cập nhật trạng thái đơn hàng');
            }

            const updatedInvoices = invoices.map((inv) =>
                inv.invoiceID === invoiceID ? { ...inv, orderStatus: 'Đã Nhận Hàng' } : inv,
            );
            setInvoices(updatedInvoices);
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
        }
    };

    const openRatingForm = (itemType, itemID, itemName, invoiceDetailID) => {
        setRatingForm({ isOpen: true, itemType, itemID, itemName, invoiceDetailID });
        setRatingContent('');
    };

    const closeRatingForm = () => {
        setRatingForm({ isOpen: false, itemType: '', itemID: '', itemName: '', invoiceDetailID: '' });
        setRatingContent('');
    };

    const handleSubmitRating = async () => {
        const { itemType, itemID, invoiceDetailID } = ratingForm;
        const userID = localStorage.getItem('userID');

        if (!userID || isNaN(userID)) {
            setSuccessMessage('Bạn cần đăng nhập để đánh giá.');
            setTimeout(() => {
                setSuccessMessage(null);
            }, 2000);
            return;
        }

        const requestData = {
            userID: parseInt(userID, 10),
            productID: itemType === 'sản phẩm' ? itemID : null,
            serviceID: itemType === 'dịch vụ' ? itemID : null,
            comment_Content: ratingContent,
            invoiceDetailID: invoiceDetailID,
        };

        const headers = {
            'Content-Type': 'application/json',
            DeviceName: localStorage.getItem('deviceName') || '',
            RefreshToken: localStorage.getItem('refreshToken') || '',
            Authorization: localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
            UserID: userID,
        };

        try {
            const response = await fetch('http://localhost:5262/api/Comment/Insert_Comment', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestData),
            });
            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.resposeMessage || 'Lỗi khi gửi đánh giá');
            }

            setSuccessMessage('Đánh giá đã được gửi thành công');
            setRatedItems((prev) => [...prev, invoiceDetailID]);
            closeRatingForm();
            setTimeout(() => {
                setSuccessMessage(null);
            }, 2000);
        } catch (error) {
            console.error('Lỗi khi gửi đánh giá:', error);
            setSuccessMessage(error.message || 'Có lỗi xảy ra khi gửi đánh giá');
            setTimeout(() => {
                setSuccessMessage(null);
            }, 2000);
        }
    };

    if (loading) {
        return <div className={cx('loading')}>Đang tải...</div>;
    }

    if (error) {
        return <div className={cx('error')}>Lỗi: {error}</div>;
    }

    return (
        <div className={cx('payment-order')}>
            {successMessage && <SuccessMessage message={successMessage} />}
            <h2>Hóa đơn đang chuẩn bị hoặc đang giao</h2>
            {invoices.length === 0 ? (
                <p>Không có hóa đơn nào đang chuẩn bị hoặc đang giao.</p>
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
                                <th>Giao Hàng</th>
                                <th>Chi Tiết</th>
                                <th>Hoàn Thành</th>
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
                                        <td>{invoice.orderStatus}</td>
                                        <td>
                                            <FontAwesomeIcon
                                                icon={faCaretDown}
                                                className={cx('caret-icon')}
                                                onClick={() => handleToggleDetails(invoice.invoiceID)}
                                            />
                                        </td>
                                        <td>
                                            <button
                                                className={cx('complete-button')}
                                                onClick={() => handleCompleteOrder(invoice.invoiceID)}
                                            >
                                                {invoice.orderStatus === 'Đã Nhận Hàng' ? 'Đồng ý' : 'Nhận hàng'}
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedInvoice === invoice.invoiceID && invoiceDetails[invoice.invoiceID] && (
                                        <tr>
                                            <td colSpan="10">
                                                <div className={cx('detail-table-wrapper')}>
                                                    <table className={cx('detail-table')}>
                                                        <thead>
                                                            <tr>
                                                                <th>Loại</th>
                                                                <th>Tên</th>
                                                                <th>Giá</th>
                                                                <th>Số Lượng</th>
                                                                <th>Tổng Tiền</th>
                                                                {invoice.orderStatus === 'Đã Nhận Hàng' && (
                                                                    <th>Đánh Giá</th>
                                                                )}
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
                                                                            {invoice.orderStatus === 'Đã Nhận Hàng' &&
                                                                                !ratedItems.includes(
                                                                                    detail.invoiceDetailID,
                                                                                ) &&
                                                                                detail.statusComment === 1 && (
                                                                                    <td>
                                                                                        <button
                                                                                            className={cx(
                                                                                                'rate-button',
                                                                                            )}
                                                                                            onClick={() =>
                                                                                                openRatingForm(
                                                                                                    'sản phẩm',
                                                                                                    detail.productID,
                                                                                                    detail.productName,
                                                                                                    detail.invoiceDetailID,
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            Đánh giá
                                                                                        </button>
                                                                                    </td>
                                                                                )}
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
                                                                            {invoice.orderStatus === 'Đã Nhận Hàng' &&
                                                                                !ratedItems.includes(
                                                                                    detail.invoiceDetailID,
                                                                                ) &&
                                                                                detail.statusComment === 1 && (
                                                                                    <td>
                                                                                        <button
                                                                                            className={cx(
                                                                                                'rate-button',
                                                                                            )}
                                                                                            onClick={() =>
                                                                                                openRatingForm(
                                                                                                    'dịch vụ',
                                                                                                    detail.serviceID,
                                                                                                    detail.serviceName,
                                                                                                    detail.invoiceDetailID,
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            Đánh giá
                                                                                        </button>
                                                                                    </td>
                                                                                )}
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
            {ratingForm.isOpen && (
                <div className={cx('rating-form')}>
                    <h3>
                        Đánh giá {ratingForm.itemType}: {ratingForm.itemName}
                    </h3>
                    <textarea
                        value={ratingContent}
                        onChange={(e) => setRatingContent(e.target.value)}
                        placeholder="Nhập nội dung đánh giá của bạn..."
                    />
                    <button onClick={handleSubmitRating}>Gửi đánh giá</button>
                    <button onClick={closeRatingForm}>Hủy</button>
                </div>
            )}
        </div>
    );
}

export default PaymentOrder;
