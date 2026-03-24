import React from 'react';
import classNames from 'classnames/bind';
import styles from './BookingSummary.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faClock, faUser, faTasks, faCheckCircle, faTrash, faUserMd } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function BookingSummary({ selectedService, selectedDoctor, selectedDate, selectedTime, onBooking, isLoading, inlineBookings = {}, onRemoveBooking, selectedTreatmentSessions = [], onRemoveTreatmentSession, customerTreatmentPlans = [] }) {
    const inlineBookingsList = Object.values(inlineBookings);
    const isComplete = (selectedService || selectedTreatmentSessions.length > 0) && selectedDoctor && (selectedDate || inlineBookingsList.length > 0) && (selectedTime || inlineBookingsList.length > 0);
    
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
                onClick={onBooking}
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
        </div>
    );
}

export default BookingSummary;
