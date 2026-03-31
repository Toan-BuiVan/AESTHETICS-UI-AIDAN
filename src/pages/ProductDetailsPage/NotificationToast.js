import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './NotificationToast.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimes, faExclamationCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

const NotificationToast = ({ 
    message, 
    type = 'success', 
    duration = 3500, 
    title = '',
    onClose 
}) => {
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (duration) {
            const timer = setTimeout(() => {
                setIsClosing(true);
                setTimeout(() => {
                    onClose && onClose();
                }, 300);
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return faCheckCircle;
            case 'error':
                return faExclamationCircle;
            case 'info':
                return faInfoCircle;
            default:
                return faCheckCircle;
        }
    };

    const getTitle = () => {
        if (title) return title;
        switch (type) {
            case 'success':
                return 'Thành công!';
            case 'error':
                return 'Lỗi';
            case 'info':
                return 'Thông tin';
            default:
                return '';
        }
    };

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose && onClose();
        }, 300);
    };

    return (
        <div className={cx('toast-container')}>
            <div className={cx('toast', `toast-${type}`, { closing: isClosing })}>
                <FontAwesomeIcon icon={getIcon()} className={cx('toast-icon')} />
                <div className={cx('toast-content')}>
                    {getTitle() && <h4 className={cx('toast-title')}>{getTitle()}</h4>}
                    <p className={cx('toast-message')}>{message}</p>
                </div>
                <button 
                    className={cx('toast-close')} 
                    onClick={handleClose}
                    type="button"
                    aria-label="Close notification"
                >
                    <FontAwesomeIcon icon={faTimes} />
                </button>
                <div className={cx('toast-progress')} />
            </div>
        </div>
    );
};

export default NotificationToast;
