import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './ServiceDetailsPage.module.scss';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faClock,
    faDollarSign,
    faCheckCircle,
    faStar,
    faBox,
    faCalendarAlt,
    faUser,
} from '@fortawesome/free-solid-svg-icons';
import { useParams, useNavigate } from 'react-router-dom';

const cx = classNames.bind(styles);

function ServiceDetailsPage() {
    const { serviceId } = useParams();
    const navigate = useNavigate();
    const [service, setService] = useState(null);
    const [treatmentPlans, setTreatmentPlans] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [sessionDetails, setSessionDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchServiceDetails();
    }, [serviceId]);

    const fetchServiceDetails = async () => {
        setLoading(true);
        try {
            // Fetch service details
            const serviceResponse = await axios.get(
                `http://localhost:5262/api/Services/${serviceId}`
            );
            setService(serviceResponse.data);

            // If it's a course (package), fetch treatment plans
            if (serviceResponse.data.isCourse) {
                const plansResponse = await axios.get(
                    `http://localhost:5262/api/TreatmentPlans/ByService/${serviceId}`
                );
                setTreatmentPlans(plansResponse.data || []);
                if (plansResponse.data?.length > 0) {
                    setSelectedPlan(plansResponse.data[0]);
                    fetchSessionDetails(plansResponse.data[0].treatmentPlanID);
                }
            } else {
                // If it's a single service, fetch appointments
                const appointmentsResponse = await axios.get(
                    `http://localhost:5262/api/Appointments/ByService/${serviceId}`
                );
                setAppointments(appointmentsResponse.data || []);
            }
        } catch (error) {
            console.error('Error fetching service details:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSessionDetails = async (planId) => {
        try {
            const response = await axios.get(
                `http://localhost:5262/api/TreatmentSessions/ByPlan/${planId}`
            );
            setSessionDetails(response.data || []);
        } catch (error) {
            console.error('Error fetching session details:', error);
        }
    };

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
        fetchSessionDetails(plan.treatmentPlanID);
    };

    if (loading) {
        return (
            <div className={cx('wrapper')}>
                <div className={cx('loadingContainer')}>
                    <div className={cx('spinner')}></div>
                    <p>Đang tải thông tin dịch vụ...</p>
                </div>
            </div>
        );
    }

    if (!service) {
        return (
            <div className={cx('wrapper')}>
                <div className={cx('errorContainer')}>
                    <p>Không tìm thấy dịch vụ</p>
                    <button onClick={() => navigate(-1)} className={cx('backBtn')}>
                        <FontAwesomeIcon icon={faArrowLeft} /> Quay lại
                    </button>
                </div>
            </div>
        );
    }

    const isCourseService = service.isCourse === 1;

    return (
        <div className={cx('wrapper')}>
            {/* Header */}
            <div className={cx('header')}>
                <button onClick={() => navigate(-1)} className={cx('backBtn')}>
                    <FontAwesomeIcon icon={faArrowLeft} /> Quay lại
                </button>
                <div className={cx('headerContent')}>
                    <h1>{service.serviceName}</h1>
                    <span className={cx('badge', { package: isCourseService })}>
                        {isCourseService ? '📦 Gói liệu trình' : '💄 Dịch vụ đơn lẻ'}
                    </span>
                </div>
            </div>

            <div className={cx('container')}>
                {/* Service Info Card */}
                <div className={cx('serviceInfo')}>
                    <div className={cx('infoHeader')}>
                        <h2>Thông tin dịch vụ</h2>
                    </div>

                    <div className={cx('infoGrid')}>
                        <div className={cx('infoItem')}>
                            <FontAwesomeIcon icon={faDollarSign} />
                            <div>
                                <span className={cx('label')}>Giá</span>
                                <span className={cx('value')}>
                                    {service.priceService?.toLocaleString('vi-VN')} VNĐ
                                </span>
                            </div>
                        </div>

                        {isCourseService && (
                            <div className={cx('infoItem')}>
                                <FontAwesomeIcon icon={faBox} />
                                <div>
                                    <span className={cx('label')}>Gói liệu trình</span>
                                    <span className={cx('value')}>{treatmentPlans.length} gói</span>
                                </div>
                            </div>
                        )}

                        {!isCourseService && (
                            <div className={cx('infoItem')}>
                                <FontAwesomeIcon icon={faCalendarAlt} />
                                <div>
                                    <span className={cx('label')}>Lịch hẹn</span>
                                    <span className={cx('value')}>{appointments.length}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {service.description && (
                        <div className={cx('description')}>
                            <h3>Mô tả</h3>
                            <p>{service.description}</p>
                        </div>
                    )}
                </div>

                {/* Tabs Navigation */}
                <div className={cx('tabs')}>
                    <button
                        className={cx('tabBtn', { active: activeTab === 'overview' })}
                        onClick={() => setActiveTab('overview')}
                    >
                        Tổng quan
                    </button>
                    {isCourseService ? (
                        <>
                            <button
                                className={cx('tabBtn', { active: activeTab === 'plans' })}
                                onClick={() => setActiveTab('plans')}
                            >
                                Gói liệu trình
                            </button>
                            <button
                                className={cx('tabBtn', { active: activeTab === 'sessions' })}
                                onClick={() => setActiveTab('sessions')}
                            >
                                Chi tiết buổi học
                            </button>
                        </>
                    ) : (
                        <button
                            className={cx('tabBtn', { active: activeTab === 'appointments' })}
                            onClick={() => setActiveTab('appointments')}
                        >
                            Lịch hẹn
                        </button>
                    )}
                </div>

                {/* Tab Content */}
                <div className={cx('tabContent')}>
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className={cx('tabPane')}>
                            <div className={cx('card')}>
                                <h3>📋 Tổng quan</h3>
                                <div className={cx('overviewGrid')}>
                                    <div className={cx('overviewItem')}>
                                        <span className={cx('label')}>Loại dịch vụ:</span>
                                        <span className={cx('value')}>
                                            {isCourseService ? 'Gói liệu trình' : 'Dịch vụ đơn lẻ'}
                                        </span>
                                    </div>
                                    <div className={cx('overviewItem')}>
                                        <span className={cx('label')}>Mã dịch vụ:</span>
                                        <span className={cx('value')}>{service.serviceID}</span>
                                    </div>
                                    <div className={cx('overviewItem')}>
                                        <span className={cx('label')}>Giá dịch vụ:</span>
                                        <span className={cx('value', 'price')}>
                                            {service.priceService?.toLocaleString('vi-VN')} VNĐ
                                        </span>
                                    </div>
                                    {isCourseService && (
                                        <div className={cx('overviewItem')}>
                                            <span className={cx('label')}>Số gói liệu trình:</span>
                                            <span className={cx('value')}>{treatmentPlans.length}</span>
                                        </div>
                                    )}
                                </div>
                                {service.description && (
                                    <div className={cx('descriptionBox')}>
                                        <h4>Chi tiết</h4>
                                        <p>{service.description}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Treatment Plans Tab */}
                    {activeTab === 'plans' && isCourseService && (
                        <div className={cx('tabPane')}>
                            <div className={cx('plansContainer')}>
                                {treatmentPlans.length > 0 ? (
                                    treatmentPlans.map((plan) => (
                                        <div
                                            key={plan.treatmentPlanID}
                                            className={cx('planCard', {
                                                selected: selectedPlan?.treatmentPlanID === plan.treatmentPlanID,
                                            })}
                                            onClick={() => handlePlanSelect(plan)}
                                        >
                                            <div className={cx('planHeader')}>
                                                <div>
                                                    <h3>{plan.planName}</h3>
                                                    <p className={cx('planSubtitle')}>
                                                        {plan.totalSessions} buổi
                                                    </p>
                                                </div>
                                                {selectedPlan?.treatmentPlanID === plan.treatmentPlanID && (
                                                    <FontAwesomeIcon
                                                        icon={faCheckCircle}
                                                        className={cx('checkIcon')}
                                                    />
                                                )}
                                            </div>
                                            <div className={cx('planDetails')}>
                                                <div className={cx('planItem')}>
                                                    <FontAwesomeIcon icon={faClock} />
                                                    <span>{plan.totalSessions} buổi điều trị</span>
                                                </div>
                                                <div className={cx('planItem')}>
                                                    <FontAwesomeIcon icon={faDollarSign} />
                                                    <span>
                                                        {(
                                                            service.priceService / plan.totalSessions
                                                        ).toLocaleString('vi-VN')}{' '}
                                                        VNĐ/buổi
                                                    </span>
                                                </div>
                                            </div>
                                            <button className={cx('selectPlanBtn')}>
                                                {selectedPlan?.treatmentPlanID === plan.treatmentPlanID
                                                    ? '✓ Đã chọn'
                                                    : 'Chọn gói này'}
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className={cx('emptyMessage')}>Không có gói liệu trình nào</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Treatment Sessions Tab */}
                    {activeTab === 'sessions' && isCourseService && selectedPlan && (
                        <div className={cx('tabPane')}>
                            <div className={cx('sessionsContainer')}>
                                <div className={cx('selectedPlanInfo')}>
                                    <h3>📅 Chi tiết gói: {selectedPlan.planName}</h3>
                                    <p>Tổng cộng {selectedPlan.totalSessions} buổi</p>
                                </div>

                                <div className={cx('sessionsList')}>
                                    {sessionDetails.length > 0 ? (
                                        sessionDetails.map((session, index) => (
                                            <div key={session.treatmentSessionID || index} className={cx('sessionCard')}>
                                                <div className={cx('sessionNumber')}>
                                                    <span>Buổi {session.sessionNumber || index + 1}</span>
                                                </div>
                                                <div className={cx('sessionContent')}>
                                                    <div className={cx('sessionMeta')}>
                                                        <span className={cx('badge', 'session')}>
                                                            Buổi {session.sessionNumber || index + 1}
                                                        </span>
                                                    </div>

                                                    {session.products && session.products.length > 0 ? (
                                                        <div className={cx('productsSection')}>
                                                            <h4>Sản phẩm sử dụng:</h4>
                                                            <div className={cx('productsList')}>
                                                                {session.products.map((product, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        className={cx('productItem')}
                                                                    >
                                                                        <FontAwesomeIcon icon={faBox} />
                                                                        <span>{product.productName || product}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className={cx('noProducts')}>
                                                            Chưa có sản phẩm được quy định
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className={cx('emptyMessage')}>
                                            Chọn một gói liệu trình để xem chi tiết buổi học
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Appointments Tab */}
                    {activeTab === 'appointments' && !isCourseService && (
                        <div className={cx('tabPane')}>
                            <div className={cx('appointmentsContainer')}>
                                {appointments.length > 0 ? (
                                    <div className={cx('appointmentsList')}>
                                        {appointments.map((appointment) => (
                                            <div
                                                key={appointment.appointmentID}
                                                className={cx('appointmentCard')}
                                            >
                                                <div className={cx('appointmentHeader')}>
                                                    <div>
                                                        <h3>
                                                            <FontAwesomeIcon icon={faUser} />
                                                            Khách hàng #{appointment.customerId}
                                                        </h3>
                                                        <p>ID: {appointment.appointmentID}</p>
                                                    </div>
                                                    <span className={cx('badge', 'appointment')}>
                                                        Đã đặt lịch
                                                    </span>
                                                </div>
                                                <div className={cx('appointmentDetails')}>
                                                    <div className={cx('detailItem')}>
                                                        <span className={cx('label')}>Dịch vụ:</span>
                                                        <span>{service.serviceName}</span>
                                                    </div>
                                                    <div className={cx('detailItem')}>
                                                        <span className={cx('label')}>Trạng thái:</span>
                                                        <span className={cx('status', 'confirmed')}>
                                                            ✓ Xác nhận
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={cx('emptyState')}>
                                        <p>Chưa có lịch hẹn nào cho dịch vụ này</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ServiceDetailsPage;
