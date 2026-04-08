import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './ServiceDetailsPage.module.scss';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import NotificationToast from './NotificationToast';
import useDebounce from '../../hooks/useDebounce';
import {
    faArrowLeft,
    faClock,
    faDollarSign,
    faBox,
    faCalendarAlt,
    faGem,
    faFlask,
    faCheck,
    faGift,
    faTrophy,
    faArrowRight,
    faCheckSquare,
    faSquare,
    faLightbulb,
    faBolt,
    faStethoscope,
    faCertificate,
    faGraduationCap,
    faBriefcase,
    faUserMd
} from '@fortawesome/free-solid-svg-icons';
import { useParams, useNavigate } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import TextField from '@mui/material/TextField';

const cx = classNames.bind(styles);

function ServiceDetailsPage() {
    const { serviceId } = useParams();
    const navigate = useNavigate();
    const [service, setService] = useState(null);
    const [treatmentPlans, setTreatmentPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [sessionDetails, setSessionDetails] = useState([]);
    const [checkedSessions, setCheckedSessions] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [doctors, setDoctors] = useState([]);
    const [loadingDoctors, setLoadingDoctors] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [notification, setNotification] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [isSingleService, setIsSingleService] = useState(false);
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
    const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
    
    // Single Service Booking in Left Column
    const [singleServiceSelectedDoctor, setSingleServiceSelectedDoctor] = useState(null);
    const [singleServiceSelectedDate, setSingleServiceSelectedDate] = useState(null);
    const debouncedSingleServiceDate = useDebounce(singleServiceSelectedDate, 800);
    const [singleServiceAvailableTimeSlots, setSingleServiceAvailableTimeSlots] = useState([]);
    const [loadingSingleServiceTimeSlots, setLoadingSingleServiceTimeSlots] = useState(false);
    const [showDoctorSelectorModal, setShowDoctorSelectorModal] = useState(false);
    
    // Single Service Payment Flow
    const [singleServiceSelectedTime, setSingleServiceSelectedTime] = useState(null);
    const debouncedSingleServiceTime = useDebounce(singleServiceSelectedTime, 3000);
    const [singleServiceSelectedPaymentMethod, setSingleServiceSelectedPaymentMethod] = useState(null);
    const debouncedSingleServicePaymentMethod = useDebounce(singleServiceSelectedPaymentMethod, 3000);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentMessage, setPaymentMessage] = useState(null);
    
    // Payment Gateway Selection Modal (VNPay/Momo)
    const [showPaymentGatewayModal, setShowPaymentGatewayModal] = useState(false);
    const [selectedPaymentGateway, setSelectedPaymentGateway] = useState(null);
    const debouncedPaymentGateway = useDebounce(selectedPaymentGateway, 3000);
    const [currentInvoiceId, setCurrentInvoiceId] = useState(null);
    const [paymentGatewayMessage, setPaymentGatewayMessage] = useState(null);
    const [paymentGatewayLoading, setPaymentGatewayLoading] = useState(false);

    useEffect(() => {
        fetchServiceData(serviceId);
    }, [serviceId]);

    useEffect(() => {
        if (selectedPlan?.serviceId) {
            fetchDoctorsList(selectedPlan.serviceInfo?.serviceTypeId);
        } else if (isSingleService && service?.serviceTypeId) {
            fetchDoctorsList(service.serviceTypeId);
        }
    }, [selectedPlan?.serviceInfo?.serviceTypeId, isSingleService, service?.serviceTypeId]);

    useEffect(() => {
        if (selectedDate && isSingleService && service?.id && selectedDoctor) {
            fetchAvailableTimeSlots();
        } else {
            setAvailableTimeSlots([]);
        }
    }, [selectedDate, isSingleService, service?.id, selectedDoctor]);

    // Auto-fetch available time slots for single service booking when doctor + date(debounced) selected
    useEffect(() => {
        if (isSingleService && singleServiceSelectedDoctor && debouncedSingleServiceDate && service?.id) {
            fetchSingleServiceAvailableTimeSlots();
        } else {
            setSingleServiceAvailableTimeSlots([]);
        }
    }, [isSingleService, singleServiceSelectedDoctor, debouncedSingleServiceDate, service?.id]);

    // Show payment modal automatically after time slot selection with 3s debounce
    useEffect(() => {
        if (debouncedSingleServiceTime) {
            setShowPaymentModal(true);
            setPaymentMessage(null);
        }
    }, [debouncedSingleServiceTime]);

    // Handle payment gateway selection (VNPay/Momo) with 3s debounce
    useEffect(() => {
        if (!selectedPaymentGateway || !debouncedPaymentGateway || !currentInvoiceId) {
            return;
        }

        if (debouncedPaymentGateway === 'vnpay') {
            setPaymentGatewayLoading(true);
            console.log('Calling VNPay API with invoiceId:', currentInvoiceId);
            
            axios.post(
                'http://localhost:5122/api/InvoicePayment/vnpay/create-payment-url',
                { invoiceId: currentInvoiceId }
            ).then(response => {
                console.log('VNPay response:', response.data);
                
                if (response.data?.success === true && response.data?.data?.paymentUrl) {
                    const paymentUrl = response.data.data.paymentUrl;
                    console.log('Redirecting to VNPay URL:', paymentUrl);
                    setPaymentGatewayMessage(`✓ Chuyển hướng tới VNPay...`);
                    
                    setTimeout(() => {
                        window.location.href = paymentUrl;
                    }, 500);
                } else {
                    setPaymentGatewayMessage('❌ Không thể tạo URL thanh toán. Vui lòng thử lại.');
                    setPaymentGatewayLoading(false);
                }
            }).catch(error => {
                console.error('Error calling VNPay API:', error);
                setPaymentGatewayMessage('❌ Lỗi tạo URL thanh toán. Vui lòng thử lại.');
                setPaymentGatewayLoading(false);
            });
        } else if (debouncedPaymentGateway === 'momo') {
            setPaymentGatewayLoading(true);
            axios.post(
                'http://localhost:5122/api/InvoicePayment/momo/create-payment-url',
                { invoiceId: currentInvoiceId }
            ).then(response => {
                if (response.data?.success === true && response.data?.data?.paymentUrl) {
                    const paymentUrl = response.data.data.paymentUrl;
                    setPaymentGatewayMessage(`✓ Chuyển hướng tới Momo...`);
                    setTimeout(() => {
                        window.location.href = paymentUrl;
                    }, 500);
                } else {
                    setPaymentGatewayMessage('❌ Không thể tạo URL thanh toán Momo. Vui lòng thử lại.');
                    setPaymentGatewayLoading(false);
                }
            }).catch(error => {
                console.error('Error calling Momo API:', error);
                setPaymentGatewayMessage('❌ Lỗi tạo URL thanh toán Momo. Vui lòng thử lại.');
                setPaymentGatewayLoading(false);
            });
        }
    }, [debouncedPaymentGateway]);

    // Handle payment method selection with 3s debounce to create appointment
    useEffect(() => {
        if (!singleServiceSelectedPaymentMethod || !debouncedSingleServicePaymentMethod) {
            return;
        }

        setPaymentLoading(true);
        setPaymentMessage(null);

        // The debounce timer is already applied via debouncedSingleServicePaymentMethod
        handleCreateAppointmentWithPayment(singleServiceSelectedPaymentMethod);
    }, [debouncedSingleServicePaymentMethod]);

    const fetchServiceData = async (svcId) => {
        setLoading(true);
        try {
            // First, try to fetch treatment plans to see if it's a course service
            const plansResponse = await axios.post(
                'http://localhost:5122/api/TreatmentPlan/gettreatmentplanlist',
                {
                    pageNo: 1,
                    pageSize: 8,
                    serviceId: parseInt(svcId)
                }
            );

            let rawPlansData = [];
            if (Array.isArray(plansResponse.data)) {
                rawPlansData = plansResponse.data;
            } else if (plansResponse.data?.baseDatas && Array.isArray(plansResponse.data.baseDatas)) {
                rawPlansData = plansResponse.data.baseDatas;
            }

            // If no treatment plans found, try to fetch as single service
            if (rawPlansData.length === 0) {
                fetchSingleService(svcId);
            } else {
                // It's a course service, use treatment plans
                const transformedPlans = rawPlansData.map(item => ({
                    id: item.treatmentPlanInfomation?.id,
                    planName: item.treatmentPlanInfomation?.planName,
                    totalSessions: item.treatmentPlanInfomation?.totalSessions,
                    price: item.treatmentPlanInfomation?.price,
                    sessionInterval: item.treatmentPlanInfomation?.sessionInterval,
                    description: item.treatmentPlanInfomation?.description,
                    serviceId: item.treatmentPlanInfomation?.serviceId,
                    serviceInfo: item.serviceInformation || {},
                    treatmentSessions: (item.treatmentSessionInformation || []).map(session => ({
                        id: session.treatmentSessionId,
                        sessionNumber: session.sessionNumber,
                        sessionName: session.sessionName,
                        description: session.description,
                        duration: session.duration,
                        treatmentSessionId: session.treatmentSessionId
                    })),
                    sessionProducts: item.sessionProductInformation || []
                }));
                
                setTreatmentPlans(transformedPlans);
                setIsSingleService(false);
                
                const firstPlan = transformedPlans[0];
                if (firstPlan) {
                    setService({
                        id: parseInt(svcId),
                        isCourse: 1,
                        serviceID: parseInt(svcId),
                        priceService: firstPlan.price || 0,
                        description: firstPlan.description || '',
                        serviceName: firstPlan.serviceInfo?.serviceName || '',
                        serviceTypeId: firstPlan.serviceInfo?.serviceTypeId || null
                    });
                    
                    setSelectedPlan(firstPlan);
                    setSessionDetails(firstPlan.treatmentSessions || []);
                }
                setLoading(false);
            }
        } catch (error) {
            console.error('Error fetching service data:', error);
            // If error, try to fetch as single service
            fetchSingleService(svcId);
        }
    };

    const fetchSingleService = async (svcId) => {
        try {
            const response = await axios.post(
                'http://localhost:5122/api/Service/getservicelist',
                {
                    pageNo: 1,
                    pageSize: 1,
                    id: parseInt(svcId)
                }
            );

            let servicesData = [];
            if (Array.isArray(response.data)) {
                servicesData = response.data;
            } else if (response.data?.baseDatas && Array.isArray(response.data.baseDatas)) {
                servicesData = response.data.baseDatas;
            }

            if (servicesData.length > 0) {
                const singleService = servicesData[0];
                setService({
                    id: singleService.id,
                    isCourse: singleService.isCourse === 0 ? 0 : 1,
                    serviceID: singleService.id,
                    priceService: singleService.price || 0,
                    description: singleService.description || '',
                    serviceName: singleService.serviceName || '',
                    duration: singleService.duration || 60,
                    serviceTypeId: singleService.serviceTypeId || null
                });
                setIsSingleService(true);
                setTreatmentPlans([]);
                setSelectedPlan(null);
            }
        } catch (error) {
            console.error('Error fetching single service:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTreatmentPlans = async (svcId) => {
        setLoading(true);
        try {
            const response = await axios.post(
                'http://localhost:5122/api/TreatmentPlan/gettreatmentplanlist',
                {
                    pageNo: 1,
                    pageSize: 8,
                    serviceId: parseInt(svcId)
                }
            );

            let rawPlansData = [];
            if (Array.isArray(response.data)) {
                rawPlansData = response.data;
            } else if (response.data?.baseDatas && Array.isArray(response.data.baseDatas)) {
                rawPlansData = response.data.baseDatas;
            }
            
            // Transform API response to match component expectations
            const transformedPlans = rawPlansData.map(item => ({
                id: item.treatmentPlanInfomation?.id,
                planName: item.treatmentPlanInfomation?.planName,
                totalSessions: item.treatmentPlanInfomation?.totalSessions,
                price: item.treatmentPlanInfomation?.price,
                sessionInterval: item.treatmentPlanInfomation?.sessionInterval,
                description: item.treatmentPlanInfomation?.description,
                serviceId: item.treatmentPlanInfomation?.serviceId,
                // Add service information
                serviceInfo: item.serviceInformation || {},
                // Add treatment sessions
                treatmentSessions: (item.treatmentSessionInformation || []).map(session => ({
                    id: session.treatmentSessionId,
                    sessionNumber: session.sessionNumber,
                    sessionName: session.sessionName,
                    description: session.description,
                    duration: session.duration,
                    treatmentSessionId: session.treatmentSessionId
                })),
                // Add session products
                sessionProducts: item.sessionProductInformation || []
            }));
            
            setTreatmentPlans(transformedPlans);
            
            // Set service data from first plan's service information
            const firstPlan = transformedPlans[0];
            if (firstPlan) {
                setService({
                    id: parseInt(svcId),
                    isCourse: 1,
                    serviceID: parseInt(svcId),
                    priceService: firstPlan.price || 0,
                    description: firstPlan.description || '',
                    serviceName: firstPlan.serviceInfo?.serviceName || '',
                    serviceTypeId: firstPlan.serviceInfo?.serviceTypeId || null
                });
                
                setSelectedPlan(firstPlan);
                setSessionDetails(firstPlan.treatmentSessions || []);
            }
        } catch (error) {
            console.error('Error fetching treatment plans:', error);
            setTreatmentPlans([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
        // Use treatmentSessions if available, otherwise fall back to sessionDetails
        const sessions = plan.treatmentSessions && plan.treatmentSessions.length > 0 
            ? plan.treatmentSessions 
            : plan.treatmentSessions || [];
        setSessionDetails(sessions);
        setCheckedSessions(new Set());
    };

    const handleSessionCheck = (sessionId) => {
        const newChecked = new Set(checkedSessions);
        if (newChecked.has(sessionId)) {
            newChecked.delete(sessionId);
        } else {
            newChecked.add(sessionId);
        }
        setCheckedSessions(newChecked);
    };

    const handleSelectAllSessions = () => {
        // Nếu tất cả đã được tích chọn, bỏ tích. Ngược lại, tích tất cả
        if (checkedSessions.size === sessionDetails.length) {
            setCheckedSessions(new Set());
        } else {
            const allIds = new Set(sessionDetails.map(s => s.id));
            setCheckedSessions(allIds);
        }
    };

    const handleViewDoctorInfo = (doctor) => {
        setSelectedDoctor(doctor);
    };

    const handleBackToDoctorsList = () => {
        setSelectedDoctor(null);
    };

    const fetchDoctorsList = async (serviceTypeId) => {
        setLoadingDoctors(true);
        try {
            const response = await axios.post(
                'http://localhost:5122/api/Staff/get-list',
                {
                    isDoctor: true,
                    serviceTypeId: parseInt(serviceTypeId)
                }
            );

            console.log('API Response:', response.data);
            
            if (response.data?.baseDatas && Array.isArray(response.data.baseDatas)) {
                console.log('Doctor sample:', response.data.baseDatas[0]);
                setDoctors(response.data.baseDatas);
            } else {
                console.log('No baseDatas in response');
                setDoctors([]);
            }
        } catch (error) {
            console.error('Error fetching doctors list:', error);
            setDoctors([]);
        } finally {
            setLoadingDoctors(false);
        }
    };

    // Helper function to format date in local timezone (not UTC)
    const getLocalDateISO = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}T00:00:00.000Z`;
    };

    const fetchAvailableTimeSlots = async () => {
        setLoadingTimeSlots(true);
        try {
            const response = await axios.post(
                'http://localhost:5122/api/Appointment/getdoctoravailability',
                {
                    doctorId: selectedDoctor.id,
                    serviceId: service.id,
                    date: getLocalDateISO(selectedDate)
                }
            );

            if (Array.isArray(response.data)) {
                setAvailableTimeSlots(response.data);
            } else if (response.data?.availableTimeSlots && Array.isArray(response.data.availableTimeSlots)) {
                setAvailableTimeSlots(response.data.availableTimeSlots);
            } else {
                setAvailableTimeSlots([]);
            }
        } catch (error) {
            console.error('Error fetching available time slots:', error);
            setAvailableTimeSlots([]);
        } finally {
            setLoadingTimeSlots(false);
        }
    };

    // Fetch available time slots for single service booking (used in left column)
    const fetchSingleServiceAvailableTimeSlots = async () => {
        setLoadingSingleServiceTimeSlots(true);
        try {
            const response = await axios.post(
                'http://localhost:5122/api/Appointment/getdoctoravailability',
                {
                    doctorId: singleServiceSelectedDoctor.id,
                    serviceId: service.id,
                    date: getLocalDateISO(debouncedSingleServiceDate)
                }
            );

            if (Array.isArray(response.data)) {
                setSingleServiceAvailableTimeSlots(response.data);
            } else if (response.data?.availableTimeSlots && Array.isArray(response.data.availableTimeSlots)) {
                setSingleServiceAvailableTimeSlots(response.data.availableTimeSlots);
            } else {
                setSingleServiceAvailableTimeSlots([]);
            }
        } catch (error) {
            console.error('Error fetching single service available time slots:', error);
            setSingleServiceAvailableTimeSlots([]);
        } finally {
            setLoadingSingleServiceTimeSlots(false);
        }
    };

    // Handle appointment creation with payment method after 3s debounce
    const handleCreateAppointmentWithPayment = async (paymentMethod) => {
        if (!singleServiceSelectedDoctor || !singleServiceSelectedDate || !singleServiceSelectedTime) {
            setPaymentMessage('❌ Thiếu thông tin để đặt lịch');
            setPaymentLoading(false);
            return;
        }

        try {
            // Get customerId from localStorage
            const customerId = parseInt(localStorage.getItem('customerId') || 0);
            
            if (!customerId || customerId === 0) {
                setPaymentMessage('❌ Vui lòng đăng nhập để tiếp tục');
                setPaymentLoading(false);
                return;
            }

            // Map payment method to typeInvoice
            const typeInvoiceMap = {
                'completion': 0,  // 0 = trả sau (thanh toán khi hoàn thành)
                'full': 1,        // 1 = trả trước toàn bộ (100%)
                'partial': 2      // 2 = thanh toán 1 phần (30%)
            };

            // Format startTime to ISO format: YYYY-MM-DDTHH:mm:ss.sssZ
            const dateStr = singleServiceSelectedDate.toISOString().split('T')[0];
            const startTime = `${dateStr}T${singleServiceSelectedTime}:00.000Z`;

            const requestData = {
                customerId: customerId,
                serviceId: service.id,
                staffId: singleServiceSelectedDoctor.id,
                customerTreatmentSessionId: null,
                customerTreatmentPlanId: null,
                sessionNumber: null,
                startTime: startTime,
                paidAmount: 0,
                typeInvoice: typeInvoiceMap[paymentMethod] || 0,
                paymentStatus: 0,
                voucherId: 0,
                paymentMethod: 'ThanhToanOnline'
            };

            console.log('Creating appointment with payment method:', {
                paymentMethod: paymentMethod,
                requestData: requestData
            });

            const response = await axios.post(
                'http://localhost:5122/api/Appointment/createappointment',
                requestData
            );

            console.log('Appointment creation response:', response.data);

            // Check if status is Success
            if (response.data?.success?.status === 'Success') {
                const typeInvoiceValue = typeInvoiceMap[paymentMethod] || 0;
                const invoiceId = response.data?.success?.invoiceId;
                
                // Only show payment gateway modal if need to pay now (typeInvoice = 1 or 2)
                if (typeInvoiceValue === 1 || typeInvoiceValue === 2) {
                    // Full or partial payment: show payment gateway selection (VNPay/Momo)
                    setCurrentInvoiceId(invoiceId);
                    setShowPaymentGatewayModal(true);
                    setPaymentLoading(false);
                    setPaymentMessage(null);
                    setSingleServiceSelectedPaymentMethod(null);
                } else if (typeInvoiceValue === 0) {
                    // Completion payment: show success message and close modals
                    setPaymentMessage('✓ Đặt lịch khám thành công! Bạn sẽ thanh toán khi hoàn tất dịch vụ.');
                    setTimeout(() => {
                        setShowPaymentModal(false);
                        setSingleServiceSelectedPaymentMethod(null);
                    }, 2000);
                }
            } else {
                setPaymentMessage('❌ Tạo lịch khám thất bại. Vui lòng thử lại.');
                setSingleServiceSelectedPaymentMethod(null);
            }
        } catch (error) {
            console.error('Error creating appointment:', error);
            setPaymentMessage('❌ Lỗi: ' + (error.response?.data?.message || error.message));
            setSingleServiceSelectedPaymentMethod(null);
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleCreateCustomerTreatmentPlan = async (isFullPackage = true) => {
        try {
            console.log('🔔 handleCreateCustomerTreatmentPlan called with isFullPackage:', isFullPackage);
            
            // For single service, create appointment directly
            if (isSingleService) {
                await handleBookingSingleService();
                return;
            }

            // Get user info from localStorage
            let customerId = parseInt(localStorage.getItem('customerId') || 0);
            const staffIdFromStorage = parseInt(localStorage.getItem('staffId') || 0);
            
            // If no customerId found, fallback to staffId from localStorage
            if (!customerId || customerId === 0) {
                customerId = staffIdFromStorage || selectedDoctor?.id || 0;
            }
            
            const staffId = selectedDoctor?.id || staffIdFromStorage || 0;
            const voucherId = 0; // You can add voucher selection later

            if (!selectedPlan) {
                alert('Vui lòng chọn một gói liệu trình');
                return;
            }

            if (!isFullPackage && checkedSessions.size === 0) {
                alert('Vui lòng chọn ít nhất một buổi điều trị');
                return;
            }

            const payload = {
                customerId: customerId,
                staffId: staffId,
                treatmentPlanId: isFullPackage ? selectedPlan.id : 0,
                treatmentSessionIds: isFullPackage ? [] : Array.from(checkedSessions),
                isFullPackage: isFullPackage,
                notes: '',
                voucherId: voucherId
            };

            console.log('Creating customer treatment plan:', {
                customerId: customerId,
                staffId: staffId,
                isFullPackage: isFullPackage,
                payload: payload
            });

            const response = await axios.post(
                'http://localhost:5122/api/CustomerTreatmentPlans/createcustomertreatmentplan',
                payload
            );

            console.log('Response:', response.data);
            console.log('🎉 Setting notification state:', {
                type: 'success',
                title: 'Đặt lịch thành công!',
                message: 'Vui lòng kiểm tra lịch đặt của bạn.'
            });
            setNotification({
                type: 'success',
                title: 'Đặt lịch thành công!',
                message: 'Vui lòng kiểm tra lịch đặt của bạn.'
            });
            
            // Reset selections
            setCheckedSessions(new Set());
            
            // Navigate to services page after delay
            setTimeout(() => {
                navigate('/servicesPage');
            }, 3600);
        } catch (error) {
            console.error('Error creating customer treatment plan:', error);
            setNotification({
                type: 'error',
                title: 'Lỗi',
                message: 'Lỗi khi đặt lịch: ' + (error.response?.data?.message || error.message)
            });
        }
    };

    const handleBookingSingleService = async () => {
        if (!selectedDoctor) {
            setNotification({
                type: 'error',
                title: 'Lỗi',
                message: 'Vui lòng chọn bác sĩ'
            });
            return;
        }

        if (!selectedDate) {
            setNotification({
                type: 'error',
                title: 'Lỗi',
                message: 'Vui lòng chọn ngày'
            });
            return;
        }

        if (!selectedTime) {
            setNotification({
                type: 'error',
                title: 'Lỗi',
                message: 'Vui lòng chọn giờ'
            });
            return;
        }

        try {
            const customerId = parseInt(localStorage.getItem('customerId') || 0);
            const dateStr = selectedDate.toISOString().split('T')[0];
            const startTime = `${dateStr}T${selectedTime}:00.000Z`;

            const requestData = {
                customerId: customerId,
                serviceId: service.id,
                staffId: selectedDoctor.id,
                customerTreatmentSessionId: 0,
                customerTreatmentPlanId: 0,
                sessionNumber: 0,
                startTime: startTime,
                paidAmount: 0,
                typeInvoice: 0,
                paymentStatus: 0,
                voucherId: 0,
                paymentMethod: 'ThanhToanOnline'
            };

            console.log('Creating single service appointment:', requestData);

            const response = await axios.post(
                'http://localhost:5122/api/Appointment/createappointment',
                requestData
            );

            console.log('Appointment response:', response.data);

            // Check if status is Success
            if (response.data?.success?.status === 'Success') {
                setNotification({
                    type: 'success',
                    title: 'Đặt lịch thành công!',
                    message: response.data?.success?.message || 'Lịch hẹn của bạn đã được xác nhận'
                });

                setTimeout(() => {
                    navigate('/servicesPage');
                }, 2000);
            } else {
                setNotification({
                    type: 'error',
                    title: 'Lỗi',
                    message: response.data?.success?.message || 'Tạo lịch khám thất bại. Vui lòng thử lại.'
                });
            }
        } catch (error) {
            console.error('Error creating appointment:', error);
            setNotification({
                type: 'error',
                title: 'Lỗi',
                message: 'Lỗi khi đặt lịch: ' + (error.response?.data?.message || error.message)
            });
        }
    };

    if (loading) {
        return (
            <div className={cx('wrapper')}>
                <div className={cx('loadingContainer')}>
                    <div className={cx('spinner')}></div>
                    <p>Đang tải thông tin dịch vụ...</p>
                </div>
            </div>
        );
    }

    if (!service) {
        return (
            <div className={cx('wrapper')}>
                <div className={cx('errorContainer')}>
                    <p>Không tìm thấy dịch vụ</p>
                    <button onClick={() => navigate(-1)} className={cx('backBtn')}>
                        <FontAwesomeIcon icon={faArrowLeft} /> Quay lại
                    </button>
                </div>
            </div>
        );
    }

    const isCourseService = service?.isCourse === 1 && !isSingleService;

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <div className={cx('wrapper')}>
                {notification && (
                    <NotificationToast
                        message={notification.message}
                        type={notification.type}
                        title={notification.title}
                        onClose={() => setNotification(null)}
                        duration={3500}
                    />
                )}
            {/* Hero Header with Social Proof & Benefits */}
            <div className={cx('headerModern')}>
                <div className={cx('headerBackdrop')}>
                    <div className={cx('animationOrb', 'orb1')}></div>
                    <div className={cx('animationOrb', 'orb2')}></div>
                    <div className={cx('animationOrb', 'orb3')}></div>
                </div>

                <div className={cx('headerContainer')}>
                    <button onClick={() => navigate(-1)} className={cx('headerBack')}>
                        <FontAwesomeIcon icon={faArrowLeft} />
                    </button>

                    <div className={cx('headerContent')}>
                        <div className={cx('headerBranding')}>
                            <span className={cx('headerTag')}>
                                {isCourseService ? '✨ Gói chuyên biệt' : '⭐ Dịch vụ cao cấp'}
                            </span>
                        </div>

                        <h1 className={cx('heroTitle')}>
                            {isSingleService ? service?.serviceName : (selectedPlan?.planName || 'Dịch vụ chăm sóc da cao cấp')}
                        </h1>

                        <div className={cx('serviceMetaHeader')}>
                            {isSingleService ? (
                                <>
                                    <div className={cx('metaItem')}>
                                        <span className={cx('metaLabel')}>Giá:</span>
                                        <span className={cx('metaValue', 'price')}>{service?.priceService?.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                    <div className={cx('metaItem')}>
                                        <span className={cx('metaLabel')}>Thời lượng:</span>
                                        <span className={cx('metaValue')}>{service?.duration} phút</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {selectedPlan?.serviceInfo?.serviceName && (
                                        <div className={cx('metaItem')}>
                                            <span className={cx('metaLabel')}>Dịch vụ:</span>
                                            <span className={cx('metaValue')}>{selectedPlan.serviceInfo.serviceName}</span>
                                        </div>
                                    )}
                                    {selectedPlan?.serviceInfo?.price && (
                                        <div className={cx('metaItem')}>
                                            <span className={cx('metaLabel')}>Giá từng buổi:</span>
                                                                                    <span className={cx('metaValue', 'price')}>{selectedPlan.price.toLocaleString('vi-VN')}đ</span>
                                            
                                        </div>
                                    )}
                                    {selectedPlan?.price && (
                                        <div className={cx('metaItem')}>
                                            <span className={cx('metaLabel')}>Giá gói trọn:</span>
                                            <span className={cx('metaValue')}>{selectedPlan.serviceInfo.price.toLocaleString('vi-VN')}đ</span>
                                        </div>
                                    )}
                                    {selectedPlan?.serviceInfo?.duration && (
                                        <div className={cx('metaItem')}>
                                            <span className={cx('metaLabel')}>Thời lượng:</span>
                                            <span className={cx('metaValue')}>{selectedPlan.serviceInfo.duration} phút/buổi</span>
                                        </div>
                                    )}
                                    {selectedPlan?.totalSessions && (
                                        <div className={cx('metaItem')}>
                                            <span className={cx('metaLabel')}>Số buổi:</span>
                                            <span className={cx('metaValue')}>{selectedPlan.totalSessions} buổi</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {selectedPlan?.serviceInfo?.price && selectedPlan?.price && selectedPlan?.totalSessions && (
                            <div className={cx('savingNotice')}>
                                {(() => {
                                    const singlePrice = selectedPlan.price * selectedPlan.totalSessions; // Giá mua lẻ từng buổi
                                    const bundlePrice = selectedPlan.serviceInfo.price; // Giá trọn gói
                                    const saving = singlePrice - bundlePrice;
                                    const savingPercent = Math.round((saving / singlePrice) * 100);
                                    
                                    return (
                                        <>
                                            <span className={cx('savingIcon')}>💰</span>
                                            <span className={cx('savingText')}>
                                                Mua trọn gói tiết kiệm <strong>{saving.toLocaleString('vi-VN')}đ</strong> ({savingPercent}%) so với mua lẻ
                                            </span>
                                        </>
                                    );
                                })()}
                            </div>
                        )}

                        <p className={cx('heroDescription')}>
                            {service?.description || selectedPlan?.description || 'Liệu trình chắp chải đặc biệt được thiết kế riêng cho từng loại da, mang lại hiệu quả tối đa'}
                        </p>

                        <div className={cx('heroCta')}>
                            <button 
                                className={cx('ctaPrimary')}
                                onClick={() => {
                                    setActiveTab('sessions');
                                    setTimeout(() => {
                                        document.querySelector('[data-tab-content]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }, 100);
                                }}
                            >
                                <FontAwesomeIcon icon={faGift} />
                                Đặt lịch ngay
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className={cx('container')}>
                {/* Service Info Card - Modern Design */}
                <div className={cx('serviceInfoModern')}>
                    <div className={cx('serviceInfoHeader')}>
                        <div className={cx('serviceInfoTitle')}>
                            <h2>Thông tin dịch vụ</h2>
                            <p>Khám phá chi tiết về gói liệu trình này</p>
                        </div>
                    </div>

                    <div className={cx('infoGridModern')}>
                        <div className={cx('infoCardModern')}>
                            <div className={cx('infoCardIcon', 'priceIcon')}>
                                <FontAwesomeIcon icon={faDollarSign} />
                            </div>
                            <div className={cx('infoCardContent')}>
                                <span className={cx('infoCardLabel')}>Giá</span>
                                <span className={cx('infoCardValue')}>
                                    {service.priceService?.toLocaleString('vi-VN')}
                                    <span className={cx('infoCardUnit')}>đ</span>
                                </span>
                                <span className={cx('infoCardDesc')}>Giá/lần sử dụng</span>
                            </div>
                        </div>

                        <div className={cx('infoCardModern')}>
                            <div className={cx('infoCardIcon', 'sessionsIcon')}>
                                <FontAwesomeIcon icon={faFlask} />
                            </div>
                            <div className={cx('infoCardContent')}>
                                <span className={cx('infoCardLabel')}>Số buổi</span>
                                <span className={cx('infoCardValue')}>
                                    {selectedPlan?.totalSessions || (treatmentPlans.length > 0 ? treatmentPlans[0].totalSessions : 0)}
                                </span>
                                <span className={cx('infoCardDesc')}>Buổi điều trị</span>
                            </div>
                        </div>

                        <div className={cx('infoCardModern')}>
                            <div className={cx('infoCardIcon', 'durationIcon')}>
                                <FontAwesomeIcon icon={faCalendarAlt} />
                            </div>
                            <div className={cx('infoCardContent')}>
                                <span className={cx('infoCardLabel')}>Thời gian</span>
                                <span className={cx('infoCardValue')}>
                                    {selectedPlan?.sessionInterval ? selectedPlan.sessionInterval * selectedPlan.totalSessions : 0}
                                    <span className={cx('infoCardUnit')}>Ngày</span>
                                </span>
                                <span className={cx('infoCardDesc')}>Thực hiện toàn bộ</span>
                            </div>
                        </div>

                        <div className={cx('infoCardModern')}>
                            <div className={cx('infoCardIcon', 'packIcon')}>
                                <FontAwesomeIcon icon={faBox} />
                            </div>
                            <div className={cx('infoCardContent')}>
                                <span className={cx('infoCardLabel')}>Tổng gói</span>
                                <span className={cx('infoCardValue')}>
                                    {treatmentPlans.length}
                                </span>
                                <span className={cx('infoCardDesc')}>Gói liệu trình</span>
                            </div>
                        </div>
                    </div>

                    {service.description && (
                        <div className={cx('serviceDescriptionCard')}>
                            <div className={cx('descriptionIcon')}>
                                <FontAwesomeIcon icon={faLightbulb} />
                            </div>
                            <div>
                                <h4>Mô tả chi tiết</h4>
                                <p>{service.description}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tabs Navigation */}
                <div className={cx('tabs')}>
                    <button
                        className={cx('tabBtn', { active: activeTab === 'overview' })}
                        onClick={() => setActiveTab('overview')}
                    >
                        Tổng quan
                    </button>
                    {isSingleService ? (
                        <button
                            className={cx('tabBtn', { active: activeTab === 'booking' })}
                            onClick={() => setActiveTab('booking')}
                        >
                            Đặt lịch
                        </button>
                    ) : (
                        <>
                            <button
                                className={cx('tabBtn', { active: activeTab === 'plans' })}
                                onClick={() => setActiveTab('plans')}
                            >
                                Gói liệu trình
                            </button>
                            <button
                                className={cx('tabBtn', { active: activeTab === 'sessions' })}
                                onClick={() => setActiveTab('sessions')}
                            >
                                Chi tiết liệu trình
                            </button>
                        </>
                    )}
                </div>

                {/* Two Column Layout: Service Details (Left) + Doctors (Right) */}
                <div className={cx('twoColumnLayout')}>
                    {/* Left Column - Tab Content */}
                    <div className={cx('contentColumn')}>
                        <div className={cx('tabContent')} data-tab-content>
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className={cx('tabPane')}>
                            <div className={cx('card')}>
                                <h3>📋 Tổng quan</h3>
                                <div className={cx('overviewGrid')}>
                                    <div className={cx('overviewItem')}>
                                        <span className={cx('label')}>Loại dịch vụ:</span>
                                        <span className={cx('value')}>
                                            {isSingleService ? 'Dịch vụ đơn lẻ' : 'Gói liệu trình'}
                                        </span>
                                    </div>
                                    <div className={cx('overviewItem')}>
                                        <span className={cx('label')}>Tên dịch vụ:</span>
                                        <span className={cx('value')}>{service.serviceName}</span>
                                    </div>
                                    {!isSingleService && (
                                        <div className={cx('overviewItem')}>
                                            <span className={cx('label')}>Gói liệu trình:</span>
                                            <span className={cx('value')}>{selectedPlan.planName}</span>
                                        </div>
                                    )}
                                    <div className={cx('overviewItem')}>
                                        <span className={cx('label')}>Giá dịch vụ:</span>
                                        <span className={cx('value', 'price')}>
                                            {service.priceService?.toLocaleString('vi-VN')} VNĐ
                                            {isSingleService && '/lần'}
                                            {!isSingleService && '/buổi'}
                                        </span>
                                    </div>
                                    {!isSingleService && selectedPlan?.totalSessions && (
                                        <div className={cx('overviewItem')}>
                                            <span className={cx('label')}>Số buổi liệu trình:</span>
                                            <span className={cx('value')}>{selectedPlan?.totalSessions} buổi</span>
                                        </div>
                                    )}
                                </div>
                                {service.description && (
                                    <div className={cx('descriptionBox')}>
                                        <h4>Chi tiết</h4>
                                        <p>{service.description}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Single Service Booking Tab */}
                    {activeTab === 'booking' && isSingleService && (
                        <div className={cx('tabPane')}>
                            <div className={cx('card')}>
                                <h4 style={{marginTop: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '700'}}>
                                    <FontAwesomeIcon icon={faCalendarAlt} />
                                    Đặt lịch dịch vụ
                                </h4>

                                {/* Service Name */}
                                <div style={{marginBottom: '20px'}}>
                                    <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#333'}}>
                                        Dịch vụ:
                                    </label>
                                    <div style={{
                                        padding: '12px',
                                        background: '#f5f5f5',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd',
                                        fontSize: '14px',
                                        color: '#333',
                                        fontWeight: '500'
                                    }}>
                                        {service.serviceName}
                                    </div>
                                </div>

                                {/* Doctor Selector Button */}
                                <div style={{marginBottom: '20px'}}>
                                    <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#333'}}>
                                        <FontAwesomeIcon icon={faUserMd} style={{marginRight: '6px', color: '#1ca07d'}} />
                                        Chọn bác sĩ:
                                    </label>
                                    <button
                                        onClick={() => setShowDoctorSelectorModal(true)}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            background: singleServiceSelectedDoctor ? '#e8f7f3' : '#f5f5f5',
                                            color: singleServiceSelectedDoctor ? '#1ca07d' : '#666',
                                            border: '2px solid ' + (singleServiceSelectedDoctor ? '#1ca07d' : '#ddd'),
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            textAlign: 'left',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        <span>
                                            {singleServiceSelectedDoctor 
                                                ? `✓ ${singleServiceSelectedDoctor.fullName || singleServiceSelectedDoctor.accountName}`
                                                : 'Chọn bác sĩ...'
                                            }
                                        </span>
                                        <FontAwesomeIcon icon={faArrowRight} style={{fontSize: '12px'}} />
                                    </button>
                                </div>

                                {/* Date Picker */}
                                {singleServiceSelectedDoctor && (
                                    <div style={{marginBottom: '20px'}}>
                                        <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#333'}}>
                                            <FontAwesomeIcon icon={faCalendarAlt} style={{marginRight: '6px', color: '#1ca07d'}} />
                                            Chọn ngày:
                                        </label>
                                        <MuiDatePicker
                                            value={singleServiceSelectedDate}
                                            onChange={(newDate) => setSingleServiceSelectedDate(newDate)}
                                            minDate={new Date()}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    size: 'small'
                                                }
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Available Time Slots */}
                                {singleServiceSelectedDate && singleServiceSelectedDoctor && (
                                    <div style={{marginBottom: '20px'}}>
                                        <label style={{display: 'block', marginBottom: '12px', fontWeight: '600', fontSize: '14px', color: '#333'}}>
                                            <FontAwesomeIcon icon={faClock} style={{marginRight: '6px', color: '#1ca07d'}} />
                                            Giờ trống:
                                        </label>
                                        
                                        {loadingSingleServiceTimeSlots ? (
                                            <div style={{textAlign: 'center', padding: '20px', color: '#999'}}>
                                                <div style={{fontSize: '24px', marginBottom: '8px'}}>⏳</div>
                                                <p>Đang tải giờ trống...</p>
                                            </div>
                                        ) : singleServiceAvailableTimeSlots && singleServiceAvailableTimeSlots.length > 0 ? (
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                                                gap: '8px'
                                            }}>
                                                {singleServiceAvailableTimeSlots.map((slot, index) => {
                                                    const slotTime = typeof slot === 'string' ? slot.split('-')[0].trim() : slot.startTime;
                                                    const isSelected = singleServiceSelectedTime === slotTime;
                                                    
                                                    return (
                                                    <button
                                                        key={index}
                                                        onClick={() => setSingleServiceSelectedTime(slotTime)}
                                                        style={{
                                                            padding: '10px',
                                                            background: isSelected ? '#1ca07d' : '#f0faf8',
                                                            color: isSelected ? 'white' : '#1ca07d',
                                                            border: '2px solid ' + (isSelected ? '#1ca07d' : '#1ca07d'),
                                                            borderRadius: '6px',
                                                            fontSize: '13px',
                                                            fontWeight: '600',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.3s ease',
                                                            textAlign: 'center',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!isSelected) {
                                                                e.target.style.background = '#1ca07d';
                                                                e.target.style.color = 'white';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (!isSelected) {
                                                                e.target.style.background = '#f0faf8';
                                                                e.target.style.color = '#1ca07d';
                                                            }
                                                        }}
                                                    >
                                                        {typeof slot === 'string' ? slot : `${slot.startTime} - ${slot.endTime}`}
                                                    </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div style={{textAlign: 'center', padding: '20px', color: '#999', background: '#f5f5f5', borderRadius: '8px'}}>
                                                <p>Không có giờ trống</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Treatment Plans Tab */}
                    {activeTab === 'plans' && isCourseService && (
                        <div className={cx('tabPane')}>
                            <div className={cx('plansGrid')}>
                                {treatmentPlans.length > 0 ? (
                                    treatmentPlans.map((plan, index) => (
                                        <div
                                            key={plan.id}
                                            className={cx('modernPlanCard', {
                                                selected: selectedPlan?.id === plan.id,
                                                featured: index === 0
                                            })}
                                            onClick={() => handlePlanSelect(plan)}
                                        >
                                            {index === 0 && (
                                                <div className={cx('badgeFeatured')}>
                                                    <FontAwesomeIcon icon={faTrophy} />
                                                    Bán chạy nhất
                                                </div>
                                            )}
                                            
                                            <div className={cx('planCardContent')}>
                                                <div className={cx('planCardHeader')}>
                                                    <div className={cx('planCardTitle')}>
                                                        <h3>{plan.planName}</h3>
                                                        {selectedPlan?.id === plan.id && (
                                                            <div className={cx('selectedBadge')}>
                                                                <FontAwesomeIcon icon={faCheck} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {plan.description && (
                                                    <p className={cx('planCardDesc')}>{plan.description}</p>
                                                )}

                                                <div className={cx('statsContainer')}>
                                                    <div className={cx('stat')}>
                                                        <div className={cx('statIcon')}>
                                                            <FontAwesomeIcon icon={faFlask} />
                                                        </div>
                                                        <div className={cx('statContent')}>
                                                            <span className={cx('statLabel')}>Số buổi</span>
                                                            <span className={cx('statValue')}>{plan.totalSessions}</span>
                                                        </div>
                                                    </div>

                                                    <div className={cx('stat')}>
                                                        <div className={cx('statIcon')}>
                                                            <FontAwesomeIcon icon={faCalendarAlt} />
                                                        </div>
                                                        <div className={cx('statContent')}>
                                                            <span className={cx('statLabel')}>Khoảng cách</span>
                                                            <span className={cx('statValue')}>{plan.sessionInterval} ngày</span>
                                                        </div>
                                                    </div>

                                                    <div className={cx('stat')}>
                                                        <div className={cx('statIcon')}>
                                                            <FontAwesomeIcon icon={faClock} />
                                                        </div>
                                                        <div className={cx('statContent')}>
                                                            <span className={cx('statLabel')}>Thời lượng</span>
                                                            <span className={cx('statValue')}>{plan.totalSessions * plan.sessionInterval}d</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className={cx('priceSection')}>
                                                    <span className={cx('priceLabel')}>Giá gói</span>
                                                    <span className={cx('price')}>
                                                        {plan.price?.toLocaleString('vi-VN')}
                                                        <span className={cx('currency')}>đ</span>
                                                    </span>
                                                </div>

                                                <button 
                                                    className={cx('selectPlanBtnModern', {
                                                        selected: selectedPlan?.id === plan.id
                                                    })}
                                                    onClick={() => handlePlanSelect(plan)}
                                                >
                                                    {selectedPlan?.id === plan.id ? (
                                                        <>
                                                            <FontAwesomeIcon icon={faCheck} />
                                                            Thêm vào đặt lịch
                                                        </>
                                                    ) : (
                                                        <>
                                                            Thêm vào đặt lịch
                                                            <FontAwesomeIcon icon={faArrowRight} />
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            <div className={cx('planCardGradient')}></div>
                                        </div>
                                    ))
                                ) : (
                                    <p className={cx('emptyMessage')}>Không có gói liệu trình nào</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Treatment Sessions Tab */}
                    {activeTab === 'sessions' && isCourseService && selectedPlan && (
                        <div className={cx('tabPane')}>
                            <div className={cx('modernSessionsContainer')}>
                                <div className={cx('sessionHeaderInfo')}>
                                    <div className={cx('headerContent')}>
                                        <div className={cx('headerIcon')}>
                                            <FontAwesomeIcon icon={faGem} />
                                        </div>
                                        <div>
                                            <h3>{selectedPlan.planName}</h3>
                                            <p>{selectedPlan.description}</p>
                                        </div>
                                    </div>
                                    <div className={cx('headerStats')}>
                                        <div className={cx('headerStat')}>
                                            <span className={cx('statNum')}>{selectedPlan.totalSessions}</span>
                                            <span className={cx('statText')}>Buổi điều trị</span>
                                        </div>
                                        <div className={cx('statDivider')}></div>
                                        <div className={cx('headerStat')}>
                                            <span className={cx('statNum', 'priceValue')}>
                                                {selectedPlan.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedPlan.price) : '0 ₫'}
                                            </span>
                                            <span className={cx('statText')}>Giá gói</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={cx('sessionsGridLayout')}>
                                    {sessionDetails && sessionDetails.length > 0 ? (
                                        <div className={cx('sessionsGrid')}>
                                            {sessionDetails.map((session, index) => {
                                                // Find products for this session based on sessionNumber or other criteria
                                                const sessionProducts = selectedPlan?.sessionProducts?.filter(
                                                    product => product.serviceId === selectedPlan?.serviceId
                                                ) || [];
                                                
                                                return (
                                                <div key={session.id} className={cx('sessionGridCard')}>
                                                    <div className={cx('sessionGridHeader')}>
                                                        <div className={cx('sessionCheckboxArea')}>
                                                            <input
                                                                type="checkbox"
                                                                id={`session-${session.id}`}
                                                                checked={checkedSessions.has(session.id)}
                                                                onChange={() => handleSessionCheck(session.id)}
                                                                className={cx('sessionCheckbox')}
                                                            />
                                                            <label htmlFor={`session-${session.id}`} className={cx('checkboxLabel')}>
                                                                {checkedSessions.has(session.id) ? (
                                                                    <FontAwesomeIcon icon={faCheckSquare} />
                                                                ) : (
                                                                    <FontAwesomeIcon icon={faSquare} />
                                                                )}
                                                            </label>
                                                        </div>
                                                        <div className={cx('sessionBadgeModern', { checked: checkedSessions.has(session.id) })}>
                                                            <FontAwesomeIcon icon={faBolt} />
                                                            Buổi {session.sessionNumber}
                                                        </div>
                                                    </div>

                                                    <div className={cx('sessionGridContent')}>
                                                        {session.sessionName && (
                                                            <h4>{session.sessionName}</h4>
                                                        )}

                                                        {session.description && (
                                                            <p className={cx('sessionDesc')}>
                                                                {session.description}
                                                            </p>
                                                        )}

                                                        <div className={cx('sessionMetaInfoModern')}>
                                                            {session.duration && (
                                                                <div className={cx('metaItemModern')}>
                                                                    <FontAwesomeIcon icon={faClock} />
                                                                    <span>{session.duration} phút</span>
                                                                </div>
                                                            )}
                                                            <div className={cx('metaItemModern')}>
                                                                <FontAwesomeIcon icon={faCalendarAlt} />
                                                                <span>Ngày {session.sessionNumber * selectedPlan.sessionInterval}</span>
                                                            </div>
                                                        </div>

                                                        {sessionProducts && sessionProducts.length > 0 && (
                                                            <div className={cx('productsGridModern')}>
                                                                <div className={cx('productsHeaderModern')}>
                                                                    <FontAwesomeIcon icon={faGift} />
                                                                    <span>Sản phẩm sử dụng</span>
                                                                </div>
                                                                <div className={cx('productsTagsModern')}>
                                                                    {sessionProducts.map((sp) => (
                                                                        <div key={sp.sessionProductId} className={cx('productTagModern')}>
                                                                            <FontAwesomeIcon icon={faBox} />
                                                                            <span>{sp.productName}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                            })}
                                        </div>
                                    ) : (
                                        <p className={cx('emptyMessage')}>
                                            Chọn một gói liệu trình để xem chi tiết buổi học
                                        </p>
                                    )}
                                </div>

                                <div className={cx('sessionFooter')}>
                                    <button 
                                        className={cx('addToCartBtnLarge')}
                                        onClick={() => {
                                            if (checkedSessions.size === 0) {
                                                // No sessions selected, book full package
                                                handleCreateCustomerTreatmentPlan(true);
                                            } else {
                                                // Some sessions selected, book individual sessions
                                                handleCreateCustomerTreatmentPlan(false);
                                            }
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faGift} />
                                        {checkedSessions.size > 0 
                                            ? `Đặt lịch ${checkedSessions.size} buổi` 
                                            : `Đặt lịch toàn bộ ${selectedPlan.planName}`
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                        </div>
                    </div>

                    {/* Right Column - Doctors Sidebar */}
                    <div className={cx('doctorsSidebar')}>
                        {/* Doctor Detail View */}
                        {selectedDoctor ? (
                            <div className={cx('doctorDetailView')}>
                                {/* Back Button */}
                                <button 
                                    className={cx('doctorDetailBackBtn')}
                                    onClick={handleBackToDoctorsList}
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} />
                                    Quay lại
                                </button>

                                {/* Doctor Large Image */}
                                <div className={cx('doctorDetailImage')}>
                                    {selectedDoctor.staffImage ? (
                                        <img src={`http://localhost:5122/Images/${selectedDoctor.staffImage}`} alt={selectedDoctor.fullName || selectedDoctor.accountName} onError={(e) => { e.target.style.display = 'none'; }} />
                                    ) : (
                                        <div className={cx('doctorImagePlaceholder')}>
                                            <FontAwesomeIcon icon={faUserMd} />
                                        </div>
                                    )}
                                </div>

                                {/* Doctor Detail Info */}
                                <div className={cx('doctorDetailContent')}>
                                    <h2 className={cx('doctorDetailName')}>
                                        {selectedDoctor.fullName || selectedDoctor.accountName}
                                    </h2>
                                    
                                    {selectedDoctor.specialization && (
                                        <p className={cx('doctorDetailSpecialty')}>
                                            {selectedDoctor.specialization}
                                        </p>
                                    )}

                                    {/* Full Details Grid */}
                                    <div className={cx('doctorDetailGrid')}>
                                        {selectedDoctor.degree && (
                                            <div className={cx('detailGridItem')}>
                                                <div className={cx('detailGridIcon')}>
                                                    <FontAwesomeIcon icon={faGraduationCap} />
                                                </div>
                                                <div>
                                                    <span className={cx('detailGridLabel')}>Bằng cấp</span>
                                                    <span className={cx('detailGridValue')}>{selectedDoctor.degree}</span>
                                                </div>
                                            </div>
                                        )}

                                        {selectedDoctor.experienceYears && (
                                            <div className={cx('detailGridItem')}>
                                                <div className={cx('detailGridIcon')}>
                                                    <FontAwesomeIcon icon={faBriefcase} />
                                                </div>
                                                <div>
                                                    <span className={cx('detailGridLabel')}>Kinh nghiệm</span>
                                                    <span className={cx('detailGridValue')}>{selectedDoctor.experienceYears} năm</span>
                                                </div>
                                            </div>
                                        )}

                                        {selectedDoctor.licenseNumber && (
                                            <div className={cx('detailGridItem')}>
                                                <div className={cx('detailGridIcon')}>
                                                    <FontAwesomeIcon icon={faCertificate} />
                                                </div>
                                                <div>
                                                    <span className={cx('detailGridLabel')}>Số giấy phép</span>
                                                    <span className={cx('detailGridValue')}>{selectedDoctor.licenseNumber}</span>
                                                </div>
                                            </div>
                                        )}

                                        {selectedDoctor.doctorLevel !== undefined && selectedDoctor.doctorLevel !== null && (
                                            <div className={cx('detailGridItem')}>
                                                <div className={cx('detailGridIcon')}>
                                                    <FontAwesomeIcon icon={faUserMd} />
                                                </div>
                                                <div>
                                                    <span className={cx('detailGridLabel')}>Chuyên gia</span>
                                                    <span className={cx('detailGridValue')}>
                                                        {selectedDoctor.doctorLevel === 0 ? 'Y tá' : 'Bác sĩ'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Biography */}
                                    {selectedDoctor.biography && (
                                        <div className={cx('doctorDetailBio')}>
                                            <h4>Giới thiệu</h4>
                                            <p>{selectedDoctor.biography}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* Doctors List View */
                            <>
                                <div className={cx('sidebarHeader')}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div className={cx('sidebarIcon')}>
                                            <FontAwesomeIcon icon={faUserMd} />
                                        </div>
                                        <h3>Đội ngũ bác sĩ</h3>
                                    </div>
                                    {doctors && doctors.length > 0 && (
                                        <div className={cx('doctorCountBadge')}>
                                            {doctors.length} bác sĩ
                                        </div>
                                    )}
                                </div>

                                {loadingDoctors ? (
                                    <div className={cx('doctorsSidebarLoading')}>
                                        <div className={cx('spinner')}></div>
                                        <p>Đang tải...</p>
                                    </div>
                                ) : doctors && doctors.length > 0 ? (
                                    <div className={cx('doctorsSidebarList')}>
                                        {doctors.map((doctor, index) => (
                                            <div 
                                                key={doctor.id} 
                                                className={cx('doctorSidebarCard', { 'doctor-selected': selectedDoctor?.id === doctor.id })}
                                                onClick={() => {
                                                    // Always view doctor detail
                                                    setSelectedDoctor(doctor);
                                                    // If it's a single service, also select the doctor for booking
                                                    if (isSingleService) {
                                                        setSingleServiceSelectedDoctor(doctor);
                                                    }
                                                }}
                                                style={{
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    border: selectedDoctor?.id === doctor.id ? '2px solid #1ca07d' : '1px solid #e0e0e0',
                                                    backgroundColor: selectedDoctor?.id === doctor.id ? '#f0faf8' : 'white',
                                                    borderRadius: '12px',
                                                    padding: '12px',
                                                    marginBottom: '12px'
                                                }}
                                            >
                                                {/* Doctor Image */}
                                                <div className={cx('doctorSidebarImage')} style={{marginBottom: '12px'}}>
                                                    {doctor.staffImage ? (
                                                        <img 
                                                            src={`http://localhost:5122/Images/${doctor.staffImage}`} 
                                                            alt={doctor.fullName || doctor.accountName} 
                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                            style={{
                                                                width: '100%',
                                                                height: '120px',
                                                                borderRadius: '8px',
                                                                objectFit: 'cover'
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className={cx('doctorImagePlaceholder')} style={{
                                                            width: '100%',
                                                            height: '120px',
                                                            borderRadius: '8px',
                                                            background: '#e8f7f3',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '40px',
                                                            color: '#1ca07d'
                                                        }}>
                                                            <FontAwesomeIcon icon={faUserMd} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Doctor Info */}
                                                <div className={cx('doctorSidebarInfo')}>
                                                    <h4 className={cx('doctorSidebarName')} style={{
                                                        margin: '0 0 6px 0',
                                                        fontSize: '15px',
                                                        fontWeight: '700',
                                                        color: '#333'
                                                    }}>
                                                        {doctor.fullName || doctor.accountName}
                                                    </h4>
                                                    {doctor.specialization && (
                                                        <p className={cx('doctorSidebarSpecialty')} style={{
                                                            margin: '0 0 8px 0',
                                                            fontSize: '13px',
                                                            color: '#1ca07d',
                                                            fontWeight: '600'
                                                        }}>
                                                            {doctor.specialization}
                                                        </p>
                                                    )}

                                                    {/* Experience & Degree */}
                                                    <div className={cx('doctorSidebarDetails')} style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '1fr 1fr',
                                                        gap: '8px',
                                                        marginTop: '10px',
                                                        paddingTop: '10px',
                                                        borderTop: '1px solid #f0f0f0'
                                                    }}>
                                                        {doctor.experienceYears && (
                                                            <div className={cx('sidebarDetailItem')} style={{
                                                                fontSize: '12px',
                                                                color: '#666'
                                                            }}>
                                                                <FontAwesomeIcon icon={faBriefcase} style={{marginRight: '4px', color: '#1ca07d'}} />
                                                                <span>{doctor.experienceYears}+ năm</span>
                                                            </div>
                                                        )}
                                                        {doctor.degree && (
                                                            <div className={cx('sidebarDetailItem')} style={{
                                                                fontSize: '12px',
                                                                color: '#666'
                                                            }}>
                                                                <FontAwesomeIcon icon={faGraduationCap} style={{marginRight: '4px', color: '#1ca07d'}} />
                                                                <span>{doctor.degree}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* View Details Button */}
                                                    <button
                                                        onClick={() => setSelectedDoctor(doctor)}
                                                        style={{
                                                            width: '100%',
                                                            marginTop: '10px',
                                                            padding: '8px',
                                                            background: selectedDoctor?.id === doctor.id ? '#1ca07d' : '#f5f5f5',
                                                            color: selectedDoctor?.id === doctor.id ? 'white' : '#333',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            fontSize: '12px',
                                                            fontWeight: '600',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.3s ease'
                                                        }}
                                                    >
                                                        {selectedDoctor?.id === doctor.id ? '✓ Đã chọn' : 'Xem chi tiết'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={cx('noDoctorsMessageSidebar')}>
                                        <FontAwesomeIcon icon={faUserMd} />
                                        <p>Chưa có bác sĩ</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Doctor Selector Modal */}
                {showDoctorSelectorModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999
                    }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            maxWidth: '500px',
                            width: '90%',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
                        }}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                                <h3 style={{margin: 0, fontSize: '18px', fontWeight: '700', color: '#333'}}>
                                    <FontAwesomeIcon icon={faUserMd} style={{marginRight: '8px', color: '#1ca07d'}} />
                                    Chọn bác sĩ
                                </h3>
                                <button
                                    onClick={() => setShowDoctorSelectorModal(false)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '24px',
                                        cursor: 'pointer',
                                        color: '#999'
                                    }}
                                >
                                    ×
                                </button>
                            </div>

                            {loadingDoctors ? (
                                <div style={{textAlign: 'center', padding: '40px 20px', color: '#999'}}>
                                    <div style={{fontSize: '32px', marginBottom: '12px'}}>⏳</div>
                                    <p>Đang tải danh sách bác sĩ...</p>
                                </div>
                            ) : doctors && doctors.length > 0 ? (
                                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                                    {doctors.map((doctor) => (
                                        <div
                                            key={doctor.id}
                                            style={{
                                                padding: '16px',
                                                border: singleServiceSelectedDoctor?.id === doctor.id ? '2px solid #1ca07d' : '1px solid #e0e0e0',
                                                borderRadius: '8px',
                                                background: singleServiceSelectedDoctor?.id === doctor.id ? '#f0faf8' : '#fafafa',
                                                transition: 'all 0.3s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px'
                                            }}
                                        >
                                            {/* Doctor Image */}
                                            <div style={{
                                                width: '60px',
                                                height: '60px',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                flexShrink: 0,
                                                background: '#e8f7f3'
                                            }}>
                                                {doctor.staffImage ? (
                                                    <img
                                                        src={`http://localhost:5122/Images/${doctor.staffImage}`}
                                                        alt={doctor.fullName}
                                                        style={{width: '100%', height: '100%', objectFit: 'cover'}}
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <div style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '24px',
                                                        color: '#1ca07d'
                                                    }}>
                                                        <FontAwesomeIcon icon={faUserMd} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Doctor Info */}
                                            <div style={{flex: 1}}>
                                                <h5 style={{margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700', color: '#333'}}>
                                                    {doctor.fullName || doctor.accountName}
                                                </h5>
                                                {doctor.specialization && (
                                                    <p style={{margin: '0 0 6px 0', fontSize: '12px', color: '#1ca07d', fontWeight: '600'}}>
                                                        {doctor.specialization}
                                                    </p>
                                                )}
                                                <div style={{fontSize: '11px', color: '#999', display: 'flex', gap: '12px'}}>
                                                    {doctor.experienceYears && <span>📅 {doctor.experienceYears}+ năm</span>}
                                                    {doctor.degree && <span>🎓 {doctor.degree}</span>}
                                                </div>
                                            </div>

                                            {/* Select Button */}
                                            <button
                                                onClick={() => {
                                                    // Toggle selection: first click selects, second click deselects
                                                    if (singleServiceSelectedDoctor?.id === doctor.id) {
                                                        // Already selected, deselect
                                                        setSingleServiceSelectedDoctor(null);
                                                    } else {
                                                        // Not selected, select
                                                        setSingleServiceSelectedDoctor(doctor);
                                                    }
                                                    // Keep modal open so user can see details and compare doctors
                                                }}
                                                style={{
                                                    padding: '8px 12px',
                                                    background: singleServiceSelectedDoctor?.id === doctor.id ? '#1ca07d' : '#e8e8e8',
                                                    color: singleServiceSelectedDoctor?.id === doctor.id ? 'white' : '#333',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    whiteSpace: 'nowrap',
                                                    flexShrink: 0
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (singleServiceSelectedDoctor?.id !== doctor.id) {
                                                        e.target.style.background = '#1ca07d';
                                                        e.target.style.color = 'white';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (singleServiceSelectedDoctor?.id !== doctor.id) {
                                                        e.target.style.background = '#e8e8e8';
                                                        e.target.style.color = '#333';
                                                    }
                                                }}
                                            >
                                                {singleServiceSelectedDoctor?.id === doctor.id ? '✓ Đã chọn' : 'Chọn'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{textAlign: 'center', padding: '40px 20px', color: '#999'}}>
                                    <p>Không có bác sĩ nào</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Payment Method Modal - Single Service */}
            {showPaymentModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '24px',
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
                    }}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                            <h3 style={{margin: 0, fontSize: '18px', fontWeight: '700', color: '#333'}}>
                                💳 Chọn phương thức thanh toán
                            </h3>
                            <button
                                onClick={() => {
                                    if (!paymentLoading) {
                                        setShowPaymentModal(false);
                                        setSingleServiceSelectedTime(null);
                                        setSingleServiceSelectedPaymentMethod(null);
                                        setPaymentMessage(null);
                                    }
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: paymentLoading ? 'not-allowed' : 'pointer',
                                    color: '#999',
                                    opacity: paymentLoading ? 0.5 : 1
                                }}
                                disabled={paymentLoading}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{
                            paddingBottom: '16px',
                            marginBottom: '16px',
                            borderBottom: '1px solid #f0f0f0',
                            fontSize: '14px',
                            color: '#666'
                        }}>
                            <p style={{margin: 0, marginBottom: '8px'}}>
                                <strong>Dịch vụ:</strong> {service?.serviceName}
                            </p>
                            <p style={{margin: 0, marginBottom: '8px'}}>
                                <strong>Bác sĩ:</strong> {singleServiceSelectedDoctor?.fullName || singleServiceSelectedDoctor?.accountName}
                            </p>
                            <p style={{margin: 0, marginBottom: '8px'}}>
                                <strong>Ngày:</strong> {singleServiceSelectedDate?.toLocaleDateString('vi-VN')}
                            </p>
                            <p style={{margin: 0}}>
                                <strong>Giờ:</strong> {singleServiceSelectedTime}
                            </p>
                        </div>

                        {paymentMessage && (
                            <div style={{
                                padding: '12px 16px',
                                borderRadius: '8px',
                                marginBottom: '16px',
                                fontSize: '14px',
                                background: paymentMessage.includes('✓') ? '#e8f7f3' : '#fee',
                                color: paymentMessage.includes('✓') ? '#1ca07d' : '#c33',
                                border: '1px solid ' + (paymentMessage.includes('✓') ? '#c2e8e0' : '#fcc')
                            }}>
                                {paymentMessage}
                            </div>
                        )}

                        {paymentLoading && (
                            <div style={{
                                textAlign: 'center',
                                padding: '20px',
                                marginBottom: '16px',
                                background: '#f5f5f5',
                                borderRadius: '8px'
                            }}>
                                <div style={{fontSize: '24px', marginBottom: '8px'}}>⏳</div>
                                <p style={{margin: 0, color: '#666', fontSize: '14px'}}>Đang xử lý thanh toán...</p>
                            </div>
                        )}

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            marginBottom: '16px'
                        }}>
                            {/* Payment Method 1: Partial Payment */}
                            <label style={{
                                padding: '16px',
                                border: singleServiceSelectedPaymentMethod === 'partial' ? '2px solid #1ca07d' : '1px solid #e0e0e0',
                                borderRadius: '8px',
                                background: singleServiceSelectedPaymentMethod === 'partial' ? '#f0faf8' : '#fafafa',
                                cursor: paymentLoading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                opacity: paymentLoading ? 0.6 : 1
                            }}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="partial"
                                    checked={singleServiceSelectedPaymentMethod === 'partial'}
                                    onChange={() => setSingleServiceSelectedPaymentMethod('partial')}
                                    disabled={paymentLoading}
                                    style={{cursor: 'pointer', width: '16px', height: '16px'}}
                                />
                                <div style={{flex: 1}}>
                                    <div style={{fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '4px'}}>
                                        💳 Trả trước 1 phần
                                    </div>
                                    <div style={{fontSize: '12px', color: '#666'}}>
                                    Thanh toán một phần trước khi dịch vụ bắt đầu
                                    </div>
                                </div>
                            </label>

                            {/* Payment Method 2: Full Payment */}
                            <label style={{
                                padding: '16px',
                                border: singleServiceSelectedPaymentMethod === 'full' ? '2px solid #1ca07d' : '1px solid #e0e0e0',
                                borderRadius: '8px',
                                background: singleServiceSelectedPaymentMethod === 'full' ? '#f0faf8' : '#fafafa',
                                cursor: paymentLoading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                opacity: paymentLoading ? 0.6 : 1
                            }}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="full"
                                    checked={singleServiceSelectedPaymentMethod === 'full'}
                                    onChange={() => setSingleServiceSelectedPaymentMethod('full')}
                                    disabled={paymentLoading}
                                    style={{cursor: 'pointer', width: '16px', height: '16px'}}
                                />
                                <div style={{flex: 1}}>
                                    <div style={{fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '4px'}}>
                                        ✅ Trả trước toàn bộ
                                    </div>
                                    <div style={{fontSize: '12px', color: '#666'}}>
                                        Thanh toán 100% ngay lập tức
                                    </div>
                                </div>
                            </label>

                            {/* Payment Method 3: Payment After Completion */}
                            <label style={{
                                padding: '16px',
                                border: singleServiceSelectedPaymentMethod === 'completion' ? '2px solid #1ca07d' : '1px solid #e0e0e0',
                                borderRadius: '8px',
                                background: singleServiceSelectedPaymentMethod === 'completion' ? '#f0faf8' : '#fafafa',
                                cursor: paymentLoading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                opacity: paymentLoading ? 0.6 : 1
                            }}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="completion"
                                    checked={singleServiceSelectedPaymentMethod === 'completion'}
                                    onChange={() => setSingleServiceSelectedPaymentMethod('completion')}
                                    disabled={paymentLoading}
                                    style={{cursor: 'pointer', width: '16px', height: '16px'}}
                                />
                                <div style={{flex: 1}}>
                                    <div style={{fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '4px'}}>
                                        🎯 Thanh toán khi hoàn thành
                                    </div>
                                    <div style={{fontSize: '12px', color: '#666'}}>
                                        Thanh toán 100% sau khi dịch vụ hoàn tất
                                    </div>
                                </div>
                            </label>
                        </div>

                        <div style={{display: 'flex', gap: '12px'}}>
                            <button
                                onClick={() => {
                                    if (!paymentLoading) {
                                        setShowPaymentModal(false);
                                        setSingleServiceSelectedTime(null);
                                        setSingleServiceSelectedPaymentMethod(null);
                                        setPaymentMessage(null);
                                    }
                                }}
                                disabled={paymentLoading}
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    background: '#f5f5f5',
                                    color: '#333',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: paymentLoading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    opacity: paymentLoading ? 0.6 : 1
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                disabled={!singleServiceSelectedPaymentMethod || paymentLoading}
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    background: (singleServiceSelectedPaymentMethod && !paymentLoading) ? '#1ca07d' : '#ccc',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: (singleServiceSelectedPaymentMethod && !paymentLoading) ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {paymentLoading ? '⏳ Đang xử lý...' : '✓ Xác nhận'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Gateway Selection Modal (VNPay/Momo) */}
            {showPaymentGatewayModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    backdropFilter: 'blur(2px)'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '40px 36px',
                        maxWidth: '420px',
                        width: '90%',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                        border: '1px solid rgba(0, 0, 0, 0.05)'
                    }}>
                        <h3 style={{
                            margin: '0 0 32px 0',
                            fontSize: '20px',
                            fontWeight: '700',
                            color: '#1a1a1a',
                            textAlign: 'center',
                            letterSpacing: '-0.3px'
                        }}>
                            Chọn Phương Thức Thanh Toán
                        </h3>

                        <div style={{marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
                            {[
                                { value: 'vnpay', label: '💳 VNPay', desc: 'Thanh toán trực tuyến an toàn' },
                                { value: 'momo', label: '📱 Momo', desc: 'Ví điện tử phổ biến' }
                            ].map((option) => (
                                <label
                                    key={option.value}
                                    onClick={() => setSelectedPaymentGateway(option.value)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '14px 16px',
                                        background: selectedPaymentGateway === option.value ? '#f0f7f4' : '#fafafa',
                                        border: selectedPaymentGateway === option.value ? '1.5px solid #1ca07d' : '1px solid #e8e8e8',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        position: 'relative'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selectedPaymentGateway !== option.value) {
                                            e.currentTarget.style.background = '#f5f5f5';
                                            e.currentTarget.style.borderColor = '#d8d8d8';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedPaymentGateway !== option.value) {
                                            e.currentTarget.style.background = '#fafafa';
                                            e.currentTarget.style.borderColor = '#e8e8e8';
                                        }
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="paymentGateway"
                                        value={option.value}
                                        checked={selectedPaymentGateway === option.value}
                                        onChange={() => setSelectedPaymentGateway(option.value)}
                                        style={{
                                            marginRight: '14px',
                                            width: '20px',
                                            height: '20px',
                                            cursor: 'pointer',
                                            accentColor: '#1ca07d'
                                        }}
                                    />
                                    <div style={{flex: 1}}>
                                        <div style={{
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            color: '#1a1a1a',
                                            marginBottom: '3px'
                                        }}>
                                            {option.label}
                                        </div>
                                        <div style={{
                                            fontSize: '13px',
                                            color: '#666',
                                            fontWeight: '400'
                                        }}>
                                            {option.desc}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {paymentGatewayMessage && (
                            <div style={{
                                marginBottom: '24px',
                                padding: '12px 14px',
                                background: paymentGatewayMessage.includes('❌') ? '#fef2f2' : '#f0fdf6',
                                color: paymentGatewayMessage.includes('❌') ? '#c41e3a' : '#15803d',
                                border: `1px solid ${paymentGatewayMessage.includes('❌') ? '#fee2e2' : '#dcfce7'}`,
                                borderRadius: '10px',
                                fontSize: '13px',
                                lineHeight: '1.5',
                                fontWeight: '500',
                                textAlign: 'center'
                            }}>
                                {paymentGatewayMessage}
                            </div>
                        )}

                        <div style={{display: 'flex', gap: '10px', marginTop: '28px'}}>
                            <button
                                onClick={() => {
                                    setShowPaymentGatewayModal(false);
                                    setSelectedPaymentGateway(null);
                                    setCurrentInvoiceId(null);
                                    setPaymentGatewayMessage(null);
                                    setShowPaymentModal(true);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '11px 16px',
                                    background: '#f8f8f8',
                                    color: '#555',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#f0f0f0';
                                    e.currentTarget.style.borderColor = '#d0d0d0';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#f8f8f8';
                                    e.currentTarget.style.borderColor = '#e0e0e0';
                                }}
                            >
                                Quay Lại
                            </button>
                        </div>
                    </div>
                </div>
            )}

            </div>
        </LocalizationProvider>
    );
}

export default ServiceDetailsPage;
