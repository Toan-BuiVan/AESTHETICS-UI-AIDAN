import React, { useState, useEffect } from 'react';
import axios from 'axios';
import classNames from 'classnames/bind';
import styles from './ServicesListPage.module.scss';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faArrowRight, faStar, faClock, faDollarSign } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function ServicesListPage() {
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [serviceType, setServiceType] = useState('all');
    const [sortBy, setSortBy] = useState('name');

    useEffect(() => {
        fetchServices();
    }, []);

    useEffect(() => {
        filterAndSortServices();
    }, [services, searchTerm, serviceType, sortBy]);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const response = await axios.post(
                'http://localhost:5262/api/Servicess/GetSortedPagedServicess',
                {
                    pageIndex: 1,
                    pageSize: 100,
                    minPrice: null,
                    maxPrice: null,
                    productsOfServicesName: null,
                }
            );

            let servicesData = [];
            if (Array.isArray(response.data)) {
                servicesData = response.data;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                servicesData = response.data.data;
            }

            setServices(servicesData);
        } catch (error) {
            console.error('Error fetching services:', error);
            setServices([]);
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortServices = () => {
        let results = [...services];

        // Filter by service type
        if (serviceType === 'single') {
            results = results.filter(s => !s.isCourse);
        } else if (serviceType === 'package') {
            results = results.filter(s => s.isCourse);
        }

        // Filter by search term
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            results = results.filter(s =>
                s.serviceName.toLowerCase().includes(term) ||
                s.description?.toLowerCase().includes(term)
            );
        }

        // Sort
        if (sortBy === 'name') {
            results.sort((a, b) => a.serviceName.localeCompare(b.serviceName));
        } else if (sortBy === 'price-asc') {
            results.sort((a, b) => (a.priceService || 0) - (b.priceService || 0));
        } else if (sortBy === 'price-desc') {
            results.sort((a, b) => (b.priceService || 0) - (a.priceService || 0));
        }

        setFilteredServices(results);
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
            <div className={cx('hero')}>
                <div className={cx('heroContent')}>
                    <h1>Danh sách Dịch Vụ</h1>
                    <p>Khám phá các dịch vụ chuyên môn của chúng tôi</p>
                </div>
            </div>

            <div className={cx('container')}>
                {/* Search & Filter Section */}
                <div className={cx('filterPanel')}>
                    <div className={cx('searchBox')}>
                        <FontAwesomeIcon icon={faSearch} className={cx('searchIcon')} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm dịch vụ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                                onChange={(e) => setServiceType(e.target.value)}
                                className={cx('selectInput')}
                            >
                                <option value="all">Tất cả</option>
                                <option value="single">Dịch vụ đơn lẻ</option>
                                <option value="package">Gói liệu trình</option>
                            </select>
                        </div>

                        <div className={cx('filterGroup')}>
                            <label>Sắp xếp</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className={cx('selectInput')}
                            >
                                <option value="name">Theo tên A-Z</option>
                                <option value="price-asc">Giá: Thấp → Cao</option>
                                <option value="price-desc">Giá: Cao → Thấp</option>
                            </select>
                        </div>
                    </div>

                    <div className={cx('resultCount')}>
                        Hiển thị <span>{filteredServices.length}</span> dịch vụ
                    </div>
                </div>

                {/* Services Grid */}
                <div className={cx('servicesGrid')}>
                    {filteredServices.length > 0 ? (
                        filteredServices.map((service) => (
                            <Link
                                key={service.serviceID}
                                to={`/services/${service.serviceID}`}
                                className={cx('serviceCard')}
                            >
                                <div className={cx('cardImage')}>
                                    <div className={cx('imagePlaceholder')}>
                                        {service.isCourse ? '📦' : '💄'}
                                    </div>
                                    <span className={cx('badge', { package: service.isCourse })}>
                                        {service.isCourse ? 'Gói liệu trình' : 'Dịch vụ đơn lẻ'}
                                    </span>
                                </div>

                                <div className={cx('cardContent')}>
                                    <h3 className={cx('serviceName')}>{service.serviceName}</h3>

                                    {service.description && (
                                        <p className={cx('serviceDescription')}>
                                            {service.description.substring(0, 100)}...
                                        </p>
                                    )}

                                    <div className={cx('serviceStats')}>
                                        <div className={cx('stat')}>
                                            <FontAwesomeIcon icon={faDollarSign} />
                                            <span>{service.priceService?.toLocaleString('vi-VN')} VNĐ</span>
                                        </div>
                                        <div className={cx('stat')}>
                                            <FontAwesomeIcon icon={faStar} />
                                            <span>4.8 (245)</span>
                                        </div>
                                    </div>

                                    <div className={cx('cardFooter')}>
                                        <span className={cx('viewMore')}>
                                            Xem chi tiết
                                            <FontAwesomeIcon icon={faArrowRight} />
                                        </span>
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
            </div>
        </div>
    );
}

export default ServicesListPage;
