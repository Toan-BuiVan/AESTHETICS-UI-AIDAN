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
    const [imageLoading, setImageLoading] = useState(true);

    // Generate random rating từ 4.7 đến 4.8
    useEffect(() => {
        const generateRating = () => {
            // Generate random rating between 4.7 and 4.8
            const randomRating = (4.7 + Math.random() * 0.1).toFixed(1);
            setAverageRating(parseFloat(randomRating));
            setLoadingRating(false);
        };
        
        // Simulate slight delay for realistic loading
        const timer = setTimeout(() => {
            generateRating();
        }, 100);
        
        return () => clearTimeout(timer);
    }, [product.id, product.productID]);

    const handleAddToCart = async (e) => {
        e.stopPropagation();
        const customerId = localStorage.getItem('customerId');
        const token = localStorage.getItem('token');

        if (!customerId) {
            onSuccess('Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.');
            return;
        }

        const productId = product.id || product.productID;
        const priceAtAdd = product.sellingPrice || 0;

        const requestData = {
            customerId: customerId,
            productId: productId,
            quantity: 1,
            priceAtAdd: priceAtAdd,
        };

        const headers = {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
        };

        const apiUrl = 'http://localhost:5122/api/CartProduct/createcartproduct';
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestData),
            });

            const responseData = await response.json();

            if (response.ok) {
                onSuccess(responseData.resposeMessage || 'Thêm vào giỏ hàng thành công!');
            } else {
                throw new Error(responseData.resposeMessage || 'Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng.');
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
                    <>
                        {imageLoading && (
                            <div className={styles.skeletonLoader}></div>
                        )}
                        <img 
                            src={imageUrl} 
                            alt={product.productName} 
                            className={styles.productImage}
                            onLoad={() => setImageLoading(false)}
                            onError={(e) => { 
                                e.target.src = 'https://via.placeholder.com/250x250?text=No+Image';
                                setImageLoading(false);
                            }}
                        />
                    </>
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
                    {product.discount && (
                        <div className={`${styles.badge} ${styles.discount}`}>-{product.discount}%</div>
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
                        <span className={styles.unit}>
                            <span style={{ marginRight: '4px' }}>📦</span>
                            {product.unit}
                        </span>
                    )}
                    {product.quantity !== undefined && (
                        <span className={`${styles.stock} ${isOutOfStock ? styles.outStock : ''}`}>
                            {isOutOfStock ? 'Hết hàng' : `${product.quantity} sẵn có`}
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
