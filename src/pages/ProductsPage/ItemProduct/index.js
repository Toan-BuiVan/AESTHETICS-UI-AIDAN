import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faStar, faBox, faUser, faTag, faHeart } from '@fortawesome/free-solid-svg-icons';
import styles from './ItemProduct.module.scss';

function ItemProduct({ product, onSuccess, onClick }) {
    const imageBaseUrl = 'http://localhost:5122/Images';
    const imageUrl = product.productImages ? `${imageBaseUrl}/${product.productImages}` : null;
    const [isHovered, setIsHovered] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [averageRating, setAverageRating] = useState(0);
    const [loadingRating, setLoadingRating] = useState(true);

    // Fetch rating từ API
    useEffect(() => {
        const fetchRating = async () => {
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
                    if (data.baseDatas.length > 0) {
                        const avgRating = (data.baseDatas.reduce((sum, comment) => sum + (comment.rating || 0), 0) / data.baseDatas.length).toFixed(1);
                        setAverageRating(parseFloat(avgRating));
                    } else {
                        // Nếu không có comment, set rating mặc định là 4.5 sao
                        setAverageRating(4.8);
                    }
                } else {
                    // Nếu không có data, set rating mặc định là 4.5 sao
                    setAverageRating(4.8);
                }
                setLoadingRating(false);
            } catch (error) {
                console.error('Error fetching rating:', error);
                // Nếu có lỗi, set rating mặc định là 4.5 sao
                setAverageRating(4.8);
                setLoadingRating(false);
            }
        };
        
        if (product.id || product.productID) {
            fetchRating();
        }
    }, [product.id, product.productID]);

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

        const productID = product.id || product.productID;
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
                onSuccess(responseData.resposeMessage || 'Thêm vào giỏ hàng thành công!');
            } else {
                throw new Error('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng.');
            }
        } catch (error) {
            console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', error);
            onSuccess('Có lỗi xảy ra. Vui lòng thử lại!');
        }
    };

    const handleFavorite = (e) => {
        e.stopPropagation();
        setIsFavorite(!isFavorite);
    };

    const isLowStock = product.quantity && product.quantity < 5;
    const isOutOfStock = product.quantity === 0;

    return (
        <div 
            className={styles.productCard} 
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Favorite Button */}
            <button 
                className={`${styles.favoriteBtn} ${isFavorite ? styles.active : ''}`}
                onClick={handleFavorite}
                title="Thêm vào yêu thích"
            >
                <FontAwesomeIcon icon={faHeart} />
            </button>

            {/* Image Container */}
            <div className={styles.imageContainer}>
                {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt={product.productName} 
                        className={styles.productImage}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/250x250?text=No+Image'; }}
                    />
                ) : (
                    <div className={styles.noImage}>
                        <FontAwesomeIcon icon={faBox} size="3x" />
                    </div>
                )}
                
                {/* Stock Status Badge */}
                <div className={styles.badgeContainer}>
                    {isOutOfStock ? (
                        <div className={`${styles.badge} ${styles.outOfStock}`}>Hết hàng</div>
                    ) : isLowStock ? (
                        <div className={`${styles.badge} ${styles.lowStock}`}>Sắp hết</div>
                    ) : (
                        <div className={`${styles.badge} ${styles.inStock}`}>Còn hàng</div>
                    )}
                </div>

                {/* Quick View Overlay */}
                <div className={`${styles.overlay} ${isHovered ? styles.show : ''}`}>
                    {!isOutOfStock && (
                        <button 
                            className={styles.addToCartBtn}
                            onClick={handleAddToCart}
                            title="Thêm vào giỏ hàng"
                        >
                            <FontAwesomeIcon icon={faShoppingCart} />
                            <span>Thêm giỏ hàng</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Product Info */}
            <div className={styles.productInfo}>
                {/* Service Type */}
                {product.serviceTypeName && (
                    <div className={styles.serviceType}>
                        <FontAwesomeIcon icon={faTag} size="xs" />
                        <span>{product.serviceTypeName}</span>
                    </div>
                )}

                {/* Product Name */}
                <h3 className={styles.productName}>{product.productName || 'Tên sản phẩm'}</h3>

                {/* Supplier */}
                {product.supplierName && (
                    <div className={styles.supplier}>
                        <FontAwesomeIcon icon={faUser} size="xs" />
                        <span>{product.supplierName}</span>
                    </div>
                )}

                {/* Description */}
                {product.description && (
                    <p className={styles.description}>{product.description}</p>
                )}

                {/* Quick Info */}
                <div className={styles.quickInfo}>
                    {product.unit && (
                        <span className={styles.unit}>{product.unit}</span>
                    )}
                    {product.quantity !== undefined && (
                        <span className={`${styles.stock} ${isOutOfStock ? styles.outStock : ''}`}>
                            {product.quantity}  sẵn có
                        </span>
                    )}
                </div>

                {/* Footer with Price and Rating */}
                <div className={styles.footer}>
                    {/* Price */}
                    <div className={styles.priceSection}>
                        <span className={styles.price}>
                            {(product.sellingPrice || 0).toLocaleString('vi-VN')}₫
                        </span>
                    </div>

                    {/* Rating */}
                    <div className={styles.ratingSection}>
                        <div className={styles.stars}>
                            {[...Array(5)].map((_, i) => (
                                <FontAwesomeIcon 
                                    key={i} 
                                    icon={faStar} 
                                    className={`${styles.star} ${i < Math.floor(averageRating) ? styles.filled : ''}`}
                                />
                            ))}
                        </div>
                        <span className={styles.ratingText}>{averageRating.toFixed(1)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ItemProduct;
