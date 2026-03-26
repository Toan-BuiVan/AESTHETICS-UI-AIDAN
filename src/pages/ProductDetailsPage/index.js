import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './ProductDetailsPage.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTruck, faTag, faBox, faArrowLeft, faHeart, faShoppingCart, faStar, faCheck, faThumbsUp, faExpand, faPen, faTrash, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
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
    const [currentCustomerId, setCurrentCustomerId] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingCommentContent, setEditingCommentContent] = useState('');
    const [editingCommentImage, setEditingCommentImage] = useState(null);
    const [editingCommentImagePreview, setEditingCommentImagePreview] = useState('');
    const [editingRating, setEditingRating] = useState(0);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [deleteConfirmingCommentId, setDeleteConfirmingCommentId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const customerId = localStorage.getItem('customerId');
        if (customerId) {
            setCurrentCustomerId(parseInt(customerId));
        }
    }, []);

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
                    
                    // Generate random rating từ 4.7 đến 4.8
                    const randomRating = (4.7 + Math.random() * 0.1).toFixed(1);
                    setAverageRating(parseFloat(randomRating));
                } else {
                    setComments([]);
                    setTotalComments(0);
                    // Generate random rating từ 4.7 đến 4.8
                    const randomRating = (4.7 + Math.random() * 0.1).toFixed(1);
                    setAverageRating(parseFloat(randomRating));
                }
                setLoadingComments(false);
            } catch (error) {
                console.error('Error fetching comments:', error);
                setComments([]);
                setTotalComments(0);
                // Generate random rating từ 4.7 đến 4.8
                const randomRating = (4.7 + Math.random() * 0.1).toFixed(1);
                setAverageRating(parseFloat(randomRating));
                setLoadingComments(false);
            }
        };
        fetchComments();
    }, [product.id, product.productID]);



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

    const handleDeleteComment = (commentId) => {
        setDeleteConfirmingCommentId(commentId);
        setShowDeleteConfirmModal(true);
    };

    const handleDeleteConfirmed = async () => {
        setIsDeleting(true);
        const commentId = deleteConfirmingCommentId;

        const token = localStorage.getItem('token') || '';
        const deviceName = localStorage.getItem('deviceName') || '';
        const refreshToken = localStorage.getItem('refreshToken') || '';
        const userID = localStorage.getItem('userID') || '';

        const headers = {
            'Content-Type': 'application/json',
            DeviceName: deviceName,
            RefreshToken: refreshToken,
            Authorization: token ? `Bearer ${token}` : '',
            UserID: userID,
        };

        try {
            const response = await fetch('http://localhost:5122/api/Comment/deletecomment', {
                method: 'DELETE',
                headers: headers,
                body: JSON.stringify({ id: commentId }),
            });

            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            if (response.ok) {
                setSuccessMessage('Xóa bình luận thành công!');
                setComments(comments.filter(c => c.id !== commentId));
                setShowDeleteConfirmModal(false);
                setDeleteConfirmingCommentId(null);
                setTimeout(() => setSuccessMessage(null), 2000);
            } else {
                setSuccessMessage('Có lỗi xảy ra khi xóa bình luận');
                setTimeout(() => setSuccessMessage(null), 2000);
            }
        } catch (error) {
            console.error('Lỗi khi xóa bình luận:', error);
            setSuccessMessage('Lỗi khi xóa bình luận');
            setTimeout(() => setSuccessMessage(null), 2000);
        } finally {
            setIsDeleting(false);
        }
    };

    const closeDeleteConfirmModal = () => {
        setShowDeleteConfirmModal(false);
        setDeleteConfirmingCommentId(null);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setEditingCommentId(null);
        setEditingCommentContent('');
        setEditingCommentImage(null);
        setEditingCommentImagePreview('');
        setEditingRating(0);
    };

    const handleEditComment = (comment) => {
        setEditingCommentId(comment.id);
        setEditingCommentContent(comment.commentContent);
        const imageUrl = comment.commentImage ? `http://localhost:5122/Images/${comment.commentImage}` : '';
        setEditingCommentImage(imageUrl);
        setEditingCommentImagePreview(imageUrl);
        setEditingRating(comment.rating || 0);
        setShowEditModal(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Data = reader.result;
                setEditingCommentImage(base64Data);
                setEditingCommentImagePreview(base64Data);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateComment = async () => {
        if (!editingCommentContent.trim()) {
            setSuccessMessage('Vui lòng nhập nội dung bình luận');
            setTimeout(() => setSuccessMessage(null), 2000);
            return;
        }

        const token = localStorage.getItem('token') || '';
        const deviceName = localStorage.getItem('deviceName') || '';
        const refreshToken = localStorage.getItem('refreshToken') || '';
        const userID = localStorage.getItem('userID') || '';

        const headers = {
            'Content-Type': 'application/json',
            DeviceName: deviceName,
            RefreshToken: refreshToken,
            Authorization: token ? `Bearer ${token}` : '',
            UserID: userID,
        };

        try {
            const requestBody = {
                id: editingCommentId,
                commentContent: editingCommentContent,
                commentImage: editingCommentImage,
                rating: editingRating,
            };

            const response = await fetch('http://localhost:5122/api/Comment/updatecomment', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody),
            });

            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            if (response.ok) {
                setSuccessMessage('Cập nhật bình luận thành công!');
                setComments(comments.map(c => 
                    c.id === editingCommentId 
                        ? { ...c, commentContent: editingCommentContent, rating: editingRating }
                        : c
                ));
                closeEditModal();
                setTimeout(() => setSuccessMessage(null), 2000);
            } else {
                setSuccessMessage('Có lỗi xảy ra khi cập nhật bình luận');
                setTimeout(() => setSuccessMessage(null), 2000);
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật bình luận:', error);
            setSuccessMessage('Lỗi khi cập nhật bình luận');
            setTimeout(() => setSuccessMessage(null), 2000);
        }
    };

    return (
        <div className={cx('wrapper')}>
            {successMessage && (
                <SuccessMessage 
                    message={successMessage} 
                    type={successMessage.includes('Lỗi') || successMessage.includes('lỗi') || successMessage.includes('Có') ? 'error' : 'success'}
                    duration={3000}
                />
            )}
            
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
                    <h2 className={cx('section-title')}>Đánh giá từ khách hàng ({totalComments})</h2>
                    <div className={cx('comment-list')}>
                        {comments.slice(0, 5).map((comment, index) => (
                            <div key={index} className={cx('comment-item')}>
                                    <div className={cx('comment-top')}>
                                        <div className={cx('user-meta')}>
                                            <div className={cx('user-avatar')}>
                                                {comment.customerName ? comment.customerName.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <div className={cx('user-info')}>
                                                <div className={cx('user-name-row')}>
                                                    <span className={cx('user-name')}>{comment.customerName || 'Khách hàng ẩn danh'}</span>
                                                    <span className={cx('verified-badge')}>✓ Đã mua</span>
                                                </div>
                                                <span className={cx('comment-date')}>{formatDate(comment.creationDate)}</span>
                                            </div>
                                        </div>
                                        <div className={cx('comment-rating')}>
                                            {[...Array(5)].map((_, i) => (
                                                <FontAwesomeIcon 
                                                    key={i} 
                                                    icon={faStar} 
                                                    className={cx('star-icon', i < (comment.rating || 0) ? 'filled' : '')} 
                                                />
                                            ))}
                                        </div>
                                    </div>
                                {comment.commentImage && (
                                    <div className={cx('comment-image-container')}>
                                        <div className={cx('image-label')}>
                                            <span>📸 Hình ảnh từ khách hàng</span>
                                        </div>
                                        <div className={cx('comment-image')}>
                                            <img 
                                                src={`http://localhost:5122/Images/${comment.commentImage}`} 
                                                alt="Comment image"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                            <div className={cx('image-overlay')}>
                                                <FontAwesomeIcon icon={faExpand} className={cx('expand-icon')} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <p className={cx('comment-content')}>{comment.commentContent}</p>
                                <div className={cx('comment-footer')}>
                                    <button className={cx('helpful-btn')}>
                                        <FontAwesomeIcon icon={faThumbsUp} />
                                        <span>Hữu ích ({comment.likeCount || 0})</span>
                                    </button>
                                    {currentCustomerId === comment.customerId && (
                                        <div className={cx('comment-actions')}>
                                            <button className={cx('action-btn', 'edit-btn')} title="Chỉnh sửa" onClick={() => handleEditComment(comment)}>
                                                <FontAwesomeIcon icon={faPen} />
                                                <span>Sửa</span>
                                            </button>
                                            <button className={cx('action-btn', 'delete-btn')} title="Xóa" onClick={() => handleDeleteComment(comment.id)}>
                                                <FontAwesomeIcon icon={faTrash} />
                                                <span>Xóa</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Edit Comment Modal */}
            {showEditModal && (
                <div className={cx('modal-overlay')} onClick={() => closeEditModal()}>
                    <div className={cx('modal-content')} onClick={(e) => e.stopPropagation()}>
                        <div className={cx('modal-header')}>
                            <h3>Sửa bình luận</h3>
                            <button className={cx('close-btn')} onClick={() => closeEditModal()}>✕</button>
                        </div>
                        <div className={cx('modal-body')}>
                            <div className={cx('form-group')}>
                                <label>Nội dung:</label>
                                <textarea
                                    className={cx('comment-textarea')}
                                    value={editingCommentContent}
                                    onChange={(e) => setEditingCommentContent(e.target.value)}
                                    placeholder="Nhập nội dung bình luận..."
                                    rows="4"
                                />
                            </div>
                            <div className={cx('form-group')}>
                                <label>Hình ảnh:</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className={cx('file-input')}
                                />
                                {editingCommentImagePreview && (
                                    <div className={cx('image-preview')}>
                                        <img src={editingCommentImagePreview} alt="Preview" />
                                    </div>
                                )}
                            </div>
                            <div className={cx('form-group')}>
                                <label>Đánh giá:</label>
                                <div className={cx('rating-stars')}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            className={cx('star-btn', { active: star <= editingRating })}
                                            onClick={() => setEditingRating(star)}
                                            title={`${star} sao`}
                                        >
                                            <FontAwesomeIcon icon={faStar} />
                                        </button>
                                    ))}
                                </div>
                                <div className={cx('rating-text')}>
                                    {editingRating > 0 ? `${editingRating} sao` : 'Chưa chọn'}
                                </div>
                            </div>
                        </div>
                        <div className={cx('modal-footer')}>
                            <button className={cx('btn-cancel')} onClick={() => closeEditModal()}>Hủy</button>
                            <button className={cx('btn-save')} onClick={handleUpdateComment}>Cập nhật</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirmModal && (
                <div className={cx('delete-modal-overlay')} onClick={closeDeleteConfirmModal}>
                    <div className={cx('delete-modal-content')} onClick={(e) => e.stopPropagation()}>
                        <div className={cx('delete-modal-icon')}>
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                        </div>
                        <h2 className={cx('delete-modal-title')}>Xóa bình luận?</h2>
                        <p className={cx('delete-modal-message')}>
                            Bạn chắc chắn muốn xóa bình luận này không? Hành động này không thể hoàn tác.
                        </p>
                        <div className={cx('delete-modal-actions')}>
                            <button 
                                className={cx('delete-btn-cancel')} 
                                onClick={closeDeleteConfirmModal}
                                disabled={isDeleting}
                            >
                                Hủy bỏ
                            </button>
                            <button 
                                className={cx('delete-btn-confirm')} 
                                onClick={handleDeleteConfirmed}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Đang xóa...' : 'Xóa bình luận'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProductDetailsPage;
