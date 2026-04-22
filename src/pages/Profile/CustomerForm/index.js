import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './CustomerForm.module.scss';
import axios from 'axios';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';
import PaymentMethods from '../PaymentMethods';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faBirthdayCake, faPhone, faMapMarker, faIdCard, faTrophy, faStar, faShieldAlt, faBriefcase, faHome, faPlus, faCheck, faTrash, faEdit, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

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

    // Delivery Address States
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedWard, setSelectedWard] = useState('');
    const [streetAddress, setStreetAddress] = useState('');
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingWards, setLoadingWards] = useState(false);
    const [addingAddress, setAddingAddress] = useState(false);

    // Address List States
    const [addressList, setAddressList] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingAddresses, setLoadingAddresses] = useState(false);
    const PAGE_SIZE = 2;

    // Edit Address States
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [editFormData, setEditFormData] = useState({
        id: null,
        provinceId: '',
        provinceName: '',
        districtId: '',
        districtName: '',
        wardCode: '',
        wardName: '',
        detailAddress: '',
        isDefault: false
    });
    const [editingDistricts, setEditingDistricts] = useState([]);
    const [editingWards, setEditingWards] = useState([]);
    const [editingLoadingDistricts, setEditingLoadingDistricts] = useState(false);
    const [editingLoadingWards, setEditingLoadingWards] = useState(false);
    const [updatingAddress, setUpdatingAddress] = useState(false);

    useEffect(() => {
        fetchCustomerData();
        fetchProvinces();
        fetchAddressList(1);
    }, []);

    const fetchProvinces = async () => {
        setLoadingProvinces(true);
        try {
            const response = await axios.get('http://localhost:5122/api/GHN/provinces');
            if (response.data && response.data.data) {
                setProvinces(response.data.data);
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách tỉnh:', error);
        } finally {
            setLoadingProvinces(false);
        }
    };

    const fetchDistricts = async (provinceId) => {
        if (!provinceId) {
            setDistricts([]);
            return;
        }
        setLoadingDistricts(true);
        try {
            const response = await axios.get(`http://localhost:5122/api/GHN/districts/${provinceId}`);
            if (response.data && response.data.data) {
                setDistricts(response.data.data);
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách quận/huyện:', error);
        } finally {
            setLoadingDistricts(false);
        }
    };

    const fetchWards = async (districtId) => {
        if (!districtId) {
            setWards([]);
            return;
        }
        setLoadingWards(true);
        try {
            const response = await axios.get(`http://localhost:5122/api/GHN/wards/${districtId}`);
            if (response.data && response.data.data) {
                setWards(response.data.data);
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách phường/xã:', error);
        } finally {
            setLoadingWards(false);
        }
    };

    const handleProvinceChange = (e) => {
        const provinceId = e.target.value;
        setSelectedProvince(provinceId);
        setSelectedDistrict('');
        setSelectedWard('');
        setDistricts([]);
        setWards([]);
        if (provinceId) {
            fetchDistricts(provinceId);
        }
    };

    const handleDistrictChange = (e) => {
        const districtId = e.target.value;
        setSelectedDistrict(districtId);
        setSelectedWard('');
        setWards([]);
        if (districtId) {
            fetchWards(districtId);
        }
    };

    const handleAddAddress = async () => {
        // Validate all fields are filled
        if (!selectedProvince || !selectedDistrict || !selectedWard || !streetAddress.trim()) {
            setSuccessMessage('Vui lòng điền đầy đủ thông tin địa chỉ!');
            return;
        }

        setAddingAddress(true);
        const token = localStorage.getItem('token') || '';
        const customerId = localStorage.getItem('customerId');
        const refreshToken = localStorage.getItem('refreshToken') || '';

        // Get province and district information
        const selectedProvinceData = provinces.find(p => p.ProvinceID == selectedProvince);
        const selectedDistrictData = districts.find(d => d.DistrictID == selectedDistrict);
        const selectedWardData = wards.find(w => w.WardCode == selectedWard);

        const requestData = {
            customerId: parseInt(customerId),
            provinceId: parseInt(selectedProvince),
            provinceName: selectedProvinceData?.ProvinceName || '',
            districtId: parseInt(selectedDistrict),
            districtName: selectedDistrictData?.DistrictName || '',
            wardCode: selectedWard,
            wardName: selectedWardData?.WardName || '',
            detailAddress: streetAddress.trim(),
            isDefault: false
        };

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            'RefreshToken': refreshToken,
        };

        try {
            const response = await axios.post('http://localhost:5122/api/AddressInfo/create', requestData, { headers });
            
            const newAccessToken = response.headers['new-accesstoken'];
            const newRefreshToken = response.headers['new-refreshtoken'];
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            if (response.data && response.data.success) {
                setSuccessMessage('Thêm địa chỉ giao hàng thành công!');
                // Reset form
                setSelectedProvince('');
                setSelectedDistrict('');
                setSelectedWard('');
                setStreetAddress('');
                setDistricts([]);
                setWards([]);
            } else {
                setSuccessMessage('Thêm địa chỉ thất bại. Vui lòng thử lại!');
            }
        } catch (error) {
            console.error('Lỗi khi thêm địa chỉ:', error);
            setSuccessMessage('Có lỗi xảy ra. Vui lòng thử lại!');
        } finally {
            setAddingAddress(false);
            // Refresh address list after adding
            fetchAddressList(1);
        }
    };

    const fetchAddressList = async (pageNo = 1) => {
        setLoadingAddresses(true);
        const token = localStorage.getItem('token') || '';
        const customerId = localStorage.getItem('customerId');
        const refreshToken = localStorage.getItem('refreshToken') || '';

        if (!customerId) {
            setLoadingAddresses(false);
            return;
        }

        const requestData = {
            pageNo: pageNo,
            pageSize: PAGE_SIZE,
            customerId: parseInt(customerId)
        };

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            'RefreshToken': refreshToken,
        };

        try {
            const response = await axios.post('http://localhost:5122/api/AddressInfo/getlist', requestData, { headers });
            
            const newAccessToken = response.headers['new-accesstoken'];
            const newRefreshToken = response.headers['new-refreshtoken'];
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            if (response.data && response.data.baseDatas) {
                setAddressList(response.data.baseDatas);
                setCurrentPage(response.data.pageIndex || 1);
                setTotalPages(response.data.pageCount || 1);
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách địa chỉ:', error);
        } finally {
            setLoadingAddresses(false);
        }
    };

    const handleDeleteAddress = async (addressId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
            return;
        }

        const token = localStorage.getItem('token') || '';
        const refreshToken = localStorage.getItem('refreshToken') || '';

        const requestData = {
            addressId: addressId
        };

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            'RefreshToken': refreshToken,
        };

        try {
            const response = await axios.post('http://localhost:5122/api/AddressInfo/delete', requestData, { headers });
            
            const newAccessToken = response.headers['new-accesstoken'];
            const newRefreshToken = response.headers['new-refreshtoken'];
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            if (response.data && response.data.success) {
                setSuccessMessage('Xóa địa chỉ thành công!');
                fetchAddressList(currentPage);
            } else {
                setSuccessMessage('Xóa địa chỉ thất bại. Vui lòng thử lại!');
            }
        } catch (error) {
            console.error('Lỗi khi xóa địa chỉ:', error);
            setSuccessMessage('Có lỗi xảy ra. Vui lòng thử lại!');
        }
    };

    const handleEditAddress = (address) => {
        setEditingAddressId(address.id);
        setEditFormData({
            id: address.id,
            provinceId: address.provinceId,
            provinceName: address.provinceName,
            districtId: address.districtId,
            districtName: address.districtName,
            wardCode: address.wardCode,
            wardName: address.wardName,
            detailAddress: address.detailAddress,
            isDefault: address.isDefault
        });
        // Fetch districts for the province
        if (address.provinceId) {
            fetchEditingDistricts(address.provinceId);
            // Fetch wards for the district
            if (address.districtId) {
                fetchEditingWards(address.districtId);
            }
        }
    };

    const fetchEditingDistricts = async (provinceId) => {
        if (!provinceId) {
            setEditingDistricts([]);
            return;
        }
        setEditingLoadingDistricts(true);
        try {
            const response = await axios.get(`http://localhost:5122/api/GHN/districts/${provinceId}`);
            if (response.data && response.data.data) {
                setEditingDistricts(response.data.data);
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách quận/huyện:', error);
        } finally {
            setEditingLoadingDistricts(false);
        }
    };

    const fetchEditingWards = async (districtId) => {
        if (!districtId) {
            setEditingWards([]);
            return;
        }
        setEditingLoadingWards(true);
        try {
            const response = await axios.get(`http://localhost:5122/api/GHN/wards/${districtId}`);
            if (response.data && response.data.data) {
                setEditingWards(response.data.data);
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách phường/xã:', error);
        } finally {
            setEditingLoadingWards(false);
        }
    };

    const handleEditProvinceChange = (e) => {
        const provinceId = e.target.value;
        const selectedProvinceData = provinces.find(p => p.ProvinceID == provinceId);
        
        setEditFormData({
            ...editFormData,
            provinceId: provinceId,
            provinceName: selectedProvinceData?.ProvinceName || '',
            districtId: '',
            districtName: '',
            wardCode: '',
            wardName: ''
        });
        setEditingDistricts([]);
        setEditingWards([]);
        
        if (provinceId) {
            fetchEditingDistricts(provinceId);
        }
    };

    const handleEditDistrictChange = (e) => {
        const districtId = e.target.value;
        const selectedDistrictData = editingDistricts.find(d => d.DistrictID == districtId);
        
        setEditFormData({
            ...editFormData,
            districtId: districtId,
            districtName: selectedDistrictData?.DistrictName || '',
            wardCode: '',
            wardName: ''
        });
        setEditingWards([]);
        
        if (districtId) {
            fetchEditingWards(districtId);
        }
    };

    const handleEditWardChange = (e) => {
        const wardCode = e.target.value;
        const selectedWardData = editingWards.find(w => w.WardCode == wardCode);
        
        setEditFormData({
            ...editFormData,
            wardCode: wardCode,
            wardName: selectedWardData?.WardName || ''
        });
    };

    const handleUpdateAddress = async () => {
        if (!editFormData.provinceId || !editFormData.districtId || !editFormData.wardCode || !editFormData.detailAddress.trim()) {
            setSuccessMessage('Vui lòng điền đầy đủ thông tin địa chỉ!');
            return;
        }

        setUpdatingAddress(true);
        const token = localStorage.getItem('token') || '';
        const refreshToken = localStorage.getItem('refreshToken') || '';

        const requestData = {
            id: editFormData.id,
            provinceId: parseInt(editFormData.provinceId),
            provinceName: editFormData.provinceName,
            districtId: parseInt(editFormData.districtId),
            districtName: editFormData.districtName,
            wardCode: editFormData.wardCode,
            wardName: editFormData.wardName,
            detailAddress: editFormData.detailAddress.trim(),
            isDefault: editFormData.isDefault
        };

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            'RefreshToken': refreshToken,
        };

        try {
            const response = await axios.post('http://localhost:5122/api/AddressInfo/update', requestData, { headers });
            
            const newAccessToken = response.headers['new-accesstoken'];
            const newRefreshToken = response.headers['new-refreshtoken'];
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            if (response.data && response.data.success) {
                setSuccessMessage('Cập nhật địa chỉ thành công!');
                setEditingAddressId(null);
                setEditFormData({
                    id: null,
                    provinceId: '',
                    provinceName: '',
                    districtId: '',
                    districtName: '',
                    wardCode: '',
                    wardName: '',
                    detailAddress: '',
                    isDefault: false
                });
                fetchAddressList(currentPage);
            } else {
                setSuccessMessage('Cập nhật địa chỉ thất bại. Vui lòng thử lại!');
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật địa chỉ:', error);
            setSuccessMessage('Có lỗi xảy ra. Vui lòng thử lại!');
        } finally {
            setUpdatingAddress(false);
        }
    };

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

            <div className={cx('form-section')}>
                <h3>Thêm Địa Chỉ Nhận Hàng</h3>
                <div className={cx('form-grid')}>
                    {/* Province Select */}
                    <div className={cx('form-group')}>
                        <label>
                            <FontAwesomeIcon icon={faMapMarker} /> 
                            Tỉnh / Thành Phố
                            <span className={cx('required')}>*</span>
                        </label>
                        <select 
                            value={selectedProvince} 
                            onChange={handleProvinceChange}
                            disabled={loadingProvinces}
                        >
                            <option value="">
                                {loadingProvinces ? 'Đang tải...' : 'Chọn Tỉnh / Thành Phố'}
                            </option>
                            {provinces.map((province) => (
                                <option key={province.ProvinceID} value={province.ProvinceID}>
                                    {province.ProvinceName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* District Select */}
                    <div className={cx('form-group')}>
                        <label>
                            <FontAwesomeIcon icon={faMapMarker} /> 
                            Quận / Huyện
                            <span className={cx('required')}>*</span>
                        </label>
                        <select 
                            value={selectedDistrict} 
                            onChange={handleDistrictChange}
                            disabled={!selectedProvince || loadingDistricts}
                        >
                            <option value="">
                                {!selectedProvince ? 'Vui lòng chọn Tỉnh trước' : loadingDistricts ? 'Đang tải...' : 'Chọn Quận / Huyện'}
                            </option>
                            {districts.map((district) => (
                                <option key={district.DistrictID} value={district.DistrictID}>
                                    {district.DistrictName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Ward Select */}
                    <div className={cx('form-group')}>
                        <label>
                            <FontAwesomeIcon icon={faMapMarker} /> 
                            Phường / Xã
                            <span className={cx('required')}>*</span>
                        </label>
                        <select 
                            value={selectedWard} 
                            onChange={(e) => setSelectedWard(e.target.value)}
                            disabled={!selectedDistrict || loadingWards}
                        >
                            <option value="">
                                {!selectedDistrict ? 'Vui lòng chọn Quận trước' : loadingWards ? 'Đang tải...' : 'Chọn Phường / Xã'}
                            </option>
                            {wards.map((ward) => (
                                <option key={ward.WardCode} value={ward.WardCode}>
                                    {ward.WardName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Street Address Input */}
                    <div className={cx('form-group')}>
                        <label>
                            <FontAwesomeIcon icon={faHome} /> 
                            Địa Chỉ Chi Tiết
                            <span className={cx('required')}>*</span>
                        </label>
                        <input 
                            type="text" 
                            value={streetAddress} 
                            onChange={(e) => setStreetAddress(e.target.value)}
                            placeholder="Nhập số nhà, tên đường..."
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Display Selected Address Summary */}
            {selectedProvince && selectedDistrict && selectedWard && (
                <div className={cx('address-summary')}>
                    <div className={cx('address-summary-content')}>
                        <div>
                            <h4>Địa Chỉ Giao Hàng:</h4>
                            <p>
                                {streetAddress && `${streetAddress}, `}
                                {wards.find(w => w.WardCode == selectedWard)?.WardName},
                                {districts.find(d => d.DistrictID == selectedDistrict)?.DistrictName},
                                {provinces.find(p => p.ProvinceID == selectedProvince)?.ProvinceName}
                            </p>
                        </div>
                        <button 
                            className={cx('add-address-btn')}
                            onClick={handleAddAddress}
                            disabled={addingAddress}
                        >
                            <FontAwesomeIcon icon={addingAddress ? faCheck : faPlus} />
                            {addingAddress ? 'Đang thêm...' : 'Thêm Địa Chỉ'}
                        </button>
                    </div>
                </div>
            )}

            {/* Address List Section */}
            <div className={cx('form-section')}>
                <h3>Danh Sách Địa Chỉ Giao Hàng</h3>
                
                {loadingAddresses ? (
                    <p className={cx('loading-text')}>Đang tải danh sách địa chỉ...</p>
                ) : addressList.length === 0 ? (
                    <p className={cx('empty-text')}>Bạn chưa có địa chỉ giao hàng nào. Hãy thêm một địa chỉ!</p>
                ) : (
                    <>
                        <div className={cx('address-cards')}>
                            {addressList.map((addr) => (
                                <div key={addr.id} className={cx('address-card')}>
                                    <div className={cx('address-card-header')}>
                                        <div className={cx('address-location')}>
                                            <FontAwesomeIcon icon={faMapMarker} />
                                            <span className={cx('address-title')}>
                                                {addr.detailAddress}, {addr.wardName}, {addr.districtName}, {addr.provinceName}
                                            </span>
                                        </div>
                                        {addr.isDefault && (
                                            <span className={cx('default-badge')}>Mặc định</span>
                                        )}
                                    </div>
                                    {/* <div className={cx('address-info')}>
                                        <p><strong>Tỉnh/Thành phố:</strong> {addr.provinceName}</p>
                                        <p><strong>Quận/Huyện:</strong> {addr.districtName}</p>
                                        <p><strong>Phường/Xã:</strong> {addr.wardName}</p>
                                        <p><strong>Địa chỉ chi tiết:</strong> {addr.detailAddress}</p>
                                    </div> */}
                                    <div className={cx('address-actions')}>
                                        <button 
                                            className={cx('edit-btn')}
                                            onClick={() => handleEditAddress(addr)}
                                        >
                                            <FontAwesomeIcon icon={faEdit} /> Sửa
                                        </button>
                                        <button 
                                            className={cx('delete-btn')}
                                            onClick={() => handleDeleteAddress(addr.id)}
                                        >
                                            <FontAwesomeIcon icon={faTrash} /> Xóa
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className={cx('pagination')}>
                                <button
                                    className={cx('pagination-btn')}
                                    onClick={() => fetchAddressList(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} /> Trước
                                </button>
                                <span className={cx('pagination-info')}>
                                    Trang {currentPage} / {totalPages}
                                </span>
                                <button
                                    className={cx('pagination-btn')}
                                    onClick={() => fetchAddressList(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Sau <FontAwesomeIcon icon={faChevronRight} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Edit Address Modal */}
            {editingAddressId && (
                <div className={cx('edit-address-overlay')}>
                    <div className={cx('edit-address-modal')}>
                        <div className={cx('modal-header')}>
                            <h3>Chỉnh Sửa Địa Chỉ Giao Hàng</h3>
                            <button 
                                className={cx('modal-close')}
                                onClick={() => setEditingAddressId(null)}
                            >
                                ×
                            </button>
                        </div>

                        <div className={cx('modal-body')}>
                            <div className={cx('form-grid')}>
                                {/* Province Select */}
                                <div className={cx('form-group')}>
                                    <label>
                                        <FontAwesomeIcon icon={faMapMarker} /> 
                                        Tỉnh / Thành Phố
                                    </label>
                                    <select 
                                        value={editFormData.provinceId} 
                                        onChange={handleEditProvinceChange}
                                    >
                                        <option value="">Chọn Tỉnh / Thành Phố</option>
                                        {provinces.map((province) => (
                                            <option key={province.ProvinceID} value={province.ProvinceID}>
                                                {province.ProvinceName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* District Select */}
                                <div className={cx('form-group')}>
                                    <label>
                                        <FontAwesomeIcon icon={faMapMarker} /> 
                                        Quận / Huyện
                                    </label>
                                    <select 
                                        value={editFormData.districtId} 
                                        onChange={handleEditDistrictChange}
                                        disabled={!editFormData.provinceId || editingLoadingDistricts}
                                    >
                                        <option value="">
                                            {!editFormData.provinceId ? 'Vui lòng chọn Tỉnh trước' : editingLoadingDistricts ? 'Đang tải...' : 'Chọn Quận / Huyện'}
                                        </option>
                                        {editingDistricts.map((district) => (
                                            <option key={district.DistrictID} value={district.DistrictID}>
                                                {district.DistrictName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Ward Select */}
                                <div className={cx('form-group')}>
                                    <label>
                                        <FontAwesomeIcon icon={faMapMarker} /> 
                                        Phường / Xã
                                    </label>
                                    <select 
                                        value={editFormData.wardCode} 
                                        onChange={handleEditWardChange}
                                        disabled={!editFormData.districtId || editingLoadingWards}
                                    >
                                        <option value="">
                                            {!editFormData.districtId ? 'Vui lòng chọn Quận trước' : editingLoadingWards ? 'Đang tải...' : 'Chọn Phường / Xã'}
                                        </option>
                                        {editingWards.map((ward) => (
                                            <option key={ward.WardCode} value={ward.WardCode}>
                                                {ward.WardName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Street Address Input */}
                                <div className={cx('form-group')}>
                                    <label>
                                        <FontAwesomeIcon icon={faHome} /> 
                                        Địa Chỉ Chi Tiết
                                    </label>
                                    <input 
                                        type="text" 
                                        value={editFormData.detailAddress} 
                                        onChange={(e) => setEditFormData({...editFormData, detailAddress: e.target.value})}
                                        placeholder="Nhập số nhà, tên đường..."
                                    />
                                </div>

                                {/* Default Address Checkbox */}
                                <div className={cx('form-group', 'checkbox-group')}>
                                    <label>
                                        <input 
                                            type="checkbox" 
                                            checked={editFormData.isDefault}
                                            onChange={(e) => setEditFormData({...editFormData, isDefault: e.target.checked})}
                                        />
                                        <span>Đặt làm địa chỉ giao hàng mặc định</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className={cx('modal-footer')}>
                            <button 
                                className={cx('cancel-btn')}
                                onClick={() => setEditingAddressId(null)}
                            >
                                Hủy
                            </button>
                            <button 
                                className={cx('save-btn')}
                                onClick={handleUpdateAddress}
                                disabled={updatingAddress}
                            >
                                {updatingAddress ? 'Đang cập nhật...' : 'Lưu Thay Đổi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Methods Section */}
            <div style={{ marginTop: '40px', paddingTop: '40px', borderTop: '1px solid #E8E8E8' }}>
                <PaymentMethods />
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

export default CustomerForm;
