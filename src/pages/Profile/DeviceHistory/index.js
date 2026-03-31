import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './DeviceHistory.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLaptop, faMobile, faTabletAlt, faClock, faMapMarkerAlt, faShieldAlt, faGlobe } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function DeviceHistory() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

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
            Authorization: token ? `Bearer ${token}` : '',
        };

        const requestData = {
            accountId: parseInt(userID),
        };

        try {
            const response = await fetch('http://localhost:5122/api/Account/getaccountsession', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error('Lỗi khi gọi API');
            }

            const result = await response.json();
            setSessions(result.baseDatas || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching sessions:', error);
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

    // Pagination logic
    const totalPages = Math.ceil(sessions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentSessions = sessions.slice(startIndex, endIndex);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
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
                <div className={cx('sessions-list')}>
                    <div className={cx('list-header')}>
                        <div className={cx('col', 'col-device')}>
                            <span>Thiết Bị</span>
                        </div>
                        <div className={cx('col', 'col-time')}>
                            <span>Thời gian đăng nhập</span>
                        </div>
                        <div className={cx('col', 'col-ip')}>
                            <span>Địa chỉ IP</span>
                        </div>
                    </div>

                    {currentSessions.map((session, index) => (
                        <div key={index} className={cx('session-row')}>
                            <div className={cx('col', 'col-device')}>
                                <div className={cx('device-cell')}>
                                    <FontAwesomeIcon icon={getDeviceIcon(session.deviceName)} className={cx('device-icon')} />
                                    <div>
                                        <p className={cx('device-name')}>{getDeviceType(session.deviceName)}</p>
                                        <p className={cx('device-full-name')}>{session.deviceName || 'Thiết bị không xác định'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className={cx('col', 'col-time')}>
                                <p>
                                    {new Intl.DateTimeFormat('vi-VN', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                    }).format(new Date(session.createTime))}
                                </p>
                            </div>

                            <div className={cx('col', 'col-ip')}>
                                <p>{session.ip || 'Không xác định'}</p>
                            </div>
                        </div>
                    ))}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className={cx('pagination-container')}>
                            <button 
                                className={cx('pagination-btn', 'prev-btn')} 
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                            >
                                ← Trang trước
                            </button>

                            <div className={cx('pagination-info')}>
                                Trang <strong>{currentPage}</strong> / {totalPages}
                            </div>

                            <div className={cx('pagination-pages')}>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        className={cx('page-btn', { active: page === currentPage })}
                                        onClick={() => goToPage(page)}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>

                            <button 
                                className={cx('pagination-btn', 'next-btn')} 
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                            >
                                Trang sau →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default DeviceHistory;
