import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './CustomerForm.module.scss';
import axios from 'axios';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faBirthdayCake, faPhone, faMapMarker, faIdCard, faTrophy, faStar, faShieldAlt, faBriefcase } from '@fortawesome/free-solid-svg-icons';

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
    const [role, setRole] = useState(null);
    const [userName, setUserName] = useState('');
    const [creationDate, setCreationDate] = useState('');
    const [accountId, setAccountId] = useState(null);

    useEffect(() => {
        fetchCustomerData();
    }, []);

    const fetchCustomerData = async () => {
        const token = localStorage.getItem('token') || '';
        const customerId = localStorage.getItem('userID');
        const refreshToken = localStorage.getItem('refreshToken') || '';

        if (!customerId) return;

        setAccountId(customerId);

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            'RefreshToken': refreshToken,
        };

        try {
            const response = await fetch(
                `http://localhost:5122/api/Account/getprofileaccount?accountId=${customerId}`,
                { 
                    method: 'POST',
                    headers 
                }
            );

            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            const userData = await response.json();

            if (userData) {
                setFullName(userData.fullName || '');
                setEmail(userData.email || '');
                setDateBirth(userData.dateBirth ? new Date(userData.dateBirth).toISOString().split('T')[0] : '');
                setSex(userData.sex || '');
                setPhone(userData.phone || '');
                setAddress(userData.address || '');
                setIdCard(userData.idCard || '');
                setRankMember(userData.rankMember || 'Bronze');
                setAccumulatedPoints(userData.accumulatedPoints || 0);
                setRatingPoints(userData.ratingPoints || 0);
                setReferralCode(userData.referralCode || '');
                setRole(userData.role || 0);
                setUserName(userData.userName || '');
                setCreationDate(userData.creationDate ? new Date(userData.creationDate).toLocaleDateString('vi-VN') : '');
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

        // Prepare common data
        const commonData = {
            searchRequest: {}, // Required by updatestaff API
            accountId: parseInt(userID),
            fullName,
            email,
            dateBirth: dateBirth ? new Date(dateBirth).toISOString() : null,
            sex: sex ? parseInt(sex) : null, // Convert string to int (0=Nam, 1=Nữ, 2=Khác)
            phone,
            addres: address,
            idCard,
        };

        try {
            // Determine API endpoint and payload based on role
            let apiUrl, data;
            
            if (role === 0) {
                // Customer role - call updatecustomer API (no searchRequest needed)
                apiUrl = 'http://localhost:5122/api/Customer/updatecustomer';
                data = {
                    accountId: parseInt(userID),
                    fullName,
                    email,
                    dateBirth: dateBirth ? new Date(dateBirth).toISOString() : null,
                    sex: sex ? parseInt(sex) : null, // Convert string to int
                    phone,
                    address: address,
                    idCard,
                };
            } else if (role === 1 || role === 2) {
                // Staff or Admin role - call updatestaff API (requires searchRequest)
                apiUrl = 'http://localhost:5122/api/Staff/updatestaff';
                data = commonData;
            } else {
                // Fallback to updatestaff if role is undefined
                apiUrl = 'http://localhost:5122/api/Staff/updatestaff';
                data = commonData;
            }

            const response = await fetch(apiUrl, {
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
                <h1>Hồ Sơ Tài Khoản</h1>
                <p>Quản lý thông tin cá nhân để bảo mật tài khoản của bạn</p>
            </div>

            {/* Account Type & Role Badge */}
            <div className={cx('account-type-section')}>
                <div className={cx('role-badge', role === 0 ? 'customer' : 'staff')}>
                    <FontAwesomeIcon icon={role === 0 ? faUser : faBriefcase} />
                    <span>{role === 0 ? '👤 Khách Hàng' : role === 1 ? '💼 Nhân Viên' : '👨‍💼 Quản Lý'}</span>
                </div>
                <div className={cx('account-meta')}>
                    <div className={cx('meta-item')}>
                        <span className={cx('meta-label')}>ID Tài Khoản:</span>
                        <span className={cx('meta-value')}>{accountId}</span>
                    </div>
                    <div className={cx('meta-item')}>
                        <span className={cx('meta-label')}>Tên Đăng Nhập:</span>
                        <span className={cx('meta-value')}>{userName}</span>
                    </div>
                    <div className={cx('meta-item')}>
                        <span className={cx('meta-label')}>Ngày Tham Gia:</span>
                        <span className={cx('meta-value')}>{creationDate}</span>
                    </div>
                </div>
            </div>

            <div className={cx('stats-container')}>
                <div className={cx('stat-card')}>
                    <FontAwesomeIcon icon={faTrophy} />
                    <div>
                        <p className={cx('stat-value')}>{rankMember}</p>
                        <p className={cx('stat-label')}>Thứ Hạng Thành Viên</p>
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
                    {/* Sex select with numeric values */}
                    <div className={cx('form-group')}>
                        <label><FontAwesomeIcon icon={faUser} /> Giới Tính</label>
                        <select value={sex} onChange={(e) => setSex(e.target.value)}>
                            <option value="">Chọn giới tính</option>
                            <option value="0">Nam</option>
                            <option value="1">Nữ</option>
                            <option value="2">Khác</option>
                        </select>
                    </div>
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
