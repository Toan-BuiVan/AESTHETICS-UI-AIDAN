
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import axios from 'axios';

import styles from './MenuItem.Module.scss';

const cx = classNames.bind(styles);

function MenuItem() {
    const [servicesById, setServicesById] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [menuItems, setMenuItems] = useState([
        { name: 'Trang Chủ', id: null, href: '/' },
        {
            name: 'Giới Thiệu',
            id: null,
            subItems: [
                { name: 'Công nghệ', href: '#section-content' },
                { name: 'Câu chuyện', href: '#section-relative' },
                { name: 'Khuyến mãi', href: '#section-sales' },
                { name: 'Tin Tức', href: '#setion-tintuc' },
                { name: 'Đánh Giá', href: '#section-nhan-xet' },
            ],
        },
        // Các mục động từ API sẽ được thêm vào đây
        { name: 'Danh sách Dịch Vụ', id: null, href: '/services-list' },
        { name: 'Đặt Lịch Khám', id: null, href: '/services' },
        { name: 'Sản Phẩm', id: null, href: '/productsPage' }, // Giữ cố định nếu không từ API
    ]);

    useEffect(() => {
        const fetchAllServices = async () => {
            try {
                // Gọi API để lấy danh sách loại dịch vụ động (Servicess)
                const headers = { 'Content-Type': 'application/json' }; // Thêm headers nếu cần token, v.v.
                const servicesTypeResponse = await axios.post(
                    'http://localhost:5262/api/TypeProductsServices/GetList_SreachProductsOfServices',
                    {
                        productsOfServicesID: null,
                        productsOfServicesName: null,
                        productsOfServicesType: 'Servicess',
                    },
                    { headers },
                );
                let dynamicTypesData = servicesTypeResponse.data;
                let dynamicTypes = [];
                if (Array.isArray(dynamicTypesData)) {
                    dynamicTypes = dynamicTypesData;
                } else if (dynamicTypesData && Array.isArray(dynamicTypesData.data)) {
                    dynamicTypes = dynamicTypesData.data;
                }

                // Tạo menuItems động từ API
                const dynamicMenuItems = dynamicTypes.map((type) => ({
                    name: type.productsOfServicesName || 'Không tên',
                    id: type.productsOfServicesID,
                    href: '/servicesPage',
                }));

                // Cập nhật menuItems: Trang Chủ + Giới Thiệu + động + Danh sách DV + Đặt Lịch + Bảng Giá + Sản Phẩm
                const fixedItemsAfter = menuItems.slice(2);
                const newMenuItems = [
                    ...menuItems.slice(0, 2), // Giữ Trang Chủ và Giới Thiệu
                    ...dynamicMenuItems, // Thêm động
                    ...fixedItemsAfter, // Thêm Danh sách DV, Đặt lịch, Bảng Giá và Sản Phẩm ở cuối
                ];
                setMenuItems(newMenuItems);

                // Tiếp tục lấy allServices như cũ
                const allServicesResponse = await axios.post(
                    'http://localhost:5262/api/Servicess/GetList_SearchServicess',
                    {
                        serviceID: null,
                        serviceName: null,
                        productsOfServicesID: null,
                    },
                );
                let allServicesData = allServicesResponse.data;
                let allServices = [];
                if (Array.isArray(allServicesData)) {
                    allServices = allServicesData;
                } else if (allServicesData && Array.isArray(allServicesData.data)) {
                    allServices = allServicesData.data;
                }

                // Tạo servicesById từ allServices (dùng cho sub-items)
                const servicesByIdTemp = {};
                [...dynamicMenuItems, ...fixedItemsAfter].forEach((item) => {
                    // Bao gồm cả động và cố định
                    if (item.id !== null) {
                        servicesByIdTemp[item.id] = allServices.filter(
                            (service) => service.productsOfServicesID === item.id,
                        );
                    }
                });

                setServicesById(servicesByIdTemp);
                setLoading(false);
            } catch (err) {
                setError('Không thể tải dịch vụ');
                setLoading(false);
            }
        };
        fetchAllServices();
    }, []);

    const toggleMenu = () => {
        setIsMenuVisible(!isMenuVisible);
    };

    const handleNavigation = (href) => {
        window.location.href = href;
    };

    const specificServiceIds = [1, 3, 4, 5, 6, 7, 8]; // Giữ nguyên, nhưng có thể điều chỉnh nếu id từ API khác

    const renderServices = (item) => {
        const isSpecificService = specificServiceIds.includes(item.id) || item.name === 'Sản Phẩm';
        if (item.subItems) {
            return item.subItems.map((subItem, index) => (
                <li key={index} className={cx('respone-item')}>
                    <a href={subItem.href}>{subItem.name}</a>
                </li>
            ));
        } else if (item.id && servicesById[item.id]?.length > 0) {
            const services = servicesById[item.id];
            if (loading)
                return <li className={cx('respone-item', { 'specific-service': isSpecificService })}>Đang tải...</li>;
            if (error)
                return <li className={cx('respone-item', { 'specific-service': isSpecificService })}>{error}</li>;
            if (services.length <= 8) {
                return services.map((service, index) => (
                    <li
                        key={index}
                        className={cx('respone-item', { 'specific-service': isSpecificService })}
                        onClick={() => handleNavigation('/servicesPage')}
                    >
                        {service.serviceName || `Dịch vụ ${index + 1}`}
                    </li>
                ));
            } else {
                const midPoint = Math.ceil(services.length / 2);
                const leftColumn = services.slice(0, midPoint);
                const rightColumn = services.slice(midPoint);
                return (
                    <div className={cx('columns')}>
                        <ul className={cx('column')}>
                            {leftColumn.map((service, index) => (
                                <li
                                    key={index}
                                    className={cx('respone-item', { 'specific-service': isSpecificService })}
                                    onClick={() => handleNavigation('/servicesPage')}
                                >
                                    {service.serviceName || `Dịch vụ ${index + 1}`}
                                </li>
                            ))}
                        </ul>
                        <ul className={cx('column')}>
                            {rightColumn.map((service, index) => (
                                <li
                                    key={index + midPoint}
                                    className={cx('respone-item', { 'specific-service': isSpecificService })}
                                    onClick={() => handleNavigation('/servicesPage')}
                                >
                                    {service.serviceName || `Dịch vụ ${index + midPoint + 1}`}
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            }
        }
        return null;
    };

    const midPoint = Math.ceil(menuItems.length / 2);
    const leftColumnItems = menuItems.slice(0, midPoint);
    const rightColumnItems = menuItems.slice(midPoint);

    return (
        <div className={cx('menu-Item', { show: isMenuVisible })}>
            <div className={cx('list-Div')} onClick={toggleMenu}>
                <FontAwesomeIcon icon={faList} />
            </div>
            <div className={cx('menu-items-container')}>
                <div className={cx('menu-column')}>
                    {leftColumnItems.map((item, index) => {
                        const isSpecificService = specificServiceIds.includes(item.id) || item.name === 'Sản Phẩm';
                        if (item.id || item.name === 'Sản Phẩm') {
                            return (
                                <div
                                    key={index}
                                    className={cx('menu-home-item')}
                                    onClick={() => handleNavigation(item.href || '/servicesPage')}
                                >
                                    <span className="menu-text">{item.name}</span>
                                    <ul className={cx('ul-item', { 'specific-service': isSpecificService })}>
                                        {renderServices(item)}
                                    </ul>
                                </div>
                            );
                        } else if (item.subItems) {
                            return (
                                <div key={index} className={cx('menu-home-item')}>
                                    <span className="menu-text">{item.name}</span>
                                    <ul className={cx('ul-item')}>{renderServices(item)}</ul>
                                </div>
                            );
                        } else {
                            return (
                                <a key={index} className={cx('menu-home-item')} href={item.href || '#'}>
                                    <span className="menu-text">{item.name}</span>
                                </a>
                            );
                        }
                    })}
                </div>

                <div className={cx('menu-column')}>
                    {rightColumnItems.map((item, index) => {
                        const isSpecificService = specificServiceIds.includes(item.id) || item.name === 'Sản Phẩm';
                        if (item.id || item.name === 'Sản Phẩm') {
                            return (
                                <div
                                    key={index + midPoint}
                                    className={cx('menu-home-item')}
                                    onClick={() => handleNavigation(item.href || '/servicesPage')}
                                >
                                    <span className="menu-text">{item.name}</span>
                                    <ul className={cx('ul-item', { 'specific-service': isSpecificService })}>
                                        {renderServices(item)}
                                    </ul>
                                </div>
                            );
                        } else if (item.subItems) {
                            return (
                                <div key={index + midPoint} className={cx('menu-home-item')}>
                                    <span className="menu-text">{item.name}</span>
                                    <ul className={cx('ul-item')}>{renderServices(item)}</ul>
                                </div>
                            );
                        } else {
                            return (
                                <a key={index + midPoint} className={cx('menu-home-item')} href={item.href || '#'}>
                                    <span className="menu-text">{item.name}</span>
                                </a>
                            );
                        }
                    })}
                </div>
            </div>
        </div>
    );
}

export default MenuItem;
