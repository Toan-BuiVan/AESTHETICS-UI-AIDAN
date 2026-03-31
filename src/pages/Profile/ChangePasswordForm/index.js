import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faLock,
    faKey,
    faCheckCircle,
    faShieldAlt,
    faEye,
    faEyeSlash,
} from '@fortawesome/free-solid-svg-icons';
import styles from './ChangePasswordForm.module.scss';
import axios from 'axios';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';

const cx = classNames.bind(styles);

function ChangePasswordForm() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [error, setError] = useState('');
    const [userName, setUserName] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    useEffect(() => {
        const storedUserName = localStorage.getItem('userName');
        if (storedUserName) {
            setUserName(storedUserName);
        } else {
            setUserName('Guest');
        }
    }, []);

    useEffect(() => {
        if (successMessage || error) {
            const timer = setTimeout(() => {
                setSuccessMessage('');
                setError('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, error]);

    const calculatePasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[!@#$%^&*]/.test(password)) strength++;
        return Math.min(strength, 5);
    };

    const handleNewPasswordChange = (e) => {
        const password = e.target.value;
        setNewPassword(password);
        setPasswordStrength(calculatePasswordStrength(password));
    };

    const handleChangePassword = async () => {
        setError('');

        if (!currentPassword) {
            setError('Vui lòng nhập mật khẩu hiện tại');
            return;
        }

        if (!newPassword) {
            setError('Vui lòng nhập mật khẩu mới');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        if (newPassword === currentPassword) {
            setError('Mật khẩu mới không được trùng với mật khẩu cũ');
            return;
        }

        if (newPassword.length < 8) {
            setError('Mật khẩu mới phải có ít nhất 8 ký tự');
            return;
        }

        setIsLoading(true);

        const deviceName = localStorage.getItem('deviceName') || '';
        const refreshToken = localStorage.getItem('refreshToken') || '';
        const token = localStorage.getItem('token') || '';
        const userID = localStorage.getItem('userID') || '';

        if (!userID) {
            setError('Không tìm thấy userID');
            setIsLoading(false);
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
            id: parseInt(userID),
            originPassWord: currentPassword,
            newPassWord: newPassword,
        };

        try {
            const response = await fetch('http://localhost:5122/api/Account/updateaccount', {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
            });

            const result = await response.json();
            
            // API trả về true/false
            if (result === true || result.success === true) {
                setSuccessMessage('Đổi mật khẩu thành công!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordStrength(0);
            } else {
                setError(result.returnMessage || result.message || 'Đổi mật khẩu thất bại!');
            }

            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
        } catch (error) {
            console.error('Lỗi khi đổi mật khẩu:', error);
            setError('Có lỗi xảy ra. Vui lòng thử lại!');
        } finally {
            setIsLoading(false);
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPassword(prev => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const getStrengthLabel = () => {
        const labels = ['Rất yếu', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh', 'Cực mạnh'];
        return labels[passwordStrength - 1] || 'N/A';
    };

    const getStrengthColor = () => {
        const colors = ['#f56565', '#f6911e', '#f6c01e', '#48bb78', '#38a169', '#2f855a'];
        return colors[passwordStrength - 1] || '#cbd5e0';
    };

    return (
        <div className={cx('change-password-form')}>
            {successMessage && <SuccessMessage message={successMessage} />}

            <div className={cx('form-header')}>
                <h1><FontAwesomeIcon icon={faLock} /> Đổi Mật Khẩu</h1>
                <p>Cập nhật mật khẩu của bạn để bảo mật tài khoản</p>
            </div>

            <div className={cx('security-info')}>
                <FontAwesomeIcon icon={faShieldAlt} />
                <div>
                    <p><strong>Tên đăng nhập:</strong> {userName}</p>
                    <p><strong>Lưu ý:</strong> Sử dụng mật khẩu mạnh với tối thiểu 8 ký tự, bao gồm chữ cái, số và ký tự đặc biệt.</p>
                </div>
            </div>

            <form className={cx('form-section')} onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }}>
                {error && (
                    <div className={cx('error-message')}>
                        <span>{error}</span>
                    </div>
                )}

                <div className={cx('form-group')}>
                    <label>
                        <FontAwesomeIcon icon={faKey} /> Mật khẩu hiện tại
                    </label>
                    <div className={cx('input-wrapper')}>
                        <input
                            type={showPassword.current ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Nhập mật khẩu hiện tại"
                        />
                        <button
                            type="button"
                            className={cx('toggle-btn')}
                            onClick={() => togglePasswordVisibility('current')}
                        >
                            <FontAwesomeIcon icon={showPassword.current ? faEyeSlash : faEye} />
                        </button>
                    </div>
                </div>

                <div className={cx('form-group')}>
                    <label>
                        <FontAwesomeIcon icon={faKey} /> Mật khẩu mới
                    </label>
                    <div className={cx('input-wrapper')}>
                        <input
                            type={showPassword.new ? 'text' : 'password'}
                            value={newPassword}
                            onChange={handleNewPasswordChange}
                            placeholder="Nhập mật khẩu mới"
                        />
                        <button
                            type="button"
                            className={cx('toggle-btn')}
                            onClick={() => togglePasswordVisibility('new')}
                        >
                            <FontAwesomeIcon icon={showPassword.new ? faEyeSlash : faEye} />
                        </button>
                    </div>

                    {newPassword && (
                        <div className={cx('strength-meter')}>
                            <div className={cx('strength-bar')}>
                                <div
                                    className={cx('strength-fill')}
                                    style={{
                                        width: `${(passwordStrength / 5) * 100}%`,
                                        backgroundColor: getStrengthColor(),
                                    }}
                                ></div>
                            </div>
                            <span className={cx('strength-text')} style={{ color: getStrengthColor() }}>
                                {getStrengthLabel()}
                            </span>
                        </div>
                    )}
                </div>

                <div className={cx('form-group')}>
                    <label>
                        <FontAwesomeIcon icon={faCheckCircle} /> Xác nhận mật khẩu mới
                    </label>
                    <div className={cx('input-wrapper')}>
                        <input
                            type={showPassword.confirm ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Nhập lại mật khẩu mới"
                        />
                        <button
                            type="button"
                            className={cx('toggle-btn')}
                            onClick={() => togglePasswordVisibility('confirm')}
                        >
                            <FontAwesomeIcon icon={showPassword.confirm ? faEyeSlash : faEye} />
                        </button>
                    </div>
                    {confirmPassword && newPassword === confirmPassword && (
                        <div className={cx('match-indicator', 'success')}>
                            <FontAwesomeIcon icon={faCheckCircle} /> Mật khẩu khớp
                        </div>
                    )}
                    {confirmPassword && newPassword !== confirmPassword && (
                        <div className={cx('match-indicator', 'error')}>
                            <FontAwesomeIcon icon={faLock} /> Mật khẩu không khớp
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className={cx('change-btn')}
                    disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                    onClick={handleChangePassword}
                >
                    {isLoading ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}
                </button>
            </form>

            <div className={cx('password-tips')}>
                <h3>Mẹo bảo mật mật khẩu:</h3>
                <ul>
                    <li>✓ Sử dụng ít nhất 8 ký tự</li>
                    <li>✓ Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt</li>
                    <li>✓ Không sử dụng thông tin cá nhân dễ đoán</li>
                    <li>✓ Tránh sử dụng lại mật khẩu cũ</li>
                </ul>
            </div>
        </div>
    );
}

export default ChangePasswordForm;
