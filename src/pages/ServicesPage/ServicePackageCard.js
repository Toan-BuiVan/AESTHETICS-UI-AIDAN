import React from 'react';
import classNames from 'classnames/bind';
import styles from './ServicePackageCard.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faClock, faListCheck, faStar } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function ServicePackageCard({ service, isSelected, onSelect, isPackage }) {
    return (
        <div
            className={cx('card', { selected: isSelected, package: isPackage })}
            onClick={() => onSelect(service)}
        >
            <div className={cx('cardHeader')}>
                <div className={cx('iconContainer', { package: isPackage })}>
                    {isPackage ? '📦' : '💄'}
                </div>
                {isSelected && (
                    <div className={cx('checkmark')}>
                        <FontAwesomeIcon icon={faCheckCircle} />
                    </div>
                )}
                {isPackage && (
                    <div className={cx('packageBadge')}>Gói Liệu Trình</div>
                )}
            </div>

            <div className={cx('cardContent')}>
                <h3 className={cx('serviceName')}>{service.serviceName}</h3>

                <div className={cx('priceSection')}>
                    <span className={cx('price')}>
                        {service.priceService?.toLocaleString('vi-VN') || service.totalPrice?.toLocaleString('vi-VN')} VNĐ
                    </span>
                </div>

                {isPackage && service.totalSessions && (
                    <div className={cx('packageInfo')}>
                        <div className={cx('infoItem')}>
                            <FontAwesomeIcon icon={faClock} className={cx('icon')} />
                            <span>{service.totalSessions} buổi</span>
                        </div>
                    </div>
                )}

                {service.description && (
                    <p className={cx('description')}>
                        {service.description.substring(0, 90)}...
                    </p>
                )}

                <div className={cx('ratingSection')}>
                    <FontAwesomeIcon icon={faStar} className={cx('starIcon')} />
                    <span>Được ưa thích</span>
                </div>

                <button className={cx('selectBtn', { active: isSelected })}>
                    <FontAwesomeIcon icon={isSelected ? faCheckCircle : faListCheck} />
                    {isSelected ? 'Đã chọn' : 'Chọn dịch vụ'}
                </button>
            </div>
        </div>
    );
}

export default ServicePackageCard;
