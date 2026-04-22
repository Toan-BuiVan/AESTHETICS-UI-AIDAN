import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './ProductDetailsPage.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTruck, faTag, faBox, faArrowLeft, faHeart, faShoppingCart, faStar, faCheck, faThumbsUp, faExpand, faPen, faTrash, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import NotificationToast from './NotificationToast';
import { PLACEHOLDER_IMAGE } from '~/utils/placeholderImage';

const cx = classNames.bind(styles);

function ProductDetailsPage({ product, onBack, onSelectProduct }) {
    const [comments, setComments] = useState([]);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loadingComments, setLoadingComments] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [notification, setNotification] = useState(null);
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
    const [imageChanged, setImageChanged] = useState(false);
    const [showCreateCommentModal, setShowCreateCommentModal] = useState(false);
    const [newCommentContent, setNewCommentContent] = useState('');
    const [newCommentRating, setNewCommentRating] = useState(5);
    const [newCommentImage, setNewCommentImage] = useState(null);
    const [newCommentImagePreview, setNewCommentImagePreview] = useState('');
    const [isCreatingComment, setIsCreatingComment] = useState(false);

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
        const customerId = localStorage.getItem('customerId');
        const token = localStorage.getItem('token');

        if (!customerId) {
            setNotification({
                type: 'error',
                title: 'Thông báo',
                message: 'Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.'
            });
            return;
        }

        const productId = product.id || product.productID;
        const priceAtAdd = product.sellingPrice || product.price || 0;

        const requestData = {
            customerId: customerId,
            productId: productId,
            quantity: quantity,
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

            const data = await response.json();

            if (response.ok) {
                setNotification({
                    type: 'success',
                    title: 'Thành công!',
                    message: data.resposeMessage || 'Thêm vào giỏ hàng thành công!'
                });
            } else {
                throw new Error(data.resposeMessage || 'Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng.');
            }
        } catch (error) {
            console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', error);
            setNotification({
                type: 'error',
                title: 'Lỗi',
                message: 'Có lỗi xảy ra. Vui lòng thử lại!'
            });
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
                setNotification({
                    type: 'success',
                    title: 'Thành công!',
                    message: 'Tạo hóa đơn thành công!'
                });
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

    // Fetch related products by serviceTypeName
    useEffect(() => {
        const fetchRelatedProducts = async () => {
            try {
                const serviceTypeName = product.serviceTypeName || product.productsOfServicesName || '';
                if (!serviceTypeName) {
                    setRelatedProducts([]);
                    setLoadingProducts(false);
                    return;
                }

                const response = await fetch('http://localhost:5122/api/Product/getproductlist', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        serviceTypeName: serviceTypeName,
                    }),
                });

                const data = await response.json();
                if (data.baseDatas && Array.isArray(data.baseDatas)) {
                    // Filter out the current product from related products
                    const currentProductId = product.id || product.productID;
                    const filtered = data.baseDatas.filter(
                        (p) => (p.id || p.productID) !== currentProductId
                    );
                    setRelatedProducts(filtered);
                } else {
                    setRelatedProducts([]);
                }
            } catch (error) {
                console.error('Error fetching related products:', error);
                setRelatedProducts([]);
            } finally {
                setLoadingProducts(false);
            }
        };
        fetchRelatedProducts();
    }, [product.id, product.productID, product.serviceTypeName, product.productsOfServicesName]);


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
                setNotification({
                    type: 'success',
                    title: 'Thành công!',
                    message: 'Xóa bình luận thành công!'
                });
                setComments(comments.filter(c => c.id !== commentId));
                setShowDeleteConfirmModal(false);
                setDeleteConfirmingCommentId(null);
            } else {
                setNotification({
                    type: 'error',
                    title: 'Lỗi',
                    message: 'Có lỗi xảy ra khi xóa bình luận'
                });
            }
        } catch (error) {
            console.error('Lỗi xóa bình luận:', error);
            setNotification({
                type: 'error',
                title: 'Lỗi',
                message: 'Lỗi khi xóa bình luận'
            });
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
        setImageChanged(false);
    };

    const handleEditComment = (comment) => {
        setEditingCommentId(comment.id);
        setEditingCommentContent(comment.commentContent);
        const imageUrl = comment.commentImage ? `http://localhost:5122/Images/${comment.commentImage}` : '';
        setEditingCommentImage(null);  // ✅ Don't set URL, keep null
        setEditingCommentImagePreview(imageUrl);  // ✅ Show existing image in preview
        setEditingRating(comment.rating || 0);
        setImageChanged(false);  // ✅ Mark image as unchanged
        setShowEditModal(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 5MB)
            const MAX_SIZE = 5 * 1024 * 1024; // 5MB
            if (file.size > MAX_SIZE) {
                setNotification({
                    type: 'error',
                    title: 'Lỗi',
                    message: 'Ảnh quá lớn (tối đa 5MB)'
                });
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const fullBase64 = reader.result;
                // ✅ Extract only base64 part (remove "data:image/...;base64," prefix)
                const base64Data = fullBase64.includes(',') 
                    ? fullBase64.split(',')[1] 
                    : fullBase64;
                
                setEditingCommentImage(base64Data); // Store pure base64 for API
                setEditingCommentImagePreview(fullBase64); // Keep full URL for preview
                setImageChanged(true);  // ✅ Mark that image has been changed
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateComment = async () => {
        if (!editingCommentContent.trim()) {
            setNotification({
                type: 'error',
                title: 'Thông báo',
                message: 'Vui lòng nhập nội dung bình luận'
            });
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
            // ✅ Only send commentImage if it was actually changed
            const requestBody = {
                id: editingCommentId,
                commentContent: editingCommentContent,
                rating: editingRating,
            };

            // ✅ Only add commentImage if user uploaded a NEW image
            if (imageChanged && editingCommentImage && editingCommentImage.trim()) {
                // Validate base64 format (should not contain data: prefix)
                if (editingCommentImage.includes(',')) {
                    console.warn('Warning: Base64 contains data URL prefix, extracting...');
                    requestBody.commentImage = editingCommentImage.split(',')[1];
                } else {
                    requestBody.commentImage = editingCommentImage;
                }
            }

            console.log('Update comment payload:', {
                id: editingCommentId,
                contentLength: editingCommentContent.length,
                imageIncluded: imageChanged && editingCommentImage ? true : false,
                imageLength: (imageChanged && editingCommentImage) ? editingCommentImage.length : 0,
                rating: editingRating,
            });

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
                setNotification({
                    type: 'success',
                    title: 'Thành công!',
                    message: 'Cập nhật bình luận thành công!'
                });
                setComments(comments.map(c => 
                    c.id === editingCommentId 
                        ? { ...c, commentContent: editingCommentContent, rating: editingRating }
                        : c
                ));
                closeEditModal();
            } else {
                const errorData = await response.json();
                console.error('API error response:', errorData);
                setNotification({
                    type: 'error',
                    title: 'Lỗi',
                    message: 'Có lỗi xảy ra khi cập nhật bình luận'
                });
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật bình luận:', error);
            setNotification({
                type: 'error',
                title: 'Lỗi',
                message: 'Lỗi khi cập nhật bình luận: ' + error.message
            });
        }
    };

    const handleCreateComment = async () => {
        if (!currentCustomerId) {
            setNotification({
                type: 'error',
                title: 'Thông báo',
                message: 'Bạn cần đăng nhập để đánh giá sản phẩm'
            });
            return;
        }

        if (!newCommentContent.trim()) {
            setNotification({
                type: 'error',
                title: 'Thông báo',
                message: 'Vui lòng nhập nội dung bình luận'
            });
            return;
        }

        setIsCreatingComment(true);
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
                productId: product.id || product.productID,
                serviceId: 0,
                customerId: currentCustomerId,
                commentContent: newCommentContent,
                rating: newCommentRating,
            };

            // Add image if user selected one
            if (newCommentImage && newCommentImage.trim()) {
                requestBody.commentImage = newCommentImage;
            }

            const response = await fetch('http://localhost:5122/api/Comment/createcomment', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody),
            });

            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            const data = await response.json();

            if (data.success) {
                setNotification({
                    type: 'success',
                    title: 'Thành công!',
                    message: 'Đánh giá của bạn đã được thêm'
                });
                // Close modal and reset form
                setShowCreateCommentModal(false);
                setNewCommentContent('');
                setNewCommentRating(5);
                setNewCommentImage(null);
                setNewCommentImagePreview('');
                // Refresh comments
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
                const newData = await response.json();
                if (newData.baseDatas && Array.isArray(newData.baseDatas)) {
                    setComments(newData.baseDatas);
                    setTotalComments(newData.totalRecordCount || 0);
                }
            } else {
                setNotification({
                    type: 'error',
                    title: 'Lỗi',
                    message: 'Có lỗi xảy ra khi thêm bình luận'
                });
            }
        } catch (error) {
            console.error('Lỗi khi tạo bình luận:', error);
            setNotification({
                type: 'error',
                title: 'Lỗi',
                message: 'Lỗi khi tạo bình luận: ' + error.message
            });
        } finally {
            setIsCreatingComment(false);
        }
    };

    const handleNewCommentImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const MAX_SIZE = 5 * 1024 * 1024;
            if (file.size > MAX_SIZE) {
                setNotification({
                    type: 'error',
                    title: 'Lỗi',
                    message: 'Ảnh quá lớn (tối đa 5MB)'
                });
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const fullBase64 = reader.result;
                const base64Data = fullBase64.includes(',') 
                    ? fullBase64.split(',')[1] 
                    : fullBase64;
                
                setNewCommentImage(base64Data);
                setNewCommentImagePreview(fullBase64);
            };
            reader.readAsDataURL(file);
        }
    };

    const closeCreateCommentModal = () => {
        setShowCreateCommentModal(false);
        setNewCommentContent('');
        setNewCommentRating(5);
        setNewCommentImage(null);
        setNewCommentImagePreview('');
    };

    return (
        <div className={cx('wrapper')}>
            {notification && (
                <NotificationToast
                    message={notification.message}
                    type={notification.type}
                    title={notification.title}
                    onClose={() => setNotification(null)}
                    duration={3500}
                />
            )}
            
            <button onClick={onBack} className={cx('back-button')}>
                <FontAwesomeIcon icon={faArrowLeft} /> Quay lại
            </button>

            <div className={cx('container')}>
                <div className={cx('detailsWithComments')}>
                <div className={cx('left-section')}>
                    <div className={cx('product-gallery')} style={{ display: 'flex', flexDirection: 'column', gap: '25px', alignItems: 'center' }}>
                        <div className={cx('main-image')} onMouseMove={handleMouseMove} style={{ width: '60%', maxWidth: '500px', height: 'auto', aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                            <img
                                src={`http://localhost:5122/Images/${product.productImages}`}
                                alt={product.productName}
                                style={{
                                    transformOrigin: `${imageZoom.x}% ${imageZoom.y}%`,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block'
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

                {/* Comments Section - Right Side */}
                <div className={cx('comments-container')}>
                    <div className={cx('comments-header')}>
                        {totalComments > 0 && (
                            <h2 className={cx('comments-title')}>Đánh giá từ khách hàng ({totalComments})</h2>
                        )}
                        <button 
                            className={cx('rating-btn')}
                            onClick={() => setShowCreateCommentModal(true)}
                        >
                            <FontAwesomeIcon icon={faStar} /> Đánh Giá Sản Phẩm
                        </button>
                    </div>
                    {!loadingComments && comments.length > 0 ? (
                        <>
                            <div className={cx('comment-list')}>
                                {comments.slice(0, 5).map((comment, index) => (
                            <div key={index} className={cx('comment-item')}>
                                    <div className={cx('comment-header')}>
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
                                        <p className={cx('comment-content')}>{comment.commentContent}</p>
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
                                {currentCustomerId === comment.customerId && (
                                            <div className={cx('comment-actions')}>
                                                <button className={cx('action-btn', 'edit-btn')} title="Chỉnh sửa" onClick={() => handleEditComment(comment)}>
                                                    <FontAwesomeIcon icon={faPen} />
                                                    Sửa
                                                </button>
                                                <button className={cx('action-btn', 'delete-btn')} title="Xóa" onClick={() => handleDeleteComment(comment.id)}>
                                                    <FontAwesomeIcon icon={faTrash} />
                                                    Xóa
                                                </button>
                                            </div>
                                        )}
                                <div className={cx('comment-footer')}>
                                    <button className={cx('helpful-btn')}>
                                        <FontAwesomeIcon icon={faThumbsUp} />
                                        <span>Hữu ích ({comment.likeCount || 0})</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                            </div>
                        </>
                    ) : (
                        <div className={cx('no-comments')}>
                            <p>Chưa có nhận xét nào</p>
                        </div>
                    )}
                </div>
                </div>

            {/* Related Products Section - Full Width Below */}
            {!loadingProducts && relatedProducts.length > 0 && (
                <div className={cx('related-products-section')}>
                    <h2 className={cx('section-title')}>Sản phẩm liên quan</h2>
                    <div className={cx('related-products-grid')}>
                        {relatedProducts.map((relatedProduct, index) => (
                            <div key={index} className={cx('related-product-card')}>
                                <div className={cx('product-image-wrapper')}>
                                    <img 
                                        src={`http://localhost:5122/Images/${relatedProduct.productImages}`}
                                        alt={relatedProduct.productName}
                                        className={cx('product-image')}
                                        onError={(e) => e.target.src = PLACEHOLDER_IMAGE}
                                    />
                                </div>
                                <div className={cx('product-info')}>
                                    <h3 className={cx('product-title')}>{relatedProduct.productName}</h3>
                                    <p className={cx('product-description')}>
                                        {relatedProduct.description?.substring(0, 100) || 'N/A'}
                                        {relatedProduct.description?.length > 100 ? '...' : ''}
                                    </p>
                                    <div className={cx('product-meta')}>
                                        <span className={cx('supplier')}>{relatedProduct.supplierName || 'N/A'}</span>
                                    </div>
                                    <div className={cx('product-footer')}>
                                        <span className={cx('price')}>{formatPrice(relatedProduct.sellingPrice || 0)}₫</span>
                                        <button 
                                            className={cx('view-btn')}
                                            onClick={() => handleViewDetails(relatedProduct)}
                                        >
                                            Xem chi tiết
                                        </button>
                                    </div>
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

            {/* Create Comment Modal */}
            {showCreateCommentModal && (
                <div className={cx('modal-overlay')} onClick={() => closeCreateCommentModal()}>
                    <div className={cx('modal-content')} onClick={(e) => e.stopPropagation()}>
                        <div className={cx('modal-header')}>
                            <h3>Đánh Giá Sản Phẩm</h3>
                            <button className={cx('close-btn')} onClick={() => closeCreateCommentModal()}>✕</button>
                        </div>
                        <div className={cx('modal-body')}>
                            <div className={cx('form-group')}>
                                <label>Đánh giá:</label>
                                <div className={cx('rating-input')}>
                                    {[...Array(5)].map((_, i) => (
                                        <button 
                                            key={i}
                                            className={cx('star-btn', i < newCommentRating ? 'active' : '')}
                                            onClick={() => setNewCommentRating(i + 1)}
                                        >
                                            <FontAwesomeIcon icon={faStar} />
                                        </button>
                                    ))}
                                </div>
                                <span className={cx('rating-text')}>{newCommentRating} / 5 sao</span>
                            </div>
                            <div className={cx('form-group')}>
                                <label>Nội dung:</label>
                                <textarea
                                    className={cx('comment-textarea')}
                                    value={newCommentContent}
                                    onChange={(e) => setNewCommentContent(e.target.value)}
                                    placeholder="Chia sẻ trải nghiệm của bạn với sản phẩm này..."
                                    rows="4"
                                />
                            </div>
                            <div className={cx('form-group')}>
                                <label>Hình ảnh (tùy chọn):</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleNewCommentImageChange}
                                    className={cx('file-input')}
                                />
                                {newCommentImagePreview && (
                                    <div className={cx('image-preview-container')}>
                                        <img 
                                            src={newCommentImagePreview} 
                                            alt="Preview"
                                            className={cx('image-preview')}
                                        />
                                        <button 
                                            className={cx('remove-image-btn')}
                                            onClick={() => {
                                                setNewCommentImage(null);
                                                setNewCommentImagePreview('');
                                            }}
                                        >
                                            Xóa ảnh
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={cx('modal-footer')}>
                            <button 
                                className={cx('cancel-btn')}
                                onClick={() => closeCreateCommentModal()}
                                disabled={isCreatingComment}
                            >
                                Hủy
                            </button>
                            <button 
                                className={cx('submit-btn')}
                                onClick={handleCreateComment}
                                disabled={isCreatingComment}
                            >
                                {isCreatingComment ? 'Đang gửi...' : 'Gửi Đánh Giá'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}

export default ProductDetailsPage;
