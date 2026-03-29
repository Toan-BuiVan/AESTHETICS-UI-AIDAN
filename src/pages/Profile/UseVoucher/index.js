import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './UseVoucher.module.scss';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet, faTag, faCalendarAlt, faSpinner, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function UseVoucher() {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const fetchVouchers = async () => {
            try {
                setLoading(true);
                const customerId = parseInt(localStorage.getItem('customerId'));
                
                if (!customerId) {
                    setError('Không tìm thấy customerId trong localStorage');
                    setLoading(false);
                    return;
                }

                const response = await fetch('http://localhost:5122/api/Wallet/getwalletlist', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ customerId }),
                });

                if (!response.ok) {
                    throw new Error('Lỗi khi tải voucher từ API');
                }

                const data = await response.json();
                
                if (data.baseDatas && Array.isArray(data.baseDatas)) {
                    setVouchers(data.baseDatas);
                } else {
                    setVouchers([]);
                }
                
                setError(null);
            } catch (err) {
                console.error('Lỗi khi lấy voucher:', err);
                setError('Không thể tải voucher. Vui lòng thử lại sau.');
                setVouchers([]);
            } finally {
                setLoading(false);
            }
        };

        fetchVouchers();
    }, []);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    if (loading) {
        return (
            <div className={cx('voucher-section')}>
                <div className={cx('loading-container')}>
                    <FontAwesomeIcon icon={faSpinner} className={cx('spinner-icon')} />
                    <p>Đang tải voucher của bạn...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cx('voucher-section')}>
                <div className={cx('error-container')}>
                    <FontAwesomeIcon icon={faExclamationCircle} className={cx('error-icon')} />
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cx('voucher-section')}>
            {successMessage && <SuccessMessage message={successMessage} />}
            <div className={cx('section-header')}>
                <h2><FontAwesomeIcon icon={faWallet} className={cx('header-icon')} /> Voucher Của Bạn</h2>
            </div>
            
            {Array.isArray(vouchers) && vouchers.length > 0 ? (
                <div className={cx('voucher-grid')}>
                    {vouchers.map((voucher) => (
                        <div key={voucher.id} className={cx('voucher-card', { used: voucher.isUsed })}>
                            {/* Card Header - Image */}
                            <div className={cx('card-header')}>
                                {voucher.voucherImage ? (
                                    <img
                                        src={`http://localhost:5122/Images/${voucher.voucherImage}`}
                                        alt={voucher.voucherCode}
                                        className={cx('voucher-image')}
                                        onError={(e) => e.target.src = 'https://via.placeholder.com/300x150?text=Voucher'}
                                    />
                                ) : (
                                    <div className={cx('voucher-image-placeholder')}>
                                        <FontAwesomeIcon icon={faTag} />
                                    </div>
                                )}
                                <span className={cx('rank-badge')}>🌟 {voucher.rankMember}</span>
                                {voucher.isUsed && <span className={cx('used-badge')}>✓ Đã dùng</span>}
                            </div>

                            {/* Card Body - Content */}
                            <div className={cx('card-body')}>
                                {/* Discount Section */}
                                <div className={cx('discount-section')}>
                                    <span className={cx('discount-value')}>{voucher.discountValue}</span>
                                    <p className={cx('discount-label')}>%</p>
                                </div>

                                {/* Details Section */}
                                <div className={cx('details-section')}>
                                    {/* Code */}
                                    <div className={cx('voucher-code-box')}>
                                        <span className={cx('voucher-code-label')}>Mã:</span>
                                        <span className={cx('voucher-code-value')}>{voucher.voucherCode}</span>
                                    </div>

                                    {/* Description */}
                                    <p className={cx('detail-item')}>
                                        <FontAwesomeIcon icon={faTag} className={cx('detail-icon')} />
                                        <span>{voucher.voucherDescription.substring(0, 50)}</span>
                                    </p>

                                    {/* Details Grid */}
                                    <div className={cx('details-grid')}>
                                        <div className={cx('detail-box')}>
                                            <span className={cx('detail-label')}>Giảm tối đa</span>
                                            <span className={cx('detail-value')}>{voucher.maxValue?.toLocaleString('vi-VN')}₫</span>
                                        </div>
                                        <div className={cx('detail-box')}>
                                            <span className={cx('detail-label')}>Tối thiểu</span>
                                            <span className={cx('detail-value')}>{voucher.minimumOrderValue?.toLocaleString('vi-VN')}₫</span>
                                        </div>
                                    </div>

                                    {/* End Date */}
                                    <p className={cx('detail-item', 'end-date')}>
                                        <FontAwesomeIcon icon={faCalendarAlt} className={cx('detail-icon')} />
                                        Hết: {voucher.endDate ? new Date(voucher.endDate).toLocaleDateString('vi-VN') : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className={cx('card-status')}>
                                <span className={cx('status-badge', voucher.isUsed ? 'used' : 'active')}>
                                    {voucher.isUsed ? '✓ Đã sử dụng' : '✨ Khả dụng'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={cx('empty-state')}>
                    <FontAwesomeIcon icon={faWallet} className={cx('empty-icon')} />
                    <p className={cx('empty-text')}>Bạn chưa có voucher nào</p>
                    <p className={cx('empty-subtext')}>Hãy đi đến Kho Voucher để lưu voucher</p>
                </div>
            )}
        </div>
    );
}

export default UseVoucher;