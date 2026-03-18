import axios from 'axios';
import Tippy from '@tippyjs/react';
import classNames from 'classnames/bind';
import { useEffect, useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMediaQuery } from 'react-responsive';
import {
    faMagnifyingGlass,
    faUser,
    faCartShopping,
    faCalendarDays,
    faComments,
} from '@fortawesome/free-solid-svg-icons';

import MenuItem from './MenuItem';
import image from '~/assets/images';
import { useDebounce } from '~/hooks';
import ContactInfo from './ContactInfo';
import styles from './Header.module.scss';
import SuccessMessage from './SuccessMessage';
import ResultSearchItem from '~/components/ResultSearchItem';
import { Wrapper as PopperWrapper } from '~/components/Popper';
import Login from '~/components/Layout/DefaultLayout/Header/Login';

const cx = classNames.bind(styles);

function Header() {
    const [searchValue, setSearchValue] = useState('');
    const [searchResult, setSearchResult] = useState([]);
    const [isContactVisible, setIsContactVisible] = useState(false);
    const [isLoginVisible, setIsLoginVisible] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const debounce = useDebounce(searchValue, 500);
    const contactRef = useRef(null);

    const isMobile = useMediaQuery({ query: '(max-width: 768px)' });

    // Hàm kiểm tra trạng thái đăng nhập
    const isLoggedIn = () => {
        return !!localStorage.getItem('token');
    };

    // Các hàm xử lý hành động trong menu
    const handleProfileClick = () => {
        window.location.href = '/profile';
        setIsMenuVisible(false);
    };

    const handleLogoutDevice = async () => {
        try {
            // Lấy accessToken từ localStorage với khóa 'token'
            const token = localStorage.getItem('token');

            // Gửi yêu cầu POST với payload { accessToken: token }
            const response = await axios.post('http://localhost:5262/api/Authentication/LogOut_Account', {
                accessToken: token,
            });

            // Xóa các giá trị cụ thể khỏi local storage
            localStorage.removeItem('deviceName');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('token');
            localStorage.removeItem('typePerson');
            localStorage.removeItem('userID');
            localStorage.removeItem('userName');
            if (response.data.responseCode === 1) {
                setSuccessMessage(response.data.resposeMessage);
                setTimeout(() => {
                    setSuccessMessage(null);
                }, 2000);
            } else {
                setSuccessMessage('Đăng xuất không thành công:');

                setTimeout(() => {
                    setSuccessMessage(null);
                }, 2000);
            }

            localStorage.clear();
            setIsMenuVisible(false);
            window.location.href = '/';
        } catch (error) {
            console.error('Lỗi khi đăng xuất:', error);
        }
    };

    const handleLogoutAllDevices = async () => {
        try {
            const accessToken = localStorage.getItem('token');
            if (!accessToken) {
                throw new Error('Không tìm thấy accessToken');
            }

            const response = await axios.post('http://localhost:5262/api/Authentication/LogOutAll_Account', {
                accessToken,
            });

            if (response.data.responseCode === 1) {
                setSuccessMessage(response.data.resposeMessage);
                setTimeout(() => {
                    setSuccessMessage(null);
                }, 2000);
            } else {
                setSuccessMessage('Đăng xuất không thành công:');
                setTimeout(() => {
                    setSuccessMessage(null);
                }, 2000);
            }

            // Xóa các giá trị cụ thể khỏi local storage
            localStorage.removeItem('deviceName');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('token');
            localStorage.removeItem('typePerson');
            localStorage.removeItem('userID');
            localStorage.removeItem('userName');

            setIsMenuVisible(false);
            window.location.href = '/';
        } catch (error) {
            console.error('Lỗi khi đăng xuất tất cả thiết bị:', error);
        }
    };

    const fetchProducts = async (productName) => {
        try {
            const response = await axios.post('http://localhost:5262/api/Products/GetList_SearchProducts', {
                productID: null,
                productName: productName,
                productsOfServicesName: null,
                supplierName: null,
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    };

    const fetchServices = async (serviceName) => {
        try {
            const response = await axios.post('http://localhost:5262/api/Servicess/GetList_SearchServicess', {
                serviceID: null,
                serviceName: serviceName,
                productsOfServicesID: null,
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching services:', error);
            return [];
        }
    };

    useEffect(() => {
        if (debounce.trim() === '') {
            setSearchResult([]);
            return;
        }

        async function search() {
            try {
                const products = await fetchProducts(debounce);
                const services = await fetchServices(debounce);
                const productArray = Array.isArray(products) ? products : [];
                const serviceArray = Array.isArray(services) ? services : [];
                const combinedResults = [...productArray, ...serviceArray];
                setSearchResult(combinedResults);
            } catch (error) {
                console.error('Lỗi trong hàm search:', error);
                setSearchResult([]);
            }
        }
        search();
    }, [debounce]);

    // useEffect(() => {
    //     const timer = setTimeout(() => {
    //         setIsContactVisible(true);
    //     }, 5000);
    //     return () => clearTimeout(timer);
    // }, []);

    const handleConsultClick = () => {
        setIsContactVisible(!isContactVisible);
    };

    // Hàm xử lý khi nhấp vào biểu tượng giỏ hàng
    const handleCartClick = () => {
        const requiredFields = ['deviceName', 'refreshToken', 'token', 'typePerson', 'userID', 'userName'];
        const missingFields = requiredFields.filter((field) => !localStorage.getItem(field));

        if (missingFields.length > 0) {
            setSuccessMessage('Vui lòng đăng nhập để xem giỏ hàng.');
            setTimeout(() => {
                setSuccessMessage(null);
            }, 2000);
        } else {
            window.location.href = '/cartProduct';
        }
    };

    const handleBookingsClick = () => {
        const requiredFields = ['deviceName', 'refreshToken', 'token', 'typePerson', 'userID', 'userName'];
        const missingFields = requiredFields.filter((field) => !localStorage.getItem(field));

        if (missingFields.length > 0) {
            setSuccessMessage('Vui lòng đăng nhập để xem lịch đặt trước.');
            setTimeout(() => {
                setSuccessMessage(null);
            }, 2000);
        } else {
            window.location.href = '/bookings';
        }
    };

    return (
        <header className={cx('wrapper')}>
            {successMessage && <SuccessMessage message={successMessage} />}
            {isContactVisible && (
                <ContactInfo
                    ref={contactRef}
                    onClose={() => setIsContactVisible(false)}
                    setSuccessMessage={setSuccessMessage}
                />
            )}
            <div className={cx('inner')}>
                <div className={cx('inner-logo')}>
                    <img src={image.logo} alt="Image-Banner" />
                </div>
                <div className={cx('header-actions')}>
                    <div className={cx('inner-search')}>
                        <img className={cx('images-search')} src={image.imgaeSearch} alt="Image-Search" />
                        <Tippy
                            appendTo={document.body}
                            interactive={true}
                            visible={searchResult.length > 0}
                            placement={isMobile ? 'bottom' : 'bottom-start'}
                            delay={[0, 100]}
                            maxWidth="80%"
                            render={(attrs) => (
                                <div className={cx('search-results')} tabIndex="-1" {...attrs}>
                                    {' '}
                                    <PopperWrapper>
                                        <h4 className={cx('search-title')}>Kết Quả Tìm Kiếm...</h4>
                                        {searchResult.map((result, index) => (
                                            <ResultSearchItem key={index} data={result} />
                                        ))}
                                    </PopperWrapper>
                                </div>
                            )}
                        >
                            <input
                                className={cx('inner-input')}
                                placeholder="Tìm kiếm bài viết, dịch vụ..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />
                        </Tippy>
                        <button className={cx('search-btn')}>
                            <FontAwesomeIcon icon={faMagnifyingGlass} />
                        </button>
                        <span className={cx('search-hotline')}>Hotline: 0383102313</span>
                        <button className={cx('search-btn-tuvan')} onClick={handleConsultClick}>
                            <FontAwesomeIcon icon={faComments} />
                            Nhắn tin
                        </button>
                    </div>
                    <div className={cx('icons-right')}>
                        <FontAwesomeIcon icon={faCalendarDays} onClick={handleBookingsClick} />
                        <div className={cx('user-icon')}>
                            <FontAwesomeIcon
                                icon={faUser}
                                onClick={() => {
                                    if (isLoggedIn()) {
                                        setIsMenuVisible(!isMenuVisible);
                                    } else {
                                        setIsLoginVisible(!isLoginVisible);
                                    }
                                }}
                            />
                            {isMenuVisible && isLoggedIn() && (
                                <ul className={cx('user-menu')}>
                                    <li onClick={handleProfileClick}>Trang cá nhân</li>
                                    <li onClick={handleLogoutDevice}>Đăng xuất 1 thiết bị</li>
                                    <li onClick={handleLogoutAllDevices}>Đăng xuất tất cả thiết bị</li>
                                </ul>
                            )}
                        </div>
                        <FontAwesomeIcon icon={faCartShopping} onClick={handleCartClick} />
                    </div>
                </div>
                <div className={cx('header-menu')}>
                    <MenuItem />
                </div>
            </div>
            {isLoginVisible && (
                <>
                    <div className={cx('overlay')} onClick={() => setIsLoginVisible(false)}></div>
                    <Login onClose={() => setIsLoginVisible(false)} setSuccessMessage={setSuccessMessage} />
                </>
            )}
        </header>
    );
}

export default Header;
