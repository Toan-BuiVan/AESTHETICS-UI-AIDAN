import React, { useState, useEffect } from 'react';
import styles from './CartProduct.module.scss';
import classNames from 'classnames/bind';
import { useNavigate } from 'react-router-dom';
import ItemCartproduct from './ItemCartproduct';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';

const cx = classNames.bind(styles);

function CartProduct() {
    const [invoiceItems, setInvoiceItems] = useState([]);
    const [vouchers, setVouchers] = useState([]);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [isVouchersVisible, setIsVouchersVisible] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [checkoutType, setCheckoutType] = useState(null);
    const [discountInfo, setDiscountInfo] = useState({ discountAmount: 0, finalTotal: 0 });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchVouchers = async () => {
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
                const response = await fetch('http://localhost:5262/api/Wallets/GetList_SearchWallets', {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({ userID: userID }),
                });

                if (response.ok) {
                    const data = await response.json();
                    const vouchersData = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
                    setVouchers(vouchersData);
                } else {
                    console.error('Failed to fetch vouchers');
                    setVouchers([]);
                }
            } catch (error) {
                console.error('Error fetching vouchers:', error);
                setVouchers([]);
            }
        };

        fetchVouchers();
    }, []);

    const handleAddToInvoice = (item) => {
        setInvoiceItems((prevItems) => {
            if (prevItems.some((i) => i.cartProductID === item.cartProductID)) {
                return prevItems;
            }
            return [...prevItems, item];
        });
    };

    const handleCheckoutAll = (allItems) => {
        setInvoiceItems((prevItems) => {
            const newItems = allItems.filter((item) => !prevItems.some((i) => i.cartProductID === item.cartProductID));
            return [...prevItems, ...newItems];
        });
    };

    const handleRemoveFromInvoice = (index) => {
        setInvoiceItems((prevItems) => prevItems.filter((_, i) => i !== index));
    };

    const handleCheckout = (index) => {
        setCheckoutType('single');
        setShowPaymentForm(true);
    };

    const handleCheckoutAllItems = () => {
        if (invoiceItems.length === 0) {
            setSuccessMessage('Không có sản phẩm nào để thanh toán.');
            setTimeout(() => {
                setSuccessMessage(null);
            }, 2000);
            return;
        }
        setCheckoutType('all');
        setShowPaymentForm(true);
    };

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
        const totalPrice = invoiceItems.reduce((total, item) => total + item.sellingPrice * item.quantity, 0);
        const { discountAmount, finalTotal } = calculateDiscount(totalPrice, selectedVoucher);
        setDiscountInfo({ discountAmount, finalTotal });
    }, [selectedVoucher, invoiceItems]);

    const handlePaymentSelection = async (method) => {
        setShowPaymentForm(false); // Đóng form thanh toán
        setPaymentMethod(method);

        const userID = localStorage.getItem('userID') || '';
        const deviceName = localStorage.getItem('deviceName') || '';
        const refreshToken = localStorage.getItem('refreshToken') || '';
        const token = localStorage.getItem('token') || '';

        const headers = {
            'Content-Type': 'application/json',
            DeviceName: deviceName,
            RefreshToken: refreshToken,
            Authorization: token ? `Bearer ${token}` : '',
            UserID: userID,
        };

        let body;
        if (checkoutType === 'single') {
            const item = invoiceItems[0];
            body = {
                customerID: userID,
                voucherID: selectedVoucher ? selectedVoucher.voucherID : null,
                productIDs: [item.productID],
                quantityProduct: [item.quantity],
            };
        } else {
            body = {
                customerID: userID,
                voucherID: selectedVoucher ? selectedVoucher.voucherID : null,
                productIDs: invoiceItems.map((item) => item.productID),
                quantityProduct: invoiceItems.map((item) => item.quantity),
            };
        }

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
                const data = await response.json();
                console.log('Thanh toán thành công:', data);
                setInvoiceItems([]); // Xóa các mục trong giỏ hàng

                if (method === 'now') {
                    // Điều hướng đến Profile với section AwaitingPayment
                    navigate('/profile', { state: { section: 'awaitingPayment' } });
                } else if (method === 'later') {
                    setSuccessMessage(data.resposeMessage || 'Thanh toán thành công!');
                    setTimeout(() => {
                        setSuccessMessage(null);
                    }, 2000);
                }
            } else {
                const errorData = await response.json();
                console.error('Thanh toán thất bại:', errorData);
                setSuccessMessage('Thanh toán thất bại: ' + (errorData.message || 'Lỗi không xác định'));
                setTimeout(() => {
                    setSuccessMessage(null);
                }, 2000);
            }
        } catch (error) {
            console.error('Lỗi khi gọi API thanh toán:', error);
            setSuccessMessage('Lỗi khi thanh toán: ' + error.message);
            setTimeout(() => {
                setSuccessMessage(null);
            }, 2000);
        }
    };

    const toggleVouchersVisibility = () => {
        setIsVouchersVisible(!isVouchersVisible);
    };

    const totalPrice = invoiceItems.reduce((total, item) => {
        return total + item.sellingPrice * item.quantity;
    }, 0);

    return (
        <div className={cx('wrapper')}>
            {successMessage && <SuccessMessage message={successMessage} />}
            <div className={cx('container')}>
                <div className={cx('contentProducts')}>
                    <h1>Giỏ Hàng</h1>
                    <div className={cx('content')}>
                        <ItemCartproduct onAddToInvoice={handleAddToInvoice} onCheckoutAll={handleCheckoutAll} />
                    </div>
                </div>
                <div className={cx('contentInvoice')}>
                    <div className={cx('invoiceDetail')}>
                        <h2 className={cx('invoiceTitle')}>Hóa Đơn Thanh Toán</h2>
                        {invoiceItems.length > 0 ? (
                            <div className={cx('invoice-items')}>
                                {invoiceItems.map((item, index) => (
                                    <div key={index} className={cx('invoice-item')}>
                                        <img
                                            src={`http://localhost:5262/Images/${item.productImages}`}
                                            alt={item.productName}
                                            className={cx('invoice-item-image')}
                                        />
                                        <div className={cx('invoice-item-details')}>
                                            <h2 className={cx('invoice-item-name')}>{item.productName}</h2>
                                            <p className={cx('invoice-item-price')}>
                                                {item.sellingPrice.toLocaleString()} VND
                                            </p>
                                            <p className={cx('invoice-item-quantity')}>Số lượng: {item.quantity}</p>
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
                                ))}
                            </div>
                        ) : (
                            <p>Chưa có sản phẩm nào được chọn.</p>
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
                                {Array.isArray(vouchers) ? (
                                    vouchers.map((voucher) => (
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
                                                    <p>
                                                        Đơn hàng tối thiểu: {voucher.minimumOrderValue.toLocaleString()}{' '}
                                                        VND
                                                    </p>
                                                    <p>Giảm tối đa: {voucher.maxValue.toLocaleString()} VND</p>
                                                </div>
                                            </div>
                                        </label>
                                    ))
                                ) : (
                                    <p>Không có voucher nào.</p>
                                )}
                            </div>
                        )}
                        {selectedVoucher && (
                            <div className={cx('selected-voucher')}>
                                <h5>Voucher Đã Chọn</h5>
                                <p>
                                    Sản phẩm:{' '}
                                    {invoiceItems.length > 0
                                        ? invoiceItems.map((item) => item.productName).join(', ')
                                        : 'Không có sản phẩm'}
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
                            Thanh Toán
                        </button>
                    </div>
                </div>
            </div>
            {showPaymentForm && (
                <div className={cx('payment-form')}>
                    <h3>Chọn phương thức thanh toán</h3>
                    <button onClick={() => handlePaymentSelection('now')}>Thanh toán ngay</button>
                    <button onClick={() => handlePaymentSelection('later')}>Thanh toán sau</button>
                </div>
            )}
            <div className={cx('footer-Products')}></div>
        </div>
    );
}

export default CartProduct;
