import React, { useState, useEffect } from 'react';
import axios from 'axios';
import classNames from 'classnames/bind';
import styles from './ServicesListPage.module.scss';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faArrowRight, faStar, faClock, faDollarSign, faChevronLeft, faChevronRight, faWandMagicSparkles, faHeartbeat } from '@fortawesome/free-solid-svg-icons';
import useDebounce from '~/hooks/useDebounce';

const cx = classNames.bind(styles);

function ServicesListPage() {
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [serviceType, setServiceType] = useState('all');
    const [selectedServiceTypeId, setSelectedServiceTypeId] = useState(null);
    const [serviceTypeList, setServiceTypeList] = useState([]);
    const [pageNo, setPageNo] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecordCount, setTotalRecordCount] = useState(0);
    const PAGE_SIZE = 12;

    const debouncedSearchTerm = useDebounce(searchTerm, 3000);
    const debouncedServiceType = useDebounce(serviceType, 3000);
    const debouncedSelectedServiceTypeId = useDebounce(selectedServiceTypeId, 3000);

    // Fetch service types list on mount
    useEffect(() => {
        fetchServiceTypes();
    }, []);

    useEffect(() => {
        fetchServices(1, debouncedSearchTerm, debouncedServiceType, debouncedSelectedServiceTypeId);
    }, [debouncedSearchTerm, debouncedServiceType, debouncedSelectedServiceTypeId]);

    const fetchServiceTypes = async () => {
        try {
            const response = await axios.post(
                'http://localhost:5122/api/ServiceType/getservicetypelist',
                {
                    serviceCategory: 0
                }
            );

            let typesData = [];
            if (Array.isArray(response.data)) {
                typesData = response.data;
            } else if (response.data?.baseDatas && Array.isArray(response.data.baseDatas)) {
                typesData = response.data.baseDatas;
            }
            
            setServiceTypeList(typesData);
        } catch (error) {
            console.error('Error fetching service types:', error);
            setServiceTypeList([]);
        }
    };

    const fetchServices = async (page = 1, search = '', type = 'all', serviceTypeId = null) => {
        setLoading(true);
        try {
            // Map filter type to isCourse value
            let isCourseValue = null;
            if (type === 'single') {
                isCourseValue = false;
            } else if (type === 'package') {
                isCourseValue = true;
            }

            const response = await axios.post(
                'http://localhost:5122/api/Service/getservicelist',
                {
                    pageNo: page,
                    pageSize: PAGE_SIZE,
                    id: null,
                    serviceName: search.trim() || null,
                    serviceTypeId: serviceTypeId || null,
                    isCourse: isCourseValue
                }
            );

            let servicesData = [];
            let pageCount = 1;
            let totalCount = 0;

            if (Array.isArray(response.data)) {
                servicesData = response.data;
            } else if (response.data?.baseDatas && Array.isArray(response.data.baseDatas)) {
                servicesData = response.data.baseDatas;
                pageCount = response.data.pageCount || 1;
                totalCount = response.data.totalRecordCount || 0;
            }

            setServices(servicesData);
            setPageNo(response.data?.pageIndex || page);
            setTotalPages(pageCount);
            setTotalRecordCount(totalCount);
        } catch (error) {
            console.error('Error fetching services:', error);
            setServices([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
    };

    const handleServiceTypeChange = (value) => {
        setServiceType(value);
    };

    const handleServiceTypeIdChange = (value) => {
        setSelectedServiceTypeId(value === 'all' ? null : parseInt(value));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchServices(newPage, searchTerm, serviceType, selectedServiceTypeId);
        }
    };

    if (loading) {
        return (
            <div className={cx('wrapper')}>
                <div className={cx('loadingContainer')}>
                    <div className={cx('spinner')}></div>
                    <p>Đang tải danh sách dịch vụ...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cx('wrapper')}>
            {/* Hero Section */}
            {/* <div className={cx('hero')}>
                <div className={cx('heroContent')}>
                    <h1>Danh sách Dịch Vụ</h1>
                    <p>Khám phá các dịch vụ chuyên môn của chúng tôi</p>
                </div>
            </div> */}

            <div className={cx('container')}>
                {/* Search & Filter Section */}
                <div className={cx('filterPanel')}>
                    <div className={cx('searchBox')}>
                        <FontAwesomeIcon icon={faSearch} className={cx('searchIcon')} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm dịch vụ..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className={cx('searchInput')}
                        />
                    </div>

                    <div className={cx('filterControls')}>
                        <div className={cx('filterGroup')}>
                            <label>
                                <FontAwesomeIcon icon={faFilter} />
                                Loại dịch vụ
                            </label>
                            <select
                                value={serviceType}
                                onChange={(e) => handleServiceTypeChange(e.target.value)}
                                className={cx('selectInput')}
                            >
                                <option value="all">Tất cả</option>
                                <option value="single">Dịch vụ đơn lẻ</option>
                                <option value="package">Có liệu trình</option>
                            </select>
                        </div>

                        <div className={cx('filterGroup')}>
                            <label>
                                <FontAwesomeIcon icon={faFilter} />
                                Danh mục dịch vụ
                            </label>
                            <select
                                value={selectedServiceTypeId || 'all'}
                                onChange={(e) => handleServiceTypeIdChange(e.target.value)}
                                className={cx('selectInput')}
                            >
                                <option value="all">Tất cả</option>
                                {serviceTypeList.map((st) => (
                                    <option key={st.id} value={st.id}>
                                        {st.serviceTypeName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={cx('resultCount')}>
                        <span className={cx('countInfo')}>Tổng: <strong>{totalRecordCount}</strong> dịch vụ</span>
                        <span className={cx('pageInfo')}>Trang <strong>{pageNo}</strong> / <strong>{totalPages}</strong></span>
                    </div>
                </div>

                {/* Services Grid */}
                <div className={cx('servicesContainer')}>
                    {services.length > 0 ? (
                        services.map((service) => (
                            <Link
                                key={service.id}
                                to={`/services/${service.id}`}
                                className={cx('serviceCardRow')}
                            >
                                <div className={cx('cardRowImageCol')}>
                                    <div className={cx('cardRowImage')}>
                                        {service.serviceImage ? (
                                            <img src={service.serviceImage} alt={service.serviceName} />
                                        ) : (
                                            <div className={cx('imagePlaceholderIcon')}>
                                                <FontAwesomeIcon 
                                                    icon={service.isCourse ? faWandMagicSparkles : faHeartbeat} 
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className={cx('badgeContainer')}>
                                        <span className={cx('badge', { course: service.isCourse, single: !service.isCourse })}>
                                            {service.isCourse ? 'Có liệu trình' : 'Dịch vụ đơn lẻ'}
                                        </span>
                                    </div>
                                </div>

                                <div className={cx('cardRowContent')}>
                                    <div className={cx('contentTop')}>
                                        <div className={cx('titleSection')}>
                                            <div className={cx('serviceTypeTag')}>{service.serviceTypeName}</div>
                                            <h3 className={cx('serviceName')}>{service.serviceName}</h3>
                                        </div>
                                    </div>

                                    {service.description && (
                                        <p className={cx('serviceDescription')}>
                                            {service.description}
                                        </p>
                                    )}

                                    <div className={cx('contentBottom')}>
                                        <div className={cx('statsGroup')}>
                                            <div className={cx('statItem')}>
                                                <div className={cx('statIcon')}>
                                                    <FontAwesomeIcon icon={faClock} />
                                                </div>
                                                <div className={cx('statContent')}>
                                                    <div className={cx('statLabel')}>Thời gian</div>
                                                    <div className={cx('statValue')}>{service.duration} phút</div>
                                                </div>
                                            </div>

                                            <div className={cx('statItem')}>
                                                <div className={cx('statIcon')}>
                                                    <FontAwesomeIcon icon={faDollarSign} />
                                                </div>
                                                <div className={cx('statContent')}>
                                                    <div className={cx('statLabel')}>Giá</div>
                                                    <div className={cx('statValue')}>
                                                        {service.price?.toLocaleString('vi-VN')} VNĐ
                                                        {!service.isCourse ? '/buổi' : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {service.isCourse ? (
                                            <button 
                                                className={cx('actionBtn')}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    navigate(`/services/${service.id}`);
                                                }}
                                            >
                                                Xem chi tiết
                                                <FontAwesomeIcon icon={faArrowRight} />
                                            </button>
                                        ) : (
                                            <button 
                                                className={cx('actionBtn', 'bookingBtn')}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    console.log('📋 Navigating to services with serviceType:', service.serviceType);
                                                    navigate(`/services/${service.id}`, {
                                                        state: {
                                                            serviceType: service.serviceType
                                                        }
                                                    });
                                                }}
                                            >
                                                Đặt lịch
                                                <FontAwesomeIcon icon={faArrowRight} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className={cx('emptyState')}>
                            <p>Không tìm thấy dịch vụ phù hợp</p>
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setServiceType('all');
                                }}
                                className={cx('resetBtn')}
                            >
                                Đặt lại bộ lọc
                            </button>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {services.length > 0 && totalPages > 1 && (
                    <div className={cx('pagination')}>
                        <button
                            className={cx('paginationBtn', { disabled: pageNo === 1 })}
                            onClick={() => handlePageChange(pageNo - 1)}
                            disabled={pageNo === 1}
                        >
                            <FontAwesomeIcon icon={faChevronLeft} />
                            Trước
                        </button>

                        <div className={cx('pageNumbers')}>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                                <button
                                    key={num}
                                    className={cx('pageNumber', { active: pageNo === num })}
                                    onClick={() => handlePageChange(num)}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>

                        <button
                            className={cx('paginationBtn', { disabled: pageNo === totalPages })}
                            onClick={() => handlePageChange(pageNo + 1)}
                            disabled={pageNo === totalPages}
                        >
                            Tiếp theo
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ServicesListPage;
