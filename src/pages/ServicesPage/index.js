import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './ServicesPage.module.scss';
import classNames from 'classnames/bind';
import ServicePackageCard from './ServicePackageCard';
import DoctorCard from './DoctorCard';
import BookingSummary from './BookingSummary';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import TextField from '@mui/material/TextField';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faTimes } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

const MOCK_DOCTORS = [
    {
        doctorID: 1,
        doctorName: 'Dr. Nguyễn Thị Hoa',
        specialty: 'Bác sĩ Da liễu',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        rating: 4.8,
        reviews: 245,
        experience: 12,
    },
    {
        doctorID: 2,
        doctorName: 'Dr. Trần Văn Hùng',
        specialty: 'Bác sĩ Thẩm mỹ',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        rating: 4.7,
        reviews: 180,
        experience: 10,
    },
    {
        doctorID: 3,
        doctorName: 'Dr. Phạm Minh Tú',
        specialty: 'Chuyên gia Massage',
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
        rating: 4.9,
        reviews: 320,
        experience: 15,
    },
    {
        doctorID: 4,
        doctorName: 'Dr. Đặng Thị Linh',
        specialty: 'Bác sĩ Chăm sóc da',
        image: 'https://images.unsplash.com/photo-1517841905240-472988bababb?w=400&h=400&fit=crop',
        rating: 4.6,
        reviews: 156,
        experience: 8,
    },
];

const APPOINTMENT_TIMES = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30'
];

function ServicesPage() {
    const [services, setServices] = useState([]);
    const [doctors, setDoctors] = useState(MOCK_DOCTORS);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [filteredServices, setFilteredServices] = useState([]);
    const [serviceType, setServiceType] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const response = await axios.post(
                'http://localhost:5262/api/Servicess/GetSortedPagedServicess',
                {
                    pageIndex: 1,
                    pageSize: 20,
                    minPrice: null,
                    maxPrice: null,
                    productsOfServicesName: null,
                }
            );

            let servicesData = [];
            if (Array.isArray(response.data)) {
                servicesData = response.data;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                servicesData = response.data.data;
            }

            setServices(servicesData);
            setFilteredServices(servicesData);
        } catch (error) {
            console.error('Error fetching services:', error);
            setServices([]);
            setFilteredServices([]);
        }
    };

    const handleServiceTypeFilter = (type) => {
        setServiceType(type);
        if (type === 'all') {
            setFilteredServices(services);
        } else if (type === 'single') {
            setFilteredServices(services.filter(s => !s.isCourse));
        } else {
            setFilteredServices(services.filter(s => s.isCourse));
        }
    };

    const handleBooking = async () => {
        if (!selectedService || !selectedDoctor || !selectedDate || !selectedTime) {
            setSuccessMessage('⚠️ Vui lòng chọn đầy đủ thông tin');
            return;
        }

        setIsLoading(true);

        try {
            const userID = localStorage.getItem('userID') || '';
            const deviceName = localStorage.getItem('deviceName') || '';
            const refreshToken = localStorage.getItem('refreshToken') || '';
            const token = localStorage.getItem('token') || '';

            const bookingDate = new Date(selectedDate);
            const [hours, minutes] = selectedTime.split(':');
            bookingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const headers = {
                'Content-Type': 'application/json',
                DeviceName: deviceName,
                RefreshToken: refreshToken,
                Authorization: token ? `Bearer ${token}` : '',
                UserID: userID,
            };

            const response = await fetch('http://localhost:5262/api/Bookings/Insert_Booking', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    serviceIDs: [selectedService.serviceID],
                    userID: userID,
                    scheduledDate: bookingDate.toISOString(),
                    doctorID: selectedDoctor.doctorID,
                }),
            });

            const responseData = await response.json();
            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');

            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            setSuccessMessage('✓ Đặt lịch khám thành công! Bác sĩ sẽ xác nhận trong vòng 2 giờ.');
            setTimeout(() => {
                setSelectedService(null);
                setSelectedDoctor(null);
                setSelectedDate(null);
                setSelectedTime(null);
                setSuccessMessage(null);
            }, 3000);
        } catch (error) {
            setSuccessMessage('❌ ' + (error.message || 'Có lỗi xảy ra khi đặt lịch'));
            console.error('Booking error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cx('wrapper')}>
            {successMessage && <SuccessMessage message={successMessage} />}

            <div className={cx('hero')}>
                <div className={cx('heroContent')}>
                    <h1>Đặt Lịch Khám Chuyên Môn</h1>
                    <p>Chọn dịch vụ, bác sĩ và thời gian phù hợp với bạn</p>
                </div>
            </div>

            <div className={cx('container')}>
                {/* LEFT SIDE - Services and Doctors */}
                <div className={cx('mainContent')}>
                    {/* Service Type Filter */}
                    <div className={cx('filterSection')}>
                        <div className={cx('filterHeader')}>
                            <FontAwesomeIcon icon={faFilter} />
                            <span>Loại Dịch Vụ</span>
                            {showFilters && (
                                <button
                                    className={cx('closeBtn')}
                                    onClick={() => setShowFilters(false)}
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            )}
                        </div>

                        <div className={cx('filterButtons')}>
                            <button
                                className={cx('filterBtn', { active: serviceType === 'all' })}
                                onClick={() => handleServiceTypeFilter('all')}
                            >
                                Tất Cả
                            </button>
                            <button
                                className={cx('filterBtn', { active: serviceType === 'single' })}
                                onClick={() => handleServiceTypeFilter('single')}
                            >
                                Dịch Vụ Đơn Lẻ
                            </button>
                            <button
                                className={cx('filterBtn', { active: serviceType === 'package' })}
                                onClick={() => handleServiceTypeFilter('package')}
                            >
                                Gói Liệu Trình
                            </button>
                        </div>
                    </div>

                    {/* Services Grid */}
                    <section className={cx('section')}>
                        <div className={cx('sectionHeader')}>
                            <h2>Chọn Dịch Vụ</h2>
                            <span className={cx('count')}>
                                {filteredServices.length} dịch vụ
                            </span>
                        </div>

                        <div className={cx('servicesGrid')}>
                            {filteredServices.length > 0 ? (
                                filteredServices.map((service) => (
                                    <ServicePackageCard
                                        key={service.serviceID}
                                        service={service}
                                        isSelected={selectedService?.serviceID === service.serviceID}
                                        onSelect={setSelectedService}
                                        isPackage={service.isCourse}
                                    />
                                ))
                            ) : (
                                <div className={cx('emptyState')}>
                                    <p>Không có dịch vụ nào phù hợp</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Doctors Section */}
                    <section className={cx('section')}>
                        <div className={cx('sectionHeader')}>
                            <h2>Chọn Bác Sĩ</h2>
                            <span className={cx('count')}>{doctors.length} bác sĩ</span>
                        </div>

                        <div className={cx('doctorsGrid')}>
                            {doctors.map((doctor) => (
                                <DoctorCard
                                    key={doctor.doctorID}
                                    doctor={doctor}
                                    isSelected={selectedDoctor?.doctorID === doctor.doctorID}
                                    onSelect={setSelectedDoctor}
                                />
                            ))}
                        </div>
                    </section>

                    {/* Date and Time Selection */}
                    <section className={cx('section')}>
                        <div className={cx('sectionHeader')}>
                            <h2>Chọn Ngày và Giờ</h2>
                        </div>

                        <div className={cx('dateTimeContainer')}>
                            <div className={cx('datePickerWrapper')}>
                                <label>Ngày Khám</label>
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <MuiDatePicker
                                        value={selectedDate}
                                        onChange={(date) => setSelectedDate(date)}
                                        minDate={new Date()}
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                            },
                                        }}
                                    />
                                </LocalizationProvider>
                            </div>

                            {selectedDate && (
                                <div className={cx('timeSlots')}>
                                    <label>Giờ Khám</label>
                                    <div className={cx('slotsGrid')}>
                                        {APPOINTMENT_TIMES.map((time) => (
                                            <button
                                                key={time}
                                                className={cx('timeSlot', {
                                                    selected: selectedTime === time,
                                                })}
                                                onClick={() => setSelectedTime(time)}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* RIGHT SIDE - Booking Summary */}
                <div className={cx('sidebar')}>
                    <BookingSummary
                        selectedService={selectedService}
                        selectedDoctor={selectedDoctor}
                        selectedDate={selectedDate}
                        selectedTime={selectedTime}
                        onBooking={handleBooking}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    );
}

export default ServicesPage;
