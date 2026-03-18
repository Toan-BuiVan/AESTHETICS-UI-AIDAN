import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

import styles from './SuccessMessage.scss';

const cx = classNames.bind(styles);

function SuccessMessage({ message }) {
    const displayMessage = message || 'Đang tải...';
    return (
        <div className={cx('success')}>
            <div className={cx('content-success')}>
                <FontAwesomeIcon className={cx('succes-icon')} icon={faCheckCircle} />
                <h4>{displayMessage}</h4>
            </div>
        </div>
    );
}

export default SuccessMessage;
