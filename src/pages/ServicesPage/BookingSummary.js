import React from 'react';
import classNames from 'classnames/bind';
import styles from './BookingSummary.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faClock, faUser, faTasks } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function BookingSummary({ selectedService, selectedDoctor, selectedDate, selectedTime, onBooking, isLoading }) {
    const isComplete = selectedService && selectedDoctor && selectedDate && selectedTime;

    const formatDate = (date) => {
        if (!date) return 'Chưa chọn';
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    };

    const totalPrice = (selectedService?.priceService || selectedService?.totalPrice || 0);

    return (
        <div className={cx('summary')}>
            <div className={cx('header')}>
                <h2>Tóm tắt đặt lịch</h2>
            </div>

            <div className={cx('summaryItems')}>
                <div className={cx('item', { filled: !!selectedService })}>
                    <div className={cx('icon')}>
                        <FontAwesomeIcon icon={faTasks} />
                    </div>
                    <div className={cx('itemContent')}>
                        <span className={cx('label')}>Dịch vụ</span>
                        <span className={cx('value')}>
                            {selectedService?.serviceName || 'Chưa chọn dịch vụ'}
                        </span>
                    </div>
                </div>

                <div className={cx('item', { filled: !!selectedDoctor })}>
                    <div className={cx('icon')}>
                        <FontAwesomeIcon icon={faUser} />
                    </div>
                    <div className={cx('itemContent')}>
                        <span className={cx('label')}>Bác sĩ</span>
                        <span className={cx('value')}>
                            {selectedDoctor?.doctorName || selectedDoctor?.name || 'Chưa chọn bác sĩ'}
                        </span>
                    </div>
                </div>

                <div className={cx('item', { filled: !!selectedDate })}>
                    <div className={cx('icon')}>
                        <FontAwesomeIcon icon={faCalendarAlt} />
                    </div>
                    <div className={cx('itemContent')}>
                        <span className={cx('label')}>Ngày khám</span>
                        <span className={cx('value', 'date')}>{formatDate(selectedDate)}</span>
                    </div>
                </div>

                <div className={cx('item', { filled: !!selectedTime })}>
                    <div className={cx('icon')}>
                        <FontAwesomeIcon icon={faClock} />
                    </div>
                    <div className={cx('itemContent')}>
                        <span className={cx('label')}>Giờ khám</span>
                        <span className={cx('value')}>
                            {selectedTime || 'Chưa chọn giờ'}
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
                ) : (
                    'Đặt lịch khám'
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
