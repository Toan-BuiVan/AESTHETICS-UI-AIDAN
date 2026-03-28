import React, { useState, useEffect } from 'react';
import styles from './BookingsInvoice.module.scss';
import classNames from 'classnames/bind';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';

const cx = classNames.bind(styles);

function BookingsInvoice({ invoiceItems, setInvoiceItems, setParentSuccessMessage }) {
    const [vouchers, setVouchers] = useState([]);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [isVouchersVisible, setIsVouchersVisible] = useState(false);
    const [discountInfo, setDiscountInfo] = useState({ discountAmount: 0, finalTotal: 0 });

    useEffect(() => {
        // Initialize empty vouchers list
        setVouchers([]);
    }, []);

    const calculateDiscount = (total, voucher) => {
        if (!voucher) return { discountAmount: 0, finalTotal: total };

        const { discountValue, maxValue, minimumOrderValue } = voucher;

        if (total < minimumOrderValue) {
            return { discountAmount: 0, finalTotal: total };
        }

        let discountAmount = (total * discountValue) / 100;
        if (discountAmount > maxValue) {
            discountAmount = maxValue;
        }

        const finalTotal = total - discountAmount;
        return { discountAmount, finalTotal };
    };

    useEffect(() => {
        const totalPrice = invoiceItems.reduce((total, item) => {
            return total + (item.priceService || 0) * (item.quantity || 1);
        }, 0);
        const { discountAmount, finalTotal } = calculateDiscount(totalPrice, selectedVoucher);
        setDiscountInfo({ discountAmount, finalTotal });
    }, [selectedVoucher, invoiceItems]);

    const handleRemoveFromInvoice = (index) => {
        setInvoiceItems((prevItems) => prevItems.filter((_, i) => i !== index));
    };

    const handleCheckout = async (index) => {
        const item = invoiceItems[index];
        const userID = localStorage.getItem('userID') || '';
        const deviceName = localStorage.getItem('deviceName') || '';
        const refreshToken = localStorage.getItem('refreshToken') || '';
        const token = localStorage.getItem('token') || '';

        if (!item || !item.serviceID || !item.quantity) {
            console.error('Dữ liệu dịch vụ không hợp lệ:', item);
            return;
        }

        const headers = {
            'Content-Type': 'application/json',
            DeviceName: deviceName,
            RefreshToken: refreshToken,
            Authorization: token ? `Bearer ${token}` : '',
            UserID: userID,
        };

        const body = {
            customerID: userID,
            voucherID: selectedVoucher ? selectedVoucher.voucherID : null,
            serviceIDs: [item.serviceID],
            quantityService: [item.quantity],
        };

        try {
            const response = await fetch('http://localhost:5262/api/Invoice/Insert_Invoice', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body),
            });

            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            const data = await response.json();
            console.log('Dữ liệu phản hồi:', data);
            setInvoiceItems((prevItems) => prevItems.filter((_, i) => i !== index));
            setParentSuccessMessage(data.resposeMessage || 'Thanh toán dịch vụ thành công!');
            setTimeout(() => {
                setParentSuccessMessage(null);
            }, 2000);
        } catch (error) {
            console.error('Lỗi khi gọi API thanh toán:', error);
            setParentSuccessMessage('Lỗi khi thanh toán: ' + error.message);
            setTimeout(() => {
                setParentSuccessMessage(null);
            }, 2000);
        }
    };

    const handleCheckoutAllItems = async () => {
        if (invoiceItems.length === 0) {
            setParentSuccessMessage('Không có dịch vụ nào để thanh toán.');
            setTimeout(() => {
                setParentSuccessMessage(null);
            }, 2000);
            return;
        }

        const userID = localStorage.getItem('userID') || '';
        const deviceName = localStorage.getItem('deviceName') || '';
        const refreshToken = localStorage.getItem('refreshToken') || '';
        const token = localStorage.getItem('token') || '';

        const invalidItems = invoiceItems.filter((item) => !item.serviceID || !item.quantity);
        if (invalidItems.length > 0) {
            console.error('Dữ liệu dịch vụ không hợp lệ:', invalidItems);
            setParentSuccessMessage('Một số dịch vụ không hợp lệ.');
            setTimeout(() => {
                setParentSuccessMessage(null);
            }, 2000);
            return;
        }

        const headers = {
            'Content-Type': 'application/json',
            DeviceName: deviceName,
            RefreshToken: refreshToken,
            Authorization: token ? `Bearer ${token}` : '',
            UserID: userID,
        };

        const body = {
            customerID: userID,
            voucherID: selectedVoucher ? selectedVoucher.voucherID : null,
            servicesIDs: invoiceItems.map((item) => item.serviceID),
            quantityServices: invoiceItems.map((item) => item.quantity),
        };

        try {
            const response = await fetch('http://localhost:5262/api/Invoice/Insert_Invoice', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body),
            });

            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            if (response.ok) {
                let data;
                const contentType = response.headers.get('Content-Type');
                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                    console.log('Dữ liệu từ API:', data);
                } else {
                    throw new Error('Phản hồi từ server không phải JSON');
                }
                setInvoiceItems([]);
                setParentSuccessMessage(data.resposeMessage || 'Thanh toán tất cả dịch vụ thành công!');
                setTimeout(() => {
                    setParentSuccessMessage(null);
                }, 2000);
            } else {
                const errorText = await response.text();
                console.error('Thanh toán thất bại:', response.statusText, 'Chi tiết lỗi:', errorText);
                setParentSuccessMessage('Thanh toán thất bại: ' + (errorText || response.statusText));
                setTimeout(() => {
                    setParentSuccessMessage(null);
                }, 2000);
            }
        } catch (error) {
            console.error('Lỗi khi gọi API thanh toán:', error);
            setParentSuccessMessage('Lỗi khi thanh toán: ' + error.message);
            setTimeout(() => {
                setParentSuccessMessage(null);
            }, 2000);
        }
    };

    const toggleVouchersVisibility = () => {
        setIsVouchersVisible(!isVouchersVisible);
    };

    const totalPrice = invoiceItems.reduce((total, item) => {
        return total + (item.priceService || 0) * (item.quantity || 1);
    }, 0);

    return (
        <div className={cx('wrapper')}>
            <div className={cx('contentInvoice')}>
                <div className={cx('invoiceDetail')}>
                    {invoiceItems.length > 0 ? (
                        <div className={cx('invoice-items')}>
                            {invoiceItems.map((item, index) => (
                                <div key={item.serviceID} className={cx('invoice-item')}>
                                    <div className={cx('invoice-item-details')}>
                                        <div className={cx('invoice-info')}>
                                            <h2 className={cx('invoice-item-name')}>{item.serviceName}</h2>
                                            <p className={cx('invoice-item-price')}>
                                                {item.priceService ? item.priceService.toLocaleString() : 'N/A'} VND
                                            </p>
                                            <p className={cx('invoice-item-quantity')}>
                                                Số lượng: {item.quantity || 'N/A'}
                                            </p>
                                        </div>
                                        <div className={cx('invoice-actions')}>
                                            <button
                                                className={cx('invoice-delete-button')}
                                                onClick={() => handleRemoveFromInvoice(index)}
                                            >
                                                Xóa
                                            </button>
                                            <button
                                                className={cx('invoice-checkout-button')}
                                                onClick={() => handleCheckout(index)}
                                            >
                                                Mua
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>Chưa có dịch vụ nào được chọn.</p>
                    )}
                </div>
                <div className={cx('vouchersDetail')}>
                    <h2
                        className={cx('vouchersTital')}
                        onClick={toggleVouchersVisibility}
                        style={{ cursor: 'pointer' }}
                    >
                        Chọn Voucher {isVouchersVisible ? '▲' : '▼'}
                    </h2>
                    {isVouchersVisible && (
                        <div className={cx('voucher-list')}>
                            {vouchers.map((voucher) => (
                                <label key={voucher.voucherID} className={cx('voucher-item')}>
                                    <input
                                        type="radio"
                                        name="voucher"
                                        value={voucher.voucherID}
                                        checked={selectedVoucher?.voucherID === voucher.voucherID}
                                        onChange={() => setSelectedVoucher(voucher)}
                                    />
                                    <div className={cx('voucher-content')}>
                                        <img
                                            src={`http://localhost:5262/Images/${voucher.voucherImage}`}
                                            alt={voucher.code}
                                            className={cx('voucher-image')}
                                        />
                                        <div className={cx('voucher-details')}>
                                            <p>{voucher.description}</p>
                                            <p>Giảm giá: {voucher.discountValue}%</p>
                                            <p>Đơn hàng tối thiểu: {voucher.minimumOrderValue.toLocaleString()} VND</p>
                                            <p>Giảm tối đa: {voucher.maxValue.toLocaleString()} VND</p>
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                    {selectedVoucher && (
                        <div className={cx('selected-voucher')}>
                            <h5>Voucher Đã Chọn</h5>
                            <p>
                                Tên Dịch Vụ:{' '}
                                {invoiceItems.length > 0
                                    ? invoiceItems.map((item) => item.serviceName).join(', ')
                                    : 'Không có dịch vụ'}
                            </p>
                            <p>Mã: {selectedVoucher.code}</p>
                            <p>Phần trăm giảm: {selectedVoucher.discountValue}%</p>
                            <p>Số tiền giảm: {discountInfo.discountAmount.toLocaleString()} VND</p>
                            <p>Tổng tiền sau giảm: {discountInfo.finalTotal.toLocaleString()} VND</p>
                        </div>
                    )}
                </div>
                <div className={cx('creatInvoice')}>
                    <h2 className={cx('totalmoney')}>
                        {selectedVoucher ? (
                            <>
                                <span className={cx('totalmoney-original')}>{totalPrice.toLocaleString()} VND</span>
                                <span className={cx('totalmoney-discounted')}>
                                    {discountInfo.finalTotal.toLocaleString()} VND
                                </span>
                            </>
                        ) : (
                            <span>{totalPrice.toLocaleString()} VND</span>
                        )}
                    </h2>
                    <button className={cx('btnPayment')} onClick={handleCheckoutAllItems}>
                        Thanh Toán Tất Cả
                    </button>
                </div>
            </div>
        </div>
    );
}

export default BookingsInvoice;
