import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './ServicesPage.module.scss';
import classNames from 'classnames/bind';
import ItemServicesType from './ItemServicesType';
import { useDebounce } from '~/hooks';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import TextField from '@mui/material/TextField';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';

const cx = classNames.bind(styles);

function ServicesPage() {
    const [selectedPriceRanges, setSelectedPriceRanges] = useState([]);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [services, setServices] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedServices, setSelectedServices] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [bookingData, setBookingData] = useState({
        serviceIDs: [],
        userID: '',
        scheduledDate: null,
    });

    const debouncedSelectedPriceRanges = useDebounce(selectedPriceRanges, 300);
    const debouncedSelectedTypes = useDebounce(selectedTypes, 300);
    const debouncedBookingData = useDebounce(bookingData, 800);

    const priceRanges = [
        { id: 1, label: '1tr - 5tr', min: 1000000, max: 5000000 },
        { id: 2, label: '5tr - 10tr', min: 5000000, max: 10000000 },
        { id: 3, label: '10tr - 50tr', min: 10000000, max: 50000000 },
        { id: 4, label: 'Lớn hơn 50tr', min: 50000000, max: null },
    ];

    const handlePriceRangeChange = (rangeId) => {
        setSelectedPriceRanges((prev) => {
            if (prev.includes(rangeId)) {
                return prev.filter((id) => id !== rangeId);
            } else {
                return [...prev, rangeId];
            }
        });
    };

    useEffect(() => {
        const fetchServices = async () => {
            try {
                let minPriceToSend = null;
                let maxPriceToSend = null;

                if (debouncedSelectedPriceRanges.length > 0) {
                    const selectedRanges = priceRanges.filter((range) =>
                        debouncedSelectedPriceRanges.includes(range.id),
                    );
                    const minPrices = selectedRanges.map((range) => range.min);
                    const maxPrices = selectedRanges.map((range) => range.max || Infinity);
                    minPriceToSend = Math.min(...minPrices);
                    maxPriceToSend = Math.max(...maxPrices);
                    if (maxPriceToSend === Infinity) maxPriceToSend = null;
                }

                const productsOfServicesNameToSend =
                    debouncedSelectedTypes.length > 0 ? debouncedSelectedTypes.join(',') : null;

                const response = await axios.post('http://localhost:5262/api/Servicess/GetSortedPagedServicess', {
                    pageIndex: currentPage,
                    pageSize: 10,
                    minPrice: minPriceToSend,
                    maxPrice: maxPriceToSend,
                    productsOfServicesName: productsOfServicesNameToSend,
                });

                let servicesData;
                let countServices;

                if (Array.isArray(response.data)) {
                    servicesData = response.data;
                    countServices = servicesData.length;
                } else if (response.data && typeof response.data === 'object') {
                    servicesData = response.data.data || [];
                    countServices = response.data.countServices || 0;
                } else {
                    servicesData = [];
                    countServices = 0;
                }

                setServices(Array.isArray(servicesData) ? servicesData : []);
                setTotalPages(Math.ceil(countServices / 10));
            } catch (error) {
                console.error('Error fetching services:', error);
                setServices([]);
                setTotalPages(1);
            }
        };
        fetchServices();
    }, [debouncedSelectedPriceRanges, debouncedSelectedTypes, currentPage]);

    useEffect(() => {
        const userID = localStorage.getItem('userID') || '';
        setBookingData((prevData) => ({
            ...prevData,
            userID: userID,
        }));
    }, []);

    useEffect(() => {
        if (
            debouncedBookingData.serviceIDs.length > 0 &&
            debouncedBookingData.scheduledDate &&
            debouncedBookingData.userID
        ) {
            callInsertBookingAPI(debouncedBookingData);
        }
    }, [debouncedBookingData]);

    const callInsertBookingAPI = async (data) => {
        const deviceName = localStorage.getItem('deviceName') || '';
        const refreshToken = localStorage.getItem('refreshToken') || '';
        const token = localStorage.getItem('token') || '';

        const headers = {
            'Content-Type': 'application/json',
            DeviceName: deviceName,
            RefreshToken: refreshToken,
            Authorization: token ? `Bearer ${token}` : '',
            UserID: data.userID,
        };

        try {
            const response = await fetch('http://localhost:5262/api/Bookings/Insert_Booking', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    serviceIDs: data.serviceIDs,
                    userID: data.userID,
                    scheduledDate: data.scheduledDate.toISOString(),
                }),
            });

            const responseData = await response.json();
            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');

            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            setSuccessMessage(responseData.resposeMessage);
            setTimeout(() => {
                setSuccessMessage(null);
            }, 2000);
        } catch (error) {
            setSuccessMessage(error.message || 'Có lỗi xảy ra khi gửi đánh giá');
            setTimeout(() => {
                setSuccessMessage(null);
            }, 2000);
        }
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const getPaginationItems = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    const handleCheckboxChange = (serviceID) => {
        setSelectedServices((prev) => {
            const updatedServices = prev.includes(serviceID)
                ? prev.filter((id) => id !== serviceID)
                : [...prev, serviceID];
            setBookingData((prevData) => ({
                ...prevData,
                serviceIDs: updatedServices,
            }));
            return updatedServices;
        });
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setBookingData((prevData) => ({
            ...prevData,
            scheduledDate: date,
        }));
    };

    return (
        <div className={cx('wrapper')}>
            {successMessage && <SuccessMessage message={successMessage} />}
            <div className={cx('sideBar')}>
                <h2 className={cx('khoangGia')}>Khoảng Giá</h2>
                <ul>
                    {priceRanges.map((range) => (
                        <li key={range.id} className={cx('menuItem')}>
                            <label className={cx('label')}>
                                <input
                                    type="checkbox"
                                    className={cx('checkbox')}
                                    checked={selectedPriceRanges.includes(range.id)}
                                    onChange={() => handlePriceRangeChange(range.id)}
                                />
                                <span className={cx('text')}>{range.label}</span>
                            </label>
                        </li>
                    ))}
                </ul>
                <h2 className={cx('khoangGia')}>Loại Dịch Vụ</h2>
                <ItemServicesType onSelectTypes={setSelectedTypes} />
            </div>
            <div className={cx('contentSevices')}>
                <div className={cx('headers')}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <MuiDatePicker
                            label="Đặt Lịch"
                            value={selectedDate}
                            onChange={handleDateChange}
                            minDate={new Date()}
                            renderInput={(params) => <TextField {...params} />}
                        />
                    </LocalizationProvider>
                </div>
                <table className={cx('services-table')}>
                    <thead>
                        <tr>
                            <th>Mã</th>
                            <th>Tên Dịch Vụ</th>
                            <th>Giá Dịch Vụ</th>
                            <th>Mô Tả</th>
                            <th>Chọn</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.length > 0 ? (
                            services.map((service) => (
                                <tr key={service.serviceID}>
                                    <td>{service.serviceID}</td>
                                    <td>{service.serviceName}</td>
                                    <td>{service.priceService.toLocaleString('vi-VN')} VNĐ</td>
                                    <td>{service.description}</td>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedServices.includes(service.serviceID)}
                                            onChange={() => handleCheckboxChange(service.serviceID)}
                                        />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6">Không có dịch vụ nào để hiển thị.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div className={cx('pagination')}>
                    {getPaginationItems().map((page, index) =>
                        page === '...' ? (
                            <span key={`ellipsis-${index}`} className={cx('ellipsis')}>
                                ...
                            </span>
                        ) : (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={currentPage === page ? cx('activePage') : ''}
                            >
                                {page}
                            </button>
                        ),
                    )}
                </div>
            </div>
        </div>
    );
}

export default ServicesPage;
