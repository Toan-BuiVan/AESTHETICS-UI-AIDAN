import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames/bind';
import styles from './StaffForm.module.scss';
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
    const [hasLoaded, setHasLoaded] = useState(false);
    
    // Store initial data for change detection
    const [initialData, setInitialData] = useState(null);
    
    // Get staffId from localStorage
    const staffId = localStorage.getItem('userID');

    // Helper function to build full image URL
    const getImageUrl = (imageValue) => {
        if (!imageValue) return '';
        // If already a full URL (starts with http), return as is
        if (imageValue.startsWith('http')) return imageValue;
        // If it's a base64 string, return as is
        if (imageValue.startsWith('data:')) return imageValue;
        // Otherwise, construct full URL from filename
        return `http://localhost:5122/Images/${imageValue}`;
    };

    const fetchStaffData = useCallback(async () => {
        const token = localStorage.getItem('token') || '';
        const refreshToken = localStorage.getItem('refreshToken') || '';

        if (!staffId || hasLoaded) return;

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            'RefreshToken': refreshToken,
        };

        try {
            const response = await fetch(
                `http://localhost:5122/api/Account/getprofileaccount?accountId=${staffId}`,
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
                const initialValues = {
                    fullName: userData.fullName || '',
                    email: userData.email || '',
                    dateBirth: userData.dateBirth ? new Date(userData.dateBirth).toISOString().split('T')[0] : '',
                    sex: userData.sex !== null && userData.sex !== undefined ? String(userData.sex) : '',
                    phone: userData.phone || '',
                    address: userData.address || '',
                    idCard: userData.idCard || '',
                    staffImage: userData.staffImage || '',
                    employmentStatus: userData.employmentStatus !== null && userData.employmentStatus !== undefined ? String(userData.employmentStatus) : '',
                    isDoctor: userData.isDoctor || false,
                    doctorLevel: userData.doctorLevel !== null && userData.doctorLevel !== undefined ? String(userData.doctorLevel) : '',
                    degree: userData.degree || '',
                    specialization: userData.specialization || '',
                    licenseNumber: userData.licenseNumber || '',
                    experienceYears: userData.experienceYears !== null && userData.experienceYears !== undefined ? String(userData.experienceYears) : '',
                    biography: userData.biography || '',
                };
                
                // Save initial data for change detection
                setInitialData(initialValues);
                
                setFullName(initialValues.fullName);
                setEmail(initialValues.email);
                setDateBirth(initialValues.dateBirth);
                setSex(initialValues.sex);
                setPhone(initialValues.phone);
                setAddress(initialValues.address);
                setIdCard(initialValues.idCard);
                setStaffImage(initialValues.staffImage);
                setEmploymentStatus(initialValues.employmentStatus);
                setIsDoctor(initialValues.isDoctor);
                setDoctorLevel(initialValues.doctorLevel);
                setDegree(initialValues.degree);
                setSpecialization(initialValues.specialization);
                setLicenseNumber(initialValues.licenseNumber);
                setExperienceYears(initialValues.experienceYears);
                setBiography(initialValues.biography);
                setHasLoaded(true);
            }
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu nhân viên:', error);
            setHasLoaded(true);
        }
    }, [staffId, hasLoaded]);

    useEffect(() => {
        fetchStaffData();
    }, [fetchStaffData]);

    // Helper to check if value changed and return new value or null
    const getChangedValue = (currentValue, initialValue, isNumeric = false) => {
        if (currentValue !== initialValue) {
            if (isNumeric) return currentValue ? parseInt(currentValue) : null;
            return currentValue || null;
        }
        return null;
    };

    const handleSave = async () => {
        setIsLoading(true);
        const token = localStorage.getItem('token') || '';
        const userID = localStorage.getItem('userID') || '';
        const deviceName = localStorage.getItem('deviceName') || '';
        const refreshToken = localStorage.getItem('refreshToken') || '';

        if (!userID || !initialData) return;

        const headers = {
            'Content-Type': 'application/json',
            DeviceName: deviceName,
            RefreshToken: refreshToken,
            Authorization: token ? `Bearer ${token}` : '',
            UserID: userID,
        };

        // Build data with only changed fields
        const data = {
            accountId: parseInt(userID),
            fullName: getChangedValue(fullName, initialData.fullName),
            email: getChangedValue(email, initialData.email),
            dateBirth: getChangedValue(dateBirth, initialData.dateBirth) ? new Date(dateBirth).toISOString() : null,
            sex: getChangedValue(sex, initialData.sex), // Keep as string, don't convert to int
            phone: getChangedValue(phone, initialData.phone),
            address: getChangedValue(address, initialData.address),
            idCard: getChangedValue(idCard, initialData.idCard),
            staffImage: getChangedValue(staffImage, initialData.staffImage),
            employmentStatus: getChangedValue(employmentStatus, initialData.employmentStatus),
            isDoctor: isDoctor !== initialData.isDoctor ? isDoctor : null,
        };

        if (isDoctor) {
            data.doctorLevel = getChangedValue(doctorLevel, initialData.doctorLevel, true);
            data.degree = getChangedValue(degree, initialData.degree);
            data.specialization = getChangedValue(specialization, initialData.specialization);
            data.licenseNumber = getChangedValue(licenseNumber, initialData.licenseNumber);
            data.experienceYears = getChangedValue(experienceYears, initialData.experienceYears, true);
            data.biography = getChangedValue(biography, initialData.biography);
        }

        try {
            const response = await fetch('http://localhost:5122/api/Staff/updatestaff', {
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

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setSuccessMessage('Vui lòng chọn file hình ảnh!');
                return;
            }

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                setSuccessMessage('Hình ảnh quá lớn (tối đa 5MB)!');
                return;
            }

            // Convert file to base64
            const reader = new FileReader();
            reader.onloadend = () => {
                setStaffImage(reader.result); // Store full base64 string
            };
            reader.readAsDataURL(file);
        }
    };

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
            <select value={value || ''} onChange={onChange}>
                {!value && <option value="">Chọn {label.toLowerCase()}</option>}
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

    const renderFileInput = (icon, label, value, onChange, required = false) => (
        <div className={cx('form-group')}>
            <label><FontAwesomeIcon icon={icon} /> {label} {required && <span className={cx('required')}>*</span>}</label>
            <div className={cx('file-input-wrapper')}>
                <input 
                    type="file" 
                    accept="image/*"
                    onChange={onChange}
                    required={required}
                />
                {value && (
                    <div className={cx('image-preview')}>
                        <img src={getImageUrl(value)} alt="Preview" />
                    </div>
                )}
            </div>
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
                <div className={cx('work-info-container')}>
                    {/* Left: Staff Image */}
                    <div className={cx('work-info-left')}>
                        {renderFileInput(faStethoscope, 'Hình Ảnh Nhân Viên', staffImage, handleImageUpload)}
                    </div>

                    {/* Right: Employment Status and Doctor Checkbox */}
                    <div className={cx('work-info-right')}>
                        {renderSelect(faBriefcase, 'Trạng Thái Việc Làm', employmentStatus, (e) => setEmploymentStatus(e.target.value), [
                            { value: '0', label: 'Hoạt Động' },
                            { value: '1', label: 'Thử Việc' },
                            { value: '2', label: 'Nghỉ Việc' },
                            { value: '3', label: 'Nghỉ Phép' }
                        ])}

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
