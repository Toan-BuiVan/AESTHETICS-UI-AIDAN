import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faExclamationCircle, faInfoCircle, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';

import styles from './SuccessMessage.scss';

const cx = classNames.bind(styles);

function SuccessMessage({ message, type = 'success', duration = 3000 }) {
    const [isVisible, setIsVisible] = useState(!!message);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (message) {
            setIsVisible(true);
            setIsExiting(false);

            const timer = setTimeout(() => {
                setIsExiting(true);
                const exitTimer = setTimeout(() => {
                    setIsVisible(false);
                }, 300); // Match animation duration
                return () => clearTimeout(exitTimer);
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [message, duration]);

    if (!isVisible) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return faCheckCircle;
            case 'error':
                return faTimesCircle;
            case 'warning':
                return faExclamationCircle;
            case 'info':
                return faInfoCircle;
            default:
                return faCheckCircle;
        }
    };

    const displayMessage = message || 'Đang tải...';

    return (
        <div className={cx('success', type, { exiting: isExiting })}>
            <div className={cx('content-success')}>
                <FontAwesomeIcon className={cx('success-icon')} icon={getIcon()} />
                <h4 className={cx('message-text')}>{displayMessage}</h4>
                <button
                    className={cx('close-btn')}
                    onClick={() => {
                        setIsExiting(true);
                        setTimeout(() => setIsVisible(false), 300);
                    }}
                    aria-label="Close notification"
                >
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>
        </div>
    );
}

export default SuccessMessage;
