import React, { useState, useEffect } from 'react';
import styles from './CartProduct.module.scss';
import classNames from 'classnames/bind';
import { useNavigate } from 'react-router-dom';
import ItemCartproduct from './ItemCartproduct';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { PLACEHOLDER_IMAGE_120, PLACEHOLDER_IMAGE_80 } from '~/utils/placeholderImage';

const cx = classNames.bind(styles);

function CartProduct() {
    const [invoiceItems, setInvoiceItems] = useState([]);
    const [vouchers, setVouchers] = useState([]);
    const [loadingVouchers, setLoadingVouchers] = useState(true);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [expandedVoucherId, setExpandedVoucherId] = useState(null);
    const [isVouchersVisible, setIsVouchersVisible] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [checkoutType, setCheckoutType] = useState(null);
    const [discountInfo, setDiscountInfo] = useState({ discountAmount: 0, finalTotal: 0 });
    const [hoveredVoucherId, setHoveredVoucherId] = useState(null);
    const navigate = useNavigate();

    // ✅ Fetch vouchers from API when component mounts
    useEffect(() => {
        const fetchWalletList = async () => {
            try {
                const customerId = localStorage.getItem('customerId');
                const token = localStorage.getItem('token') || '';
                const refreshToken = localStorage.getItem('refreshToken') || '';

                if (!customerId) {
                    setLoadingVouchers(false);
                    return;
                }

                const headers = {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                    'RefreshToken': refreshToken,
                };

                const response = await fetch('http://localhost:5122/api/Wallet/getwalletlist', {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({
                        customerId: parseInt(customerId),
                    }),
                });

                // Handle token refresh
                const newAccessToken = response.headers.get('New-AccessToken');
                const newRefreshToken = response.headers.get('New-RefreshToken');
                if (newAccessToken) localStorage.setItem('token', newAccessToken);
                if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

                if (response.ok) {
                    const data = await response.json();
                    setVouchers(data.baseDatas || []);
                } else {
                    console.error('Failed to fetch vouchers');
                    setVouchers([]);
                }
            } catch (error) {
                console.error('Error fetching vouchers:', error);
                setVouchers([]);
            } finally {
                setLoadingVouchers(false);
            }
        };

        fetchWalletList();
    }, []);



    const handleAddToInvoice = (item) => {
        // Validate item has required properties
        if (!item.productName || !item.sellingPrice || !item.productId) {
            setSuccessMessage('❌ Lỗi: Dữ liệu sản phẩm không đủ (thiếu ProductId)');
            setTimeout(() => setSuccessMessage(null), 2000);
            return;
        }

        // Ensure all required properties exist with explicit productId
        const normalizedItem = {
            ...item,
            productId: item.productId,  // Explicitly store productId for API
            cartProductID: item.id,
            quantity: item.quantity || 1,
            sellingPrice: parseFloat(item.sellingPrice) || 0,
            productName: item.productName || 'Sản phẩm',
            productImages: item.productImages || '',
        };

        // Check if product already exists in invoice
        const alreadyExists = invoiceItems.some((i) => {
            return i.productId === item.productId;
        });

        if (alreadyExists) {
            // If product exists, show warning message and don't add
            setSuccessMessage(`⚠️ "${normalizedItem.productName}" đã tồn tại trong chi tiết đơn hàng`);
            setTimeout(() => setSuccessMessage(null), 2000);
            return;
        }
        
        // If new product, add to list
        setInvoiceItems((prevItems) => [...prevItems, normalizedItem]);
        
        // Show success message
        setSuccessMessage(`✓ Thêm "${normalizedItem.productName}" vào chi tiết đơn hàng`);
        setTimeout(() => setSuccessMessage(null), 2000);
    };

    const handleCheckoutAll = (allItems) => {
        setInvoiceItems((prevItems) => {
            const newItems = allItems.filter((item) => !prevItems.some((i) => i.cartProductID === item.cartProductID));
            return [...prevItems, ...newItems];
        });
    };

    const handleRemoveFromInvoice = (index) => {
        const itemToDelete = invoiceItems[index];
        
        // Call delete API
        handleDeleteCartProduct(itemToDelete);
        
        // Remove from local state
        setInvoiceItems((prevItems) => prevItems.filter((_, i) => i !== index));
        setSuccessMessage(`✓ Xóa "${itemToDelete.productName}" khỏi chi tiết đơn hàng`);
        setTimeout(() => setSuccessMessage(null), 2000);
    };

    // ✅ Delete CartProduct API
    const handleDeleteCartProduct = async (item) => {
        try {
            const customerId = localStorage.getItem('customerId');
            const token = localStorage.getItem('token') || '';
            const refreshToken = localStorage.getItem('refreshToken') || '';
            
            if (!customerId || !item.cartProductID) return;

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
                'RefreshToken': refreshToken,
            };

            const response = await fetch(
                `http://localhost:5122/api/CartProduct/delete?cartProductID=${item.cartProductID}`,
                {
                    method: 'DELETE',
                    headers: headers,
                }
            );

            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            if (!response.ok) {
                console.error('Failed to delete cart product');
            }
        } catch (error) {
            console.error('Error deleting cart product:', error);
        }
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
        setPaymentMethod(null);
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

    // Debounce payment method selection - wait 3 seconds then call API
    useEffect(() => {
        if (!paymentMethod || !showPaymentForm) {
            return;
        }

        const debounceTimer = setTimeout(() => {
            handleCreateInvoice(paymentMethod);
        }, 3000);

        return () => clearTimeout(debounceTimer);
    }, [paymentMethod]);

    const handleCreateInvoice = async (method) => {
        try {
            const customerId = localStorage.getItem('customerId');
            const token = localStorage.getItem('token') || '';
            const refreshToken = localStorage.getItem('refreshToken') || '';

            if (!customerId || invoiceItems.length === 0) {
                setSuccessMessage('❌ Thông tin không đủ để tạo hóa đơn');
                return;
            }

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
                'RefreshToken': refreshToken,
            };

            // Build lineItems from invoiceItems
            // Ensure all items have productId
            const lineItems = invoiceItems.map((item) => {
                if (!item.productId) {
                    console.error('⚠️ Item missing productId:', item);
                }
                return {
                    productId: item.productId,  // Required field from InvoiceLineItem class
                    quantity: item.quantity || 1,
                };
            });

            // Map payment method values
            const paymentMethodMap = {
                'now': 'ThanhToanNgay',
                'later': 'ThanhToanSau'
            };
            const mappedPaymentMethod = paymentMethodMap[method] || method;

            const requestBody = {
                customerId: parseInt(customerId),
                staffId: null,
                lineItems: lineItems,
                voucherId: selectedVoucher ? selectedVoucher.voucherId : 0,
                paidAmount: 0,
                paymentMethod: mappedPaymentMethod,
                typeInvoice: 0,
                type: "BanHang",
                notes: null,
            };

            console.log('Creating invoice with request:', requestBody);

            const response = await fetch('http://localhost:5122/api/Invoice/createinvoice', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody),
            });

            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            if (response.ok) {
                const data = await response.json();
                console.log('✓ Tạo hóa đơn thành công:', data);
                
                // Check if API returns success: true
                if (data.success === true) {
                    setInvoiceItems([]); // Xóa các mục trong giỏ hàng
                    setPaymentMethod(null);
                    setShowPaymentForm(false); // Đóng form thanh toán

                    const paymentMethodText = {
                        'ThanhToanOnline': 'Thanh toán ngay',
                        'ThanhToanOnline': 'Thanh toán sau'
                    };

                    if (method === 'now') {
                        // Điều hướng đến Profile với section AwaitingPayment
                        setSuccessMessage(`✓ Tạo hóa đơn thành công!`);
                        setTimeout(() => {
                            navigate('/profile', { state: { section: 'awaitingPayment' } });
                        }, 2000);
                    } else if (method === 'later') {
                        setSuccessMessage(`✓ Tạo hóa đơn thành công!`);
                        setTimeout(() => {
                            setSuccessMessage(null);
                        }, 2000);
                    }
                } else {
                    setPaymentMethod(null);
                    setSuccessMessage('❌ Tạo hóa đơn thất bại: ' + (data.message || 'Lỗi không xác định'));
                    setTimeout(() => {
                        setSuccessMessage(null);
                    }, 3000);
                }
            } else {
                const errorData = await response.json();
                console.error('❌ Tạo hóa đơn thất bại:', errorData);
                setSuccessMessage('❌ Tạo hóa đơn thất bại: ' + (errorData.message || 'Lỗi không xác định'));
                setPaymentMethod(null);
                setTimeout(() => {
                    setSuccessMessage(null);
                }, 3000);
            }
        } catch (error) {
            console.error('❌ Lỗi khi tạo hóa đơn:', error);
            setSuccessMessage('❌ Lỗi: ' + error.message);
            setPaymentMethod(null);
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        }
    };

    const handlePaymentSelection = (method) => {
        setShowPaymentForm(false); // Đóng form thanh toán
        setPaymentMethod(method); // Kích hoạt useEffect với debounce
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
                {/* <h1 className={cx('pageTitle')}>Giỏ Hàng Của Bạn</h1> */}
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
                            <div className={cx('invoiceHeader')}>
                                <h2 className={cx('invoiceTitle')}>CHI TIẾT ĐƠN HÀNG</h2>
                                <span className={cx('orderCount')}>{invoiceItems.length}</span>
                            </div>
                            
                            {invoiceItems.length > 0 ? (
                                <div className={cx('invoiceItems')}>
                                    {invoiceItems.map((item, index) => {
                                        // Generate stable key for React reconciliation
                                        const itemKey = item.productId || item.id || item.cartProductID || index;
                                        return (
                                            <div key={itemKey} className={cx('invoiceItem')} style={{ animationDelay: `${index * 0.08}s` }}>
                                            {/* Product Status Badge */}
                                            <div className={cx('itemStatusBadge')}>
                                                <span className={cx('statusDot')}></span>
                                                <span className={cx('statusText')}>Sẵn sàng</span>
                                            </div>

                                            {/* Product Image */}
                                            <div className={cx('imageWrapper')}>
                                                <div className={cx('imagePulse')}></div>
                                                <img
                                                    src={`http://localhost:5122/Images/${item.productImages}`}
                                                    alt={item.productName}
                                                    className={cx('itemImage')}
                                                    onError={(e) => e.target.src = PLACEHOLDER_IMAGE_120}
                                                />
                                            </div>

                                            {/* Product Content */}
                                            <div className={cx('itemContent')}>
                                                <h3 className={cx('itemName')}>{item.productName}</h3>
                                                {item.description && (
                                                    <p className={cx('itemDescription')}>
                                                        {item.description.length > 60 
                                                            ? item.description.substring(0, 60) + '...' 
                                                            : item.description}
                                                    </p>
                                                )}
                                                <div className={cx('itemSpecs')}>
                                                    <span className={cx('specItem')}>
                                                        <span className={cx('specLabel')}>Số lượng:</span>
                                                        <span className={cx('specValue')}>×{item.quantity}</span>
                                                    </span>
                                                    <span className={cx('specItem')}>
                                                        <span className={cx('specLabel')}>Dạng:</span>
                                                        <span className={cx('specValue')}>{item.unit || 'sản phẩm'}</span>
                                                    </span>
                                                    {item.size && (
                                                        <span className={cx('specItem')}>
                                                            <span className={cx('specLabel')}>Kích cỡ:</span>
                                                            <span className={cx('specValue')}>{item.size}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Price Display */}
                                            <div className={cx('priceContainer')}>
                                                <span className={cx('priceLabel')}>Thành tiền</span>
                                                <span className={cx('itemPrice')}>
                                                    {(item.sellingPrice * item.quantity).toLocaleString()}₫
                                                </span>
                                            </div>

                                            {/* Delete Button */}
                                            <button
                                                className={cx('deleteBtn')}
                                                onClick={() => handleRemoveFromInvoice(index)}
                                                title="Xóa sản phẩm"
                                            >
                                                <span className={cx('deleteIcon')}>✕</span>
                                            </button>
                                        </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className={cx('emptyState')}>
                                    <p>🛍️ Đơn hàng của bạn trống</p>
                                </div>
                            )}
                        </div>

                        {/* Vouchers - Only show when there are items in invoice */}
                        {invoiceItems.length > 0 && (
                        <div className={cx('vouchersDetail', {
                            'expanded': expandedVoucherId !== null
                        })}>
                            <div className={cx('voucherHeader')}>
                                <h2 className={cx('vouchersTitle')}>🎁 ĐIỀU KIỆN ĐẶC BIỆT</h2>
                                <span className={cx('voucherCountBadge')}>
                                    {vouchers.filter(v => !v.isUsed).length} khả dụng
                                </span>
                            </div>

                            {!loadingVouchers && vouchers.length > 0 && (
                                <>
                                    <button
                                        className={cx('voucherToggleBtn')}
                                        onClick={toggleVouchersVisibility}
                                    >
                                        {isVouchersVisible ? '▼ ẨN ĐỀ XUẤT' : '▶ XEM ĐỀ XUẤT'}
                                    </button>

                                    {isVouchersVisible && (
                                        <div className={cx('voucherPillsList')}>
                                            {Array.isArray(vouchers) && vouchers.length > 0 ? (
                                                vouchers.map((voucher) => {
                                                    // Map API field names
                                                    const voucherId = voucher.voucherId || voucher.id || voucher.voucherID;
                                                    const voucherCode = voucher.voucherCode || voucher.code || 'N/A';
                                                    const discountValue = voucher.discountValue || 0;
                                                    const minimumOrder = voucher.minimumOrderValue || 0;
                                                    const maxValue = voucher.maxValue || 0;
                                                    const rankMember = voucher.rankMember || 'Member';
                                                    const isActive = voucher.isActive !== false;
                                                    const isUsed = voucher.isUsed === true;

                                                    if (!isActive || isUsed) return null;

                                                    // Check if current order meets minimum requirement
                                                    const meetsMinimum = totalPrice >= minimumOrder;
                                                    const isDisabled = !meetsMinimum;

                                                    const voucherDescription = voucher.voucherDescription || 'Khuyến mãi đặc biệt';
                                                    const voucherImage = voucher.voucherImage;
                                                    const startDate = voucher.startDate ? new Date(voucher.startDate).toLocaleDateString('vi-VN') : 'N/A';
                                                    const endDate = voucher.endDate ? new Date(voucher.endDate).toLocaleDateString('vi-VN') : 'N/A';

                                                    const isSelected = selectedVoucher?.voucherId === voucherId || 
                                                                    selectedVoucher?.id === voucherId ||
                                                                    selectedVoucher?.voucherID === voucherId;

                                                    return (
                                                        <>
                                                        <div 
                                                            key={voucherId} 
                                                            className={cx('voucherPill', {
                                                                selected: isSelected,
                                                                expanded: expandedVoucherId === voucherId,
                                                                disabled: isDisabled
                                                            })}
                                                            onClick={() => {
                                                                if (!isDisabled) {
                                                                    setExpandedVoucherId(expandedVoucherId === voucherId ? null : voucherId);
                                                                }
                                                            }}
                                                            onMouseEnter={() => {
                                                                if (!isDisabled) {
                                                                    setHoveredVoucherId(voucherId);
                                                                }
                                                            }}
                                                            onMouseLeave={() => {
                                                                if (!isDisabled) {
                                                                    setHoveredVoucherId(null);
                                                                }
                                                            }}
                                                            title={isDisabled ? `Đơn hàng phải đạt tối thiểu ${(minimumOrder / 1000).toLocaleString()}K` : ''}
                                                        >
                                                            {/* Discount Badge */}
                                                            <div className={cx('pillDiscount')}>
                                                                {voucherImage ? (
                                                                    <img 
                                                                        src={`http://localhost:5122/Images/${voucherImage}`} 
                                                                        alt="voucher"
                                                                        className={cx('discountImage')}
                                                                        onError={(e) => e.target.style.display = 'none'}
                                                                    />
                                                                ) : (
                                                                    <div style={{
                                                                        background: 'linear-gradient(135deg, #00d4ff, #ff6b9d)',
                                                                        width: '100%',
                                                                        height: '100%',
                                                                    }} />
                                                                )}
                                                                <span className={cx('discountPercent')}>
                                                                    {discountValue}%
                                                                </span>
                                                            </div>

                                                            {/* Voucher Info */}
                                                            <div className={cx('pillInfo')}>
                                                                <span className={cx('pillCode')}>
                                                                    {voucherCode}
                                                                </span>
                                                                <span className={cx('pillRank')}>
                                                                    {rankMember}
                                                                </span>
                                                            </div>

                                                            {/* Min Order */}
                                                            <div className={cx('pillDetails')}>
                                                                <span className={cx('minOrder')}>
                                                                    Tối thiểu: {(minimumOrder / 1000).toLocaleString()}K
                                                                </span>
                                                            </div>

                                                            {/* Select Button */}
                                                            <button
                                                                className={cx('selectBtn')}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (!isDisabled) {
                                                                        setSelectedVoucher(voucher);
                                                                    }
                                                                }}
                                                                disabled={isDisabled}
                                                                title={isDisabled ? `Đơn hàng phải đạt tối thiểu ${(minimumOrder / 1000).toLocaleString()}K` : ''}
                                                                type="button"
                                                            >
                                                                {isSelected ? '✓' : '+'}
                                                            </button>

                                                        </div>

                                                        {/* Expanded Details Panel - Shows below voucher when clicked */}
                                                        {expandedVoucherId === voucherId && (
                                                        <div className={cx('voucherExpandedDetails')}>
                                                            <div className={cx('expandDetailHeader')}>
                                                                {voucherImage && (
                                                                    <div className={cx('expandDetailImage')}>
                                                                        <img 
                                                                            src={`http://localhost:5122/Images/${voucherImage}`} 
                                                                            alt={voucherCode}
                                                                            onError={(e) => e.target.src = PLACEHOLDER_IMAGE_80}
                                                                        />
                                                                    </div>
                                                                )}
                                                                <div className={cx('expandDetailInfo')}>
                                                                    <h3 className={cx('expandDetailCode')}>{voucherCode}</h3>
                                                                    <p className={cx('expandDetailDesc')}>{voucherDescription}</p>
                                                                </div>
                                                            </div>

                                                            <div className={cx('expandDetailMeta')}>
                                                                <div className={cx('metaRow')}>
                                                                    <span className={cx('metaLabel')}>Giảm tối đa:</span>
                                                                    <span className={cx('metaValue')}>{(maxValue).toLocaleString()}₫</span>
                                                                </div>
                                                                <div className={cx('metaRow')}>
                                                                    <span className={cx('metaLabel')}>Áp dụng cho:</span>
                                                                    <span className={cx('metaValue')}>{rankMember}</span>
                                                                </div>
                                                                <div className={cx('metaRow')}>
                                                                    <span className={cx('metaLabel')}>Đơn tối thiểu:</span>
                                                                    <span className={cx('metaValue')}>{(minimumOrder / 1000).toLocaleString()}K</span>
                                                                </div>
                                                            </div>

                                                            <div className={cx('expandDetailFooter')}>
                                                                <span className={cx('expandDetailDate')}>📅 Từ {startDate} đến {endDate}</span>
                                                                <button
                                                                    className={cx('useVoucherBtn')}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedVoucher(voucher);
                                                                        setSuccessMessage('✓ Voucher đã được áp dụng');
                                                                        setTimeout(() => setSuccessMessage(null), 2000);
                                                                    }}
                                                                    type="button"
                                                                >
                                                                    SỬ DỤNG
                                                                </button>
                                                            </div>
                                                        </div>
                                                        )}
                                                        </>
                                                    );
                                                }).filter(Boolean)
                                            ) : (
                                                <p className={cx('emptyState')}>Không có đề xuất nào khả dụng</p>
                                            )}
                                        </div>
                                    )}

                                    {selectedVoucher && (
                                        <div className={cx('selectedVoucher')}>
                                            <div className={cx('selectedVoucherContent')}>
                                                <span className={cx('selectedLabel')}>✓ Đã áp dụng</span>
                                                <strong className={cx('selectedCode')}>
                                                    {selectedVoucher.voucherCode || selectedVoucher.code}
                                                </strong>
                                                <span className={cx('selectedSaving')}>
                                                    Tiết kiệm {discountInfo.discountAmount.toLocaleString()} VND
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {!loadingVouchers && vouchers.length === 0 && (
                                <p className={cx('emptyState')}>Không có đề xuất nào khả dụng</p>
                            )}

                            {loadingVouchers && (
                                <p className={cx('emptyState')}>Đang tải đề xuất...</p>
                            )}
                        </div>
                        )}

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
                <div className={cx('paymentModalOverlay')}>
                    <div className={cx('paymentModal')}>
                        <div className={cx('paymentModalHeader')}>
                            <h3>Chọn phương thức thanh toán</h3>
                            <button
                                className={cx('closeBtn')}
                                onClick={() => setShowPaymentForm(false)}
                                title="Đóng"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        <div className={cx('paymentModalContent')}>
                            <div className={cx('paymentMethods')}>
                                {/* Payment Method 1 - Pay Now */}
                                <label className={cx('paymentMethodOption', { selected: paymentMethod === 'now' })}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="now"
                                        checked={paymentMethod === 'now'}
                                        onChange={() => setPaymentMethod('now')}
                                    />
                                    <div className={cx('methodContent')}>
                                        <span className={cx('methodTitle')}>💳 Thanh toán ngay</span>
                                        <span className={cx('methodDescription')}>Thanh toán 100% ngay lập tức</span>
                                    </div>
                                </label>

                                {/* Payment Method 2 - Pay Later */}
                                <label className={cx('paymentMethodOption', { selected: paymentMethod === 'later' })}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="later"
                                        checked={paymentMethod === 'later'}
                                        onChange={() => setPaymentMethod('later')}
                                    />
                                    <div className={cx('methodContent')}>
                                        <span className={cx('methodTitle')}>📅 Thanh toán sau</span>
                                        <span className={cx('methodDescription')}>Thanh toán sau khi nhận hàng</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className={cx('paymentModalFooter')}>
                            <button
                                className={cx('cancelBtn')}
                                onClick={() => setShowPaymentForm(false)}
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CartProduct;
