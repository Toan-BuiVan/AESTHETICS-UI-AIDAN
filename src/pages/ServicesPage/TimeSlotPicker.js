import React from 'react';
import classNames from 'classnames/bind';
import styles from './TimeSlotPicker.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function TimeSlotPicker({ 
    availableTimeSlots, 
    loading, 
    error, 
    selectedSlot, 
    onSlotSelect,
    serviceDuration 
}) {
    if (loading) {
        return (
            <div className={cx('timeSlotPicker')}>
                <div className={cx('loadingContainer')}>
                    <FontAwesomeIcon icon={faSpinner} className={cx('spinner')} />
                    <p>Đang tải giờ trống...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cx('timeSlotPicker')}>
                <div className={cx('errorContainer')}>
                    <p className={cx('errorText')}>⚠️ {error}</p>
                </div>
            </div>
        );
    }

    if (!availableTimeSlots || availableTimeSlots.length === 0) {
        return (
            <div className={cx('timeSlotPicker')}>
                <div className={cx('emptyContainer')}>
                    <p className={cx('emptyText')}>Không có giờ trống để đặt lịch</p>
                </div>
            </div>
        );
    }

    // Group time slots by availability
    const availableSlots = availableTimeSlots.filter(slot => slot.isAvailable);
    const unavailableSlots = availableTimeSlots.filter(slot => !slot.isAvailable);

    return (
        <div className={cx('timeSlotPicker')}>
            <div className={cx('pickerHeader')}>
                <h4 className={cx('pickerTitle')}>
                    Chọn giờ khám
                    <span className={cx('durationBadge')}>{serviceDuration} phút</span>
                </h4>
                <p className={cx('pickerSubtitle')}>
                    {availableSlots.length} giờ trống
                </p>
            </div>

            {/* Available Slots Grid */}
            <div className={cx('slotsContainer')}>
                <div className={cx('availableGroup')}>
                    <div className={cx('slotGrid')}>
                        {availableSlots.map((slot, idx) => (
                            <button
                                key={idx}
                                className={cx('timeSlot', {
                                    available: true,
                                    selected: selectedSlot?.startTime === slot.startTime
                                })}
                                onClick={() => onSlotSelect(slot)}
                                title={`${slot.startTime} - ${slot.endTime}`}
                            >
                                <span className={cx('slotTime')}>
                                    {slot.startTime}
                                </span>
                                <span className={cx('slotEnd')}>
                                    {slot.endTime}
                                </span>
                                {selectedSlot?.startTime === slot.startTime && (
                                    <FontAwesomeIcon 
                                        icon={faCheckCircle} 
                                        className={cx('checkIcon')} 
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Unavailable Slots */}
                {unavailableSlots.length > 0 && (
                    <div className={cx('unavailableGroup')}>
                        <span className={cx('unavailableLabel')}>Giờ đã được đặt</span>
                        <div className={cx('slotGrid', 'unavailable')}>
                            {unavailableSlots.map((slot, idx) => (
                                <div
                                    key={idx}
                                    className={cx('timeSlot', { unavailable: true })}
                                    title={`${slot.startTime} - ${slot.endTime} (Đã đặt)`}
                                >
                                    <span className={cx('slotTime')}>
                                        {slot.startTime}
                                    </span>
                                    <span className={cx('slotEnd')}>
                                        {slot.endTime}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TimeSlotPicker;
