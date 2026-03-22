import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './DeviceHistory.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLaptop, faMobile, faTabletAlt, faClock, faMapMarkerAlt, faShieldAlt } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function DeviceHistory() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSessions = async () => {
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

        const requestData = {
            userID: userID,
            userName: null,
        };

        try {
            const response = await fetch('http://localhost:5262/api/UserSession/GetList_SearchUserSession', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error('Lỗi khi gọi API');
            }

            const result = await response.json();
            setSessions(result.data || []);
            setLoading(false);
        } catch (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const getDeviceIcon = (deviceName) => {
        if (!deviceName) return faLaptop;
        const name = deviceName.toLowerCase();
        if (name.includes('iphone') || name.includes('android') || name.includes('mobile')) return faMobile;
        if (name.includes('ipad') || name.includes('tablet')) return faTabletAlt;
        return faLaptop;
    };

    const getDeviceType = (deviceName) => {
        if (!deviceName) return 'Máy Tính';
        const name = deviceName.toLowerCase();
        if (name.includes('iphone')) return 'iPhone';
        if (name.includes('android') || name.includes('mobile')) return 'Mobile';
        if (name.includes('ipad') || name.includes('tablet')) return 'Tablet';
        return 'Máy Tính';
    };

    if (loading) {
        return (
            <div className={cx('container')}>
                <div className={cx('loading-spinner')}>
                    <div className={cx('spinner')}></div>
                    <p>Đang tải lịch sử đăng nhập...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cx('container')}>
                <div className={cx('error-box')}>
                    <FontAwesomeIcon icon={faShieldAlt} />
                    <p>Lỗi: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cx('container')}>
            <div className={cx('header')}>
                <h1><FontAwesomeIcon icon={faClock} /> Lịch Sử Đăng Nhập</h1>
                <p>Theo dõi hoạt động đăng nhập của bạn</p>
            </div>

            {sessions.length === 0 ? (
                <div className={cx('empty-state')}>
                    <FontAwesomeIcon icon={faShieldAlt} />
                    <p>Không có lịch sử đăng nhập</p>
                </div>
            ) : (
                <div className={cx('sessions-grid')}>
                    {sessions.map((session, index) => (
                        <div key={index} className={cx('session-card')}>
                            <div className={cx('card-header')}>
                                <div className={cx('device-icon')}>
                                    <FontAwesomeIcon icon={getDeviceIcon(session.deviceName)} />
                                </div>
                                <div className={cx('device-info')}>
                                    <h3>{getDeviceType(session.deviceName)}</h3>
                                    <p>{session.deviceName || 'Thiết bị không xác định'}</p>
                                </div>
                            </div>

                            <div className={cx('card-body')}>
                                <div className={cx('info-item')}>
                                    <FontAwesomeIcon icon={faClock} />
                                    <div>
                                        <span className={cx('label')}>Thời gian đăng nhập</span>
                                        <p>
                                            {new Intl.DateTimeFormat('vi-VN', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                            }).format(new Date(session.createTime))}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className={cx('card-footer')}>
                                <span className={cx('badge', 'active')}>Hoạt động</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default DeviceHistory;
