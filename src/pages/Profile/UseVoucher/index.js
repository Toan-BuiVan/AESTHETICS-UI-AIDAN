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
                const customerId = parseInt(localStorage.getItem('customerId') || localStorage.getItem('staffId'));
                
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
                <div className={cx('header-content')}>
                    <h2><FontAwesomeIcon icon={faWallet} className={cx('header-icon')} /> Kho Voucher Của Bạn</h2>
                    <p className={cx('header-subtitle')}>Quản lý và sử dụng các ưu đãi đã lưu</p>
                </div>
                {Array.isArray(vouchers) && vouchers.length > 0 && (
                    <div className={cx('voucher-count')}>
                        <span className={cx('count-number')}>{vouchers.filter(v => !v.isUsed).length}</span>
                        <span className={cx('count-label')}>Khả dụng</span>
                    </div>
                )}
            </div>
            
            {Array.isArray(vouchers) && vouchers.length > 0 ? (
                <div className={cx('voucher-list')}>
                    {vouchers.map((voucher) => (
                        <div key={voucher.id} className={cx('voucher-row', { used: voucher.isUsed })}>
                            {/* Discount Badge */}
                            <div className={cx('row-discount')}>
                                <span className={cx('discount-percent')}>{voucher.discountValue}%</span>
                            </div>

                            {/* Code */}
                            <div className={cx('row-code')}>
                                <h4 className={cx('code-text')}>{voucher.voucherCode}</h4>
                                {voucher.voucherDescription && (
                                    <span className={cx('code-desc')}>{voucher.voucherDescription.substring(0, 50)}</span>
                                )}
                            </div>

                            {/* Details */}
                            <div className={cx('row-details')}>
                                <span className={cx('detail-item')}>Giảm: <strong>{voucher.maxValue?.toLocaleString('vi-VN') || '0'}đ</strong></span>
                                <span className={cx('detail-item')}>Min: <strong>{voucher.minimumOrderValue?.toLocaleString('vi-VN') || '0'}đ</strong></span>
                            </div>

                            {/* Expiry */}
                            <div className={cx('row-expiry')}>
                                <span className={cx('expiry-label')}>Hết hạn:</span>
                                <span className={cx('expiry-date')}>
                                    {voucher.endDate ? new Date(voucher.endDate).toLocaleDateString('vi-VN') : 'N/A'}
                                </span>
                            </div>

                            {/* Rank */}
                            <div className={cx('row-rank')}>
                                <span>⭐ {voucher.rankMember}</span>
                            </div>

                            {/* Status */}
                            <div className={cx('row-status')}>
                                <span className={cx('status-badge', voucher.isUsed ? 'used' : 'active')}>
                                    {voucher.isUsed ? '✓ Đã dùng' : '✨ Khả dụng'}
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