import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUser,
    faShoppingBag,
    faTicketAlt,
    faCoins,
    faGift,
    faExchange,
    faGifts,
} from '@fortawesome/free-solid-svg-icons';
import styles from './ChangePasswordForm.module.scss';
import images from '~/assets/images';
import axios from 'axios';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';

const cx = classNames.bind(styles);
function ChangePasswordForm() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [userName, setUserName] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const storedUserName = localStorage.getItem('userName');
        if (storedUserName) {
            setUserName(storedUserName);
        } else {
            setUserName('Guest');
        }
    }, []);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setError('Mật khẩu không khớp');
            return;
        }

        const deviceName = localStorage.getItem('deviceName') || '';
        const refreshToken = localStorage.getItem('refreshToken') || '';
        const token = localStorage.getItem('token') || '';
        const userID = localStorage.getItem('userID') || '';

        if (!userID) {
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
            passWord: newPassword,
        };

        try {
            const response = await fetch('http://localhost:5262/api/Users/ChangePassword', {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
            });

            const result = await response.json();
            setSuccessMessage(result.returnMessage || 'Đổi mật khẩu thành công!');
            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
            if (!response.ok) {
                setSuccessMessage(result.returnMessage || 'Đổi mật khẩu thất bại!');
            } else {
                setNewPassword('');
                setConfirmPassword('');
                setError('');
            }
        } catch (error) {
            console.error('Lỗi khi đổi mật khẩu:', error);
        }
    };

    return (
        <div className={cx('change-password-form')}>
            {successMessage && <SuccessMessage message={successMessage} />}
            <h2>Đổi Mật Khẩu</h2>
            <div className={cx('form-group', 'fromName-tile')}>
                <label>Tên đăng nhập: </label>
                <p>{userName}</p>
            </div>
            {error && <p className={cx('error')}>{error}</p>}
            <div className={cx('form-group')}>
                <label>Mật khẩu mới</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className={cx('form-group')}>
                <label>Xác nhận mật khẩu</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <button onClick={handleChangePassword}>Đổi Mật Khẩu</button>
        </div>
    );
}

export default ChangePasswordForm;
