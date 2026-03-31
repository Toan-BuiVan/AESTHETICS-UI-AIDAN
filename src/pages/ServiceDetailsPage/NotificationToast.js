import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './NotificationToast.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimes, faExclamationCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function NotificationToast({ 
    message, 
    type = 'success', 
    duration = 3500, 
    onClose,
    title = null 
}) {
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsClosing(true);
            setTimeout(() => {
                onClose?.();
            }, 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose?.();
        }, 300);
    };

    const getIcon = () => {
        switch (type) {
            case 'error':
                return faExclamationCircle;
            case 'info':
                return faInfoCircle;
            default:
                return faCheckCircle;
        }
    };

    return (
        <div className={cx('toast-container')}>
            <div className={cx('toast', `toast-${type}`, { closing: isClosing })}>
                <div className={cx('toast-icon')}>
                    <FontAwesomeIcon icon={getIcon()} />
                </div>
                
                <div className={cx('toast-content')}>
                    {title && <h4 className={cx('toast-title')}>{title}</h4>}
                    <p className={cx('toast-message')}>{message}</p>
                </div>

                <button 
                    className={cx('toast-close')} 
                    onClick={handleClose}
                    aria-label="Close"
                >
                    <FontAwesomeIcon icon={faTimes} />
                </button>

                <div className={cx('toast-progress')}></div>
            </div>
        </div>
    );
}

export default NotificationToast;
