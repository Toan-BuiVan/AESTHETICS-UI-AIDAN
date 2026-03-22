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
        const fetchUserVouchers = async () => {
            const deviceName = localStorage.getItem('deviceName') || '';
            const refreshToken = localStorage.getItem('refreshToken') || '';
            const token = localStorage.getItem('token') || '';
            const userID = localStorage.getItem('userID') || '';

            if (!userID) {
                setLoading(false);
                return;
            }

            const headers = {
                'Content-Type': 'application/json',
                DeviceName: deviceName,
                RefreshToken: refreshToken,
                Authorization: token ? `Bearer ${token}` : '',
                UserID: userID,
            };

            const data = {
                userID: parseInt(userID),
            };
            try {
                const response = await fetch('http://localhost:5262/api/Wallets/GetList_SearchWallets', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(data),
                });

                const result = await response.json();

                if (!response.ok) {
                    setError(result.returnMessage || 'Không thể tải danh sách voucher. Vui lòng thử lại sau.');
                    setLoading(false);
                    return;
                }

               
                const voucherData = result?.data || [];  
                if (Array.isArray(voucherData)) {
                    setVouchers(voucherData);
                    console.log('Vouchers fetched successfully:', voucherData);  
                } else {
                    setVouchers([]);
                    setError('Dữ liệu voucher không hợp lệ hoặc không phải mảng.');
                    console.warn('Dữ liệu từ API không phải array:', voucherData);  
                }
                setLoading(false);

                const newAccessToken = response.headers.get('New-AccessToken');
                const newRefreshToken = response.headers.get('New-RefreshToken');
                if (newAccessToken) localStorage.setItem('token', newAccessToken);
                if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
            } catch (err) {
                setLoading(false);
                console.error('Lỗi khi lấy voucher:', err);
                setError('Có lỗi xảy ra khi tải voucher.');
                setVouchers([]); 
            }
        };

        fetchUserVouchers();
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