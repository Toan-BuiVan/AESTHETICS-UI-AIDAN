import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames/bind';
import styles from './VoucherSection.module.scss';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';

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

    if (loading) return <div className={cx('content')}>Đang tải...</div>;
    if (error) return <div className={cx('content')}>{error}</div>;

    return (
        <div className={cx('voucher-section')}>
            {successMessage && <SuccessMessage message={successMessage} />}
            <h2>Kho Voucher</h2>
            <div className={cx('voucher-input')}>
                <input
                    type="text"
                    placeholder="Nhập mã voucher tại đây"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                />
                <button>Lưu</button>
            </div>
            <div className={cx('voucher-grid')}>
                {Array.isArray(vouchers) && vouchers.length > 0 ? (
                    vouchers.map((voucher) => (
                        <div key={voucher.voucherID} className={cx('voucher-card')}>
                            <div className={cx('voucher-card-header')}>
                                <img
                                    src={`http://localhost:5262/Images/${voucher.voucherImage}`}
                                    alt={voucher.code}
                                    className={cx('voucher-logo')}
                                />
                            </div>
                            <div className={cx('voucher-details')}>
                                <p className={cx('rank-member')}>{voucher.rankMember}</p>
                                <div className={cx('voucher-discount')}>
                                    <span className={cx('discount-percent')}>{voucher.discountValue}%</span>
                                    <span className={cx('discount-text')}>
                                        Giảm tối đa {voucher.maxValue.toLocaleString('vi-VN')}đ
                                    </span>
                                </div>
                                <p>Đơn tối thiểu {voucher.minimumOrderValue.toLocaleString('vi-VN')}đ</p>
                                <p>Hết hạn: {new Date(voucher.endDate).toLocaleDateString('vi-VN')}</p>
                                <div className={cx('button-group')}>
                                    <button className={cx('save-button')} onClick={() => handleSaveVoucher(voucher)}>
                                        Lưu
                                    </button>
                                    <div className={cx('exchange-container')}>
                                        <button
                                            className={cx('exchange-button')}
                                            onMouseEnter={() => handleExchangeHover(voucher, true)}
                                            onMouseLeave={() => handleExchangeHover(voucher, false)}
                                            onClick={() => handleExchangeClick(voucher)}
                                        >
                                            Đổi
                                        </button>
                                        {showExchangeOptions[voucher.voucherID] && (
                                            <div
                                                className={cx('exchange-options')}
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
                                                <label>
                                                    <input
                                                        type="radio"
                                                        value="Accumulated"
                                                        checked={selectedOptions[voucher.voucherID] === 'Accumulated'}
                                                        onChange={(e) =>
                                                            handleOptionChange(voucher.voucherID, e.target.value)
                                                        }
                                                    />
                                                    Accumulated
                                                </label>
                                                <label>
                                                    <input
                                                        type="radio"
                                                        value="Rating"
                                                        checked={selectedOptions[voucher.voucherID] === 'Rating'}
                                                        onChange={(e) =>
                                                            handleOptionChange(voucher.voucherID, e.target.value)
                                                        }
                                                    />
                                                    Rating
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>Không có voucher nào để hiển thị.</p>  
                )}
            </div>
        </div>
    );
}
export default VoucherSection;