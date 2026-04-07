import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './ServicesPage.module.scss';
import classNames from 'classnames/bind';
import { useLocation } from 'react-router-dom';
import ServicePackageCard from './ServicePackageCard';
import DoctorCard from './DoctorCard';
import BookingSummary from './BookingSummary';
import BookingSuccessNotification from './BookingSuccessNotification';
import TimeSlotPicker from './TimeSlotPicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faTimes, faCheckCircle, faClock, faCalendarAlt, faGift, faStar, faUsers, faFlask, faUserMd, faArrowRight, faSearch, faTrophy, faBriefcase, faTrash, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { PLACEHOLDER_IMAGE } from '~/utils/placeholderImage';

const cx = classNames.bind(styles);

const APPOINTMENT_TIMES = [
    // Morning: 08:00 - 12:00
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00',
    // Afternoon: 13:00 - 18:00
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00'
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
    const [treatmentPlanDeleteConfirmation, setTreatmentPlanDeleteConfirmation] = useState({ open: false, planId: null, planName: null, planIndex: null });
    
    // New state for doctor availability time slots
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
    const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
    const [doctorAvailabilityError, setDoctorAvailabilityError] = useState(null);
    const [selectedSessionForBooking, setSelectedSessionForBooking] = useState(null); // Track which session is being booked

    const location = useLocation();
    const [isSingleServiceBooking, setIsSingleServiceBooking] = useState(false);

    useEffect(() => {
        // Check if serviceType is passed from ServicesListPage - SINGLE SERVICE BOOKING MODE
        if (location.state?.serviceType) {
            console.log('🎯 SINGLE SERVICE BOOKING MODE - Fetching services for serviceType:', location.state.serviceType);
            setIsSingleServiceBooking(true);
            setDoctors([]); // Clear old doctors
            setCustomerTreatmentPlans([]); // Clear old treatment plans
            fetchServicesByType(location.state.serviceType);
        } else {
            // TREATMENT PLAN MODE - Fetch customer treatment plans and doctors
            console.log('📋 TREATMENT PLAN MODE - Fetching customer treatment plans');
            setIsSingleServiceBooking(false);
            setServices([]); // Clear services from single mode
            setFilteredServices([]); // Clear filtered services
            fetchCustomerTreatmentPlans();
        }
    }, [location.state]);

    const fetchServicesByType = async (serviceType) => {
        try {
            setIsLoading(true);
            const payload = {
                isDoctor: false,
                servicetypeId: serviceType
            };
            console.log('📤 Calling Service/getservicelist with payload:', payload);
            const response = await axios.post(
                'http://localhost:5122/api/Service/getservicelist',
                payload
            );
            console.log('✅ Services fetched:', response.data);
            
            // Handle different response formats
            let servicesData = [];
            if (Array.isArray(response.data)) {
                servicesData = response.data;
            } else if (response.data?.result && Array.isArray(response.data.result)) {
                servicesData = response.data.result;
            } else if (response.data?.baseDatas && Array.isArray(response.data.baseDatas)) {
                servicesData = response.data.baseDatas;
            }
            
            if (servicesData.length > 0) {
                setServices(servicesData);
                setFilteredServices(servicesData);
                console.log('✅ Services set:', servicesData);
                
                // Also fetch staff for single service booking
                await fetchStaffForSingleService(serviceType);
            } else {
                console.warn('⚠️ No services returned from API');
            }
        } catch (error) {
            console.error('❌ Error fetching services:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStaffForSingleService = async (serviceType) => {
        try {
            const payload = {
                isDoctor: false,
                servicetypeId: serviceType
            };
            console.log('📤 Calling Staff/get-list with payload:', payload);
            const response = await axios.post(
                'http://localhost:5122/api/Staff/get-list',
                payload
            );
            console.log('✅ Staff fetched:', response.data);
            
            // Handle response format
            let staffData = [];
            if (response.data?.baseDatas && Array.isArray(response.data.baseDatas)) {
                staffData = response.data.baseDatas;
            }
            
            if (staffData.length > 0) {
                // Format staff data similar to how we do for treatment plans
                const formattedDoctors = staffData.map(staff => ({
                    staffId: staff.id,
                    doctorID: staff.id,
                    doctorName: staff.fullName || 'Nhân viên',
                    image: staff.staffImage ? `http://localhost:5122/Images/${staff.staffImage}` : PLACEHOLDER_IMAGE,
                    specialty: staff.specialization || 'Nhân viên',
                    rating: 4.8,
                    reviews: 120,
                    experience: staff.experienceYears || 0,
                    email: '',
                    phone: staff.phone || '',
                    degree: staff.degree || '',
                    licenseNumber: staff.licenseNumber || '',
                    biography: staff.biography || '',
                    serviceTypeId: serviceType,
                    ...staff
                }));
                setDoctors(formattedDoctors);
                console.log('✅ Staff formatted and set:', formattedDoctors);
            } else {
                console.warn('⚠️ No staff returned from API');
                setDoctors([]);
            }
        } catch (error) {
            console.error('❌ Error fetching staff:', error);
            setDoctors([]);
        }
    };
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

    // Auto-fetch doctor availability after 3 seconds when both doctor and sessions are selected
    useEffect(() => {
        // If no doctor selected → clear time slots
        if (!selectedDoctor) {
            setAvailableTimeSlots([]);
            setSelectedSessionForBooking(null);
            return;
        }

        // Check if there are any selected sessions (from checkbox selection)
        const hasSelectedSessions = Object.values(selectedSessions).some(arr => arr && arr.length > 0);
        
        // If no sessions selected → clear time slots
        if (!hasSelectedSessions) {
            setAvailableTimeSlots([]);
            setSelectedSessionForBooking(null);
            return;
        }

        // Set 3-second debounce timer
        const timer = setTimeout(() => {
            // Find the first selected session across all plans
            let firstSession = null;
            let planIndex = -1;

            for (let pIdx = 0; pIdx < customerTreatmentPlans.length; pIdx++) {
                if (selectedSessions[pIdx] && selectedSessions[pIdx].length > 0) {
                    // Extract session index from first selected session key (format: "0-0" = planIndex-sessionIndex)
                    const firstSessionKey = selectedSessions[pIdx][0];
                    const [, sessionIndexStr] = firstSessionKey.split('-');
                    const sessionIndex = parseInt(sessionIndexStr);
                    
                    const plan = customerTreatmentPlans[pIdx];
                    const session = plan?.customerSessions?.[sessionIndex];
                    
                    if (session) {
                        firstSession = { planIndex: pIdx, sessionIndex };
                        break;
                    }
                }
            }

            if (!firstSession) {
                console.log('No valid session found');
                return;
            }

            // Get date from inlineBookings if user selected a date, otherwise use today
            const sessionKey = `${firstSession.planIndex}-${firstSession.sessionIndex}`;
            const selectedDateFromInput = inlineBookings[sessionKey]?.date;
            
            let dateString;
            if (selectedDateFromInput) {
                dateString = selectedDateFromInput;  // Use date chosen by user
            } else {
                // Fallback: use today's date
                const today = new Date();
                dateString = today.toISOString().split('T')[0];
            }

            console.log('Auto-fetching doctor availability:', {
                doctorId: selectedDoctor.staffId,
                planIndex: firstSession.planIndex,
                sessionIndex: firstSession.sessionIndex,
                date: dateString,
                source: selectedDateFromInput ? 'user-selected' : 'today'
            });

            // Call API with the first selected session
            fetchDoctorAvailability(
                selectedDoctor.staffId,
                firstSession.planIndex,
                firstSession.sessionIndex,
                dateString
            );
        }, 3000);

        // Cleanup: clear timeout if dependencies change before 3 seconds
        return () => clearTimeout(timer);
    }, [selectedDoctor, selectedSessions, customerTreatmentPlans]);

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
                                    image: doctor.staffImage ? `http://localhost:5122/Images/${doctor.staffImage}` : PLACEHOLDER_IMAGE,
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
            // DONT FETCH IF IN SINGLE SERVICE BOOKING MODE
            if (isSingleServiceBooking) {
                console.log('⏭️ Skipping fetchCustomerTreatmentPlans - Single Service Booking Mode');
                return;
            }

            // ALSO SKIP if location.state has serviceType (indicating single service mode)
            if (location.state?.serviceType) {
                console.log('⏭️ Skipping fetchCustomerTreatmentPlans - location.state has serviceType');
                return;
            }

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

            // Fetch plans with both statuses: ChoDatLich and DangThucHien
            const [responseChoDatLich, responseDangThucHien] = await Promise.all([
                axios.post(
                    'http://localhost:5122/api/CustomerTreatmentPlans/getcustomertreatmentplanlist',
                    {
                        customerId: customerId,
                        status: 'ChoDatLich'
                    }
                ),
                axios.post(
                    'http://localhost:5122/api/CustomerTreatmentPlans/getcustomertreatmentplanlist',
                    {
                        customerId: customerId,
                        status: 'DangThucHien'
                    }
                )
            ]);

            // Merge results from both API calls
            const allPlans = [
                ...(responseChoDatLich.data?.baseDatas || []),
                ...(responseDangThucHien.data?.baseDatas || [])
            ];

            console.log('Customer treatment plans response (ChoDatLich):', responseChoDatLich.data);
            console.log('Customer treatment plans response (DangThucHien):', responseDangThucHien.data);

            if (allPlans.length > 0) {
                // Remove duplicates based on customerTreatmentPlanInformation ID
                const uniquePlans = Array.from(
                    new Map(allPlans.map(plan => [plan.customerTreatmentPlanInformation?.id, plan])).values()
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
            setSuccessMessage('Đặt lịch thành công! Vui lòng kiểm tra lịch đặt của bạn.');
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

    const handleDeleteTreatmentPlan = (planId, planName, planIndex) => {
        setTreatmentPlanDeleteConfirmation({ open: true, planId, planName, planIndex });
    };

    const confirmDeleteTreatmentPlan = async () => {
        const { planId, planName, planIndex } = treatmentPlanDeleteConfirmation;
        setTreatmentPlanDeleteConfirmation({ open: false, planId: null, planName: null, planIndex: null });

        try {
            setIsLoading(true);
            const response = await axios.post(
                'http://localhost:5122/api/CustomerTreatmentPlans/deletecustomertreatmentplan',
                { id: planId }
            );
            console.log('Delete treatment plan response:', response.data);
            
            setSuccessMessage(`Xóa gói liệu trình thành công!`);
            
            // Refresh treatment plans
            await fetchCustomerTreatmentPlans();
            
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Delete treatment plan error:', error);
            setSuccessMessage('Lỗi khi xóa gói liệu trình: ' + error.message);
            setTimeout(() => setSuccessMessage(null), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const cancelDeleteTreatmentPlan = () => {
        setTreatmentPlanDeleteConfirmation({ open: false, planId: null, planName: null, planIndex: null });
    };

    // Fetch doctor availability time slots
    const fetchDoctorAvailability = async (doctorId, planIndex, sessionIndex, dateString) => {
        if (!doctorId || !dateString) return;
        
        setLoadingTimeSlots(true);
        setDoctorAvailabilityError(null);
        setAvailableTimeSlots([]);

        try {
            const plan = customerTreatmentPlans[planIndex];
            const session = plan?.customerSessions?.[sessionIndex];
            
            if (!session) {
                setDoctorAvailabilityError('Không tìm thấy buổi khám');
                return;
            }

            // Debug: Log full objects to see structure
            console.log('🔍 Full Plan Object:', plan);
            console.log('🔍 Full Session Object:', session);
            console.log('🔍 Plan IDs:', {
                'plan.id': plan?.id,
                'plan.customerTreatmentPlanInformation?.id': plan?.customerTreatmentPlanInformation?.id,
                'plan.planId': plan?.planId,
                'plan.customerTreatmentPlanInformation': plan?.customerTreatmentPlanInformation
            });
            console.log('🔍 Session IDs:', {
                'session.id': session?.id,
                'session.sessionId': session?.sessionId,
                'session.customerSessionId': session?.customerSessionId,
                'session.customerTreatmentSessionId': session?.customerTreatmentSessionId
            });

            // Format date to YYYY-MM-DD
            const date = new Date(dateString);
            const formattedDate = date.toISOString().split('T')[0];

            // Extract correct IDs
            const customerSessionId = session?.id || session?.sessionId || session?.customerSessionId || session?.customerTreatmentSessionId;
            const customerPlanId = plan?.customerTreatmentPlanInformation?.id || plan?.id || plan?.planId;

            const requestData = {
                doctorId: parseInt(doctorId),
                customerTreatmentSessionId: customerSessionId,
                customerTreatmentPlanId: customerPlanId,
                sessionNumber: session?.sessionNumber,
                date: formattedDate
            };

            console.log('📋 FINAL Payload being sent:', JSON.stringify(requestData, null, 2));

            const response = await fetch('http://localhost:5122/api/Appointment/getdoctoravailability', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            console.log('✅ Doctor availability response status:', response.status);

            if (!response.ok) {
                throw new Error('Lỗi khi lấy giờ trống bác sĩ');
            }

            const result = await response.json();
            setAvailableTimeSlots(result.availableTimeSlots || []);
            
            setSelectedSessionForBooking({
                planIndex,
                sessionIndex,
                doctorId,
                dateString: formattedDate,
                serviceDuration: result.serviceDuration || 60
            });
        } catch (error) {
            console.error('Error fetching doctor availability:', error);
            setDoctorAvailabilityError('Không thể tải giờ trống bác sĩ: ' + error.message);
        } finally {
            setLoadingTimeSlots(false);
        }
    };


    // Handle time slot selection from TimeSlotPicker grid
    const handleTimeSlotSelect = (slot) => {
        if (!selectedSessionForBooking) return;

        const { planIndex, sessionIndex, dateString } = selectedSessionForBooking;
        const sessionKey = `${planIndex}-${sessionIndex}`;
        const dateTimeString = `${dateString}T${slot.startTime}`;

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
                sessionName: session?.sessionName,
                selectedTimeSlot: slot // Store selected slot info
            }
        }));

        // Show success message
        setSuccessMessage(`✓ Đã chọn giờ ${slot.startTime} - ${slot.endTime}`);
        setTimeout(() => setSuccessMessage(null), 2000);
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
        
        // Morning: 08:00 - 12:00
        if (hour >= 8 && hour < 12) return true;
        // Afternoon: 13:00 - 18:00
        if (hour >= 13 && hour < 18) return true;
        
        return false;
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

    // Get minimum date for date input (today or tomorrow if after business hours)
    const getMinDate = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        let day = String(now.getDate()).padStart(2, '0');
        
        // Check if current time is after business hours (after 4:30 PM = 16:30)
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // If after 16:30 (4:30 PM), next available date is tomorrow
        if (currentHour > 16 || (currentHour === 16 && currentMinute > 30)) {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const nextYear = tomorrow.getFullYear();
            const nextMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
            const nextDay = String(tomorrow.getDate()).padStart(2, '0');
            return `${nextYear}-${nextMonth}-${nextDay}`;
        }
        
        return `${year}-${month}-${day}`;
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

    // Handle date selection - updates selectedSessionForBooking and triggers API re-fetch
    const handleDateChange = (dateString) => {
        if (!dateString) return;
        if (!selectedSessionForBooking) return;

        // Update selectedSessionForBooking with new date for API call
        setSelectedSessionForBooking(prev => ({
            ...prev,
            dateString: dateString
        }));

        // Clear previous time slots - they will be re-fetched for new date
        setAvailableTimeSlots([]);
        setDoctorAvailabilityError(null);

        // Immediately fetch doctor availability for the new date
        console.log('📅 Date changed to:', dateString, 'Fetching availability immediately...');
        fetchDoctorAvailability(
            selectedDoctor.staffId || selectedDoctor.doctorID,
            selectedSessionForBooking.planIndex,
            selectedSessionForBooking.sessionIndex,
            dateString
        );
    };

    // Store date when user selects it in inline booking input
    const handleSelectDateOnly = (planIndex, sessionIndex, dateString) => {
        const sessionKey = `${planIndex}-${sessionIndex}`;
        setInlineBookings(prev => ({
            ...prev,
            [sessionKey]: {
                ...prev[sessionKey],
                date: dateString
            }
        }));
    };

    // Remove inline booking
    const handleRemoveInlineBooking = (sessionKey) => {
        setInlineBookings(prev => {
            const updated = { ...prev };
            delete updated[sessionKey];
            return updated;
        });
    };

    // Get maximum datetime for datetime-local input (16:30 on the selected date or later)
    const getMaxDateTime = (selectedDateObj) => {
        if (!selectedDateObj) return '';
        
        const year = selectedDateObj.getFullYear();
        const month = String(selectedDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDateObj.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}T16:30`;
    };

    // Generate session info for appointment creation
    const getSelectedSessionInfo = () => {
        if (!selectedSessionForBooking || !selectedDoctor) return null;

        const customerId = parseInt(localStorage.getItem('customerId') || 0);
        const { planIndex, sessionIndex, dateString } = selectedSessionForBooking;
        const sessionKey = `${planIndex}-${sessionIndex}`;
        const plan = customerTreatmentPlans[planIndex];
        const session = plan?.customerSessions?.[sessionIndex];

        if (!session || !plan) return null;

        // Get the selected time from inlineBookings (e.g., "08:30")
        const selectedSlot = inlineBookings[sessionKey]?.selectedTimeSlot;
        const timeString = selectedSlot?.startTime || '08:00:00'; // Fallback to 08:00:00 if no time selected
        
        const startDateTime = new Date(`${dateString}T${timeString}Z`).toISOString();

        console.log('📋 Session Info - Date:', dateString, 'Time:', timeString, 'StartTime ISO:', startDateTime);

        return {
            customerId: customerId,
            staffId: selectedDoctor.staffId || selectedDoctor.doctorID,
            customerTreatmentSessionId: session.id || session.sessionId || session.customerSessionId,
            customerTreatmentPlanId: plan.customerTreatmentPlanInformation?.id || plan.id || plan.planId,
            sessionNumber: session.sessionNumber,
            startTime: startDateTime
        };
    };

    const handleBooking = async (paymentData = {}) => {
        // Get payment method from modal
        const { paymentMethod, appointmentCreated } = paymentData;

        if (!selectedService || !selectedDoctor || !selectedDate || !selectedTime) {
            setSuccessMessage('⚠️ Vui lòng chọn đầy đủ thông tin');
            return;
        }

        if (!paymentMethod) {
            setSuccessMessage('⚠️ Vui lòng chọn phương thức thanh toán');
            return;
        }

        // If appointment already created by BookingSummary API call, show success and return
        if (appointmentCreated) {
            const paymentMethodText = {
                'partial': 'Trả trước 1 phần (30%)',
                'full': 'Trả trước toàn bộ (100%)',
                'completion': 'Thanh toán khi hoàn thành'
            };
            
            setSuccessMessage(`✓ Đặt lịch khám thành công! Phương thức thanh toán: ${paymentMethodText[paymentMethod]}. Bác sĩ sẽ xác nhận trong vòng 2 giờ.`);
            setTimeout(() => {
                setSelectedService(null);
                setSelectedDoctor(null);
                setSelectedDate(null);
                setSelectedTime(null);
                setSuccessMessage(null);
            }, 3000);
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
                    paymentMethod: paymentMethod,
                }),
            });

            const responseData = await response.json();
            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');

            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            // Map payment method to display text
            const paymentMethodText = {
                'partial': 'Trả trước 1 phần (30%)',
                'full': 'Trả trước toàn bộ (100%)',
                'completion': 'Thanh toán khi hoàn thành'
            };

            setSuccessMessage(`✓ Đặt lịch khám thành công! Phương thức thanh toán: ${paymentMethodText[paymentMethod] || paymentMethod}. Bác sĩ sẽ xác nhận trong vòng 2 giờ.`);
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
            {successMessage && (
                <BookingSuccessNotification 
                    message={successMessage}
                    onClose={() => setSuccessMessage(null)}
                    duration={4000}
                />
            )}
            <div className={cx('container')}>
                {/* TREATMENT PLAN MODE - Original Multi-Panel Layout */}
                {!isSingleServiceBooking && (
                    <>
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
                                                <div className={cx('planTitleWrapper')}>
                                                    <h3 className={cx('planTitle')}>
                                                        {plan.treatmentPlanInformation?.planName}
                                                    </h3>
                                                    <span className={cx('statusBadge', plan.customerTreatmentPlanInformation?.status?.toLowerCase())}>
                                                        {plan.customerTreatmentPlanInformation?.status === 'ChoDatLich' && '⏳ Chờ đặt lịch'}
                                                        {plan.customerTreatmentPlanInformation?.status === 'DangThucHien' && '🔄 Đang thực hiện'}
                                                        {plan.customerTreatmentPlanInformation?.status === 'HoanTat' && '✓ Hoàn tất'}
                                                    </span>
                                                </div>
                                                <button 
                                                    className={cx('deletePlanBtn')}
                                                    onClick={() => handleDeleteTreatmentPlan(
                                                        plan.customerTreatmentPlanInformation?.id, 
                                                        plan.treatmentPlanInformation?.planName,
                                                        index
                                                    )}
                                                    title="Xóa gói liệu trình"
                                                >
                                                    <FontAwesomeIcon icon={faTimes} />
                                                </button>
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
                                                                                type="date"
                                                                                className={cx('sessionDateTimeInput')}
                                                                                value={inlineBookings[sessionKey]?.date || ''}
                                                                                onChange={(e) => {
                                                                                    e.stopPropagation();
                                                                                    if (selectedSessionForBooking?.planIndex === index && selectedSessionForBooking?.sessionIndex === idx) {
                                                                                        handleDateChange(e.target.value);
                                                                                    }
                                                                                    handleSelectDateOnly(index, idx, e.target.value);
                                                                                }}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                placeholder="Chọn ngày"
                                                                                min={getMinDate()}
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

                                                            {/* Time Slot Picker - Show when date is selected */}
                                                            {selectedSessionForBooking && selectedSessionForBooking.planIndex === index && selectedSessionForBooking.sessionIndex === idx && (
                                                                <div className={cx('timeSlotPickerWrapper')}>
                                                                    <TimeSlotPicker 
                                                                        availableTimeSlots={availableTimeSlots}
                                                                        loading={loadingTimeSlots}
                                                                        error={doctorAvailabilityError}
                                                                        selectedSlot={inlineBookings[sessionKey]?.selectedTimeSlot}
                                                                        onSlotSelect={handleTimeSlotSelect}
                                                                        serviceDuration={selectedSessionForBooking?.serviceDuration}
                                                                    />
                                                                </div>
                                                            )}

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
                                                {(plan.customerTreatmentPlanInformation?.status === 'ChoDatLich' || plan.customerTreatmentPlanInformation?.status === 'DangThucHien') && (plan.customerSessions?.some(s => s.status === 'ChoDatLich' || s.status === 'DangThucHien') || false) && (
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
                                                    onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
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
                            customerId={parseInt(localStorage.getItem('customerId') || 0)}
                            selectedSessionInfo={getSelectedSessionInfo()}
                        />
                    </div>
                </div>
                </>
                )}
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

            {/* Delete Confirmation Modal for Treatment Plan */}
            <Dialog
                open={treatmentPlanDeleteConfirmation.open}
                onClose={cancelDeleteTreatmentPlan}
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
                    Xác nhận xóa gói liệu trình
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
                            Bạn có chắc chắn muốn xóa gói liệu trình <strong>"{treatmentPlanDeleteConfirmation.planName}"</strong>?
                        </p>
                        <div style={{
                            background: 'rgba(255, 107, 107, 0.1)',
                            border: '1px solid rgba(255, 107, 107, 0.2)',
                            borderRadius: '10px',
                            padding: '12px 16px',
                            marginTop: '16px'
                        }}>
                            <p style={{
                                margin: '0 0 8px 0',
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
                                Tất cả buổi điều trị sẽ bị xóa
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
                        onClick={cancelDeleteTreatmentPlan}
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
                        onClick={confirmDeleteTreatmentPlan}
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
                        {isLoading ? 'Đang xóa...' : 'Xóa gói'}
                    </Button>
                </DialogActions>
            </Dialog>

        </div>
    );
}

export default ServicesPage;
