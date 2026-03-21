import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './ProductDetailsPage.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTruck, faTag, faBox, faUserCircle, faArrowLeft, faHeart, faShoppingCart, faStar, faCheck } from '@fortawesome/free-solid-svg-icons';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';

const cx = classNames.bind(styles);

function ProductDetailsPage({ product, onBack, onSelectProduct }) {
    const [comments, setComments] = useState([]);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loadingComments, setLoadingComments] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [successMessage, setSuccessMessage] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [imageZoom, setImageZoom] = useState({ x: 0, y: 0 });
    const [averageRating, setAverageRating] = useState(0);
    const [totalComments, setTotalComments] = useState(0);

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
            productID: product.id || product.productID,
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
            setSuccessMessage(data.resposeMessage || 'Thêm vào giỏ hàng thành công!');
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
            productIDs: [product.id || product.productID],
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
                const response = await fetch('http://localhost:5122/api/Comment/getcommentlist', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        pageNo: 1,
                        pageSize: 10,
                        productId: product.id || product.productID || 0,
                        serviceId: 0,
                    }),
                });
                const data = await response.json();
                
                if (data.baseDatas && Array.isArray(data.baseDatas)) {
                    setComments(data.baseDatas);
                    setTotalComments(data.totalRecordCount || 0);
                    
                    // Tính rating trung bình
                    if (data.baseDatas.length > 0) {
                        const avgRating = (data.baseDatas.reduce((sum, comment) => sum + (comment.rating || 0), 0) / data.baseDatas.length).toFixed(1);
                        setAverageRating(parseFloat(avgRating));
                    } else {
                        setAverageRating(0);
                    }
                } else {
                    setComments([]);
                    setTotalComments(0);
                    setAverageRating(0);
                }
                setLoadingComments(false);
            } catch (error) {
                console.error('Error fetching comments:', error);
                setComments([]);
                setTotalComments(0);
                setAverageRating(0);
                setLoadingComments(false);
            }
        };
        fetchComments();
    }, [product.id, product.productID]);

    useEffect(() => {
        const fetchRelatedProducts = async () => {
            try {
                const response = await fetch('http://localhost:5262/api/Products/GetList_SearchProducts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ productsOfServicesName: product.productsOfServicesName || product.serviceTypeName }),
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

                const filteredProducts = productsData.filter((p) => (p.id || p.productID) !== (product.id || product.productID));
                setRelatedProducts(filteredProducts.slice(0, 4));
                setLoadingProducts(false);
            } catch (error) {
                console.error('Error fetching related products:', error);
                setRelatedProducts([]);
                setLoadingProducts(false);
            }
        };
        fetchRelatedProducts();
    }, [product.productsOfServicesName, product.serviceTypeName, product.id, product.productID]);

    const handleViewDetails = (relatedProduct) => {
        if (typeof onSelectProduct === 'function') {
            onSelectProduct(relatedProduct);
        }
    };

    const handleMouseMove = (e) => {
        const img = e.currentTarget;
        const { left, top, width, height } = img.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setImageZoom({ x, y });
    };

    return (
        <div className={cx('wrapper')}>
            {successMessage && <SuccessMessage message={successMessage} />}
            
            <button onClick={onBack} className={cx('back-button')}>
                <FontAwesomeIcon icon={faArrowLeft} /> Quay lại
            </button>

            <div className={cx('container')}>
                <div className={cx('product-gallery')}>
                    <div className={cx('main-image')} onMouseMove={handleMouseMove}>
                        <img
                            src={`http://localhost:5122/Images/${product.productImages}`}
                            alt={product.productName}
                            style={{
                                transformOrigin: `${imageZoom.x}% ${imageZoom.y}%`,
                            }}
                        />
                        <div className={cx('quick-features')}>
                            <span className={cx('feature')}>
                                <FontAwesomeIcon icon={faTruck} /> Giao hàng nhanh
                            </span>
                            <span className={cx('feature')}>
                                <FontAwesomeIcon icon={faCheck} /> Hàng chính hãng
                            </span>
                        </div>
                    </div>
                </div>

                <div className={cx('product-info-section')}>
                    {/* Header */}
                    <div className={cx('info-header')}>
                        <div>
                            <h1 className={cx('product-name')}>{product.productName}</h1>
                            <div className={cx('rating-info')}>
                                <div className={cx('stars')}>
                                    {[...Array(5)].map((_, i) => (
                                        <FontAwesomeIcon key={i} icon={faStar} className={cx('star-icon', i < Math.floor(averageRating) ? 'filled' : '')} />
                                    ))}
                                </div>
                                <span className={cx('reviews')}>{averageRating.toFixed(1)} ({totalComments} đánh giá)</span>
                            </div>
                        </div>
                        <button className={cx('favorite-btn', isFavorite ? 'active' : '')} onClick={() => setIsFavorite(!isFavorite)}>
                            <FontAwesomeIcon icon={faHeart} />
                        </button>
                    </div>

                    {/* Price Section */}
                    <div className={cx('price-section')}>
                        <div className={cx('current-price')}>
                            {formatPrice(product.sellingPrice || 0)}₫
                        </div>
                    </div>

                    {/* Description */}
                    {product.description && (
                        <p className={cx('product-description')}>{product.description}</p>
                    )}

                    {/* Product Details */}
                    <div className={cx('product-details')}>
                        <div className={cx('detail-item')}>
                            <span className={cx('detail-label')}>
                                <FontAwesomeIcon icon={faBox} /> Nhà cung cấp:
                            </span>
                            <span className={cx('detail-value')}>{product.supplierName || 'N/A'}</span>
                        </div>
                        <div className={cx('detail-item')}>
                            <span className={cx('detail-label')}>
                                <FontAwesomeIcon icon={faTag} /> Loại:
                            </span>
                            <span className={cx('detail-value')}>{product.serviceTypeName || product.productsOfServicesName || 'N/A'}</span>
                        </div>
                        <div className={cx('detail-item')}>
                            <span className={cx('detail-label')}>
                                <FontAwesomeIcon icon={faBox} /> Đơn vị:
                            </span>
                            <span className={cx('detail-value')}>{product.unit || 'N/A'}</span>
                        </div>
                    </div>

                    {/* Stock Status */}
                    <div className={cx('stock-status', product.quantity > 0 ? 'in-stock' : 'out-of-stock')}>
                        <FontAwesomeIcon icon={faBox} />
                        {product.quantity > 0 ? `Còn ${product.quantity} sản phẩm` : 'Hết hàng'}
                    </div>

                    {/* Quantity Selector */}
                    {product.quantity > 0 && (
                        <div className={cx('quantity-section')}>
                            <label className={cx('quantity-label')}>Số lượng:</label>
                            <div className={cx('quantity-selector')}>
                                <button onClick={() => handleQuantityChange(-1)} className={cx('qty-btn')}>−</button>
                                <input type="number" value={quantity} readOnly className={cx('qty-input')} />
                                <button onClick={() => handleQuantityChange(1)} className={cx('qty-btn')}>+</button>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {product.quantity > 0 ? (
                        <div className={cx('action-buttons')}>
                            <button className={cx('add-to-cart')} onClick={handleAddToCart}>
                                <FontAwesomeIcon icon={faShoppingCart} /> Thêm vào giỏ
                            </button>
                            <button className={cx('buy-now')} onClick={handlePayment}>
                                Mua ngay
                            </button>
                        </div>
                    ) : (
                        <div className={cx('out-of-stock-banner')}>Sản phẩm này hiện đã hết hàng</div>
                    )}
                </div>
            </div>

            {/* Comments Section */}
            {!loadingComments && comments.length > 0 && (
                <div className={cx('reviews-section')}>
                    <h2 className={cx('section-title')}>Đánh giá từ khách hàng</h2>
                    <div className={cx('comment-list')}>
                        {comments.slice(0, 3).map((comment, index) => (
                            <div key={index} className={cx('comment-item')}>
                                <div className={cx('comment-header')}>
                                    <FontAwesomeIcon icon={faUserCircle} className={cx('user-icon')} />
                                    <div className={cx('user-info')}>
                                        <span className={cx('user-name')}>Khách hàng {comment.customerId}</span>
                                        <span className={cx('comment-date')}>{formatDate(comment.creationDate)}</span>
                                    </div>
                                </div>
                                <div className={cx('comment-rating')}>
                                    {[...Array(5)].map((_, i) => (
                                        <FontAwesomeIcon key={i} icon={faStar} className={cx('star-icon', i < comment.rating ? 'filled' : '')} />
                                    ))}
                                </div>
                                <p className={cx('comment-content')}>{comment.commentContent}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Related Products Section */}
            {!loadingProducts && relatedProducts.length > 0 && (
                <div className={cx('related-section')}>
                    <h2 className={cx('section-title')}>Sản phẩm tương tự</h2>
                    <div className={cx('related-products')}>
                        {relatedProducts.map((rProduct, index) => (
                            <div key={index} className={cx('related-item')}>
                                <div className={cx('related-image')}>
                                    <img src={`http://localhost:5122/Images/${rProduct.productImages}`} alt={rProduct.productName} />
                                </div>
                                <div className={cx('related-info')}>
                                    <h4 className={cx('related-name')}>{rProduct.productName}</h4>
                                    <p className={cx('related-price')}>{formatPrice(rProduct.sellingPrice || 0)}₫</p>
                                    <button className={cx('view-btn')} onClick={() => handleViewDetails(rProduct)}>
                                        Xem chi tiết
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProductDetailsPage;
