import React from 'react';
import classNames from 'classnames/bind';
import styles from './AIResponseDisplay.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faCalendarAlt, faUserMd, faTrophy, faShoppingBag, faTrash } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function AIResponseDisplay({ response }) {
    if (!response || !response.data) return null;

    const data = response.data;
    const toolUsed = response.toolUsed;

    // Type 1 & 2: Doctor Available Slots
    if (toolUsed === 'getDoctorAvailableSlots') {
        return (
            <div className={cx('container', 'slotContainer')}>
                <div className={cx('header')}>
                    <FontAwesomeIcon icon={faCheckCircle} className={cx('headerIcon')} />
                    <div className={cx('headerContent')}>
                        <h3>{data.message}</h3>
                        <p className={cx('doctorName')}>{data.doctorName}</p>
                    </div>
                </div>

                {data.availableSlots && data.availableSlots.length > 0 && (
                    <div className={cx('slotsGrid')}>
                        {data.availableSlots.map((slot, idx) => (
                            <div key={idx} className={cx('slotCard')}>
                                <div className={cx('slotDate')}>
                                    <FontAwesomeIcon icon={faCalendarAlt} />
                                    {new Date(slot.date).toLocaleDateString('vi-VN', {
                                        weekday: 'short',
                                        month: '2-digit',
                                        day: '2-digit'
                                    })}
                                </div>
                                <div className={cx('slotTime')}>
                                    {slot.startTime} - {slot.endTime}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {data.treatmentPlans && data.treatmentPlans.length > 0 && (
                    <div className={cx('plansSection')}>
                        <h4>Gói Điều Trị Liên Quan</h4>
                        {data.treatmentPlans.map((plan, idx) => (
                            <div key={idx} className={cx('planCard')}>
                                <div className={cx('planName')}>{plan.name}</div>
                                <p className={cx('planDesc')}>{plan.description}</p>
                                <div className={cx('planPrice')}>
                                    {plan.price.toLocaleString('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND'
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Type 3: Doctors for Service
    if (toolUsed === 'getDoctorsForService') {
        return (
            <div className={cx('container', 'doctorContainer')}>
                <div className={cx('header')}>
                    <FontAwesomeIcon icon={faUserMd} className={cx('headerIcon')} />
                    <div className={cx('headerContent')}>
                        <h3>{data.message}</h3>
                        <p className={cx('serviceName')}>{data.serviceName}</p>
                    </div>
                </div>

                <p className={cx('serviceDesc')}>{data.serviceDescription}</p>

                {data.doctors && data.doctors.length > 0 && (
                    <div className={cx('doctorsList')}>
                        {data.doctors.map((doctor, idx) => (
                            <div key={idx} className={cx('doctorCard')}>
                                <div className={cx('doctorHeader')}>
                                    <div className={cx('doctorName')}>{doctor.name}</div>
                                    {doctor.rating && (
                                        <div className={cx('doctorRating')}>
                                            ⭐ {doctor.rating.toFixed(1)}
                                        </div>
                                    )}
                                </div>
                                <div className={cx('doctorInfo')}>
                                    {doctor.specialization && (
                                        <p><span>Chuyên môn:</span> {doctor.specialization}</p>
                                    )}
                                    {doctor.degree && (
                                        <p><span>Bằng cấp:</span> {doctor.degree}</p>
                                    )}
                                    {doctor.experience > 0 && (
                                        <p><span>Kinh nghiệm:</span> {doctor.experience} năm</p>
                                    )}
                                    <p><span>Lịch hẹn:</span> {doctor.appointmentCount}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Type 4: Most Popular Services
    if (toolUsed === 'getMostPopularServices') {
        return (
            <div className={cx('container', 'popularContainer')}>
                <div className={cx('header')}>
                    <FontAwesomeIcon icon={faTrophy} className={cx('headerIcon')} />
                    <div className={cx('headerContent')}>
                        <h3>{data.message}</h3>
                    </div>
                </div>

                <div className={cx('popularCard')}>
                    <div className={cx('serviceName')}>{data.serviceName}</div>
                    <div className={cx('serviceStats')}>
                        <div className={cx('stat')}>
                            <span className={cx('label')}>Giá:</span>
                            <span className={cx('value')}>
                                {data.price.toLocaleString('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND'
                                })}
                            </span>
                        </div>
                        <div className={cx('stat')}>
                            <span className={cx('label')}>Số lần sử dụng:</span>
                            <span className={cx('value', 'userCount')}>{data.userCount}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Type 5: Best Doctor for Service
    if (toolUsed === 'getBestDoctorForService') {
        return (
            <div className={cx('container', 'bestDoctorContainer')}>
                <div className={cx('header')}>
                    <FontAwesomeIcon icon={faTrophy} className={cx('headerIcon')} />
                    <div className={cx('headerContent')}>
                        <h3>{data.message}</h3>
                    </div>
                </div>

                <div className={cx('bestDoctorCard')}>
                    <div className={cx('doctorHeader')}>
                        <div className={cx('doctorName')}>{data.staffName}</div>
                        <span className={cx('badge', 'bestBadge')}>Hàng Đầu</span>
                    </div>
                    <div className={cx('doctorInfo')}>
                        {data.specialization && (
                            <p><span>Chuyên môn:</span> {data.specialization}</p>
                        )}
                        {data.degree && (
                            <p><span>Bằng cấp:</span> {data.degree}</p>
                        )}
                        {data.experienceYears > 0 && (
                            <p><span>Kinh nghiệm:</span> {data.experienceYears} năm</p>
                        )}
                        <p><span>Lịch hẹn:</span> {data.appointmentCount}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Type 6: Services by Price Range
    if (toolUsed === 'getServicesByPriceRange') {
        return (
            <div className={cx('container', 'priceRangeContainer')}>
                <div className={cx('header')}>
                    <FontAwesomeIcon icon={faShoppingBag} className={cx('headerIcon')} />
                    <div className={cx('headerContent')}>
                        <h3>{data.message}</h3>
                    </div>
                </div>

                {data.services && data.services.length > 0 && (
                    <div className={cx('servicesList')}>
                        {data.services.map((service, idx) => (
                            <div key={idx} className={cx('serviceCard')}>
                                <div className={cx('serviceName')}>{service.serviceName}</div>
                                <p className={cx('serviceDesc')}>{service.description}</p>
                                <div className={cx('servicePrice')}>
                                    {service.price.toLocaleString('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND'
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Type 7: Top Selling Products
    if (toolUsed === 'getTopSellingProducts') {
        return (
            <div className={cx('container', 'productsContainer')}>
                <div className={cx('header')}>
                    <FontAwesomeIcon icon={faShoppingBag} className={cx('headerIcon')} />
                    <div className={cx('headerContent')}>
                        <h3>{data.message}</h3>
                    </div>
                </div>

                {data.products && data.products.length > 0 && (
                    <div className={cx('productsList')}>
                        {data.products.map((product, idx) => (
                            <div key={idx} className={cx('productCard')}>
                                <div className={cx('productName')}>{product.productName}</div>
                                <div className={cx('productPrice')}>
                                    {product.price.toLocaleString('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND'
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Type 8 & 9: Recommended Products
    if (toolUsed === 'getRecommendedProductsByCategory') {
        return (
            <div className={cx('container', 'productsContainer')}>
                <div className={cx('header')}>
                    <FontAwesomeIcon icon={faShoppingBag} className={cx('headerIcon')} />
                    <div className={cx('headerContent')}>
                        <h3>{data.message}</h3>
                    </div>
                </div>

                {data.products && data.products.length > 0 && (
                    <div className={cx('productsList')}>
                        {data.products.map((product, idx) => (
                            <div key={idx} className={cx('productCard')}>
                                <div className={cx('productName')}>{product.productName}</div>
                                <p className={cx('productDesc')}>{product.description}</p>
                                <div className={cx('productStats')}>
                                    <span className={cx('price')}>
                                        {product.price.toLocaleString('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND'
                                        })}
                                    </span>
                                    {product.quantity && (
                                        <span className={cx('quantity')}>Kho: {product.quantity}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Type 10: Book Appointment
    if (toolUsed === 'bookAppointment') {
        return (
            <div className={cx('container', 'successContainer')}>
                <div className={cx('successMessage')}>
                    <FontAwesomeIcon icon={faCheckCircle} className={cx('successIcon')} />
                    <div className={cx('message')}>{data.message}</div>
                    <div className={cx('appointmentId')}>ID: {data.appointmentId}</div>
                </div>
            </div>
        );
    }

    // Type 11: Treatment Packages (no packages)
    if (toolUsed === 'getTreatmentPackagesByServiceName') {
        return (
            <div className={cx('container', 'treatmentContainer')}>
                <div className={cx('header')}>
                    <FontAwesomeIcon icon={faShoppingBag} className={cx('headerIcon')} />
                    <div className={cx('headerContent')}>
                        <h3>{data.message}</h3>
                        <p className={cx('serviceName')}>{data.service?.serviceName}</p>
                    </div>
                </div>

                {data.service && (
                    <div className={cx('serviceCard')}>
                        <div className={cx('serviceName')}>{data.service.serviceName}</div>
                        <p className={cx('serviceDesc')}>{data.service.description}</p>
                        <div className={cx('serviceStats')}>
                            <span>Thời lượng: {data.service.duration} phút</span>
                            <span>Giá: {data.service.price.toLocaleString('vi-VN', {
                                style: 'currency',
                                currency: 'VND'
                            })}</span>
                        </div>
                    </div>
                )}

                {data.treatmentPackages && data.treatmentPackages.length > 0 && (
                    <div className={cx('packagesList')}>
                        {data.treatmentPackages.map((pkg, idx) => (
                            <div key={idx} className={cx('packageCard')}>
                                <div className={cx('packageHeader')}>
                                    <div className={cx('packageName')}>{pkg.planName}</div>
                                    <span className={cx('sessionCount')}>{pkg.totalSessions} buổi</span>
                                </div>
                                <p className={cx('packageDesc')}>{pkg.description}</p>
                                <div className={cx('packagePrice')}>
                                    {pkg.price.toLocaleString('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND'
                                    })}
                                </div>
                                {pkg.sessions && pkg.sessions.length > 0 && (
                                    <div className={cx('sessionsList')}>
                                        {pkg.sessions.map((session, sIdx) => (
                                            <div key={sIdx} className={cx('sessionItem')}>
                                                <span className={cx('sessionNum')}>Buổi {session.sessionNumber}</span>
                                                <span className={cx('sessionName')}>{session.sessionName}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Type 13, 14, 15: Cancel Appointment
    if (toolUsed === 'cancelAppointment') {
        return (
            <div className={cx('container', 'cancelContainer')}>
                <div className={cx('cancelMessage')}>
                    <FontAwesomeIcon icon={faTrash} className={cx('cancelIcon')} />
                    <div>
                        <div className={cx('cancelCount')}>
                            ✅ Đã hủy {data.cancelledCount} lịch hẹn
                        </div>
                        {data.details && data.details.length > 0 && (
                            <div className={cx('detailsList')}>
                                {data.details.map((detail, idx) => (
                                    <p key={idx} className={cx('detailItem')}>• {detail}</p>
                                ))}
                            </div>
                        )}
                        {data.assignmentCount > 0 && (
                            <p className={cx('infoText')}>
                                Cập nhật {data.assignmentCount} assignment(s)
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Default fallback
    return (
        <div className={cx('container', 'defaultContainer')}>
            <div className={cx('message')}>{data.message}</div>
        </div>
    );
}

export default AIResponseDisplay;
