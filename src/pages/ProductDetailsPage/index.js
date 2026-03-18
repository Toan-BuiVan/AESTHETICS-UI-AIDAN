import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './ProductDetailsPage.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTruck, faTag, faBox, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';

const cx = classNames.bind(styles);

function ProductDetailsPage({ product, onBack, onSelectProduct }) {
    const [comments, setComments] = useState([]);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loadingComments, setLoadingComments] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [successMessage, setSuccessMessage] = useState(null);
    const [quantity, setQuantity] = useState(1);

    const formatPrice = (price) => {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleQuantityChange = (change) => {
        setQuantity((prevQuantity) => {
            const newQuantity = prevQuantity + change;
            if (newQuantity < 1) return 1;
            if (newQuantity > product.quantity) return product.quantity;
            return newQuantity;
        });
    };

    const handleAddToCart = async () => {
        const deviceName = localStorage.getItem('deviceName') || '';
        const refreshToken = localStorage.getItem('refreshToken') || '';
        const token = localStorage.getItem('token') || '';
        const userID = localStorage.getItem('userID') || '';

        if (!userID) {
            return;
        }

        const requestData = {
            userID: userID,
            productID: product.productID,
            quantity: quantity,
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

            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            const data = await response.json();
            setSuccessMessage(data.resposeMessage);
            setTimeout(() => {
                setSuccessMessage(null);
            }, 2000);
        } catch (error) {
            console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', error);
        }
    };

    const handlePayment = async () => {
        const deviceName = localStorage.getItem('deviceName') || '';
        const refreshToken = localStorage.getItem('refreshToken') || '';
        const token = localStorage.getItem('token') || '';
        const userID = localStorage.getItem('userID') || '';

        if (!userID) {
            return;
        }

        const requestData = {
            customerID: userID,
            productIDs: [product.productID],
            quantityProduct: [quantity],
        };

        const headers = {
            'Content-Type': 'application/json',
            DeviceName: deviceName,
            RefreshToken: refreshToken,
            Authorization: token ? `Bearer ${token}` : '',
            UserID: userID,
        };

        const apiUrl = 'http://localhost:5262/api/Invoice/Insert_Invoice';
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestData),
            });

            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            const data = await response.json();
            if (response.ok) {
                setSuccessMessage('Tạo hóa đơn thành công!');
                setTimeout(() => {
                    setSuccessMessage(null);
                }, 2000);
            } else {
                console.error('Có lỗi xảy ra: ' + data.message);
            }
        } catch (error) {
            console.error('Lỗi khi thực hiện thanh toán:', error);
        }
    };

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const response = await fetch('http://localhost:5262/api/Comment/GetList_SearchComment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ productID: product.productID }),
                });
                const data = await response.json();
                setComments(data.data || []);
                setLoadingComments(false);
            } catch (error) {
                console.error('Error fetching comments:', error);
                setComments([]);
                setLoadingComments(false);
            }
        };
        fetchComments();
    }, [product.productID]);

    useEffect(() => {
        const fetchRelatedProducts = async () => {
            try {
                const response = await fetch('http://localhost:5262/api/Products/GetList_SearchProducts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ productsOfServicesName: product.productsOfServicesName }),
                });
                const data = await response.json();
                let productsData;

                if (Array.isArray(data)) {
                    productsData = data;
                } else if (data && Array.isArray(data.data)) {
                    productsData = data.data;
                } else {
                    productsData = [];
                }

                const filteredProducts = productsData.filter((p) => p.productID !== product.productID);
                setRelatedProducts(filteredProducts);
                setLoadingProducts(false);
            } catch (error) {
                console.error('Error fetching related products:', error);
                setRelatedProducts([]);
                setLoadingProducts(false);
            }
        };
        fetchRelatedProducts();
    }, [product.productsOfServicesName, product.productID]);

    const handleViewDetails = (relatedProduct) => {
        if (typeof onSelectProduct === 'function') {
            onSelectProduct(relatedProduct);
        } else {
            console.error('onSelectProduct is not a function');
        }
    };

    return (
        <div className={cx('wrapper')}>
            {successMessage && <SuccessMessage message={successMessage} />}
            <div className={cx('product-details')}>
                <button onClick={onBack} className={cx('back-button')}>
                    Quay lại
                </button>
                <div className={cx('product-image')}>
                    <img
                        src={`http://localhost:5262/Images/${product.productImages}`}
                        alt={product.productName}
                    />
                </div>
                <div className={cx('product-info')}>
                    <h1 className={cx('product-name')}>{product.productName}</h1>
                    <p className={cx('product-description')}>{product.productDescription}</p>
                    <div className={cx('product-price')}>{formatPrice(product.sellingPrice)} VND</div>
                    <div className={cx('product-supplier')}>
                        <FontAwesomeIcon icon={faTruck} /> Nhà cung cấp: {product.supplierName}
                    </div>
                    <div className={cx('product-category')}>
                        <FontAwesomeIcon icon={faTag} /> Danh mục: {product.productsOfServicesName}
                    </div>
                    <div className={cx('product-quantity')}>
                        <FontAwesomeIcon icon={faBox} /> Còn hàng: {product.quantity}
                        {product.quantity > 0 && (
                            <div className={cx('quantity-selector')}>
                                <button onClick={() => handleQuantityChange(-1)}>-</button>
                                <input type="number" value={quantity} readOnly />
                                <button onClick={() => handleQuantityChange(1)}>+</button>
                            </div>
                        )}
                    </div>
                    {product.quantity > 0 ? (
                        <div className={cx('action-buttons')}>
                            <button className={cx('add-to-cart')} onClick={handleAddToCart}>
                                Thêm vào giỏ
                            </button>
                            <button className={cx('payment')} onClick={handlePayment}>
                                Mua Ngay
                            </button>
                        </div>
                    ) : (
                        <div className={cx('out-of-stock')}>Hết hàng</div>
                    )}
                </div>
            </div>
            <div className={cx('comment-details')}>
                <h2 className={cx('comment-title')}>Đánh Giá Sản Phẩm: {product.productName}</h2>
                {loadingComments ? (
                    <p className={cx('loading')}>Đang tải bình luận...</p>
                ) : comments.length > 0 ? (
                    <div className={cx('comment-list')}>
                        {comments.map((comment) => (
                            <div key={comment.commentID} className={cx('comment-item')}>
                                <div className={cx('comment-header')}>
                                    <FontAwesomeIcon icon={faUserCircle} className={cx('user-icon')} />
                                    <div className={cx('user-info')}>
                                        <span className={cx('user-name')}>{comment.userName}</span>
                                        <span className={cx('comment-date')}>{formatDate(comment.creationDate)}</span>
                                    </div>
                                </div>
                                <p className={cx('comment-content')}>{comment.comment_Content}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className={cx('no-comments')}>Chưa có bình luận nào.</p>
                )}
            </div>
            <div className={cx('products-details')}>
                <h2 className={cx('products-title')}>Các sản phẩm khác</h2>
                {loadingProducts ? (
                    <p className={cx('loading')}>Đang tải sản phẩm...</p>
                ) : relatedProducts.length > 0 ? (
                    <div className={cx('related-product-list')}>
                        {relatedProducts.map((relatedProduct) => (
                            <div key={relatedProduct.productID} className={cx('related-product-item')}>
                                <img
                                    src={`http://localhost:5262/Images/${relatedProduct.productImages}`}
                                    alt={relatedProduct.productName}
                                    className={cx('related-product-image')}
                                />
                                <div className={cx('related-product-info')}>
                                    <h3 className={cx('related-product-name')}>{relatedProduct.productName}</h3>
                                    <p className={cx('related-product-price')}>
                                        {formatPrice(relatedProduct.sellingPrice)} VND
                                    </p>
                                    <button
                                        className={cx('related-view-details')}
                                        onClick={() => handleViewDetails(relatedProduct)}
                                    >
                                        Xem chi tiết
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className={cx('no-products')}>Không có sản phẩm nào khác.</p>
                )}
            </div>
        </div>
    );
}

export default ProductDetailsPage;
