import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './AdminForm.module.scss';
import axios from 'axios';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faBirthdayCake, faPhone, faMapMarker, faIdCard, faCrown, faShieldAlt, faCogs, faDatabase } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function AdminForm() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [dateBirth, setDateBirth] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [idCard, setIdCard] = useState('');
    
    // Admin specific info
    const [adminLevel, setAdminLevel] = useState('');
    const [department, setDepartment] = useState('');
    const [permissions, setPermissions] = useState('');
    const [createdDate, setCreatedDate] = useState('');
    
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
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
                setPhone(userData.phone || '');
                setAddress(userData.addres || userData.address || '');
                setIdCard(userData.idCard || '');
                setCreatedDate(userData.createdDate ? new Date(userData.createdDate).toLocaleDateString('vi-VN') : '');
                // These would come from the admin-specific table/API
                setAdminLevel(userData.adminLevel || '3'); // Super Admin = 3, Admin = 2, etc.
                setDepartment(userData.department || '');
                setPermissions(userData.permissions || '');
            }
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu quản trị viên:', error);
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

    const renderInput = (icon, label, value, onChange, type = 'text', readOnly = false) => (
        <div className={cx('form-group')}>
            <label><FontAwesomeIcon icon={icon} /> {label}</label>
            <input 
                type={type} 
                value={value} 
                onChange={onChange}
                placeholder={label}
                readOnly={readOnly}
                disabled={readOnly}
            />
        </div>
    );

    const renderSelect = (icon, label, value, onChange, options, readOnly = false) => (
        <div className={cx('form-group')}>
            <label><FontAwesomeIcon icon={icon} /> {label}</label>
            <select value={value} onChange={onChange} disabled={readOnly}>
                <option value="">Chọn {label.toLowerCase()}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );

    return (
        <div className={cx('admin-form')}>
            {successMessage && <SuccessMessage message={successMessage} />}
            
            <div className={cx('form-header')}>
                <h1><FontAwesomeIcon icon={faCrown} /> Hồ Sơ Quản Trị Viên</h1>
                <p>Quản lý thông tin hệ thống và quyền truy cập</p>
            </div>

            <div className={cx('admin-stats')}>
                <div className={cx('stat-card', 'primary')}>
                    <FontAwesomeIcon icon={faShieldAlt} />
                    <div>
                        <p className={cx('label')}>Cấp Độ Quản Trị</p>
                        <p className={cx('value')}>{
                            adminLevel === '3' ? 'Super Admin' : 
                            adminLevel === '2' ? 'Admin' : 
                            'Quản Lý'
                        }</p>
                    </div>
                </div>
                <div className={cx('stat-card', 'success')}>
                    <FontAwesomeIcon icon={faDatabase} />
                    <div>
                        <p className={cx('label')}>Phòng Ban</p>
                        <p className={cx('value')}>{department || 'N/A'}</p>
                    </div>
                </div>
                <div className={cx('stat-card', 'info')}>
                    <FontAwesomeIcon icon={faCogs} />
                    <div>
                        <p className={cx('label')}>Ngày Tạo Tài Khoản</p>
                        <p className={cx('value')}>{createdDate}</p>
                    </div>
                </div>
            </div>

            <div className={cx('form-section')}>
                <h3><FontAwesomeIcon icon={faUser} /> Thông Tin Cá Nhân</h3>
                <div className={cx('form-grid')}>
                    {renderInput(faUser, 'Họ và Tên', fullName, (e) => setFullName(e.target.value), 'text')}
                    {renderInput(faEnvelope, 'Email', email, (e) => setEmail(e.target.value), 'email')}
                    {renderInput(faBirthdayCake, 'Ngày Sinh', dateBirth, (e) => setDateBirth(e.target.value), 'date')}
                    {renderInput(faPhone, 'Số Điện Thoại', phone, (e) => setPhone(e.target.value), 'tel')}
                </div>
            </div>

            <div className={cx('form-section')}>
                <h3><FontAwesomeIcon icon={faMapMarker} /> Thông Tin Liên Lạc</h3>
                <div className={cx('form-grid')}>
                    {renderInput(faMapMarker, 'Địa Chỉ', address, (e) => setAddress(e.target.value), 'text')}
                    {renderInput(faIdCard, 'CMND/CCCD', idCard, (e) => setIdCard(e.target.value), 'text')}
                </div>
            </div>

            <div className={cx('form-section', 'admin-section')}>
                <h3><FontAwesomeIcon icon={faShieldAlt} /> Phân Quyền Hệ Thống</h3>
                <div className={cx('info-box')}>
                    <p><strong>Cấp Độ Quản Trị:</strong> {
                        adminLevel === '3' ? 'Super Admin - Toàn quyền hệ thống' : 
                        adminLevel === '2' ? 'Admin - Quyền quản lý chính' : 
                        'Quản Lý - Quyền giới hạn'
                    }</p>
                    <p><strong>Phòng Ban:</strong> {department || 'Chưa xác định'}</p>
                    <p><strong>Quyền Truy Cập:</strong></p>
                    <ul className={cx('permissions-list')}>
                        <li>✔ Quản lý người dùng</li>
                        <li>✔ Quản lý sản phẩm & dịch vụ</li>
                        <li>✔ Quản lý đơn hàng</li>
                        <li>✔ Xem báo cáo thống kê</li>
                        <li>✔ Quản lý nhân viên</li>
                        <li>✔ Quản lý hệ thống</li>
                    </ul>
                </div>
                
                <div className={cx('warning-box')}>
                    <FontAwesomeIcon icon={faShieldAlt} />
                    <div>
                        <p><strong>Lưu Ý Bảo Mật</strong></p>
                        <p>Tài khoản quản trị viên có quyền truy cập cao. Vui lòng bảo mật mật khẩu và không chia sẻ thông tin đăng nhập.</p>
                    </div>
                </div>
            </div>

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

export default AdminForm;
