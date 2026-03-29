import React, { useEffect, useState } from 'react';
import styles from './ItemCartproduct.module.scss';
import classNames from 'classnames/bind';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';
import { useDebounce } from '~/hooks';

const cx = classNames.bind(styles);

function CartItem({ item, onQuantityChange, onDelete, onAddToInvoice }) {
    const [quantity, setQuantity] = useState(item.quantity);
    const [statusMessage, setStatusMessage] = useState(null);
    const debouncedQuantity = useDebounce(quantity, 2000); // 2 seconds debounce

    useEffect(() => {
        if (debouncedQuantity !== item.quantity) {
            // Call update API
            handleUpdateQuantity(debouncedQuantity);
            onQuantityChange(item.id, debouncedQuantity);
        }
    }, [debouncedQuantity, item.id, item.quantity, onQuantityChange]);

    // ✅ Update CartProduct API
    const handleUpdateQuantity = async (newQuantity) => {
        try {
            const token = localStorage.getItem('token') || '';
            const refreshToken = localStorage.getItem('refreshToken') || '';
            
            const cartProductId = item.cartProductID || item.id;
            if (!cartProductId) {
                setStatusMessage('❌ Lỗi: ID sản phẩm không hợp lệ');
                setTimeout(() => setStatusMessage(null), 2000);
                return;
            }

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
                'RefreshToken': refreshToken,
            };

            const response = await fetch(
                'http://localhost:5122/api/CartProduct/updatecartproduct',
                {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({
                        cartProductId: parseInt(cartProductId),
                        quantity: newQuantity,
                    }),
                }
            );

            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            const data = await response.json();
            
            if (data.success) {
                setStatusMessage(`✓ Cập nhật số lượng thành công`);
            } else {
                setStatusMessage('❌ Cập nhật số lượng thất bại');
            }
            setTimeout(() => setStatusMessage(null), 2000);
        } catch (error) {
            console.error('Error updating cart product:', error);
            setStatusMessage('❌ Lỗi khi cập nhật: ' + error.message);
            setTimeout(() => setStatusMessage(null), 2000);
        }
    };

    // ✅ Delete CartProduct API
    const handleDeleteItem = async () => {
        try {
            const token = localStorage.getItem('token') || '';
            const refreshToken = localStorage.getItem('refreshToken') || '';
            
            const cartProductId = item.cartProductID || item.id;
            if (!cartProductId) {
                setStatusMessage('❌ Lỗi: ID sản phẩm không hợp lệ');
                setTimeout(() => setStatusMessage(null), 2000);
                return;
            }

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
                'RefreshToken': refreshToken,
            };

            const response = await fetch(
                'http://localhost:5122/api/CartProduct/deletecartproduct',
                {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({
                        cartProductId: parseInt(cartProductId),
                    }),
                }
            );

            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            const data = await response.json();
            
            if (data.success) {
                setStatusMessage(`✓ Xóa "${item.productName}" thành công`);
                setTimeout(() => {
                    onDelete(item.id);
                    setStatusMessage(null);
                }, 1500);
            } else {
                setStatusMessage('❌ Xóa sản phẩm thất bại');
                setTimeout(() => setStatusMessage(null), 2000);
            }
        } catch (error) {
            console.error('Error deleting cart product:', error);
            setStatusMessage('❌ Lỗi khi xóa: ' + error.message);
            setTimeout(() => setStatusMessage(null), 2000);
        }
    };

    const handleIncrease = () => setQuantity(quantity + 1);
    const handleDecrease = () => {
        if (quantity > 1) setQuantity(quantity - 1);
    };

    const totalPrice = (item.sellingPrice || item.priceAtAdd) * quantity;

    return (
        <div className={cx('cart-item')}>
            {/* Premium Product Image */}
            <div className={cx('item-image-container')}>
                <img
                    src={`http://localhost:5122/Images/${item.productImages}`}
                    alt={item.productName}
                    className={cx('item-image')}
                    onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1557821552-17105176677c?w=200&h=200&fit=crop'}
                />
                <div className={cx('image-overlay')}></div>
            </div>

            {/* Product Details */}
            <div className={cx('item-details')}>
                {/* Product Header - Name & Description */}
                <div className={cx('product-header')}>
                    <h2 className={cx('item-name')}>{item.productName}</h2>
                    {item.description && (
                        <p className={cx('item-description')}>
                            {item.description.length > 80 
                                ? item.description.substring(0, 80) + '...' 
                                : item.description
                            }
                        </p>
                    )}
                </div>

                {/* Price & Unit Info */}
                <div className={cx('price-info')}>
                    <div className={cx('price-section')}>
                        <span className={cx('label')}>Giá</span>
                        <span className={cx('item-price')}>{(item.sellingPrice || item.priceAtAdd).toLocaleString('vi-VN')}</span>
                        <span className={cx('currency')}>₫</span>
                    </div>
                    {(item.unit || item.size) && (
                        <div className={cx('spec-section')}>
                            {item.unit && (
                                <span className={cx('spec-badge')}>{item.unit}</span>
                            )}
                            {item.size && (
                                <span className={cx('spec-badge', 'size-badge')}>Size: {item.size}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Quantity Control */}
                <div className={cx('quantity-control')}>
                    <button 
                        className={cx('quantity-btn')} 
                        onClick={handleDecrease} 
                        disabled={quantity <= 1}
                        title="Giảm số lượng"
                        aria-label="Decrease quantity"
                    >
                        −
                    </button>
                    <span className={cx('item-quantity')}>{quantity}</span>
                    <button 
                        className={cx('quantity-btn')} 
                        onClick={handleIncrease}
                        title="Tăng số lượng"
                        aria-label="Increase quantity"
                    >
                        +
                    </button>
                    <span className={cx('total-price')}>{totalPrice.toLocaleString('vi-VN')}₫</span>
                </div>

                {/* Action Buttons */}
                <div className={cx('btn-actions')}>
                    <button 
                        className={cx('delete-button')} 
                        onClick={handleDeleteItem}
                        title="Xóa khỏi giỏ"
                        aria-label="Delete from cart"
                    >
                        <span>🗑</span>
                        <span>Xóa</span>
                    </button>
                    <button 
                        className={cx('payment-button')} 
                        onClick={() => onAddToInvoice(item)}
                        title="Thanh toán item này"
                        aria-label="Checkout this item"
                    >
                        <span>💳</span>
                        <span>Thanh Toán</span>
                    </button>
                </div>

                {/* Status Message */}
                {statusMessage && (
                    <div className={cx('status-message', statusMessage.includes('✓') ? 'success' : 'error')}>
                        {statusMessage}
                    </div>
                )}
            </div>
        </div>
    );
}

function ItemCartproduct({ onAddToInvoice, onCheckoutAll }) {
    const [cartItems, setCartItems] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Get all possible IDs
    const staffId = localStorage.getItem('staffId');
    const customerId = localStorage.getItem('customerId');
    const userID = localStorage.getItem('userID');
    const token = localStorage.getItem('token');
    
    // Use whichever ID is available (priority: staff > customer > user)
    const activeUserID = staffId || customerId || userID || '';
    const isLoggedIn = !!token && !!activeUserID;

    useEffect(() => {
        const customerId = localStorage.getItem('customerId');
        const token = localStorage.getItem('token');

        if (!customerId || !token) {
            setIsLoading(false);
            return;
        }

        const fetchCartItems = async () => {
            setIsLoading(true);
            const headers = {
                'Content-Type': 'application/json',
                Authorization: token ? `Bearer ${token}` : '',
            };

            const requestData = {
                customerId: customerId,
            };

            try {
                const response = await fetch('http://localhost:5122/api/CartProduct/getcartproductlist', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(requestData),
                });

                if (!response.ok) throw new Error('Lỗi khi lấy dữ liệu giỏ hàng');

                const result = await response.json();
                if (result.baseDatas && Array.isArray(result.baseDatas)) {
                    // Map API response to match CartItem component structure
                    const mappedItems = result.baseDatas.map(item => ({
                        id: item.id,
                        cartId: item.cartId,
                        productId: item.productId,
                        quantity: item.quantity,
                        priceAtAdd: item.priceAtAdd,
                        createDate: item.createDate,
                        productName: item.productName,
                        productImages: item.productImages,
                        description: item.description,
                        sellingPrice: item.sellingPrice,
                        unit: item.unit,
                    }));
                    setCartItems(mappedItems);
                    calculateTotalPrice(mappedItems);
                } else {
                    setCartItems([]);
                }
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu giỏ hàng:', error);
                setCartItems([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCartItems();
    }, []);


    const calculateTotalPrice = (items) => {
        const total = items.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
        setTotalPrice(total);
    };

    const handleDeleteItem = async (cartItemId) => {
        const token = localStorage.getItem('token');

        const headers = {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
        };

        const requestData = {
            id: cartItemId,
        };

        try {
            // Since API doesn't have delete endpoint yet, just update local state
            const updatedItems = cartItems.filter((item) => item.id !== cartItemId);
            setCartItems(updatedItems);
            calculateTotalPrice(updatedItems);
            setSuccessMessage('Xóa sản phẩm thành công!');
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch (error) {
            console.error('Lỗi khi xóa sản phẩm:', error);
        }
    };

    const handleUpdateQuantity = async (cartItemId, newQuantity) => {
        try {
            // Update local state immediately
            const updatedItems = cartItems.map((item) =>
                item.id === cartItemId ? { ...item, quantity: newQuantity } : item,
            );
            setCartItems(updatedItems);
            calculateTotalPrice(updatedItems);
            setSuccessMessage('Cập nhật số lượng thành công!');
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch (error) {
            console.error('Lỗi khi cập nhật số lượng:', error);
        }
    };

    return (
        <div className={cx('cart-container')}>
            {successMessage && <SuccessMessage message={successMessage} />}
            
            {isLoading ? (
                <p>Đang tải giỏ hàng...</p>
            ) : !isLoggedIn ? (
                <p>Vui lòng đăng nhập để xem giỏ hàng.</p>
            ) : cartItems.length === 0 ? (
                <p>Giỏ hàng của bạn đang trống.</p>
            ) : (
                <>
                    <div className={cx('cart-items')}>
                        {cartItems.map((item) => (
                            <CartItem
                                key={item.id}
                                item={item}
                                onQuantityChange={handleUpdateQuantity}
                                onDelete={handleDeleteItem}
                                onAddToInvoice={onAddToInvoice}
                            />
                        ))}
                    </div>
                    <div className={cx('cart-summary')}>
                        <div className={cx('summary-card')}>
                            <div className={cx('summary-row')}>
                                <span className={cx('label')}>Số lượng sản phẩm:</span>
                                <span className={cx('value')}>{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                            </div>
                            <div className={cx('summary-row')}>
                                <span className={cx('label')}>Tổng tiền:</span>
                                <span className={cx('total-amount')}>💰 {totalPrice.toLocaleString('vi-VN')}₫</span>
                            </div>
                            <button className={cx('checkout-button')} onClick={() => onCheckoutAll(cartItems)}>
                                🛒 Thanh Toán Tất Cả ({cartItems.length} sản phẩm)
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default ItemCartproduct;
