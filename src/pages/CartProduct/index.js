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
            const userID = localStorage.getItem('userID') || localStorage.getItem('customerId') || '';

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

        const userID = localStorage.getItem('userID') || localStorage.getItem('customerId') || '';
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
            
            {/* Header - Luxury Statement */}
            <div className={cx('header')}>
                <h1 className={cx('pageTitle')}>Giỏ Hàng Của Bạn</h1>
                <p className={cx('pageSubtitle')}>Lựa Chọn Cao Cấp Của Bạn</p>
            </div>

            <div className={cx('content')}>
                <div className={cx('container')}>
                    {/* Products Section */}
                    <div className={cx('contentProducts')}>
                        <h2 className={cx('productsTitle')}>SẢN PHẨM TRONG GIỎ</h2>
                        <ItemCartproduct onAddToInvoice={handleAddToInvoice} onCheckoutAll={handleCheckoutAll} />
                    </div>

                    {/* Sidebar */}
                    <div className={cx('sidebar')}>
                        {/* Invoice Detail */}
                        <div className={cx('invoiceDetail')}>
                            <h2 className={cx('invoiceTitle')}>CHI TIẾT ĐƠN HÀNG</h2>
                            
                            {invoiceItems.length > 0 ? (
                                <div className={cx('invoiceItems')}>
                                    {invoiceItems.map((item, index) => (
                                        <div key={index} className={cx('invoiceItem')}>
                                            <img
                                                src={`http://localhost:5262/Images/${item.productImages}`}
                                                alt={item.productName}
                                                className={cx('itemImage')}
                                            />
                                            <div className={cx('itemContent')}>
                                                <h3 className={cx('itemName')}>{item.productName}</h3>
                                                <p className={cx('itemMeta')}>
                                                    <span className={cx('itemQuantity')}>SỐ LƯỢNG: {item.quantity}</span>
                                                </p>
                                            </div>
                                            <span className={cx('itemPrice')}>
                                                {(item.sellingPrice * item.quantity).toLocaleString()} VND
                                            </span>
                                            <div className={cx('itemActions')}>
                                                <button
                                                    className={cx('deleteBtn')}
                                                    onClick={() => handleRemoveFromInvoice(index)}
                                                    title="Remove"
                                                >
                                                    XÓA
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={cx('emptyState')}>
                                    <p>Giỏ hàng của bạn trống</p>
                                </div>
                            )}
                        </div>

                        {/* Vouchers */}
                        <div className={cx('vouchersDetail')}>
                            <h2 className={cx('vouchersTitle')}>ĐIỀU KIỆN ĐẶC BIỆT</h2>
                            <button
                                className={cx('voucherToggleBtn')}
                                onClick={toggleVouchersVisibility}
                            >
                                {isVouchersVisible ? '▼ ẨN ĐỀ XUẤT' : '▶ XEM ĐỀ XUẤT'}
                            </button>

                            {isVouchersVisible && (
                                <div className={cx('voucherList')}>
                                    {Array.isArray(vouchers) && vouchers.length > 0 ? (
                                        vouchers.map((voucher) => (
                                            <label 
                                                key={voucher.voucherID} 
                                                className={cx('voucherItem', {
                                                    selected: selectedVoucher?.voucherID === voucher.voucherID
                                                })}
                                            >
                                                <input
                                                    type="radio"
                                                    className={cx('voucherRadio')}
                                                    name="voucher"
                                                    value={voucher.voucherID}
                                                    checked={selectedVoucher?.voucherID === voucher.voucherID}
                                                    onChange={() => setSelectedVoucher(voucher)}
                                                />
                                                <div className={cx('voucherContent')}>
                                                    <h4 className={cx('voucherName')}>{voucher.code}</h4>
                                                    <p className={cx('voucherDiscount')}>Tiết kiệm {voucher.discountValue}%</p>
                                                </div>
                                            </label>
                                        ))
                                    ) : (
                                        <p className={cx('emptyState')}>Không có đề xuất nào khả dụng</p>
                                    )}
                                </div>
                            )}

                            {selectedVoucher && (
                                <div className={cx('selectedVoucher')}>
                                    <p className={cx('selectedVoucherTitle')}>ĐÃ ÁP DỤNG ĐỀ XUẤT</p>
                                    <p className={cx('selectedVoucherInfo')}>
                                        {selectedVoucher.code} • Bạn tiết kiệm {discountInfo.discountAmount.toLocaleString()} VND
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Payment Summary */}
                        <div className={cx('creatInvoice')}>
                            <div className={cx('priceBreakdown')}>
                                <div className={cx('priceRow')}>
                                    <span className={cx('priceLabel')}>Tổng cộng</span>
                                    <span className={cx('priceValue')}>{totalPrice.toLocaleString()} VND</span>
                                </div>
                                {selectedVoucher && (
                                    <>
                                        <div className={cx('priceRow', 'discount')}>
                                            <span className={cx('priceLabel')}>Giảm giá</span>
                                            <span className={cx('priceValue')}>−{discountInfo.discountAmount.toLocaleString()} VND</span>
                                        </div>
                                        <div className={cx('priceRow', 'total')}>
                                            <span className={cx('priceLabel')}>Thành tiền</span>
                                            <span className={cx('priceValue')}>{discountInfo.finalTotal.toLocaleString()} VND</span>
                                        </div>
                                    </>
                                )}
                            </div>
                            <button 
                                className={cx('btnPayment')} 
                                onClick={handleCheckoutAllItems}
                                disabled={invoiceItems.length === 0}
                            >
                                THANH TOÁN
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={cx('footerProducts')}>
                    <p>Chất Lượng Premium • Lựa Chọn Độc Quyền • Trải Nghiệm Mua Sắm Sang Trọng</p>
                </div>
            </div>

            {/* Payment Method Modal */}
            {showPaymentForm && (
                <div className={cx('modalOverlay')}>
                    <div className={cx('paymentForm')}>
                        <h3 className={cx('paymentFormTitle')}>Payment Method</h3>
                        <div className={cx('paymentOptions')}>
                            <button 
                                className={cx('paymentFormBtn')}
                                onClick={() => handlePaymentSelection('now')}
                            >
                                PAY NOW
                            </button>
                            <button 
                                className={cx('paymentFormBtn')}
                                onClick={() => handlePaymentSelection('later')}
                            >
                                PAY LATER
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CartProduct;
