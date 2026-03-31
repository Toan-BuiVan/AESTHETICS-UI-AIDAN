import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './BookingSuccessNotification.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimes } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function BookingSuccessNotification({ message, onClose, duration = 4000 }) {
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsClosing(true);
            setTimeout(() => {
                onClose();
            }, 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    return (
        <div className={cx('notification-overlay')}>
            <div className={cx('notification', { closing: isClosing })}>
                {/* Background Gradient */}
                <div className={cx('notification-bg')}></div>

                {/* Content */}
                <div className={cx('notification-content')}>
                    {/* Icon Section */}
                    <div className={cx('icon-section')}>
                        <div className={cx('icon-wrapper')}>
                            <FontAwesomeIcon icon={faCheckCircle} className={cx('success-icon')} />
                            <div className={cx('icon-ring')}></div>
                        </div>
                    </div>

                    {/* Text Section */}
                    <div className={cx('text-section')}>
                        <h3 className={cx('notification-title')}>Thành công!</h3>
                        <p className={cx('notification-message')}>{message}</p>
                    </div>

                    {/* Close Button */}
                    <button className={cx('close-btn')} onClick={handleClose} title="Đóng">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className={cx('progress-bar')}></div>

                {/* Decorative Elements */}
                <div className={cx('decoration', 'decoration-1')}></div>
                <div className={cx('decoration', 'decoration-2')}></div>
            </div>
        </div>
    );
}

export default BookingSuccessNotification;
