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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faTimes, faCheckCircle, faClock, faCalendarAlt, faGift, faStar, faUsers, faFlask, faUserMd, faArrowRight, faSearch, faTrophy, faBriefcase, faTrash, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

const APPOINTMENT_TIMES = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30'
];

function ServicesPage() {
    const [services, setServices] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [filteredServices, setFilteredServices] = useState([]);
    const [serviceType, setServiceType] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [customerTreatmentPlans, setCustomerTreatmentPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(false);
    const [selectedSessions, setSelectedSessions] = useState({}); // { planIndex: [sessionIds] }
    const [treatmentBooking, setTreatmentBooking] = useState({ 
        planIndex: null, 
        planData: null, 
        sessionIds: [], 
        sessionDates: {}, 
        doctorId: null 
    });
    const [bookingDoctor, setBookingDoctor] = useState(null);
    const [expandedSessionKey, setExpandedSessionKey] = useState(null);
    const [inlineBookings, setInlineBookings] = useState({}); // { sessionKey: { planIndex, sessionIndex, date, time, planName, sessionNumber, sessionName } }
    const [selectedTreatmentSessions, setSelectedTreatmentSessions] = useState([]); // Array of { planIndex, sessionIndex, planName, sessionNumber, sessionName }
    const [deleteConfirmation, setDeleteConfirmation] = useState({ open: false, sessionId: null, sessionNumber: null });

    useEffect(() => {
        fetchCustomerTreatmentPlans();
    }, []);

    // Monitor selected sessions and reset doctor if not eligible
    useEffect(() => {
        if (selectedDoctor && selectedTreatmentSessions.length > 0) {
            // Get eligible service type IDs from selected sessions
            const eligibleIds = new Set();
            selectedTreatmentSessions.forEach(session => {
                const plan = customerTreatmentPlans[session.planIndex];
                if (plan?.serviceInformation?.serviceTypeId) {
                    eligibleIds.add(plan.serviceInformation.serviceTypeId);
                }
            });

            // Check if selected doctor's serviceTypeId is in eligible list
            const isEligible = Array.from(eligibleIds).includes(selectedDoctor.serviceTypeId);
            if (!isEligible) {
                setSelectedDoctor(null);
            }
        }
    }, [selectedTreatmentSessions, customerTreatmentPlans]);

    const fetchDoctors = async (serviceTypeIds) => {
        try {
            if (!serviceTypeIds || serviceTypeIds.length === 0) {
                setDoctors([]);
                return;
            }

            // Fetch doctors for each service type ID and combine results
            const doctorMap = new Map();

            for (const serviceTypeId of serviceTypeIds) {
                try {
                    const response = await axios.post(
                        'http://localhost:5122/api/Staff/get-list',
                        {
                            isDoctor: true,
                            servicetypeId: serviceTypeId
                        }
                    );

                    // API returns { baseDatas: [...], totalRecordCount, pageIndex, pageCount }
                    if (response.data?.baseDatas && Array.isArray(response.data.baseDatas)) {
                        response.data.baseDatas.forEach(doctor => {
                            if (!doctorMap.has(doctor.id)) {
                                // Map API response to expected format
                                const doctorName = doctor.fullName || 'Bác sĩ chuyên khoa';
                                const formattedDoctor = {
                                    staffId: doctor.id,
                                    doctorID: doctor.id, // For backward compatibility
                                    doctorName: doctorName,
                                    image: doctor.staffImage || 'https://via.placeholder.com/200?text=Doctor',
                                    specialty: doctor.specialization || 'Bác sĩ chuyên khoa',
                                    rating: 4.8, // Default rating
                                    reviews: 120, // Default reviews count
                                    experience: doctor.experienceYears || 8,
                                    email: '',
                                    phone: doctor.phone || '',
                                    degree: doctor.degree || '',
                                    licenseNumber: doctor.licenseNumber || '',
                                    biography: doctor.biography || '',
                                    serviceTypeId: serviceTypeId, // ← Track which service type this doctor belongs to
                                    // Keep original data as well
                                    ...doctor
                                };
                                doctorMap.set(doctor.id, formattedDoctor);
                                console.log('Formatted doctor:', formattedDoctor);
                            }
                        });
                    }
                } catch (error) {
                    console.error(`Lỗi khi lấy danh sách bác sĩ cho serviceTypeId ${serviceTypeId}:`, error);
                }
            }

            setDoctors(Array.from(doctorMap.values()));
            console.log('All doctors fetched and formatted:', Array.from(doctorMap.values()));
        } catch (error) {
            console.error('Lỗi trong fetchDoctors:', error);
            setDoctors([]);
        }
    };

    const fetchCustomerTreatmentPlans = async () => {
        try {
            setLoadingPlans(true);
            // Get customerId from localStorage (CustomerId or fallback to StaffId)
            let customerId = parseInt(localStorage.getItem('customerId') || 0);
            const staffId = parseInt(localStorage.getItem('staffId') || 0);
            
            if (!customerId || customerId === 0) {
                customerId = staffId;
            }

            if (!customerId || customerId === 0) {
                console.log('No customerId found');
                setCustomerTreatmentPlans([]);
                return;
            }

            const response = await axios.post(
                'http://localhost:5122/api/CustomerTreatmentPlans/getcustomertreatmentplanlist',
                {
                    customerId: customerId
                }
            );

            console.log('Customer treatment plans response:', response.data);

            if (response.data?.baseDatas && Array.isArray(response.data.baseDatas)) {
                // Remove duplicates based on customerTreatmentPlanInformation ID
                const uniquePlans = Array.from(
                    new Map(response.data.baseDatas.map(plan => [plan.customerTreatmentPlanInformation?.id, plan])).values()
                );
                setCustomerTreatmentPlans(uniquePlans);
                
                // Extract unique serviceTypeIds from serviceInformation
                const serviceTypeIds = [...new Set(
                    uniquePlans
                        .map(plan => plan.serviceInformation?.serviceTypeId)
                        .filter(id => id !== undefined && id !== null)
                )];
                
                // Fetch doctors based on serviceTypeIds
                if (serviceTypeIds.length > 0) {
                    fetchDoctors(serviceTypeIds);
                } else {
                    setDoctors([]);
                }
            } else {
                setCustomerTreatmentPlans([]);
                setDoctors([]);
            }
        } catch (error) {
            console.error('Error fetching customer treatment plans:', error);
            setCustomerTreatmentPlans([]);
        } finally {
            setLoadingPlans(false);
        }
    };

    const toggleSessionSelection = (planIndex, sessionKey) => {
        setSelectedSessions(prev => {
            const current = prev[planIndex] || [];
            const updated = current.includes(sessionKey)
                ? current.filter(key => key !== sessionKey)
                : [...current, sessionKey];
            return { ...prev, [planIndex]: updated };
        });
    };

    const handleOpenBookingModal = (planIndex, planData) => {
        const plan = customerTreatmentPlans[planIndex];
        const pendingSessions = plan.customerSessions?.filter(s => s.status === 'ChoDatLich') || [];
        const selectedSessionKeys = selectedSessions[planIndex] || [];
        
        // Convert sessionKeys (e.g., "0-1") back to session indices
        const sessionIndices = selectedSessionKeys.length > 0 
            ? selectedSessionKeys.map(key => {
                const [pIdx, sIdx] = key.split('-');
                return parseInt(sIdx);
            })
            : pendingSessions.map((_, idx) => idx);

        setTreatmentBooking({
            planIndex,
            planData: plan,
            sessionIds: sessionIndices,
            sessionDates: {},
            doctorId: null
        });
    };

    const handleBookSessions = async () => {
        const { planIndex, planData, sessionIds, sessionDates } = treatmentBooking;
        const customerId = parseInt(localStorage.getItem('customerId') || 0) || parseInt(localStorage.getItem('staffId') || 0);
        
        if (!customerId) {
            alert('Vui lòng đăng nhập');
            return;
        }

        if (!selectedDoctor) {
            alert('Vui lòng chọn bác sĩ');
            return;
        }

        if (Object.keys(sessionDates).length !== sessionIds.length) {
            alert('Vui lòng chọn ngày/giờ cho tất cả các buổi');
            return;
        }

        try {
            setIsLoading(true);
            // Book each session
            for (const sessionId of sessionIds) {
                const sessionDate = sessionDates[sessionId];
                await axios.post('http://localhost:5122/api/CustomerTreatmentPlans/bookcustomersession', {
                    customerId,
                    sessionId,
                    bookingDate: sessionDate,
                    treatmentPlanId: planData.id,
                    doctorId: selectedDoctor.doctorID
                });
            }
            setSuccessMessage('Đặt lịch thành công!');
            setTreatmentBooking({ planIndex: null, planData: null, sessionIds: [], sessionDates: {}, doctorId: null });
            setSelectedSessions({});
            fetchCustomerTreatmentPlans(); // Refresh
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Booking error:', error);
            alert('Lỗi khi đặt lịch: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteSession = async (sessionId, sessionNumber) => {
        setDeleteConfirmation({ open: true, sessionId, sessionNumber });
    };

    const confirmDeleteSession = async () => {
        const { sessionId, sessionNumber } = deleteConfirmation;
        setDeleteConfirmation({ open: false, sessionId: null, sessionNumber: null });

        try {
            setIsLoading(true);
            const response = await axios.post(
                'http://localhost:5122/api/CustomerTreatmentSessions/deletecustomertreatmentsession',
                { id: sessionId }
            );
            console.log('Delete session response:', response.data);
            
            setSuccessMessage('✓ Xóa buổi điều trị thành công!');
            
            // Refresh treatment plans
            fetchCustomerTreatmentPlans();
            
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Delete session error:', error);
            setSuccessMessage('❌ Lỗi khi xóa buổi: ' + error.message);
            setTimeout(() => setSuccessMessage(null), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const cancelDeleteSession = () => {
        setDeleteConfirmation({ open: false, sessionId: null, sessionNumber: null });
    };

    const handleSessionDateTimeChange = (planIndex, sessionIndex, dateTimeString) => {
        const sessionKey = `${planIndex}-${sessionIndex}`;
        if (!dateTimeString) {
            // Remove if empty
            setInlineBookings(prev => {
                const updated = { ...prev };
                delete updated[sessionKey];
                return updated;
            });
            return;
        }

        // Validate if time is within business hours (08:00 - 16:30)
        if (!isDateTimeInBusinessHours(dateTimeString)) {
            setSuccessMessage('⚠️ Vui lòng chọn giờ từ 08:00 đến 16:30');
            return;
        }

        const plan = customerTreatmentPlans[planIndex];
        const session = plan?.customerSessions?.[sessionIndex];
        
        setInlineBookings(prev => ({
            ...prev,
            [sessionKey]: {
                planIndex,
                sessionIndex,
                dateTime: dateTimeString,
                planName: plan?.treatmentPlanInformation?.planName,
                sessionNumber: session?.sessionNumber,
                sessionName: session?.sessionName
            }
        }));
    };

    const handleRemoveInlineBooking = (sessionKey) => {
        setInlineBookings(prev => {
            const updated = { ...prev };
            delete updated[sessionKey];
            return updated;
        });
    };

    const handleAddTreatmentSessions = (planIndex, planData, sessionKeys) => {
        // sessionKeys is array like ['0-0', '0-1'] from selectedSessions[planIndex]
        const newSessions = sessionKeys.map(sessionKey => {
            const [pIdx, sIdx] = sessionKey.split('-');
            const idx = parseInt(sIdx);
            const session = planData.customerSessions?.[idx];
            return {
                planIndex,
                sessionIndex: idx,
                planName: planData.treatmentPlanInformation?.planName,
                sessionNumber: session?.sessionNumber,
                sessionName: session?.sessionName
            };
        });
        
        // Filter out duplicates - only add sessions that don't already exist
        const filteredSessions = newSessions.filter(newSession => 
            !selectedTreatmentSessions.some(existing => 
                existing.planIndex === newSession.planIndex && 
                existing.sessionIndex === newSession.sessionIndex
            )
        );
        
        if (filteredSessions.length > 0) {
            setSelectedTreatmentSessions(prev => [...prev, ...filteredSessions]);
        }
    };

    const handleRemoveTreatmentSession = (planIndex, sessionIndex) => {
        const updatedSessions = selectedTreatmentSessions.filter(s => !(s.planIndex === planIndex && s.sessionIndex === sessionIndex));
        setSelectedTreatmentSessions(updatedSessions);
        
        // If no more treatment sessions, reset doctor, date, and time
        if (updatedSessions.length === 0) {
            setSelectedDoctor(null);
            setSelectedDate(null);
            setSelectedTime(null);
        }
    };

    const handleSessionDateChange = (sessionId, date) => {
        // Validate if time is within business hours (08:00 - 16:30)
        if (date && !isDateTimeInBusinessHours(date)) {
            setSuccessMessage('⚠️ Vui lòng chọn giờ từ 08:00 đến 16:30');
            return;
        }
        
        setTreatmentBooking(prev => ({
            ...prev,
            sessionDates: { ...prev.sessionDates, [sessionId]: date }
        }));
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

    // Get eligible service type IDs from selected treatment sessions
    const getEligibleServiceTypeIds = () => {
        if (selectedTreatmentSessions.length === 0) {
            return []; // No sessions selected = no filter
        }
        
        const eligibleIds = new Set();
        selectedTreatmentSessions.forEach(session => {
            const plan = customerTreatmentPlans[session.planIndex];
            if (plan?.serviceInformation?.serviceTypeId) {
                eligibleIds.add(plan.serviceInformation.serviceTypeId);
            }
        });
        return Array.from(eligibleIds);
    };

    // Get eligible doctors based on selected treatment sessions
    const getEligibleDoctors = () => {
        const eligibleServiceTypeIds = getEligibleServiceTypeIds();
        
        // If no sessions selected, all doctors are eligible
        if (eligibleServiceTypeIds.length === 0) {
            return doctors;
        }
        
        // Filter doctors that match the eligible service type IDs
        return doctors.filter(doctor => eligibleServiceTypeIds.includes(doctor.serviceTypeId));
    };

    // Check if a doctor is eligible
    const isDoctorEligible = (doctor) => {
        const eligibleDoctors = getEligibleDoctors();
        return eligibleDoctors.some(d => d.staffId === doctor.staffId);
    };

    // Check if a time is within business hours (08:00 - 16:30)
    const isTimeInBusinessHours = (timeString) => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const minute = parseInt(minutes);
        
        // Before 08:00 → not allowed
        if (hour < 8) return false;
        // After 16:30 → not allowed
        if (hour > 16) return false;
        // At 16:xx but after 16:30 → not allowed
        if (hour === 16 && minute > 30) return false;
        
        return true;
    };

    // Check if a datetime string is within business hours
    const isDateTimeInBusinessHours = (dateTimeString) => {
        if (!dateTimeString) return false;
        const [datePart, timePart] = dateTimeString.split('T');
        return isTimeInBusinessHours(timePart);
    };

    // Filter appointment times to exclude past times on today + business hours only
    const getAvailableTimes = () => {
        const now = new Date();
        const isToday = selectedDate && 
            selectedDate.toDateString() === now.toDateString();

        // First, filter to only business hours (08:00 - 16:30)
        const businessHoursTimes = APPOINTMENT_TIMES.filter(time => isTimeInBusinessHours(time));

        if (!isToday) {
            return businessHoursTimes;
        }

        // Filter out times that have already passed today
        return businessHoursTimes.filter(time => {
            const [hours, minutes] = time.split(':');
            const timeDate = new Date();
            timeDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            return timeDate > now;
        });
    };

    // Get minimum datetime for datetime-local input (08:00 AM or next available time)
    const getMinDateTime = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        let day = String(now.getDate()).padStart(2, '0');
        
        // Check if current time is after business hours (after 4:30 PM = 16:30)
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // If after 16:30 (4:30 PM), next available time is 08:00 AM tomorrow
        if (currentHour > 16 || (currentHour === 16 && currentMinute > 30)) {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const nextYear = tomorrow.getFullYear();
            const nextMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
            const nextDay = String(tomorrow.getDate()).padStart(2, '0');
            return `${nextYear}-${nextMonth}-${nextDay}T08:00`;
        }
        
        // If before 08:00 AM, next available time is 08:00 AM today
        if (currentHour < 8) {
            return `${year}-${month}-${day}T08:00`;
        }
        
        // If within business hours, use current time rounded to next 15 minutes
        const minutes = String(String(Math.ceil(currentMinute / 15) * 15).padStart(2, '0')).padStart(2, '0');
        const hours = String(currentHour).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Get maximum datetime for datetime-local input (16:30 on the selected date or later)
    const getMaxDateTime = (selectedDateObj) => {
        if (!selectedDateObj) return '';
        
        const year = selectedDateObj.getFullYear();
        const month = String(selectedDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDateObj.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}T16:30`;
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
            <div className={cx('container')}>
                {/* LEFT PANEL - Treatment Plans + Date Selection */}
                <div className={cx('leftPanel')}>
                    {/* CUSTOMER TREATMENT PLANS SECTION */}
                    {!loadingPlans && customerTreatmentPlans.length > 0 && (
                        <div className={cx('treatmentPlansSection')}>
                            <div className={cx('plansHeader')}>
                                <div className={cx('headerTitle')}>
                                    <FontAwesomeIcon icon={faGift} className={cx('headerIcon')} />
                                    <h2>Gói liệu trình của bạn</h2>
                                    <span className={cx('planCount')}>{customerTreatmentPlans.length}</span>
                                </div>
                                <p className={cx('headerSubtitle')}>Theo dõi tiến độ và quản lý các gói liệu trình</p>
                            </div>

                            <div className={cx('plansGrid')}>
                                {customerTreatmentPlans.map((plan, index) => (
                                    <div key={index} className={cx('treatmentPlanCard')}>
                                        {/* Card Header */}
                                        <div className={cx('planCardHeader')}>
                                            <div className={cx('planTitleSection')}>
                                                <h3 className={cx('planTitle')}>
                                                    {plan.treatmentPlanInformation?.planName}
                                                </h3>
                                                <span className={cx('statusBadge', plan.customerTreatmentPlanInformation?.status?.toLowerCase())}>
                                                    {plan.customerTreatmentPlanInformation?.status === 'ChoDatLich' && '⏳ Chờ đặt lịch'}
                                                    {plan.customerTreatmentPlanInformation?.status === 'DangThucHien' && '🔄 Đang thực hiện'}
                                                    {plan.customerTreatmentPlanInformation?.status === 'HoanTat' && '✓ Hoàn tất'}
                                                </span>
                                            </div>
                                            <div className={cx('serviceName')}>
                                                {plan.serviceInformation?.serviceName}
                                            </div>
                                        </div>

                                        {/* Card Content */}
                                        <div className={cx('planCardContent')}>
                                            <div className={cx('planStats')}>
                                                <div className={cx('statItem')}>
                                                    <FontAwesomeIcon icon={faFlask} className={cx('statIcon')} />
                                                    <div>
                                                        <span className={cx('statLabel')}>Số buổi</span>
                                                        <span className={cx('statValue')}>
                                                            {plan.customerSessions?.length || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={cx('statDivider')}></div>
                                                <div className={cx('statItem')}>
                                                    <FontAwesomeIcon icon={faCalendarAlt} className={cx('statIcon')} />
                                                    <div>
                                                        <span className={cx('statLabel')}>Khoảng cách</span>
                                                        <span className={cx('statValue')}>
                                                            {plan.treatmentPlanInformation?.sessionInterval}d
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={cx('statDivider')}></div>
                                                <div className={cx('statItem')}>
                                                    <FontAwesomeIcon icon={faClock} className={cx('statIcon')} />
                                                    <div>
                                                        <span className={cx('statLabel')}>Thời lượng</span>
                                                        <span className={cx('statValue')}>
                                                            {(plan.treatmentPlanInformation?.totalSessions || 0) * (plan.treatmentPlanInformation?.sessionInterval || 0)}d
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sessions Overview */}
                                            <div className={cx('sessionsOverview')}>
                                                <div className={cx('sessionsHeader')}>
                                                    <span className={cx('sessionsTitle')}>Các buổi điều trị</span>
                                                    <span className={cx('completedCount')}>
                                                        {plan.customerSessions?.filter(s => s.status === 'HoanTat').length || 0}/{plan.customerSessions?.length || 0}
                                                    </span>
                                                </div>
                                                <div className={cx('sessionsList')}>
                                                    {plan.customerSessions?.map((session, idx) => {
                                                        const sessionKey = `${index}-${idx}`; 
                                                        const isSelectable = session.status === 'ChoDatLich';
                                                        const isSelected = selectedSessions[index]?.includes(sessionKey);
                                                        
                                                        // Debug: Log session structure
                                                        console.log('Session object:', session);
                                                        
                                                        const statusMap = {
                                                            'ChoDatLich': '⏳ Chờ đặt lịch',
                                                            'DaDatLich': '📅 Đã đặt lịch',
                                                            'DangThucHien': '🔄 Đang thực hiện',
                                                            'HoanTat': '✓ Hoàn tất',
                                                            'Huy': '❌ Hủy'
                                                        };
                                                        
                                                        return (
                                                            <div key={idx}>
                                                                <div 
                                                                    className={cx('sessionItem', { selectable: isSelectable, selected: isSelected, expanded: expandedSessionKey === sessionKey })}
                                                                    onClick={() => setExpandedSessionKey(expandedSessionKey === sessionKey ? null : sessionKey)}
                                                                >
                                                                    <div className={cx('sessionItemLeft')}>
                                                                    {isSelectable && (
                                                                        <input
                                                                            type="checkbox"
                                                                            className={cx('sessionCheckbox')}
                                                                            checked={isSelected}
                                                                            onChange={(e) => {
                                                                                e.stopPropagation();
                                                                                toggleSessionSelection(index, sessionKey);
                                                                            }}
                                                                        />
                                                                    )}
                                                                    <div className={cx('sessionInfo')}>
                                                                        <span className={cx('sessionNumber')}>Buổi {session.sessionNumber}</span>
                                                                        <span className={cx('sessionName')}>{session.sessionName}</span>
                                                                    </div>
                                                                </div>
                                                                <div className={cx('sessionItemRight')}>
                                                                    {isSelectable ? (
                                                                        <div className={cx('sessionActions')}>
                                                                            <input
                                                                                type="datetime-local"
                                                                                className={cx('sessionDateTimeInput')}
                                                                                value={inlineBookings[sessionKey]?.dateTime || ''}
                                                                                onChange={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleSessionDateTimeChange(index, idx, e.target.value);
                                                                                }}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                placeholder="Chọn ngày/giờ"
                                                                                min={getMinDateTime()}
                                                                            />
                                                                            {inlineBookings[sessionKey] && (
                                                                                <button
                                                                                    className={cx('deleteSessionBtn')}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleRemoveInlineBooking(sessionKey);
                                                                                    }}
                                                                                    title="Xóa lịch"
                                                                                >
                                                                                    <FontAwesomeIcon icon={faTrash} />
                                                                                </button>
                                                                            )}
                                                                            <button
                                                                                className={cx('deleteSessionApiBtn')}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    const sessionId = session.id || session.sessionId || session.customerSessionId;
                                                                                    if (sessionId) {
                                                                                        handleDeleteSession(sessionId, session.sessionNumber);
                                                                                    } else {
                                                                                        alert('Không tìm thấy ID buổi điều trị');
                                                                                    }
                                                                                }}
                                                                                title="Xóa buổi điều trị"
                                                                                disabled={isLoading}
                                                                            >
                                                                                <FontAwesomeIcon icon={faTrash} />
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <div className={cx('sessionStatusActions')}>
                                                                            <span className={cx('statusBadge', session.status?.toLowerCase())}>
                                                                                {statusMap[session.status] || session.status}
                                                                            </span>
                                                                            <button
                                                                                className={cx('deleteSessionApiBtn')}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    const sessionId = session.id || session.sessionId || session.customerSessionId;
                                                                                    if (sessionId) {
                                                                                        handleDeleteSession(sessionId, session.sessionNumber);
                                                                                    } else {
                                                                                        alert('Không tìm thấy ID buổi điều trị');
                                                                                    }
                                                                                }}
                                                                                title="Xóa buổi điều trị"
                                                                                disabled={isLoading}
                                                                            >
                                                                                <FontAwesomeIcon icon={faTrash} />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Inline Session Details */}
                                                            {expandedSessionKey === sessionKey && (
                                                                <div className={cx('inlineSessionDetails')}>
                                                                    <div className={cx('detailsHeroSection')}>
                                                                        <div className={cx('detailsHeroContent')}>
                                                                            <h3>Buổi {session.sessionNumber}: {session.sessionName}</h3>
                                                                            <span className={cx('detailsHeroStatus', session.status?.toLowerCase())}>
                                                                                {statusMap[session.status]}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    <div className={cx('detailsContentGrid')}>                                                                    
                                                                        {/* Plan Info */}
                                                                        <div className={cx('detailsInfoCard')}>
                                                                            <div className={cx('detailsCardIcon')}>📋</div>
                                                                            <div className={cx('detailsCardBody')}>
                                                                                <h4>Gói Liệu Trình</h4>
                                                                                <p>{plan.treatmentPlanInformation?.planName}</p>
                                                                            </div>
                                                                        </div>

                                                                        {/* Products Info */}
                                                                        {session.products && session.products.length > 0 && (
                                                                            <div className={cx('detailsProductsCard')}>
                                                                                <div className={cx('detailsCardIcon')}>🧴</div>
                                                                                <div className={cx('detailsCardBody')}>
                                                                                    <h4>Sản Phẩm Sử Dụng ({session.products.length})</h4>
                                                                                    <div className={cx('productsList')}>
                                                                                        {session.products.map((product, pidx) => (
                                                                                            <div key={pidx} className={cx('productItem')}>
                                                                                                <span className={cx('productItemName')}>{product.productName}</span>
                                                                                                <span className={cx('productItemQty')}>x{product.quantityUsed}</span>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Description */}
                                                                    {session.description && (
                                                                        <div className={cx('detailsDescriptionBox')}>
                                                                            <h4>Chi Tiết</h4>
                                                                            <p>{session.description}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                {plan.customerTreatmentPlanInformation?.status === 'ChoDatLich' && (plan.customerSessions?.some(s => s.status === 'ChoDatLich') || false) && (
                                                    <button
                                                        className={cx('bookSelectedBtn')}
                                                        onClick={() => handleAddTreatmentSessions(index, plan, selectedSessions[index])}
                                                        disabled={
                                                            !selectedSessions[index] || 
                                                            selectedSessions[index].length === 0 ||
                                                            // Disable if any selected session doesn't have datetime selected
                                                            !selectedSessions[index].every(sessionKey => inlineBookings[sessionKey])
                                                        }
                                                    >
                                                        Đặt lịch {selectedSessions[index]?.length > 0 ? `${selectedSessions[index].length} buổi` : 'buổi'}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Price & Description */}
                                            <div className={cx('planFooter')}>
                                                <div className={cx('priceSection')}>
                                                    <span className={cx('priceLabel')}>Giá gói:</span>
                                                    <span className={cx('price')}>
                                                        {plan.treatmentPlanInformation?.price?.toLocaleString('vi-VN')}đ/buổi
                                                    </span>
                                                </div>
                                                <p className={cx('description')}>
                                                    {plan.treatmentPlanInformation?.description}
                                                </p>
                                            </div>
                                        </div>

                                        {/* <div className={cx('cardAction')}>
                                            <button className={cx('viewDetailsBtn')}>
                                                Xem chi tiết →
                                            </button>
                                        </div> */}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {treatmentBooking.planData && (
                        <div className={cx('treatmentBookingPanel')}>
                            <div className={cx('treatmentBookingHeader')}>
                                <h3>Đặt lịch {treatmentBooking.planData?.treatmentPlanInformation?.planName}</h3>
                                <button
                                    className={cx('treatmentBookingClose')}
                                    onClick={() => setTreatmentBooking({ planIndex: null, planData: null, sessionIds: [], sessionDates: {}, doctorId: null })}
                                >
                                    ✕
                                </button>
                            </div>

                            <div className={cx('treatmentSessionsSection')}>
                                <label className={cx('treatmentLabel')}>Chọn ngày/giờ cho các buổi:</label>
                                <div className={cx('treatmentSessionsList')}>
                                    {treatmentBooking.planData?.customerSessions?.map((session, idx) => {
                                        if (!treatmentBooking.sessionIds.includes(idx)) return null;
                                        return (
                                            <div key={idx} className={cx('treatmentSessionItem')}>
                                                <span className={cx('treatmentSessionLabel')}>
                                                    Buổi {session.sessionNumber}: {session.sessionName}
                                                </span>
                                                <input
                                                    type="datetime-local"
                                                    className={cx('treatmentDateTimeInput')}
                                                    value={treatmentBooking.sessionDates[idx] || ''}
                                                    onChange={(e) => handleSessionDateChange(idx, e.target.value)}
                                                    min={getMinDateTime()}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className={cx('treatmentBookingFooter')}>
                                <button
                                    className={cx('treatmentButtonCancel')}
                                    onClick={() => setTreatmentBooking({ planIndex: null, planData: null, sessionIds: [], sessionDates: {}, doctorId: null })}
                                >
                                    Hủy
                                </button>
                                <button
                                    className={cx('treatmentButtonConfirm')}
                                    onClick={handleBookSessions}
                                    disabled={isLoading || Object.keys(treatmentBooking.sessionDates).length !== treatmentBooking.sessionIds.length}
                                >
                                    {isLoading ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT PANEL - Doctors + Booking Summary */}
                <div className={cx('rightPanel')}>
                    {/* Doctors Sidebar */}
                    <div className={cx('doctorsSidebarSection')}>
                        <div className={cx('doctorsSidebarHeader')}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className={cx('doctorHeaderIcon')}>
                                    <FontAwesomeIcon icon={faUserMd} />
                                </div>
                                <div>
                                    <h3>Đội Ngũ Bác Sĩ</h3>
                                    <p className={cx('doctorSubtitle')}>Các chuyên gia hàng đầu</p>
                                </div>
                            </div>
                            {doctors && doctors.length > 0 && (
                                <div className={cx('doctorCountBadge')}>
                                    {doctors.length}
                                </div>
                            )}
                        </div>

                        <div className={cx('doctorsSidebarList')}>
                            {doctors && doctors.length > 0 ? (
                                doctors.map((doctor, index) => {
                                    const isEligible = isDoctorEligible(doctor);
                                    const canSelect = selectedTreatmentSessions.length === 0 || isEligible;
                                    
                                    return (
                                        <div
                                            key={doctor.doctorID}
                                            className={cx('doctorSidebarCard', { 
                                                selected: selectedDoctor?.doctorID === doctor.doctorID,
                                                disabled: !canSelect
                                            })}
                                            onClick={() => canSelect && setSelectedDoctor(doctor)}
                                            title={!canSelect ? 'Bác sĩ này không phù hợp với các buổi bạn đã chọn' : ''}
                                            style={{
                                                opacity: canSelect ? 1 : 0.5,
                                                cursor: canSelect ? 'pointer' : 'not-allowed',
                                                pointerEvents: canSelect ? 'auto' : 'none'
                                            }}
                                        >
                                            <div className={cx('doctorCardImage')}>
                                                <img
                                                    src={doctor.image}
                                                    alt={doctor.doctorName}
                                                />
                                                <div className={cx('doctorCardOverlay')}></div>
                                                {!canSelect && (
                                                    <div className={cx('disabledOverlay')}>
                                                        Không khả dụng
                                                    </div>
                                                )}
                                            </div>

                                            <div className={cx('doctorCardInfo')}>
                                                <h4 className={cx('doctorCardName')}>{doctor.doctorName}</h4>
                                                <p className={cx('doctorCardSpecialty')}>{doctor.specialty}</p>

                                                <div className={cx('doctorCardStats')}>
                                                    <div className={cx('statRow')}>
                                                        <FontAwesomeIcon icon={faTrophy} className={cx('statIcon')} />
                                                        <span>{doctor.rating} ⭐ ({doctor.reviews} đánh giá)</span>
                                                    </div>
                                                    <div className={cx('statRow')}>
                                                        <FontAwesomeIcon icon={faBriefcase} className={cx('statIcon')} />
                                                        <span>{doctor.experience} năm kinh nghiệm</span>
                                                    </div>
                                                </div>

                                                <button 
                                                    className={cx('selectDoctorBtn', { disabled: !canSelect })}
                                                    disabled={!canSelect}
                                                >
                                                    <FontAwesomeIcon icon={faArrowRight} />
                                                    {canSelect ? 'Chọn bác sĩ' : 'Không phù hợp'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className={cx('noDoctorsMessage')}>
                                    <FontAwesomeIcon icon={faSearch} />
                                    <p>Không có bác sĩ nào</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Booking Summary */}
                    <div className={cx('bookingSummaryWrapper')}>
                        <BookingSummary
                            selectedService={selectedService}
                            selectedDoctor={selectedDoctor}
                            selectedDate={selectedDate}
                            selectedTime={selectedTime}
                            onBooking={handleBooking}
                            isLoading={isLoading}
                            inlineBookings={inlineBookings}
                            onRemoveBooking={handleRemoveInlineBooking}
                            selectedTreatmentSessions={selectedTreatmentSessions}
                            onRemoveTreatmentSession={handleRemoveTreatmentSession}
                            customerTreatmentPlans={customerTreatmentPlans}
                        />
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Dialog
                open={deleteConfirmation.open}
                onClose={cancelDeleteSession}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                        color: 'white',
                        fontSize: '20px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '24px'
                    }}
                >
                    <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: '22px' }} />
                    Xác nhận xóa buổi
                </DialogTitle>
                <DialogContent
                    sx={{
                        padding: '24px',
                        background: 'linear-gradient(135deg, #fff5f5 0%, #fffbfb 100%)',
                    }}
                >
                    <div style={{ marginTop: '12px' }}>
                        <p style={{
                            fontSize: '16px',
                            color: '#333',
                            lineHeight: '1.6',
                            margin: '0 0 16px 0'
                        }}>
                            Bạn có chắc chắn muốn xóa <strong>buổi {deleteConfirmation.sessionNumber}</strong>?
                        </p>
                        <div style={{
                            background: 'rgba(255, 107, 107, 0.1)',
                            border: '1px solid rgba(255, 107, 107, 0.2)',
                            borderRadius: '10px',
                            padding: '12px 16px',
                            marginTop: '16px'
                        }}>
                            <p style={{
                                margin: '0',
                                fontSize: '13px',
                                color: '#666',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span style={{
                                    width: '6px',
                                    height: '6px',
                                    background: '#ff6b6b',
                                    borderRadius: '50%',
                                    display: 'inline-block'
                                }}></span>
                                Hành động này không thể hoàn tác
                            </p>
                        </div>
                    </div>
                </DialogContent>
                <DialogActions
                    sx={{
                        padding: '20px 24px',
                        borderTop: '1px solid #eee',
                        gap: '12px',
                        background: '#fafafa'
                    }}
                >
                    <Button
                        onClick={cancelDeleteSession}
                        variant="outlined"
                        sx={{
                            borderColor: '#ddd',
                            color: '#666',
                            borderRadius: '10px',
                            textTransform: 'none',
                            fontSize: '14px',
                            fontWeight: '600',
                            padding: '10px 24px',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                background: '#f5f5f5',
                                borderColor: '#ccc'
                            }
                        }}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={confirmDeleteSession}
                        variant="contained"
                        sx={{
                            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                            color: 'white',
                            borderRadius: '10px',
                            textTransform: 'none',
                            fontSize: '14px',
                            fontWeight: '600',
                            padding: '10px 28px',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #ff5252 0%, #ee3d5f 100%)',
                                boxShadow: '0 8px 20px rgba(255, 107, 107, 0.4)',
                                transform: 'translateY(-2px)'
                            }
                        }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Đang xóa...' : 'Xóa buổi'}
                    </Button>
                </DialogActions>
            </Dialog>

        </div>
    );
}

export default ServicesPage;
