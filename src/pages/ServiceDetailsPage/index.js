import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './ServiceDetailsPage.module.scss';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faClock,
    faDollarSign,
    faBox,
    faCalendarAlt,
    faGem,
    faFlask,
    faCheck,
    faGift,
    faTrophy,
    faArrowRight,
    faCheckSquare,
    faSquare,
    faLightbulb,
    faBolt,
    faStethoscope,
    faCertificate,
    faGraduationCap,
    faBriefcase,
    faUserMd
} from '@fortawesome/free-solid-svg-icons';
import { useParams, useNavigate } from 'react-router-dom';

const cx = classNames.bind(styles);

function ServiceDetailsPage() {
    const { serviceId } = useParams();
    const navigate = useNavigate();
    const [service, setService] = useState(null);
    const [treatmentPlans, setTreatmentPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [sessionDetails, setSessionDetails] = useState([]);
    const [checkedSessions, setCheckedSessions] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [doctors, setDoctors] = useState([]);
    const [loadingDoctors, setLoadingDoctors] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    useEffect(() => {
        fetchTreatmentPlans(serviceId);
    }, [serviceId]);

    useEffect(() => {
        if (selectedPlan?.serviceId) {
            fetchDoctorsList(selectedPlan.serviceId);
        }
    }, [selectedPlan?.serviceId]);

    const fetchTreatmentPlans = async (svcId) => {
        setLoading(true);
        try {
            const response = await axios.post(
                'http://localhost:5122/api/TreatmentPlan/gettreatmentplanlist',
                {
                    pageNo: 1,
                    pageSize: 8,
                    serviceId: parseInt(svcId)
                }
            );

            let rawPlansData = [];
            if (Array.isArray(response.data)) {
                rawPlansData = response.data;
            } else if (response.data?.baseDatas && Array.isArray(response.data.baseDatas)) {
                rawPlansData = response.data.baseDatas;
            }
            
            // Transform API response to match component expectations
            const transformedPlans = rawPlansData.map(item => ({
                id: item.treatmentPlanInfomation?.id,
                planName: item.treatmentPlanInfomation?.planName,
                totalSessions: item.treatmentPlanInfomation?.totalSessions,
                price: item.treatmentPlanInfomation?.price,
                sessionInterval: item.treatmentPlanInfomation?.sessionInterval,
                description: item.treatmentPlanInfomation?.description,
                serviceId: item.treatmentPlanInfomation?.serviceId,
                // Add service information
                serviceInfo: item.serviceInformation || {},
                // Add treatment sessions
                treatmentSessions: (item.treatmentSessionInformation || []).map(session => ({
                    id: session.treatmentSessionId,
                    sessionNumber: session.sessionNumber,
                    sessionName: session.sessionName,
                    description: session.description,
                    duration: session.duration,
                    treatmentSessionId: session.treatmentSessionId
                })),
                // Add session products
                sessionProducts: item.sessionProductInformation || []
            }));
            
            setTreatmentPlans(transformedPlans);
            
            // Set service data from first plan's service information
            const firstPlan = transformedPlans[0];
            if (firstPlan) {
                setService({
                    id: parseInt(svcId),
                    isCourse: 1,
                    serviceID: parseInt(svcId),
                    priceService: firstPlan.price || 0,
                    description: firstPlan.description || '',
                    serviceName: firstPlan.serviceInfo?.serviceName || ''
                });
                
                setSelectedPlan(firstPlan);
                setSessionDetails(firstPlan.treatmentSessions || []);
            }
        } catch (error) {
            console.error('Error fetching treatment plans:', error);
            setTreatmentPlans([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
        // Use treatmentSessions if available, otherwise fall back to sessionDetails
        const sessions = plan.treatmentSessions && plan.treatmentSessions.length > 0 
            ? plan.treatmentSessions 
            : plan.treatmentSessions || [];
        setSessionDetails(sessions);
        setCheckedSessions(new Set());
    };

    const handleSessionCheck = (sessionId) => {
        const newChecked = new Set(checkedSessions);
        if (newChecked.has(sessionId)) {
            newChecked.delete(sessionId);
        } else {
            newChecked.add(sessionId);
        }
        setCheckedSessions(newChecked);
    };

    const handleSelectAllSessions = () => {
        // Nếu tất cả đã được tích chọn, bỏ tích. Ngược lại, tích tất cả
        if (checkedSessions.size === sessionDetails.length) {
            setCheckedSessions(new Set());
        } else {
            const allIds = new Set(sessionDetails.map(s => s.id));
            setCheckedSessions(allIds);
        }
    };

    const handleViewDoctorInfo = (doctor) => {
        setSelectedDoctor(doctor);
    };

    const handleBackToDoctorsList = () => {
        setSelectedDoctor(null);
    };

    const fetchDoctorsList = async (serviceTypeId) => {
        setLoadingDoctors(true);
        try {
            const response = await axios.post(
                'http://localhost:5122/api/Staff/get-list',
                {
                    isDoctor: true,
                    servicetypeId: parseInt(serviceTypeId)
                }
            );

            console.log('API Response:', response.data);
            
            if (response.data?.baseDatas && Array.isArray(response.data.baseDatas)) {
                console.log('Doctor sample:', response.data.baseDatas[0]);
                setDoctors(response.data.baseDatas);
            } else {
                console.log('No baseDatas in response');
                setDoctors([]);
            }
        } catch (error) {
            console.error('Error fetching doctors list:', error);
            setDoctors([]);
        } finally {
            setLoadingDoctors(false);
        }
    };

    const handleCreateCustomerTreatmentPlan = async (isFullPackage = true) => {
        try {
            // Get user info from localStorage
            let customerId = parseInt(localStorage.getItem('customerId') || 0);
            const staffIdFromStorage = parseInt(localStorage.getItem('staffId') || 0);
            
            // If no customerId found, fallback to staffId from localStorage
            if (!customerId || customerId === 0) {
                customerId = staffIdFromStorage || selectedDoctor?.id || 0;
            }
            
            const staffId = selectedDoctor?.id || staffIdFromStorage || 0;
            const voucherId = 0; // You can add voucher selection later

            if (!selectedPlan) {
                alert('Vui lòng chọn một gói liệu trình');
                return;
            }

            if (!isFullPackage && checkedSessions.size === 0) {
                alert('Vui lòng chọn ít nhất một buổi điều trị');
                return;
            }

            const payload = {
                customerId: customerId,
                staffId: staffId,
                treatmentPlanId: isFullPackage ? selectedPlan.id : 0,
                treatmentSessionIds: isFullPackage ? [] : Array.from(checkedSessions),
                isFullPackage: isFullPackage,
                notes: '',
                voucherId: voucherId
            };

            console.log('Creating customer treatment plan:', {
                customerId: customerId,
                staffId: staffId,
                isFullPackage: isFullPackage,
                payload: payload
            });

            const response = await axios.post(
                'http://localhost:5122/api/CustomerTreatmentPlans/createcustomertreatmentplan',
                payload
            );

            console.log('Response:', response.data);
            alert('Đặt lịch thành công! Vui lòng kiểm tra lịch đặt của bạn.');
            
            // Reset selections
            setCheckedSessions(new Set());
            
            // Navigate to bookings page
            navigate('/profile?tab=bookings');
        } catch (error) {
            console.error('Error creating customer treatment plan:', error);
            alert('Lỗi khi đặt lịch: ' + (error.response?.data?.message || error.message));
        }
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
            {/* Hero Header with Social Proof & Benefits */}
            <div className={cx('headerModern')}>
                <div className={cx('headerBackdrop')}>
                    <div className={cx('animationOrb', 'orb1')}></div>
                    <div className={cx('animationOrb', 'orb2')}></div>
                    <div className={cx('animationOrb', 'orb3')}></div>
                </div>

                <div className={cx('headerContainer')}>
                    <button onClick={() => navigate(-1)} className={cx('headerBack')}>
                        <FontAwesomeIcon icon={faArrowLeft} />
                    </button>

                    <div className={cx('headerContent')}>
                        <div className={cx('headerBranding')}>
                            <span className={cx('headerTag')}>
                                {isCourseService ? '✨ Gói chuyên biệt' : '⭐ Dịch vụ cao cấp'}
                            </span>
                        </div>

                        <h1 className={cx('heroTitle')}>
                            {selectedPlan?.planName || 'Dịch vụ chăm sóc da cao cấp'}
                        </h1>

                        <div className={cx('serviceMetaHeader')}>
                            {selectedPlan?.serviceInfo?.serviceName && (
                                <div className={cx('metaItem')}>
                                    <span className={cx('metaLabel')}>Dịch vụ:</span>
                                    <span className={cx('metaValue')}>{selectedPlan.serviceInfo.serviceName}</span>
                                </div>
                            )}
                            {selectedPlan?.serviceInfo?.price && (
                                <div className={cx('metaItem')}>
                                    <span className={cx('metaLabel')}>Giá từng buổi:</span>
                                                                        <span className={cx('metaValue', 'price')}>{selectedPlan.price.toLocaleString('vi-VN')}đ</span>
                                    
                                </div>
                            )}
                            {selectedPlan?.price && (
                                <div className={cx('metaItem')}>
                                    <span className={cx('metaLabel')}>Giá gói trọn:</span>
                                    <span className={cx('metaValue')}>{selectedPlan.serviceInfo.price.toLocaleString('vi-VN')}đ</span>
                                </div>
                            )}
                            {selectedPlan?.serviceInfo?.duration && (
                                <div className={cx('metaItem')}>
                                    <span className={cx('metaLabel')}>Thời lượng:</span>
                                    <span className={cx('metaValue')}>{selectedPlan.serviceInfo.duration} phút/buổi</span>
                                </div>
                            )}
                            {selectedPlan?.totalSessions && (
                                <div className={cx('metaItem')}>
                                    <span className={cx('metaLabel')}>Số buổi:</span>
                                    <span className={cx('metaValue')}>{selectedPlan.totalSessions} buổi</span>
                                </div>
                            )}
                        </div>

                        {selectedPlan?.serviceInfo?.price && selectedPlan?.price && selectedPlan?.totalSessions && (
                            <div className={cx('savingNotice')}>
                                {(() => {
                                    const singlePrice = selectedPlan.price * selectedPlan.totalSessions; // Giá mua lẻ từng buổi
                                    const bundlePrice = selectedPlan.serviceInfo.price; // Giá trọn gói
                                    const saving = singlePrice - bundlePrice;
                                    const savingPercent = Math.round((saving / singlePrice) * 100);
                                    
                                    return (
                                        <>
                                            <span className={cx('savingIcon')}>💰</span>
                                            <span className={cx('savingText')}>
                                                Mua trọn gói tiết kiệm <strong>{saving.toLocaleString('vi-VN')}đ</strong> ({savingPercent}%) so với mua lẻ
                                            </span>
                                        </>
                                    );
                                })()}
                            </div>
                        )}

                        <p className={cx('heroDescription')}>
                            {service?.description || selectedPlan?.description || 'Liệu trình chắp chải đặc biệt được thiết kế riêng cho từng loại da, mang lại hiệu quả tối đa'}
                        </p>

                        <div className={cx('heroCta')}>
                            <button 
                                className={cx('ctaPrimary')}
                                onClick={() => {
                                    setActiveTab('sessions');
                                    setTimeout(() => {
                                        document.querySelector('[data-tab-content]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }, 100);
                                }}
                            >
                                <FontAwesomeIcon icon={faGift} />
                                Đặt lịch ngay
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className={cx('container')}>
                {/* Service Info Card - Modern Design */}
                <div className={cx('serviceInfoModern')}>
                    <div className={cx('serviceInfoHeader')}>
                        <div className={cx('serviceInfoTitle')}>
                            <h2>Thông tin dịch vụ</h2>
                            <p>Khám phá chi tiết về gói liệu trình này</p>
                        </div>
                    </div>

                    <div className={cx('infoGridModern')}>
                        <div className={cx('infoCardModern')}>
                            <div className={cx('infoCardIcon', 'priceIcon')}>
                                <FontAwesomeIcon icon={faDollarSign} />
                            </div>
                            <div className={cx('infoCardContent')}>
                                <span className={cx('infoCardLabel')}>Giá</span>
                                <span className={cx('infoCardValue')}>
                                    {service.priceService?.toLocaleString('vi-VN')}
                                    <span className={cx('infoCardUnit')}>đ</span>
                                </span>
                                <span className={cx('infoCardDesc')}>Giá/lần sử dụng</span>
                            </div>
                        </div>

                        <div className={cx('infoCardModern')}>
                            <div className={cx('infoCardIcon', 'sessionsIcon')}>
                                <FontAwesomeIcon icon={faFlask} />
                            </div>
                            <div className={cx('infoCardContent')}>
                                <span className={cx('infoCardLabel')}>Số buổi</span>
                                <span className={cx('infoCardValue')}>
                                    {selectedPlan?.totalSessions || (treatmentPlans.length > 0 ? treatmentPlans[0].totalSessions : 0)}
                                </span>
                                <span className={cx('infoCardDesc')}>Buổi điều trị</span>
                            </div>
                        </div>

                        <div className={cx('infoCardModern')}>
                            <div className={cx('infoCardIcon', 'durationIcon')}>
                                <FontAwesomeIcon icon={faCalendarAlt} />
                            </div>
                            <div className={cx('infoCardContent')}>
                                <span className={cx('infoCardLabel')}>Thời gian</span>
                                <span className={cx('infoCardValue')}>
                                    {selectedPlan?.sessionInterval ? selectedPlan.sessionInterval * selectedPlan.totalSessions : 0}
                                    <span className={cx('infoCardUnit')}>Ngày</span>
                                </span>
                                <span className={cx('infoCardDesc')}>Thực hiện toàn bộ</span>
                            </div>
                        </div>

                        <div className={cx('infoCardModern')}>
                            <div className={cx('infoCardIcon', 'packIcon')}>
                                <FontAwesomeIcon icon={faBox} />
                            </div>
                            <div className={cx('infoCardContent')}>
                                <span className={cx('infoCardLabel')}>Tổng gói</span>
                                <span className={cx('infoCardValue')}>
                                    {treatmentPlans.length}
                                </span>
                                <span className={cx('infoCardDesc')}>Gói liệu trình</span>
                            </div>
                        </div>
                    </div>

                    {service.description && (
                        <div className={cx('serviceDescriptionCard')}>
                            <div className={cx('descriptionIcon')}>
                                <FontAwesomeIcon icon={faLightbulb} />
                            </div>
                            <div>
                                <h4>Mô tả chi tiết</h4>
                                <p>{service.description}</p>
                            </div>
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
                                Chi tiết liệu trình
                            </button>
                        </>
                    ) : null}
                </div>

                {/* Two Column Layout: Service Details (Left) + Doctors (Right) */}
                <div className={cx('twoColumnLayout')}>
                    {/* Left Column - Tab Content */}
                    <div className={cx('contentColumn')}>
                        <div className={cx('tabContent')} data-tab-content>
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
                                    {/* <div className={cx('overviewItem')}>
                                        <span className={cx('label')}>Mã dịch vụ:</span>
                                        <span className={cx('value')}>{service.serviceID}</span>
                                    </div> */}
                                    <div className={cx('overviewItem')}>
                                        <span className={cx('label')}>Tên dịch vụ:</span>
                                        <span className={cx('value')}>{service.serviceName}</span>
                                    </div>
                                    <div className={cx('overviewItem')}>
                                        <span className={cx('label')}>Gói liệu trình:</span>
                                        <span className={cx('value')}>{selectedPlan.planName}</span>
                                    </div>
                                    <div className={cx('overviewItem')}>
                                        <span className={cx('label')}>Giá dịch vụ:</span>
                                        <span className={cx('value', 'price')}>
                                            {service.priceService?.toLocaleString('vi-VN')} VNĐ/lần
                                        </span>
                                    </div>
                                    {isCourseService && (
                                        <div className={cx('overviewItem')}>
                                            <span className={cx('label')}>Số buổi liệu trình:</span>
                                            <span className={cx('value')}>{selectedPlan?.totalSessions || (treatmentPlans.length > 0 ? treatmentPlans[0].totalSessions : 0)} buổi</span>
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
                            <div className={cx('plansGrid')}>
                                {treatmentPlans.length > 0 ? (
                                    treatmentPlans.map((plan, index) => (
                                        <div
                                            key={plan.id}
                                            className={cx('modernPlanCard', {
                                                selected: selectedPlan?.id === plan.id,
                                                featured: index === 0
                                            })}
                                            onClick={() => handlePlanSelect(plan)}
                                        >
                                            {index === 0 && (
                                                <div className={cx('badgeFeatured')}>
                                                    <FontAwesomeIcon icon={faTrophy} />
                                                    Bán chạy nhất
                                                </div>
                                            )}
                                            
                                            <div className={cx('planCardContent')}>
                                                <div className={cx('planCardHeader')}>
                                                    <div className={cx('planCardTitle')}>
                                                        <h3>{plan.planName}</h3>
                                                        {selectedPlan?.id === plan.id && (
                                                            <div className={cx('selectedBadge')}>
                                                                <FontAwesomeIcon icon={faCheck} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {plan.description && (
                                                    <p className={cx('planCardDesc')}>{plan.description}</p>
                                                )}

                                                <div className={cx('statsContainer')}>
                                                    <div className={cx('stat')}>
                                                        <div className={cx('statIcon')}>
                                                            <FontAwesomeIcon icon={faFlask} />
                                                        </div>
                                                        <div className={cx('statContent')}>
                                                            <span className={cx('statLabel')}>Số buổi</span>
                                                            <span className={cx('statValue')}>{plan.totalSessions}</span>
                                                        </div>
                                                    </div>

                                                    <div className={cx('stat')}>
                                                        <div className={cx('statIcon')}>
                                                            <FontAwesomeIcon icon={faCalendarAlt} />
                                                        </div>
                                                        <div className={cx('statContent')}>
                                                            <span className={cx('statLabel')}>Khoảng cách</span>
                                                            <span className={cx('statValue')}>{plan.sessionInterval} ngày</span>
                                                        </div>
                                                    </div>

                                                    <div className={cx('stat')}>
                                                        <div className={cx('statIcon')}>
                                                            <FontAwesomeIcon icon={faClock} />
                                                        </div>
                                                        <div className={cx('statContent')}>
                                                            <span className={cx('statLabel')}>Thời lượng</span>
                                                            <span className={cx('statValue')}>{plan.totalSessions * plan.sessionInterval}d</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className={cx('priceSection')}>
                                                    <span className={cx('priceLabel')}>Giá gói</span>
                                                    <span className={cx('price')}>
                                                        {plan.price?.toLocaleString('vi-VN')}
                                                        <span className={cx('currency')}>đ</span>
                                                    </span>
                                                </div>

                                                <button 
                                                    className={cx('selectPlanBtnModern', {
                                                        selected: selectedPlan?.id === plan.id
                                                    })}
                                                    onClick={() => handlePlanSelect(plan)}
                                                >
                                                    {selectedPlan?.id === plan.id ? (
                                                        <>
                                                            <FontAwesomeIcon icon={faCheck} />
                                                            Thêm vào đặt lịch
                                                        </>
                                                    ) : (
                                                        <>
                                                            Thêm vào đặt lịch
                                                            <FontAwesomeIcon icon={faArrowRight} />
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            <div className={cx('planCardGradient')}></div>
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
                            <div className={cx('modernSessionsContainer')}>
                                <div className={cx('sessionHeaderInfo')}>
                                    <div className={cx('headerContent')}>
                                        <div className={cx('headerIcon')}>
                                            <FontAwesomeIcon icon={faGem} />
                                        </div>
                                        <div>
                                            <h3>{selectedPlan.planName}</h3>
                                            <p>{selectedPlan.description}</p>
                                        </div>
                                    </div>
                                    <div className={cx('headerStats')}>
                                        <div className={cx('headerStat')}>
                                            <span className={cx('statNum')}>{selectedPlan.totalSessions}</span>
                                            <span className={cx('statText')}>Buổi điều trị</span>
                                        </div>
                                        <div className={cx('statDivider')}></div>
                                        <div className={cx('headerStat')}>
                                            <span className={cx('statNum', 'priceValue')}>
                                                {selectedPlan.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedPlan.price) : '0 ₫'}
                                            </span>
                                            <span className={cx('statText')}>Giá gói</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={cx('sessionsGridLayout')}>
                                    {sessionDetails && sessionDetails.length > 0 ? (
                                        <div className={cx('sessionsGrid')}>
                                            {sessionDetails.map((session, index) => {
                                                // Find products for this session based on sessionNumber or other criteria
                                                const sessionProducts = selectedPlan?.sessionProducts?.filter(
                                                    product => product.serviceId === selectedPlan?.serviceId
                                                ) || [];
                                                
                                                return (
                                                <div key={session.id} className={cx('sessionGridCard')}>
                                                    <div className={cx('sessionGridHeader')}>
                                                        <div className={cx('sessionCheckboxArea')}>
                                                            <input
                                                                type="checkbox"
                                                                id={`session-${session.id}`}
                                                                checked={checkedSessions.has(session.id)}
                                                                onChange={() => handleSessionCheck(session.id)}
                                                                className={cx('sessionCheckbox')}
                                                            />
                                                            <label htmlFor={`session-${session.id}`} className={cx('checkboxLabel')}>
                                                                {checkedSessions.has(session.id) ? (
                                                                    <FontAwesomeIcon icon={faCheckSquare} />
                                                                ) : (
                                                                    <FontAwesomeIcon icon={faSquare} />
                                                                )}
                                                            </label>
                                                        </div>
                                                        <div className={cx('sessionBadgeModern', { checked: checkedSessions.has(session.id) })}>
                                                            <FontAwesomeIcon icon={faBolt} />
                                                            Buổi {session.sessionNumber}
                                                        </div>
                                                    </div>

                                                    <div className={cx('sessionGridContent')}>
                                                        {session.sessionName && (
                                                            <h4>{session.sessionName}</h4>
                                                        )}

                                                        {session.description && (
                                                            <p className={cx('sessionDesc')}>
                                                                {session.description}
                                                            </p>
                                                        )}

                                                        <div className={cx('sessionMetaInfoModern')}>
                                                            {session.duration && (
                                                                <div className={cx('metaItemModern')}>
                                                                    <FontAwesomeIcon icon={faClock} />
                                                                    <span>{session.duration} phút</span>
                                                                </div>
                                                            )}
                                                            <div className={cx('metaItemModern')}>
                                                                <FontAwesomeIcon icon={faCalendarAlt} />
                                                                <span>Ngày {session.sessionNumber * selectedPlan.sessionInterval}</span>
                                                            </div>
                                                        </div>

                                                        {sessionProducts && sessionProducts.length > 0 && (
                                                            <div className={cx('productsGridModern')}>
                                                                <div className={cx('productsHeaderModern')}>
                                                                    <FontAwesomeIcon icon={faGift} />
                                                                    <span>Sản phẩm sử dụng</span>
                                                                </div>
                                                                <div className={cx('productsTagsModern')}>
                                                                    {sessionProducts.map((sp) => (
                                                                        <div key={sp.sessionProductId} className={cx('productTagModern')}>
                                                                            <FontAwesomeIcon icon={faBox} />
                                                                            <span>{sp.productName}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                            })}
                                        </div>
                                    ) : (
                                        <p className={cx('emptyMessage')}>
                                            Chọn một gói liệu trình để xem chi tiết buổi học
                                        </p>
                                    )}
                                </div>

                                <div className={cx('sessionFooter')}>
                                    <button 
                                        className={cx('addToCartBtnLarge')}
                                        onClick={() => {
                                            if (checkedSessions.size === 0) {
                                                // No sessions selected, book full package
                                                handleCreateCustomerTreatmentPlan(true);
                                            } else {
                                                // Some sessions selected, book individual sessions
                                                handleCreateCustomerTreatmentPlan(false);
                                            }
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faGift} />
                                        {checkedSessions.size > 0 
                                            ? `Đặt lịch ${checkedSessions.size} buổi` 
                                            : `Đặt lịch toàn bộ ${selectedPlan.planName}`
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                        </div>
                    </div>

                    {/* Right Column - Doctors Sidebar */}
                    <div className={cx('doctorsSidebar')}>
                        {/* Doctor Detail View */}
                        {selectedDoctor ? (
                            <div className={cx('doctorDetailView')}>
                                {/* Back Button */}
                                <button 
                                    className={cx('doctorDetailBackBtn')}
                                    onClick={handleBackToDoctorsList}
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} />
                                    Quay lại
                                </button>

                                {/* Doctor Large Image */}
                                <div className={cx('doctorDetailImage')}>
                                    {selectedDoctor.staffImage ? (
                                        <img src={selectedDoctor.staffImage} alt={selectedDoctor.fullName || selectedDoctor.accountName} />
                                    ) : (
                                        <div className={cx('doctorImagePlaceholder')}>
                                            <FontAwesomeIcon icon={faUserMd} />
                                        </div>
                                    )}
                                </div>

                                {/* Doctor Detail Info */}
                                <div className={cx('doctorDetailContent')}>
                                    <h2 className={cx('doctorDetailName')}>
                                        {selectedDoctor.fullName || selectedDoctor.accountName}
                                    </h2>
                                    
                                    {selectedDoctor.specialization && (
                                        <p className={cx('doctorDetailSpecialty')}>
                                            {selectedDoctor.specialization}
                                        </p>
                                    )}

                                    {/* Full Details Grid */}
                                    <div className={cx('doctorDetailGrid')}>
                                        {selectedDoctor.degree && (
                                            <div className={cx('detailGridItem')}>
                                                <div className={cx('detailGridIcon')}>
                                                    <FontAwesomeIcon icon={faGraduationCap} />
                                                </div>
                                                <div>
                                                    <span className={cx('detailGridLabel')}>Bằng cấp</span>
                                                    <span className={cx('detailGridValue')}>{selectedDoctor.degree}</span>
                                                </div>
                                            </div>
                                        )}

                                        {selectedDoctor.experienceYears && (
                                            <div className={cx('detailGridItem')}>
                                                <div className={cx('detailGridIcon')}>
                                                    <FontAwesomeIcon icon={faBriefcase} />
                                                </div>
                                                <div>
                                                    <span className={cx('detailGridLabel')}>Kinh nghiệm</span>
                                                    <span className={cx('detailGridValue')}>{selectedDoctor.experienceYears} năm</span>
                                                </div>
                                            </div>
                                        )}

                                        {selectedDoctor.licenseNumber && (
                                            <div className={cx('detailGridItem')}>
                                                <div className={cx('detailGridIcon')}>
                                                    <FontAwesomeIcon icon={faCertificate} />
                                                </div>
                                                <div>
                                                    <span className={cx('detailGridLabel')}>Số giấy phép</span>
                                                    <span className={cx('detailGridValue')}>{selectedDoctor.licenseNumber}</span>
                                                </div>
                                            </div>
                                        )}

                                        {selectedDoctor.doctorLevel !== undefined && selectedDoctor.doctorLevel !== null && (
                                            <div className={cx('detailGridItem')}>
                                                <div className={cx('detailGridIcon')}>
                                                    <FontAwesomeIcon icon={faUserMd} />
                                                </div>
                                                <div>
                                                    <span className={cx('detailGridLabel')}>Chuyên gia</span>
                                                    <span className={cx('detailGridValue')}>
                                                        {selectedDoctor.doctorLevel === 0 ? 'Y tá' : 'Bác sĩ'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Biography */}
                                    {selectedDoctor.biography && (
                                        <div className={cx('doctorDetailBio')}>
                                            <h4>Giới thiệu</h4>
                                            <p>{selectedDoctor.biography}</p>
                                        </div>
                                    )}

                                    {/* Book Appointment Button */}
                                    <button 
                                        className={cx('doctorDetailBookBtn')}
                                        onClick={() => handleCreateCustomerTreatmentPlan(true)}
                                    >
                                        <FontAwesomeIcon icon={faCalendarAlt} />
                                        Đặt lịch với {selectedDoctor.fullName || selectedDoctor.accountName}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Doctors List View */
                            <>
                                <div className={cx('sidebarHeader')}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div className={cx('sidebarIcon')}>
                                            <FontAwesomeIcon icon={faUserMd} />
                                        </div>
                                        <h3>Đội ngũ bác sĩ</h3>
                                    </div>
                                    {doctors && doctors.length > 0 && (
                                        <div className={cx('doctorCountBadge')}>
                                            {doctors.length} bác sĩ
                                        </div>
                                    )}
                                </div>

                                {loadingDoctors ? (
                                    <div className={cx('doctorsSidebarLoading')}>
                                        <div className={cx('spinner')}></div>
                                        <p>Đang tải...</p>
                                    </div>
                                ) : doctors && doctors.length > 0 ? (
                                    <div className={cx('doctorsSidebarList')}>
                                        {doctors.map((doctor, index) => (
                                            <div key={doctor.id} className={cx('doctorSidebarCard')}>
                                                {/* Doctor Image */}
                                                <div className={cx('doctorSidebarImage')}>
                                                    {doctor.staffImage ? (
                                                        <img src={doctor.staffImage} alt={doctor.fullName || doctor.accountName} />
                                                    ) : (
                                                        <div className={cx('doctorImagePlaceholder')}>
                                                            <FontAwesomeIcon icon={faUserMd} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Doctor Info */}
                                                <div className={cx('doctorSidebarInfo')}>
                                                    <h4 className={cx('doctorSidebarName')}>
                                                        {doctor.fullName || doctor.accountName}
                                                    </h4>
                                                    {doctor.specialization && (
                                                        <p className={cx('doctorSidebarSpecialty')}>
                                                            {doctor.specialization}
                                                        </p>
                                                    )}

                                                    {/* Compact Details */}
                                                    <div className={cx('doctorSidebarDetails')}>
                                                        {doctor.degree && (
                                                            <div className={cx('sidebarDetailItem')}>
                                                                <FontAwesomeIcon icon={faGraduationCap} />
                                                                <span>{doctor.degree}</span>
                                                            </div>
                                                        )}
                                                        {doctor.experienceYears && (
                                                            <div className={cx('sidebarDetailItem')}>
                                                                <FontAwesomeIcon icon={faBriefcase} />
                                                                <span>{doctor.experienceYears} năm</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Book Button */}
                                                    <button 
                                                        className={cx('doctorSidebarBookBtn')}
                                                        onClick={() => handleViewDoctorInfo(doctor)}
                                                    >
                                                        <FontAwesomeIcon icon={faCalendarAlt} />
                                                        Xem thông tin
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={cx('noDoctorsMessageSidebar')}>
                                        <FontAwesomeIcon icon={faUserMd} />
                                        <p>Chưa có bác sĩ</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ServiceDetailsPage;
