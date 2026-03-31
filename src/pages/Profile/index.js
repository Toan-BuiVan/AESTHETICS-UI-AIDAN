import { useLocation } from 'react-router-dom';
import ChangePasswordForm from './ChangePasswordForm';
import VoucherSection from './VoucherSection';
import DeviceHistory from './DeviceHistory';
import AwaitingPayment from './AwaitingPayment';
import PaymentSuccessful from './PaymentSuccessful';
import PaymentCanceled from './PaymentCanceled';
import PaymentOrder from './PaymentOrder';
import UseVoucher from './UseVoucher';
import CustomerForm from './CustomerForm';
import StaffForm from './StaffForm';
import MyBookings from './MyBookings';

import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faExchange, faGifts, faHistory, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import styles from './Profile.module.scss';
import images from '~/assets/images';

const cx = classNames.bind(styles);

function Profile() {
    const [selectedMenu, setSelectedMenu] = useState('account');
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState(0); // 0: Customer, 1: Staff, 2: Admin
    const [awaitingPaymentCount, setAwaitingPaymentCount] = useState(0);
    const [paymentSuccessfulCount, setPaymentSuccessfulCount] = useState(0);
    const [paymentCanceledCount, setPaymentCanceledCount] = useState(0);
    const location = useLocation();

    useEffect(() => {
        // Đọc trạng thái từ URL và cập nhật selectedMenu
        if (location.state && location.state.section) {
            setSelectedMenu(location.state.section);
        }
    }, [location]);

    // Reset menu when user role changes (indicates login/logout)
    useEffect(() => {
        setSelectedMenu('account');
    }, [userRole]);

    useEffect(() => {
        const storedUserName = localStorage.getItem('userName');
        const role = localStorage.getItem('role');
        
        if (storedUserName) {
            setUserName(storedUserName);
        } else {
            setUserName('Guest');
        }

        if (role) {
            setUserRole(parseInt(role));
        }

        // Function to update user info from localStorage
        const updateUserInfo = () => {
            const storedUserName = localStorage.getItem('userName');
            const role = localStorage.getItem('role');
            
            if (storedUserName) {
                setUserName(storedUserName);
            } else {
                setUserName('Guest');
            }

            if (role) {
                setUserRole(parseInt(role));
            }
        };

        // Listen for storage changes from the same tab (custom event)
        const handleUserChange = () => {
            updateUserInfo();
        };

        // Listen for custom event dispatched on logout/login
        window.addEventListener('userAuthenticated', handleUserChange);
        window.addEventListener('userLoggedOut', handleUserChange);

        // Also listen for storage changes (when user logs in/out from another tab)
        const handleStorageChange = () => {
            updateUserInfo();
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('userAuthenticated', handleUserChange);
            window.removeEventListener('userLoggedOut', handleUserChange);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const handleAwaitingPaymentCount = (count) => {
        setAwaitingPaymentCount(count);
    };

    const handlePaymentSuccessfulCount = (count) => {
        setPaymentSuccessfulCount(count);
    };

    const handlePaymentCanceledCount = (count) => {
        setPaymentCanceledCount(count);
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('sideBar')}>
                <div className={cx('userProfile')}>
                    <img src={images.profile} alt="User Avatar" className={cx('avatar')} />
                    <div className={cx('item-profile')}>
                        <span className={cx('username')}>{userName}</span>
                        <span className={cx('profileText')}>Xin chào {userName}!</span>
                    </div>
                </div>
                <ul className={cx('menu')}>
                    <li
                        className={cx('menuItem', 'account', { active: selectedMenu === 'account' })}
                        onClick={() => setSelectedMenu('account')}
                    >
                        <FontAwesomeIcon icon={faUser} />
                        <span>Hồ Sơ Của Tôi</span>
                    </li>
                    {(userRole === 0 || userRole === 1 || userRole === 2  ) && (
                        <li
                            className={cx('menuItem', 'myBookings', { active: selectedMenu === 'myBookings' })}
                            onClick={() => setSelectedMenu('myBookings')}
                        >
                            <FontAwesomeIcon icon={faCalendarAlt} />
                            <span>Đặt Lịch Của Tôi</span>
                        </li>
                    )}
                    <li
                        className={cx('menuItem', 'changePassword', { active: selectedMenu === 'changePassword' })}
                        onClick={() => setSelectedMenu('changePassword')}
                    >
                        <FontAwesomeIcon icon={faExchange} />
                        <span>Đổi Mật Khẩu</span>
                    </li>
                    <li
                        className={cx('menuItem', 'deviceHistory', { active: selectedMenu === 'deviceHistory' })}
                        onClick={() => setSelectedMenu('deviceHistory')}
                    >
                        <FontAwesomeIcon icon={faHistory} />
                        <span>Lịch Sử Đăng Nhập</span>
                    </li>
                    {( userRole === 0 || userRole === 1 || userRole === 2  ) && (
                        <li
                            className={cx('menuItem', 'voucher', { active: selectedMenu === 'voucher' })}
                            onClick={() => setSelectedMenu('voucher')}
                        >
                            <FontAwesomeIcon icon={faGifts} />
                            <span>Kho Voucher</span>
                        </li>
                    )}
                </ul>
            </div>
            <div className={cx('content')}>
                <div className={cx('header-content')}>
                    {( userRole === 0 || userRole === 1 || userRole === 2  ) && (
                        <ul className={cx('status-tabs')}>
                            <li
                                className={cx('tab', { active: selectedMenu === 'voucher' })}
                                onClick={() => setSelectedMenu('voucher')}
                            >
                                Tất cả
                            </li>
                            <li
                                className={cx('tab', { active: selectedMenu === 'useVoucher' })}
                                onClick={() => setSelectedMenu('useVoucher')}
                            >
                                Vouchers Của Tôi
                            </li>
                            <li
                                className={cx('tab', { active: selectedMenu === 'awaitingPayment' })}
                                onClick={() => setSelectedMenu('awaitingPayment')}
                            >
                                Chờ thanh toán {awaitingPaymentCount > 0 && `(${awaitingPaymentCount})`}
                            </li>
                            <li
                                className={cx('tab', { active: selectedMenu === 'paymentSuccessful' })}
                                onClick={() => setSelectedMenu('paymentSuccessful')}
                            >
                                Hoàn thành {paymentSuccessfulCount > 0 && `(${paymentSuccessfulCount})`}
                            </li>
                            <li
                                className={cx('tab', { active: selectedMenu === 'paymentCanceled' })}
                                onClick={() => setSelectedMenu('paymentCanceled')}
                            >
                                Đã hủy {paymentCanceledCount > 0 && `(${paymentCanceledCount})`}
                            </li>
                            <li
                                className={cx('tab', { active: selectedMenu === 'paymentOrder' })}
                                onClick={() => setSelectedMenu('paymentOrder')}
                            >
                                Trạng Thái Đơn Hàng
                            </li>
                        </ul>
                    )}
                </div>
                <div className={cx('content-content')}>
                    {selectedMenu === 'account' && userRole === 0 && <CustomerForm />}
                    {selectedMenu === 'account' && (userRole === 1 || userRole === 2) && <StaffForm />}
                    {selectedMenu === 'myBookings' && <MyBookings />}
                    {selectedMenu === 'changePassword' && <ChangePasswordForm />}
                    {selectedMenu === 'voucher' && (userRole === 0 || userRole === 1 || userRole === 2  ) && <VoucherSection />}
                    {selectedMenu === 'deviceHistory' && <DeviceHistory />}
                    {selectedMenu === 'awaitingPayment' && (
                        <AwaitingPayment onCountChange={handleAwaitingPaymentCount} />
                    )}
                    {selectedMenu === 'paymentSuccessful' && (
                        <PaymentSuccessful onCountChange={handlePaymentSuccessfulCount} />
                    )}
                    {selectedMenu === 'paymentCanceled' && (
                        <PaymentCanceled onCountChange={handlePaymentCanceledCount} />
                    )}
                    {selectedMenu === 'paymentOrder' && <PaymentOrder />}
                    {selectedMenu === 'useVoucher' && <UseVoucher />}
                </div>
            </div>
        </div>
    );
}

export default Profile;
