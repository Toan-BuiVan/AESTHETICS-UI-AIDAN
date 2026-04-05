import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './DoctorCard.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faStar, faBriefcaseMedical } from '@fortawesome/free-solid-svg-icons';
import { PLACEHOLDER_IMAGE_150 } from '~/utils/placeholderImage';

const cx = classNames.bind(styles);

function DoctorCard({ doctor, isSelected, onSelect }) {
    const [doctorRating, setDoctorRating] = useState(0);

    useEffect(() => {
        // Generate random rating từ 4.7 đến 4.8
        const randomRating = (4.7 + Math.random() * 0.1).toFixed(1);
        setDoctorRating(parseFloat(randomRating));
    }, [doctor.id]);
    return (
        <div
            className={cx('card', { selected: isSelected })}
            onClick={() => onSelect(doctor)}
        >
            <div className={cx('imageContainer')}>
                <img
                    src={doctor.image || PLACEHOLDER_IMAGE_150}
                    alt={doctor.doctorName}
                    className={cx('image')}
                />
                {isSelected && (
                    <div className={cx('checkmark')}>
                        <FontAwesomeIcon icon={faCheckCircle} />
                    </div>
                )}
                <div className={cx('ratingBadge')}>
                    <FontAwesomeIcon icon={faStar} className={cx('starIcon')} />
                    <span>{doctorRating.toFixed(1)}</span>
                </div>
            </div>

            <div className={cx('content')}>
                <h3 className={cx('doctorName')}>{doctor.doctorName || doctor.name}</h3>
                
                <p className={cx('specialty')}>
                    <FontAwesomeIcon icon={faBriefcaseMedical} className={cx('specialtyIcon')} />
                    {doctor.specialty || 'Bác sĩ chuyên khoa'}
                </p>

                <div className={cx('ratingFull')}>
                    <div className={cx('stars')}>
                        {[...Array(5)].map((_, i) => (
                            <FontAwesomeIcon
                                key={i}
                                icon={faStar}
                                className={cx('star', {
                                    filled: i < Math.floor(doctorRating),
                                })}
                            />
                        ))}
                    </div>
                    <span className={cx('ratingText')}>
                        ({doctor.reviews || 120})
                    </span>
                </div>

                <div className={cx('experience')}>
                    <span className={cx('experienceLabel')}>Kinh nghiệm:</span>
                    <span className={cx('experienceValue')}>
                        🎓 {doctor.experience || 10}+ năm
                    </span>
                </div>

                <button className={cx('selectBtn', { active: isSelected })}>
                    {isSelected ? (
                        <>
                            <FontAwesomeIcon icon={faCheckCircle} />
                            Đã chọn
                        </>
                    ) : (
                        'Chọn bác sĩ'
                    )}
                </button>
            </div>
        </div>
    );
}

export default DoctorCard;
