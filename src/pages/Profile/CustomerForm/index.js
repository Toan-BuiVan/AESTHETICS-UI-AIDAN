import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './CustomerForm.module.scss';
import axios from 'axios';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faBirthdayCake, faPhone, faMapMarker, faIdCard, faTrophy, faStar } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function CustomerForm() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [dateBirth, setDateBirth] = useState('');
    const [sex, setSex] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [idCard, setIdCard] = useState('');
    const [rankMember, setRankMember] = useState('');
    const [accumulatedPoints, setAccumulatedPoints] = useState(0);
    const [ratingPoints, setRatingPoints] = useState(0);
    const [referralCode, setReferralCode] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchCustomerData();
    }, []);

    const fetchCustomerData = async () => {
        const token = localStorage.getItem('token') || '';
        const userID = localStorage.getItem('userID') || '';
        const deviceName = localStorage.getItem('deviceName') || '';
        const refreshToken = localStorage.getItem('refreshToken') || '';

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

            let userData = response.data.data?.[0] || response.data[0];

            if (userData) {
                setFullName(userData.fullName || '');
                setEmail(userData.email || '');
                setDateBirth(userData.dateBirth ? new Date(userData.dateBirth).toISOString().split('T')[0] : '');
                setSex(userData.sex || '');
                setPhone(userData.phone || '');
                setAddress(userData.addres || userData.address || '');
                setIdCard(userData.idCard || '');
                setRankMember(userData.rankMember || 'Thành Viên Mới');
                setAccumulatedPoints(userData.accumulatedPoints || 0);
                setRatingPoints(userData.ratingPoints || 0);
                setReferralCode(userData.referralCode || '');
            }
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu khách hàng:', error);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        const token = localStorage.getItem('token') || '';
        const userID = localStorage.getItem('userID') || '';
        const deviceName = localStorage.getItem('deviceName') || '';
        const refreshToken = localStorage.getItem('refreshToken') || '';

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
            fullName,
            email,
            dateBirth: dateBirth ? new Date(dateBirth).toISOString() : null,
            sex,
            phone,
            addres: address,
            idCard,
        };

        try {
            const response = await fetch('http://localhost:5262/api/Users/Update_User', {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
            });

            const result = await response.json();
            setSuccessMessage(result.resposeMessage || 'Cập nhật thông tin thành công!');
            
            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
        } catch (error) {
            console.error('Lỗi khi cập nhật thông tin:', error);
            setSuccessMessage('Có lỗi xảy ra. Vui lòng thử lại!');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const renderInput = (icon, label, value, onChange, type = 'text', required = false) => (
        <div className={cx('form-group')}>
            <label><FontAwesomeIcon icon={icon} /> {label} {required && <span className={cx('required')}>*</span>}</label>
            <input 
                type={type} 
                value={value} 
                onChange={onChange}
                placeholder={label}
                required={required}
            />
        </div>
    );

    const renderSelect = (icon, label, value, onChange, options) => (
        <div className={cx('form-group')}>
            <label><FontAwesomeIcon icon={icon} /> {label}</label>
            <select value={value} onChange={onChange}>
                <option value="">Chọn {label.toLowerCase()}</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );

    return (
        <div className={cx('customer-form')}>
            {successMessage && <SuccessMessage message={successMessage} />}
            
            <div className={cx('form-header')}>
                <h1>Hồ Sơ Khách Hàng</h1>
                <p>Quản lý thông tin cá nhân để bảo mật tài khoản của bạn</p>
            </div>

            <div className={cx('stats-container')}>
                <div className={cx('stat-card')}>
                    <FontAwesomeIcon icon={faTrophy} />
                    <div>
                        <p className={cx('stat-value')}>{rankMember}</p>
                        <p className={cx('stat-label')}>Thứ Hạng</p>
                    </div>
                </div>
                <div className={cx('stat-card')}>
                    <FontAwesomeIcon icon={faStar} />
                    <div>
                        <p className={cx('stat-value')}>{accumulatedPoints}</p>
                        <p className={cx('stat-label')}>Điểm Tích Lũy</p>
                    </div>
                </div>
                <div className={cx('stat-card')}>
                    <FontAwesomeIcon icon={faStar} />
                    <div>
                        <p className={cx('stat-value')}>{ratingPoints}</p>
                        <p className={cx('stat-label')}>Điểm Mua Hàng</p>
                    </div>
                </div>
            </div>

            <div className={cx('form-section')}>
                <h3>Thông Tin Cơ Bản</h3>
                <div className={cx('form-grid')}>
                    {renderInput(faUser, 'Họ và Tên', fullName, (e) => setFullName(e.target.value), 'text', true)}
                    {renderInput(faEnvelope, 'Email', email, (e) => setEmail(e.target.value), 'email', true)}
                    {renderInput(faBirthdayCake, 'Ngày Sinh', dateBirth, (e) => setDateBirth(e.target.value), 'date')}
                    {renderSelect(faUser, 'Giới Tính', sex, (e) => setSex(e.target.value), ['Nam', 'Nữ', 'Khác'])}
                </div>
            </div>

            <div className={cx('form-section')}>
                <h3>Thông Tin Liên Hệ</h3>
                <div className={cx('form-grid')}>
                    {renderInput(faPhone, 'Số Điện Thoại', phone, (e) => setPhone(e.target.value), 'tel', true)}
                    {renderInput(faMapMarker, 'Địa Chỉ', address, (e) => setAddress(e.target.value), 'text')}
                    {renderInput(faIdCard, 'CMND/CCCD', idCard, (e) => setIdCard(e.target.value), 'text')}
                </div>
            </div>

            {referralCode && (
                <div className={cx('referral-section')}>
                    <h3>Mã Giới Thiệu</h3>
                    <div className={cx('referral-code')}>
                        <p>{referralCode}</p>
                        <button onClick={() => navigator.clipboard.writeText(referralCode)}>Sao Chép</button>
                    </div>
                </div>
            )}

            <div className={cx('form-actions')}>
                <button 
                    className={cx('save-btn')} 
                    onClick={handleSave}
                    disabled={isLoading}
                >
                    {isLoading ? 'Đang cập nhật...' : 'Lưu Thay Đổi'}
                </button>
            </div>
        </div>
    );
}

export default CustomerForm;
