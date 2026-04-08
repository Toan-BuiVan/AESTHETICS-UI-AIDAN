import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './BookingSummary.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faClock, faUser, faTasks, faCheckCircle, faTrash, faUserMd, faTimes } from '@fortawesome/free-solid-svg-icons';
import useDebounce from '../../hooks/useDebounce';

const cx = classNames.bind(styles);

function BookingSummary({ selectedService, selectedDoctor, selectedDate, selectedTime, onBooking, isLoading, inlineBookings = {}, onRemoveBooking, selectedTreatmentSessions = [], onRemoveTreatmentSession, customerTreatmentPlans = [], customerId, selectedSessionInfo = null }) {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentMessage, setPaymentMessage] = useState(null);
    
    // Payment Gateway Selection Modal (VNPay/Momo)
    const [showPaymentGatewayModal, setShowPaymentGatewayModal] = useState(false);
    const [selectedPaymentGateway, setSelectedPaymentGateway] = useState(null);
    const debouncedPaymentGateway = useDebounce(selectedPaymentGateway, 3000);
    const [currentInvoiceId, setCurrentInvoiceId] = useState(null);
    const [paymentGatewayMessage, setPaymentGatewayMessage] = useState(null);
    const [paymentGatewayLoading, setPaymentGatewayLoading] = useState(false);
    const inlineBookingsList = Object.values(inlineBookings);
    const isComplete = (selectedService || selectedTreatmentSessions.length > 0) && selectedDoctor && (selectedDate || inlineBookingsList.length > 0) && (selectedTime || inlineBookingsList.length > 0);
    
    // Debounce payment method selection with 3 second delay
    useEffect(() => {
        if (!selectedPaymentMethod || !selectedSessionInfo) {
            return;
        }

        setPaymentLoading(true);
        setPaymentMessage(null);

        // Set up debounce timer - 3 second delay
        const debounceTimer = setTimeout(() => {
            handleCreateAppointment(selectedPaymentMethod);
        }, 3000);

        // Cleanup function to clear timer if component unmounts or selection changes
        return () => clearTimeout(debounceTimer);
    }, [selectedPaymentMethod, selectedSessionInfo]);
    
    // Handle booking with payment method
    const handleBookingClick = () => {
        setShowPaymentModal(true);
        setSelectedPaymentMethod(null);
    };

    // Handle payment gateway selection (VNPay/Momo) with 3s debounce
    useEffect(() => {
        if (!selectedPaymentGateway || !debouncedPaymentGateway || !currentInvoiceId) {
            return;
        }

        if (debouncedPaymentGateway === 'vnpay') {
            setPaymentGatewayLoading(true);
            console.log('Calling VNPay API with invoiceId:', currentInvoiceId);
            
            fetch('http://localhost:5122/api/InvoicePayment/vnpay/create-payment-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ invoiceId: currentInvoiceId })
            }).then(response => response.json()).then(data => {
                console.log('VNPay response:', data);
                
                if (data?.success === true && data?.data?.paymentUrl) {
                    const paymentUrl = data.data.paymentUrl;
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
            fetch('http://localhost:5122/api/InvoicePayment/momo/create-payment-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ invoiceId: currentInvoiceId })
            }).then(response => response.json()).then(data => {
                if (data?.success === true && data?.data?.paymentUrl) {
                    const paymentUrl = data.data.paymentUrl;
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

    const handlePaymentMethodSelect = (method) => {
        setSelectedPaymentMethod(method);
        setPaymentMessage(null);
    };

    const handleCreateAppointment = async (paymentMethod) => {
        if (!selectedSessionInfo) {
            setPaymentMessage('❌ Không có thông tin buổi khám');
            setPaymentLoading(false);
            return;
        }

        try {
            const {
                customerId: cId,
                staffId,
                customerTreatmentSessionId,
                customerTreatmentPlanId,
                sessionNumber,
                startTime
            } = selectedSessionInfo;

            // Map payment method to typeInvoice
            const typeInvoiceMap = {
                'completion': 0,  // 0 = trả sau (thanh toán khi hoàn thành)
                'full': 1,        // 1 = trả trước toàn bộ (100%)
                'partial': 2      // 2 = thanh toán 1 phần (30%)
            };

            // Determine actual payment method for API
            // When user selects "full" or "partial", use "ThanhToanOnline" for online payment
            // Otherwise, use "TienMat" for cash payment
            let apiPaymentMethod = 'ThanhToanOnline';
            if (paymentMethod === 'full' || paymentMethod === 'partial') {
                apiPaymentMethod = 'ThanhToanOnline';
            }

            // Extract serviceId from treatment plan
            const serviceId = customerTreatmentPlans && customerTreatmentPlanId
                ? customerTreatmentPlans.find(plan => plan.customerTreatmentPlanInformation?.id === customerTreatmentPlanId)?.treatmentPlanInformation?.serviceId
                : null;

            const requestData = {
                serviceId: serviceId,
                customerId: cId,
                staffId: staffId,
                customerTreatmentSessionId: customerTreatmentSessionId,
                customerTreatmentPlanId: customerTreatmentPlanId,
                sessionNumber: sessionNumber,
                startTime: startTime,
                paidAmount: 0,
                paymentMethod: apiPaymentMethod,
                typeInvoice: typeInvoiceMap[paymentMethod] || 0,
                voucherId: null
            };

            console.log(`📋 Creating appointment with ${paymentMethod} payment (API method: ${apiPaymentMethod}):`, requestData);

            const response = await fetch('http://localhost:5122/api/Appointment/createappointment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();
            
            console.log(`✅ Appointment creation response (${paymentMethod}):`, result);

            // Check if status is Success
            if (result?.success?.status === 'Success') {
                const typeInvoiceValue = typeInvoiceMap[paymentMethod] || 0;
                const invoiceId = result?.success?.invoiceId;
                
                // Only show payment gateway modal if need to pay now (typeInvoice = 1 or 2)
                if (typeInvoiceValue === 1 || typeInvoiceValue === 2) {
                    // Full or partial payment: show payment gateway selection (VNPay/Momo)
                    setCurrentInvoiceId(invoiceId);
                    setShowPaymentGatewayModal(true);
                    setPaymentLoading(false);
                    setPaymentMessage(null);
                    setSelectedPaymentMethod(null);
                } else if (typeInvoiceValue === 0) {
                    // Completion payment: show success message and close modals
                    setPaymentMessage('✓ Đặt lịch khám thành công! Bạn sẽ thanh toán khi hoàn tất dịch vụ.');
                    setTimeout(() => {
                        setShowPaymentModal(false);
                        setSelectedPaymentMethod(null);
                        onBooking();
                    }, 2000);
                }
            } else {
                setPaymentMessage('❌ Tạo lịch khám thất bại. Vui lòng thử lại.');
                setSelectedPaymentMethod(null);
            }
        } catch (error) {
            console.error('Error creating appointment:', error);
            setPaymentMessage('❌ Lỗi: ' + error.message);
            setSelectedPaymentMethod(null);
        } finally {
            setPaymentLoading(false);
        }
    };
    
    // Calculate total price including treatment sessions
    let totalPrice = (selectedService?.priceService || selectedService?.totalPrice || 0);
    
    // Group selected treatment sessions by plan
    const sessionsByPlan = {};
    selectedTreatmentSessions.forEach(session => {
        if (!sessionsByPlan[session.planIndex]) {
            sessionsByPlan[session.planIndex] = [];
        }
        sessionsByPlan[session.planIndex].push(session);
    });
    
    // Add prices from selected treatment sessions
    Object.entries(sessionsByPlan).forEach(([planIndex, sessions]) => {
        const plan = customerTreatmentPlans[parseInt(planIndex)];
        if (!plan) return;
        
        const totalSessions = plan.treatmentPlanInformation?.totalSessions || 0;
        const selectedCount = sessions.length;
        
        // If all sessions in the plan are selected, use service price
        if (selectedCount === totalSessions) {
            totalPrice += (plan.serviceInformation?.price || plan.serviceInformation?.totalPrice || 0);
        } else {
            // If only partial sessions, use per-session price
            const perSessionPrice = plan.treatmentPlanInformation?.price || 0;
            totalPrice += perSessionPrice * selectedCount;
        }
    });
    
    // Calculate completed steps including treatment sessions
    const completedSteps = [
        !!selectedService || selectedTreatmentSessions.length > 0,  // Dịch vụ
        !!selectedDoctor,  // Bác sĩ
        !!selectedDate || inlineBookingsList.length > 0,    // Ngày (or treatment sessions with datetime)
        !!selectedTime || inlineBookingsList.length > 0     // Giờ (or treatment sessions with datetime)
    ].filter(Boolean).length;
    
    const progressPercentage = (completedSteps / 4) * 100;

    const formatDate = (date) => {
        if (!date) return 'Chưa chọn';
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    };

    // Get date and time from inline bookings if not set via regular selection
    const displayDate = selectedDate || (inlineBookingsList.length > 0 ? new Date(inlineBookingsList[0].dateTime) : null);
    const displayTime = selectedTime || (inlineBookingsList.length > 0 ? new Date(inlineBookingsList[0].dateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : null);

    return (
        <div className={cx('summary')}>
            <div className={cx('header')}>
                <h2>Tóm tắt đặt lịch</h2>
                <span className={cx('progressText')}>{completedSteps}/4</span>
            </div>

            {/* Progress Bar */}
            <div className={cx('progressSection')}>
                <div className={cx('progressBar')}>
                    <div 
                        className={cx('progressFill')} 
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
                <div className={cx('progressDots')}>
                    <div className={cx('dot', { active: !!selectedService || selectedTreatmentSessions.length > 0 })} title="Dịch vụ">📋</div>
                    <div className={cx('dot', { active: !!selectedDoctor })} title="Bác sĩ">👨‍⚕️</div>
                    <div className={cx('dot', { active: !!selectedDate || inlineBookingsList.length > 0 })} title="Ngày">📅</div>
                    <div className={cx('dot', { active: !!selectedTime || inlineBookingsList.length > 0 })} title="Giờ">🕐</div>
                </div>
            </div>

            <div className={cx('divider')}></div>

            <div className={cx('summaryItems')}>
                <div className={cx('item', { filled: !!selectedService || selectedTreatmentSessions.length > 0, completed: !!selectedService || selectedTreatmentSessions.length > 0 })}>
                    <div className={cx('icon')}>
                        <FontAwesomeIcon icon={faTasks} />
                        {(selectedService || selectedTreatmentSessions.length > 0) && <FontAwesomeIcon icon={faCheckCircle} className={cx('checkIcon')} />}
                    </div>
                    <div className={cx('itemContent')}>
                        <span className={cx('label')}>Dịch vụ</span>
                        <span className={cx('value')}>
                            {selectedService?.serviceName || (selectedTreatmentSessions.length > 0 ? `${selectedTreatmentSessions.length} buổi điều trị` : 'Chưa chọn dịch vụ')}
                        </span>
                        {selectedTreatmentSessions.length > 0 && (
                            <div className={cx('treatmentSessionsList')}>
                                {selectedTreatmentSessions.map((session, idx) => {
                                    const sessionKey = `${session.planIndex}-${session.sessionIndex}`;
                                    const bookingInfo = inlineBookings[sessionKey];
                                    const hasDateTime = bookingInfo?.dateTime;
                                    
                                    return (
                                        <div key={idx} className={cx('treatmentSessionItem', { withDateTime: hasDateTime })}>
                                            <div className={cx('sessionHeaderInfo')}>
                                                <span className={cx('sessionPlanName')}>
                                                    📋 {session.planName}
                                                </span>
                                                <span className={cx('sessionLabel')}>
                                                    Buổi {session.sessionNumber}{session.sessionName ? ': ' + session.sessionName : ''}
                                                </span>
                                            </div>
                                            {hasDateTime && (
                                                <div className={cx('sessionDateTimeInfo')}>
                                                    <div className={cx('dateTimeRow')}>
                                                        <FontAwesomeIcon icon={faCalendarAlt} className={cx('dateTimeIcon')} />
                                                        <span className={cx('dateTimeValue')}>
                                                            {new Date(bookingInfo.dateTime).toLocaleDateString('vi-VN', { 
                                                                weekday: 'short', 
                                                                year: 'numeric', 
                                                                month: 'long', 
                                                                day: 'numeric' 
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className={cx('dateTimeRow')}>
                                                        <FontAwesomeIcon icon={faClock} className={cx('dateTimeIcon')} />
                                                        <span className={cx('dateTimeValue')}>
                                                            {new Date(bookingInfo.dateTime).toLocaleTimeString('vi-VN', { 
                                                                hour: '2-digit', 
                                                                minute: '2-digit' 
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            <button
                                                className={cx('removeTreatmentSessionBtn')}
                                                onClick={() => onRemoveTreatmentSession(session.planIndex, session.sessionIndex)}
                                                title="Xóa"
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className={cx('item', { filled: !!selectedDoctor, completed: !!selectedDoctor })}>
                    <div className={cx('icon')}>
                        <FontAwesomeIcon icon={faUser} />
                        {selectedDoctor && <FontAwesomeIcon icon={faCheckCircle} className={cx('checkIcon')} />}
                    </div>
                    <div className={cx('itemContent')}>
                        <span className={cx('label')}>Bác sĩ</span>
                        <span className={cx('value')}>
                            {selectedDoctor?.doctorName || selectedDoctor?.name || 'Chưa chọn bác sĩ'}
                        </span>
                    </div>
                </div>

                <div className={cx('item', { filled: !!displayDate, completed: !!displayDate })}>
                    <div className={cx('icon')}>
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        {displayDate && <FontAwesomeIcon icon={faCheckCircle} className={cx('checkIcon')} />}
                    </div>
                    <div className={cx('itemContent')}>
                        <span className={cx('label')}>Ngày khám</span>
                        <span className={cx('value', 'date')}>{formatDate(displayDate)}</span>
                    </div>
                </div>

                <div className={cx('item', { filled: !!displayTime, completed: !!displayTime })}>
                    <div className={cx('icon')}>
                        <FontAwesomeIcon icon={faClock} />
                        {displayTime && <FontAwesomeIcon icon={faCheckCircle} className={cx('checkIcon')} />}
                    </div>
                    <div className={cx('itemContent')}>
                        <span className={cx('label')}>Giờ khám</span>
                        <span className={cx('value')}>
                            {displayTime || 'Chưa chọn giờ'}
                        </span>
                    </div>
                </div>
            </div>

            <div className={cx('priceSection')}>
                <div className={cx('priceRow')}>
                    <span>Giá dịch vụ:</span>
                    <span className={cx('price')}>
                        {totalPrice.toLocaleString('vi-VN')} VNĐ
                    </span>
                </div>
            </div>

            <button
                className={cx('bookingBtn', { disabled: !isComplete, loading: isLoading })}
                onClick={handleBookingClick}
                disabled={!isComplete || isLoading}
            >
                {isLoading ? (
                    <>
                        <span className={cx('spinner')}></span>
                        Đang xử lý...
                    </>
                ) : isComplete ? (
                    <>
                        <FontAwesomeIcon icon={faCheckCircle} />
                        Đặt lịch khám
                    </>
                ) : (
                    'Hoàn thiện để đặt lịch'
                )}
            </button>

            {!isComplete && (
                <p className={cx('note')}>
                    ⚠️ Vui lòng chọn đầy đủ dịch vụ, bác sĩ, ngày và giờ để đặt lịch
                </p>
            )}

            {/* Payment Method Modal */}
            {showPaymentModal && (
                <div className={cx('paymentModalOverlay')}>
                    <div className={cx('paymentModal')}>
                        <div className={cx('paymentModalHeader')}>
                            <h3>Chọn phương thức thanh toán</h3>
                            <button
                                className={cx('closeBtn')}
                                onClick={() => setShowPaymentModal(false)}
                                title="Đóng"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        <div className={cx('paymentModalContent')}>
                            {paymentMessage && (
                                <div className={cx('paymentMessage', { 
                                    success: paymentMessage.includes('✓'), 
                                    error: paymentMessage.includes('❌') 
                                })}>
                                    {paymentMessage}
                                </div>
                            )}
                            {paymentLoading && (
                                <div className={cx('paymentLoadingContainer')}>
                                    <span className={cx('paymentSpinner')}></span>
                                    <span>Đang tạo lịch khám...</span>
                                </div>
                            )}
                            <div className={cx('paymentMethods')}>
                                {/* Payment Method 1 */}
                                <label className={cx('paymentMethodOption', { selected: selectedPaymentMethod === 'partial' })}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="partial"
                                        checked={selectedPaymentMethod === 'partial'}
                                        onChange={() => handlePaymentMethodSelect('partial')}
                                    />
                                    <div className={cx('methodContent')}>
                                        <span className={cx('methodTitle')}>💳 Trả trước 1 phần</span>
                                        <span className={cx('methodDescription')}>Thanh toán một phần trước khi dịch vụ bắt đầu</span>
                                    </div>
                                </label>

                                {/* Payment Method 2 */}
                                <label className={cx('paymentMethodOption', { selected: selectedPaymentMethod === 'full' })}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="full"
                                        checked={selectedPaymentMethod === 'full'}
                                        onChange={() => handlePaymentMethodSelect('full')}
                                    />
                                    <div className={cx('methodContent')}>
                                        <span className={cx('methodTitle')}>✅ Trả trước toàn bộ</span>
                                        <span className={cx('methodDescription')}>Thanh toán 100% ngay lập tức</span>
                                    </div>
                                </label>

                                {/* Payment Method 3 */}
                                <label className={cx('paymentMethodOption', { selected: selectedPaymentMethod === 'completion' })}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="completion"
                                        checked={selectedPaymentMethod === 'completion'}
                                        onChange={() => handlePaymentMethodSelect('completion')}
                                    />
                                    <div className={cx('methodContent')}>
                                        <span className={cx('methodTitle')}>🎯 Thanh toán khi hoàn thành</span>
                                        <span className={cx('methodDescription')}>Thanh toán 100% sau khi dịch vụ hoàn tất</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className={cx('paymentModalFooter')}>
                            <button
                                className={cx('cancelBtn')}
                                onClick={() => setShowPaymentModal(false)}
                                disabled={paymentLoading}
                            >
                                Hủy
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

                    </div>
                </div>
            )}
        </div>
    );
}

export default BookingSummary;
