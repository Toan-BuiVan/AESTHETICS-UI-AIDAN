import React, { useState, useEffect } from 'react';
import axios from 'axios';
import classNames from 'classnames/bind';
import styles from './MyBookings.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faClock, faUserMd, faTimes, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function MyBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, pending, completed, canceled

    useEffect(() => {
        fetchMyBookings();
    }, []);

    const fetchMyBookings = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get customerId from localStorage
            let customerId = parseInt(localStorage.getItem('customerId') || 0);
            const staffId = parseInt(localStorage.getItem('staffId') || 0);
            
            if (!customerId || customerId === 0) {
                customerId = staffId;
            }

            if (!customerId || customerId === 0) {
                setError('Vui lòng đăng nhập');
                return;
            }

            const response = await axios.post(
                'http://localhost:5122/api/CustomerTreatmentPlans/getcustomertreatmentplanlist',
                { customerId: customerId }
            );

            console.log('My bookings response:', response.data);

            if (response.data?.baseDatas && Array.isArray(response.data.baseDatas)) {
                // Flatten all sessions from all plans
                const allBookings = [];
                response.data.baseDatas.forEach((plan, planIndex) => {
                    if (plan.customerSessions && Array.isArray(plan.customerSessions)) {
                        plan.customerSessions.forEach((session, sessionIndex) => {
                            allBookings.push({
                                ...session,
                                planIndex,
                                sessionIndex,
                                planName: plan.treatmentPlanInformation?.planName,
                                serviceName: plan.serviceInformation?.serviceName,
                                planId: plan.id
                            });
                        });
                    }
                });
                setBookings(allBookings);
            } else {
                setBookings([]);
            }
        } catch (err) {
            console.error('Error fetching bookings:', err);
            setError('Không thể tải danh sách đặt lịch');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ChoDatLich':
                return 'pending';
            case 'DaDatLich':
                return 'booked';
            case 'DangThucHien':
                return 'inprogress';
            case 'HoanTat':
                return 'completed';
            case 'Huy':
                return 'canceled';
            default:
                return 'default';
        }
    };

    const getStatusText = (status) => {
        const statusMap = {
            'ChoDatLich': '⏳ Chờ đặt lịch',
            'DaDatLich': '📅 Đã đặt lịch',
            'DangThucHien': '🔄 Đang thực hiện',
            'HoanTat': '✓ Hoàn tất',
            'Huy': '❌ Hủy'
        };
        return statusMap[status] || status;
    };

    const filterBookings = () => {
        if (filter === 'all') return bookings;
        
        return bookings.filter(booking => {
            switch (filter) {
                case 'pending':
                    return booking.status === 'ChoDatLich';
                case 'booked':
                    return booking.status === 'DaDatLich';
                case 'completed':
                    return booking.status === 'HoanTat';
                case 'canceled':
                    return booking.status === 'Huy';
                default:
                    return true;
            }
        });
    };

    const filteredBookings = filterBookings();

    if (loading) {
        return (
            <div className={cx('container')}>
                <div className={cx('loading')}>Đang tải...</div>
            </div>
        );
    }

    return (
        <div className={cx('container')}>
            <div className={cx('header')}>
                <h2>Đặt Lịch Của Tôi</h2>
                <p>Theo dõi và quản lý các buổi điều trị của bạn</p>
            </div>

            <div className={cx('filterTabs')}>
                <button 
                    className={cx('tab', { active: filter === 'all' })}
                    onClick={() => setFilter('all')}
                >
                    Tất cả ({bookings.length})
                </button>
                <button 
                    className={cx('tab', { active: filter === 'pending' })}
                    onClick={() => setFilter('pending')}
                >
                    Chờ đặt ({bookings.filter(b => b.status === 'ChoDatLich').length})
                </button>
                <button 
                    className={cx('tab', { active: filter === 'booked' })}
                    onClick={() => setFilter('booked')}
                >
                    Đã đặt ({bookings.filter(b => b.status === 'DaDatLich').length})
                </button>
                <button 
                    className={cx('tab', { active: filter === 'completed' })}
                    onClick={() => setFilter('completed')}
                >
                    Hoàn tất ({bookings.filter(b => b.status === 'HoanTat').length})
                </button>
                <button 
                    className={cx('tab', { active: filter === 'canceled' })}
                    onClick={() => setFilter('canceled')}
                >
                    Hủy ({bookings.filter(b => b.status === 'Huy').length})
                </button>
            </div>

            {error && (
                <div className={cx('error')}>
                    {error}
                </div>
            )}

            <div className={cx('bookingsList')}>
                {filteredBookings.length > 0 ? (
                    filteredBookings.map((booking, index) => (
                        <div key={index} className={cx('bookingCard', getStatusColor(booking.status))}>
                            <div className={cx('bookingHeader')}>
                                <div className={cx('bookingInfo')}>
                                    <h3 className={cx('sessionName')}>
                                        Buổi {booking.sessionNumber}: {booking.sessionName}
                                    </h3>
                                    <p className={cx('planName')}>
                                        {booking.planName} - {booking.serviceName}
                                    </p>
                                </div>
                                <span className={cx('statusBadge', getStatusColor(booking.status))}>
                                    {getStatusText(booking.status)}
                                </span>
                            </div>

                            <div className={cx('bookingDetails')}>
                                {booking.bookingDate && (
                                    <div className={cx('detail')}>
                                        <FontAwesomeIcon icon={faCalendarAlt} className={cx('icon')} />
                                        <span>
                                            {new Date(booking.bookingDate).toLocaleDateString('vi-VN', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                )}
                                {booking.bookingTime && (
                                    <div className={cx('detail')}>
                                        <FontAwesomeIcon icon={faClock} className={cx('icon')} />
                                        <span>{booking.bookingTime}</span>
                                    </div>
                                )}
                                {booking.doctorName && (
                                    <div className={cx('detail')}>
                                        <FontAwesomeIcon icon={faUserMd} className={cx('icon')} />
                                        <span>{booking.doctorName}</span>
                                    </div>
                                )}
                            </div>

                            {booking.description && (
                                <div className={cx('bookingDescription')}>
                                    {booking.description}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className={cx('emptyState')}>
                        <FontAwesomeIcon icon={faCalendarAlt} className={cx('emptyIcon')} />
                        <p>Không có đặt lịch nào</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyBookings;
