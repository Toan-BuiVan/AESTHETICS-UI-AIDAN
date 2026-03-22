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
    faBolt
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

    useEffect(() => {
        fetchTreatmentPlans(serviceId);
    }, [serviceId]);

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

                        <div className={cx('heroStats')}>
                            <div className={cx('heroStat')}>
                                <span className={cx('statValue')}>4.9</span>
                                <span className={cx('statLabel')}>Đánh giá</span>
                                <div className={cx('stars')}>★★★★★</div>
                            </div>
                            <div className={cx('statDivider')}></div>
                            <div className={cx('heroStat')}>
                                <span className={cx('statValue')}>2.5K+</span>
                                <span className={cx('statLabel')}>Khách hài lòng</span>
                            </div>
                            <div className={cx('statDivider')}></div>
                            <div className={cx('heroStat')}>
                                <span className={cx('statValue')}>10+</span>
                                <span className={cx('statLabel')}>Năm kinh nghiệm</span>
                            </div>
                        </div>

                        <div className={cx('heroBenefits')}>
                            <div className={cx('benefitChip')}>
                                <span>🎯</span>
                                <span>Kết quả tối ưu</span>
                            </div>
                            <div className={cx('benefitChip')}>
                                <span>💯</span>
                                <span>Chất lượng đảm bảo</span>
                            </div>
                            <div className={cx('benefitChip')}>
                                <span>🔒</span>
                                <span>An toàn 100%</span>
                            </div>
                            <div className={cx('benefitChip')}>
                                <span>🚀</span>
                                <span>Kỹ thuật tiên tiến</span>
                            </div>
                        </div>

                        <p className={cx('heroDescription')}>
                            {service?.description || selectedPlan?.description || 'Liệu trình chắp chải đặc biệt được thiết kế riêng cho từng loại da, mang lại hiệu quả tối đa'}
                        </p>

                        <div className={cx('heroCta')}>
                            <button className={cx('ctaPrimary')}>
                                <FontAwesomeIcon icon={faGift} />
                                Đặt lịch ngay
                            </button>
                            {/* <button className={cx('ctaSecondary')}>
                                Xem chi tiết
                                <FontAwesomeIcon icon={faArrowRight} />
                            </button> */}
                        </div>

                        <div className={cx('heroTrust')}>
                            <div className={cx('trustItem')}>
                                <span className={cx('trustIcon')}>👥</span>
                                <span>Được tin tưởng bởi hàng nghìn khách hàng</span>
                            </div>
                            <div className={cx('trustItem')}>
                                <span className={cx('trustIcon')}>✓</span>
                                <span>Hoàn tiền 100% nếu không hài lòng</span>
                            </div>
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
                                            {service.priceService?.toLocaleString('vi-VN')} VNĐ/lần
                                        </span>
                                    </div>
                                    {isCourseService && (
                                        <div className={cx('overviewItem')}>
                                            <span className={cx('label')}>Số gói liệu trình:</span>
                                            <span className={cx('value')}>{selectedPlan?.totalSessions || (treatmentPlans.length > 0 ? treatmentPlans[0].totalSessions : 0)}</span>
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
                                                                <span>Ngày {(index + 1) * selectedPlan.sessionInterval}</span>
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
                                    <button className={cx('addToCartBtnLarge')}>
                                        <FontAwesomeIcon icon={faGift} />
                                        Thêm {selectedPlan.planName} vào đặt lịch
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ServiceDetailsPage;
