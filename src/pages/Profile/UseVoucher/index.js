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
        // Initialize empty vouchers list
        setVouchers([]);
        setLoading(false);
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
                        <div key={voucher.voucherID} className={cx('voucher-card')}>
                            <div className={cx('card-header')}>
                                <img
                                    src={`http://localhost:5262/Images/${voucher.voucherImage}`}
                                    alt={voucher.code}
                                    className={cx('voucher-image')}
                                />
                            </div>
                            <div className={cx('card-body')}>
                                <div className={cx('discount-section')}>
                                    <span className={cx('discount-value')}>{voucher.discountValue}%</span>
                                    <p className={cx('discount-label')}>Giảm giá</p>
                                </div>
                                <div className={cx('details-section')}>
                                    <p className={cx('detail-item')}>
                                        <FontAwesomeIcon icon={faTag} className={cx('detail-icon')} />
                                        Tối đa: {voucher.maxValue?.toLocaleString('vi-VN') || '0'}đ
                                    </p>
                                    <p className={cx('detail-item')}>
                                        <FontAwesomeIcon icon={faTag} className={cx('detail-icon')} />
                                        Đơn tối thiểu: {voucher.minimumOrderValue?.toLocaleString('vi-VN') || '0'}đ
                                    </p>
                                    <p className={cx('detail-item')}>
                                        <FontAwesomeIcon icon={faCalendarAlt} className={cx('detail-icon')} />
                                        Hết hạn: {voucher.endDate ? new Date(voucher.endDate).toLocaleDateString('vi-VN') : 'Không xác định'}
                                    </p>
                                </div>
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