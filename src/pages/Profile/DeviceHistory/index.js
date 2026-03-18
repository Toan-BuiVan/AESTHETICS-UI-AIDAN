import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './DeviceHistory.module.scss';

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
            setSessions(result.data);
            setLoading(false);
        } catch (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    if (loading) {
        return <div className={cx('loading')}>Đang tải...</div>;
    }

    if (error) {
        return <div className={cx('error')}>Lỗi: {error}</div>;
    }

    return (
        <div className={cx('container')}>
            <h2>Lịch sử đăng nhập</h2>
            <ul className={cx('session-list')}>
                {sessions.map((session, index) => (
                    <li key={index} className={cx('session-item')}>
                        <div>Tên thiết bị: {session.deviceName || 'Không xác định'}</div>
                        <div>
                            Thời gian đăng nhập:{' '}
                            {new Intl.DateTimeFormat('vi-VN', {
                                dateStyle: 'full',
                                timeStyle: 'medium',
                            }).format(new Date(session.createTime))}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default DeviceHistory;
