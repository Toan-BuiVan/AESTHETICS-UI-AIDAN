import React from 'react';
import classNames from 'classnames/bind';
import styles from './DoctorCard.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faStar } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function DoctorCard({ doctor, isSelected, onSelect }) {
    return (
        <div
            className={cx('card', { selected: isSelected })}
            onClick={() => onSelect(doctor)}
        >
            <div className={cx('imageContainer')}>
                <img
                    src={doctor.image || 'https://via.placeholder.com/150?text=Doctor'}
                    alt={doctor.doctorName}
                    className={cx('image')}
                />
                {isSelected && (
                    <div className={cx('checkmark')}>
                        <FontAwesomeIcon icon={faCheckCircle} />
                    </div>
                )}
            </div>

            <div className={cx('content')}>
                <h3 className={cx('doctorName')}>{doctor.doctorName || doctor.name}</h3>
                
                <p className={cx('specialty')}>
                    {doctor.specialty || 'Bác sĩ chuyên khoa'}
                </p>

                <div className={cx('rating')}>
                    {[...Array(5)].map((_, i) => (
                        <FontAwesomeIcon
                            key={i}
                            icon={faStar}
                            className={cx('star', {
                                filled: i < (doctor.rating || 4),
                            })}
                        />
                    ))}
                    <span className={cx('ratingText')}>
                        {doctor.rating || 4}.0 ({doctor.reviews || 120} đánh giá)
                    </span>
                </div>

                <p className={cx('experience')}>
                    {doctor.experience || 10}+ năm kinh nghiệm
                </p>

                <button className={cx('selectBtn', { active: isSelected })}>
                    {isSelected ? '✓ Đã chọn' : 'Chọn bác sĩ'}
                </button>
            </div>
        </div>
    );
}

export default DoctorCard;
