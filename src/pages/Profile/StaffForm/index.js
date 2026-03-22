import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './StaffForm.module.scss';
import axios from 'axios';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faBirthdayCake, faPhone, faMapMarker, faIdCard, faBriefcase, faStethoscope, faAward, faGraduationCap } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function StaffForm() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [dateBirth, setDateBirth] = useState('');
    const [sex, setSex] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [idCard, setIdCard] = useState('');
    const [staffImage, setStaffImage] = useState('');
    const [isDoctor, setIsDoctor] = useState(false);
    const [employmentStatus, setEmploymentStatus] = useState('');
    
    // Doctor specific fields
    const [doctorLevel, setDoctorLevel] = useState('');
    const [degree, setDegree] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [experienceYears, setExperienceYears] = useState('');
    const [biography, setBiography] = useState('');
    
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchStaffData();
    }, []);

    const fetchStaffData = async () => {
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
                setStaffImage(userData.staffImage || '');
                setIsDoctor(userData.isDoctor || false);
                setEmploymentStatus(userData.employmentStatus || '0');
                setDoctorLevel(userData.doctorLevel || '');
                setDegree(userData.degree || '');
                setSpecialization(userData.specialization || '');
                setLicenseNumber(userData.licenseNumber || '');
                setExperienceYears(userData.experienceYears || '');
                setBiography(userData.biography || '');
            }
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu nhân viên:', error);
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
            staffImage,
            isDoctor,
            employmentStatus: parseInt(employmentStatus),
        };

        if (isDoctor) {
            data.doctorLevel = parseInt(doctorLevel);
            data.degree = degree;
            data.specialization = specialization;
            data.licenseNumber = licenseNumber;
            data.experienceYears = parseInt(experienceYears) || 0;
            data.biography = biography;
        }

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
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );

    const renderTextarea = (icon, label, value, onChange) => (
        <div className={cx('form-group', 'full-width')}>
            <label><FontAwesomeIcon icon={icon} /> {label}</label>
            <textarea 
                value={value} 
                onChange={onChange}
                placeholder={label}
                rows="5"
            />
        </div>
    );

    return (
        <div className={cx('staff-form')}>
            {successMessage && <SuccessMessage message={successMessage} />}
            
            <div className={cx('form-header')}>
                <h1>Hồ Sơ Nhân Viên</h1>
                <p>Quản lý thông tin cá nhân và chuyên môn của bạn</p>
            </div>

            <div className={cx('form-section')}>
                <h3><FontAwesomeIcon icon={faUser} /> Thông Tin Cơ Bản</h3>
                <div className={cx('form-grid')}>
                    {renderInput(faUser, 'Họ và Tên', fullName, (e) => setFullName(e.target.value), 'text', true)}
                    {renderInput(faEnvelope, 'Email', email, (e) => setEmail(e.target.value), 'email', true)}
                    {renderInput(faBirthdayCake, 'Ngày Sinh', dateBirth, (e) => setDateBirth(e.target.value), 'date')}
                    {renderSelect(faUser, 'Giới Tính', sex, (e) => setSex(e.target.value), [
                        { value: '0', label: 'Nam' },
                        { value: '1', label: 'Nữ' },
                        { value: '2', label: 'Khác' }
                    ])}
                </div>
            </div>

            <div className={cx('form-section')}>
                <h3><FontAwesomeIcon icon={faPhone} /> Thông Tin Liên Hệ</h3>
                <div className={cx('form-grid')}>
                    {renderInput(faPhone, 'Số Điện Thoại', phone, (e) => setPhone(e.target.value), 'tel', true)}
                    {renderInput(faMapMarker, 'Địa Chỉ', address, (e) => setAddress(e.target.value), 'text')}
                    {renderInput(faIdCard, 'CMND/CCCD', idCard, (e) => setIdCard(e.target.value), 'text')}
                </div>
            </div>

            <div className={cx('form-section')}>
                <h3><FontAwesomeIcon icon={faBriefcase} /> Thông Tin Công Việc</h3>
                <div className={cx('form-grid')}>
                    {renderSelect(faBriefcase, 'Trạng Thái Việc Làm', employmentStatus, (e) => setEmploymentStatus(e.target.value), [
                        { value: '0', label: 'Hoạt Động' },
                        { value: '1', label: 'Thử Việc' },
                        { value: '2', label: 'Nghỉ Việc' },
                        { value: '3', label: 'Nghỉ Phép' }
                    ])}
                    {renderInput(faStethoscope, 'Hình Ảnh Nhân Viên (URL)', staffImage, (e) => setStaffImage(e.target.value), 'url')}
                </div>

                <div className={cx('checkbox-group')}>
                    <input 
                        type="checkbox" 
                        id="isDoctor" 
                        checked={isDoctor} 
                        onChange={(e) => setIsDoctor(e.target.checked)}
                    />
                    <label htmlFor="isDoctor">Là Bác Sĩ / Chuyên Viên Y Tế</label>
                </div>
            </div>

            {isDoctor && (
                <div className={cx('form-section', 'doctor-section')}>
                    <h3><FontAwesomeIcon icon={faStethoscope} /> Thông Tin Bác Sĩ</h3>
                    <div className={cx('form-grid')}>
                        {renderSelect(faStethoscope, 'Cấp Độ Chuyên Viên', doctorLevel, (e) => setDoctorLevel(e.target.value), [
                            { value: '0', label: 'Y Tá' },
                            { value: '1', label: 'Bác Sĩ' }
                        ])}
                        {renderInput(faGraduationCap, 'Bằng Cấp', degree, (e) => setDegree(e.target.value), 'text')}
                        {renderInput(faAward, 'Chuyên Khoa', specialization, (e) => setSpecialization(e.target.value), 'text')}
                        {renderInput(faAward, 'Số Giấy Phép Hành Nghề', licenseNumber, (e) => setLicenseNumber(e.target.value), 'text')}
                        {renderInput(faAward, 'Năm Kinh Nghiệm', experienceYears, (e) => setExperienceYears(e.target.value), 'number')}
                    </div>
                    {renderTextarea(faUser, 'Tiểu Sử / Giới Thiệu', biography, (e) => setBiography(e.target.value))}
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

export default StaffForm;
