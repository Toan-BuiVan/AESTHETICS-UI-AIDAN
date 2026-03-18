import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './AccountForm.module.scss';
import axios from 'axios';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';

const cx = classNames.bind(styles);

function AccountForm() {
    const [email, setEmail] = useState('');
    const [dateBirth, setDateBirth] = useState('');
    const [sex, setSex] = useState('');
    const [phone, setPhone] = useState('');
    const [addres, setAddress] = useState('');
    const [idCard, setIdCard] = useState('');
    const [userName, setUserName] = useState('');
    const [rankMember, setRankMember] = useState('');
    const [accumulatedPoints, setAccumulatedPoints] = useState('');
    const [ratingPoints, setRatingPoints] = useState(''); 
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const storedUserName = localStorage.getItem('userName');
        if (storedUserName) {
            setUserName(storedUserName);
        } else {
            setUserName('Guest');
        }

        const fetchUserData = async () => {
            const deviceName = localStorage.getItem('deviceName') || '';
            const refreshToken = localStorage.getItem('refreshToken') || '';
            const token = localStorage.getItem('token') || '';
            const userID = localStorage.getItem('userID') || '';

            if (!userID) return;

            const headers = {
                'Content-Type': 'application/json',
                DeviceName: deviceName,
                RefreshToken: refreshToken,
                Authorization: token ? `Bearer ${token}` : '',
                UserID: userID,
            };

            try {
                const response = await axios.post(
                    'http://localhost:5262/api/Users/GetList_SearchUser',
                    { userID: parseInt(userID) },
                    { headers },
                );

                let userData;
                if (response.data.data) {
                    userData = response.data.data[0];
                } else if (Array.isArray(response.data)) {
                    userData = response.data[0];
                }

                if (userData) {
                    setEmail(userData.email || '');
                    setDateBirth(userData.dateBirth ? new Date(userData.dateBirth).toISOString().split('T')[0] : '');
                    setSex(userData.sex || '');
                    setPhone(userData.phone || '');
                    setAddress(userData.addres || '');
                    setIdCard(userData.idCard || '');
                    setRankMember(userData.rankMember || '');
                    setAccumulatedPoints(userData.accumulatedPoints || '');
                    setRatingPoints(userData.ratingPoints || ''); 
                }
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu người dùng:', error);
            }
        };

        fetchUserData();
    }, []);

    const handleSave = async () => {
        const deviceName = localStorage.getItem('deviceName') || '';
        const refreshToken = localStorage.getItem('refreshToken') || '';
        const token = localStorage.getItem('token') || '';
        const userID = localStorage.getItem('userID') || '';

        if (!userID) return;

        const headers = {
            'Content-Type': 'application/json',
            DeviceName: deviceName,
            RefreshToken: refreshToken,
            Authorization: token ? `Bearer ${token}` : '',
            UserID: userID,
        };

        const data = {
            userID: parseInt(userID),
            email,
            dateBirth: dateBirth ? new Date(dateBirth).toISOString() : null,
            sex,
            phone,
            addres,
            idCard,
        };

        try {
            const response = await fetch('http://localhost:5262/api/Users/Update_User', {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
            });

            const result = await response.json();
            setSuccessMessage(result.resposeMessage || 'Cập nhật thành công!');
            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
            if (!response.ok) {
                setSuccessMessage('Cập nhật thành công!');
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật thông tin:', error);
        }
    };

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const renderInput = (label, value, onChange, type = 'text') => {
        return (
            <div className={cx('form-group')}>
                <label>{label}</label>
                <input type={type} value={value} onChange={onChange} />
                {!value && (
                    <div className={cx('update-info')}>
                        <span>Cập nhật thông tin</span>
                    </div>
                )}
            </div>
        );
    };

    const renderSelect = (label, value, onChange, options) => {
        return (
            <div className={cx('form-group')}>
                <label>{label}</label>
                <select value={value} onChange={onChange}>
                    <option value="">Chọn giới tính</option>
                    {options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                {!value && (
                    <div className={cx('update-info')}>
                        <span>Cập nhật thông tin</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={cx('account-form')}>
            {successMessage && <SuccessMessage message={successMessage} />}
            <h2>Hồ Sơ Của Tôi</h2>
            <p>Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
            <div className={cx('form-group', 'fromName-tile')}>
                <label>Tên đăng nhập: </label>
                <p>{userName}</p>
                <label>Thứ Hạng: </label>
                <p>{rankMember || 'Chưa có thứ hạng'}</p>
                <label>Điểm Tích Lũy: </label>
                <p>{accumulatedPoints || '0'}</p>
                <label>Điểm Mua Hàng: </label>
                <p>{ratingPoints || '0'}</p> 
            </div>
            {renderInput(
                'Email - Vui Lòng Cập Nhật Email Để Nhận Thông Báo',
                email,
                (e) => setEmail(e.target.value),
                'email',
            )}
            {renderInput('Ngày sinh', dateBirth, (e) => setDateBirth(e.target.value), 'date')}
            {renderSelect('Giới tính', sex, (e) => setSex(e.target.value), ['Nam', 'Nữ', 'Khác'])}
            {renderInput('Số điện thoại', phone, (e) => setPhone(e.target.value))}
            {renderInput('Địa chỉ', addres, (e) => setAddress(e.target.value))}
            {renderInput('CMND/CCCD', idCard, (e) => setIdCard(e.target.value))}
            <button onClick={handleSave}>Lưu</button>
        </div>
    );
}

export default AccountForm;
