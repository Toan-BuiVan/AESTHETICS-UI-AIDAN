import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames/bind';
import styles from './VoucherSection.module.scss';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGift, faCheckCircle, faTimes, faTag, faCalendarAlt, faStar, faSpinner, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function VoucherSection() {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [voucherCode, setVoucherCode] = useState('');
    const [showExchangeOptions, setShowExchangeOptions] = useState({});
    const [selectedOptions, setSelectedOptions] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const timeoutRefs = useRef({});

    useEffect(() => {
        const fetchVouchers = async () => {
            const deviceName = localStorage.getItem('deviceName') || '';
            const refreshToken = localStorage.getItem('refreshToken') || '';
            const token = localStorage.getItem('token') || '';
            const userID = localStorage.getItem('userID') || '';

            if (!userID) {
                setError('Không tìm thấy userID trong localStorage');
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
                voucherID: null,
                startDate: null,
                endDate: null,
                rankMember: null,
            };

            try {
                const response = await fetch('http://localhost:5262/api/Vouchers/GetList_SearchVouchers', {
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

                const voucherData = result.data || result;
                if (Array.isArray(voucherData)) {
                    setVouchers(voucherData);
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
                setError('Không thể tải danh sách voucher. Vui lòng thử lại sau.');
                setLoading(false);
                console.error('Lỗi khi lấy voucher:', err);
            }
        };

        fetchVouchers();
    }, []);

    const handleSaveVoucher = async (voucher) => {
        const deviceName = localStorage.getItem('deviceName') || '';
        const refreshToken = localStorage.getItem('refreshToken') || '';
        const token = localStorage.getItem('token') || '';
        const userID = localStorage.getItem('userID') || '';

        if (!userID) {
            alert('Không tìm thấy userID trong localStorage');
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
            voucherID: voucher.voucherID,
        };

        try {
            const response = await fetch('http://localhost:5262/api/Wallets/Insert_Wallets', {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok) {
                setSuccessMessage(result.responseMessage); 
            } else {
                setSuccessMessage(result.responseMessage);  
            }

            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
        } catch (err) {
            setSuccessMessage('Không thể lưu voucher. Vui lòng thử lại sau.');
            console.error('Lỗi khi lưu voucher:', err);
        }
    };

    const handleExchangeHover = (voucher, show) => {
        if (show) {
            if (timeoutRefs.current[voucher.voucherID]) {
                clearTimeout(timeoutRefs.current[voucher.voucherID]);
                delete timeoutRefs.current[voucher.voucherID];
            }
            setShowExchangeOptions((prev) => ({
                ...prev,
                [voucher.voucherID]: true,
            }));
        } else {
            timeoutRefs.current[voucher.voucherID] = setTimeout(() => {
                setShowExchangeOptions((prev) => ({
                    ...prev,
                    [voucher.voucherID]: false,
                }));
                delete timeoutRefs.current[voucher.voucherID];
            }, 200);
        }
    };

    const handleOptionChange = (voucherID, value) => {
        setSelectedOptions((prev) => ({
            ...prev,
            [voucherID]: value,
        }));
    };

    const handleExchangeClick = async (voucher) => {
        const pointType = selectedOptions[voucher.voucherID];
        if (!pointType) {
            setSuccessMessage('Vui lòng chọn loại điểm trước khi đổi.');
            return;
        }

        const deviceName = localStorage.getItem('deviceName') || '';
        const refreshToken = localStorage.getItem('refreshToken') || '';
        const token = localStorage.getItem('token') || '';
        const userID = localStorage.getItem('userID') || '';

        if (!userID) {
            setSuccessMessage('Không tìm thấy userID trong localStorage');
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
            voucherID: voucher.voucherID,
            pointType: pointType,
        };

        try {
            const response = await fetch('http://localhost:5262/api/Wallets/RedeemPointsForVoucher', {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok) {
                setSuccessMessage(result.responseMessage);  
            } else {
                setSuccessMessage(result.responseMessage);  
            }

            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
        } catch (err) {
            setSuccessMessage('Không thể đổi voucher. Vui lòng thử lại sau.');
            console.error('Lỗi khi đổi voucher:', err);
        }
    };

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
                    <p>Đang tải kho voucher...</p>
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
                <h2><FontAwesomeIcon icon={faGift} className={cx('header-icon')} /> Kho Voucher</h2>
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
                                <span className={cx('rank-badge')}>
                                    <FontAwesomeIcon icon={faStar} /> {voucher.rankMember}
                                </span>
                            </div>
                            <div className={cx('card-body')}>
                                <div className={cx('discount-section')}>
                                    <span className={cx('discount-value')}>{voucher.discountValue}%</span>
                                    <p className={cx('discount-label')}>Giảm tối đa</p>
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
                            <div className={cx('card-footer')}>
                                <button className={cx('btn-save')} onClick={() => handleSaveVoucher(voucher)} title="Lưu voucher này vào ví">
                                    <FontAwesomeIcon icon={faCheckCircle} /> Lưu
                                </button>
                                <div className={cx('exchange-container')}>
                                    <button
                                        className={cx('btn-exchange')}
                                        onMouseEnter={() => handleExchangeHover(voucher, true)}
                                        onMouseLeave={() => handleExchangeHover(voucher, false)}
                                        onClick={() => handleExchangeClick(voucher)}
                                        title="Đổi điểm lấy voucher"
                                    >
                                        <FontAwesomeIcon icon={faGift} /> Đổi
                                    </button>
                                    {showExchangeOptions[voucher.voucherID] && (
                                        <div
                                            className={cx('exchange-dropdown')}
                                            onMouseEnter={() => {
                                                if (timeoutRefs.current[voucher.voucherID]) {
                                                    clearTimeout(timeoutRefs.current[voucher.voucherID]);
                                                    delete timeoutRefs.current[voucher.voucherID];
                                                }
                                            }}
                                            onMouseLeave={() => {
                                                timeoutRefs.current[voucher.voucherID] = setTimeout(() => {
                                                    setShowExchangeOptions((prev) => ({
                                                        ...prev,
                                                        [voucher.voucherID]: false,
                                                    }));
                                                    delete timeoutRefs.current[voucher.voucherID];
                                                }, 200);
                                            }}
                                        >
                                            <label className={cx('option-item')}>
                                                <input
                                                    type="radio"
                                                    value="Accumulated"
                                                    checked={selectedOptions[voucher.voucherID] === 'Accumulated'}
                                                    onChange={(e) =>
                                                        handleOptionChange(voucher.voucherID, e.target.value)
                                                    }
                                                />
                                                <span>Điểm tích lũy</span>
                                            </label>
                                            <label className={cx('option-item')}>
                                                <input
                                                    type="radio"
                                                    value="Rating"
                                                    checked={selectedOptions[voucher.voucherID] === 'Rating'}
                                                    onChange={(e) =>
                                                        handleOptionChange(voucher.voucherID, e.target.value)
                                                    }
                                                />
                                                <span>Điểm đánh giá</span>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={cx('empty-state')}>
                    <FontAwesomeIcon icon={faGift} className={cx('empty-icon')} />
                    <p className={cx('empty-text')}>Không có voucher nào để hiển thị</p>
                    <p className={cx('empty-subtext')}>Hãy quay lại sau để xem các voucher mới</p>
                </div>
            )}
        </div>
    );
}

export default VoucherSection;