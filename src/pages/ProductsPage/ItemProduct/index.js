import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import styles from './ItemProduct.module.scss';

function ItemProduct({ product, onSuccess, onClick }) {
    const imageBaseUrl = 'http://localhost:5262/Images';
    const imageUrl = `${imageBaseUrl}/${product.productImages}`;

    const handleAddToCart = async (e) => {
        e.stopPropagation();
        const deviceName = localStorage.getItem('deviceName') || '';
        const refreshToken = localStorage.getItem('refreshToken') || '';
        const token = localStorage.getItem('token') || '';
        const userID = localStorage.getItem('userID') || '';

        if (!userID) {
            onSuccess('Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.');
            return;
        }

        const productID = product.productID;
        const requestData = {
            userID: userID,
            productID: productID,
            quantity: 1,
        };

        const headers = {
            'Content-Type': 'application/json',
            DeviceName: deviceName,
            RefreshToken: refreshToken,
            Authorization: token ? `Bearer ${token}` : '',
            UserID: userID,
        };

        const apiUrl = 'http://localhost:5262/api/CartProduct/Insert_CartProduct';
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestData),
            });

            const responseData = await response.json();
            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');

            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            if (response.ok) {
                onSuccess(responseData.resposeMessage);
            } else {
                throw new Error('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng.');
            }
        } catch (error) {
            console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', error);
        }
    };

    return (
        <div className={styles.productContainer} onClick={onClick}>
            <img src={imageUrl} alt={product.productName} className={styles.productImage} />
            <div className={styles.productInfo}>
                <h3>{product.productName || 'Tên sản phẩm'}</h3>
                <p>Giá: {(product.sellingPrice || 0).toLocaleString('vi-VN')} VND</p>
            </div>
            <FontAwesomeIcon icon={faShoppingCart} className={styles.cartIcon} onClick={handleAddToCart} />
        </div>
    );
}

export default ItemProduct;
