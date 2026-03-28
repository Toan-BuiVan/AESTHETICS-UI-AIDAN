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
    const debounce = useDebounce(searchValue, 3000);
    const contactRef = useRef(null);
    const searchRef = useRef(null);
    const tippyInstanceRef = useRef(null);

    const isMobile = useMediaQuery({ query: '(max-width: 768px)' });

    // Đóng kết quả tìm kiếm khi click ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!searchRef.current) return;
            
            // Kiểm tra nếu click trong search container
            const isClickInSearch = searchRef.current.contains(event.target);
            
            // Kiểm tra nếu click trong search results popup
            const searchResultsPopup = document.querySelector('.search-results')?.contains(event.target);
            
            if (!isClickInSearch && !searchResultsPopup) {
                // Click thực sự ngoài cả search container và popup, thì đóng
                setSearchResult([]);
                setSearchValue('');
            }
        };

        // Dùng click thay vì mousedown để không conflict với navigation
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

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
            const response = await axios.post('http://localhost:5122/api/Authentication/logout', {
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

            const response = await axios.post('http://localhost:5122/api/Authentication/logout', {
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

    const fetchServices = async (serviceName) => {
        try {
            const response = await axios.post('http://localhost:5122/api/Service/getservicelist', {
                serviceName: serviceName,
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching services:', error);
            return [];
        }
    };

    // Clear ngay khi searchValue trống (không chờ debounce)
    useEffect(() => {
        if (searchValue.trim() === '') {
            setSearchResult([]);
            return;
        }
    }, [searchValue]);

    // Tìm kiếm sau debounce
    useEffect(() => {
        if (debounce.trim() === '') {
            setSearchResult([]);
            return;
        }

        async function search() {
            try {
                const response = await fetchServices(debounce);
                let serviceArray = [];
                if (Array.isArray(response)) {
                    serviceArray = response;
                } else if (response?.baseDatas && Array.isArray(response.baseDatas)) {
                    serviceArray = response.baseDatas;
                }
                setSearchResult(serviceArray);
            } catch (error) {
                console.error('Lỗi trong hàm search:', error);
                setSearchResult([]);
            }
        }
        search();
    }, [debounce]);

    const handleConsultClick = () => {
        setIsContactVisible(!isContactVisible);
    };

    // Hàm xử lý khi nhấp vào biểu tượng giỏ hàng
    const handleCartClick = () => {
        // Check if user is logged in - must have token AND at least one ID
        const token = localStorage.getItem('token');
        const userID = localStorage.getItem('userID');
        const customerId = localStorage.getItem('customerId');
        const staffId = localStorage.getItem('staffId');
        const refreshToken = localStorage.getItem('refreshToken');

        if (!token || !refreshToken || (!userID && !customerId && !staffId)) {
            setSuccessMessage('Vui lòng đăng nhập để xem giỏ hàng.');
            setTimeout(() => {
                setSuccessMessage(null);
            }, 2000);
        } else {
            window.location.href = '/cartProduct';
        }
    };

    const handleBookingsClick = () => {
        window.location.href = '/servicesPage';
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
                    <div className={cx('inner-search')} ref={searchRef}>
                        <img className={cx('images-search')} src={image.imgaeSearch} alt="Image-Search" />
                        {searchResult.length > 0 && searchValue.trim() !== '' ? (
                            <Tippy
                                appendTo={document.body}
                                interactive={true}
                                visible={true}
                                placement={isMobile ? 'bottom' : 'bottom-start'}
                                delay={[0, 100]}
                                maxWidth="80%"
                                render={(attrs) => (
                                    <div 
                                        className={cx('search-results')} 
                                        tabIndex="-1" 
                                        {...attrs}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <PopperWrapper>
                                            <h4 className={cx('search-title')}>Kết Quả Tìm Kiếm...</h4>
                                            {searchResult.map((result, index) => (
                                                <ResultSearchItem 
                                                    key={index} 
                                                    data={result}
                                                    onNavigate={() => {
                                                        // Sau khi navigate, đóng search
                                                        setTimeout(() => {
                                                            setSearchResult([]);
                                                            setSearchValue('');
                                                        }, 0);
                                                    }}
                                                />
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
                        ) : (
                            <input
                                className={cx('inner-input')}
                                placeholder="Tìm kiếm bài viết, dịch vụ..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />
                        )}
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
                            <button
                                className={cx('user-icon-btn', isMenuVisible && isLoggedIn() ? 'active' : '')}
                                onClick={() => {
                                    if (isLoggedIn()) {
                                        setIsMenuVisible(!isMenuVisible);
                                    } else {
                                        setIsLoginVisible(!isLoginVisible);
                                    }
                                }}
                                title="Tài khoản"
                            >
                                <FontAwesomeIcon icon={faUser} />
                            </button>
                            {isMenuVisible && isLoggedIn() && (
                                <>
                                    <div 
                                        className={cx('menu-backdrop')} 
                                        onClick={() => setIsMenuVisible(false)}
                                    ></div>
                                    <ul className={cx('user-menu')}>
                                        <li className={cx('menu-item')} onClick={handleProfileClick}>
                                            <FontAwesomeIcon icon={faUser} />
                                            Trang cá nhân
                                        </li>
                                        <li className={cx('menu-divider')}></li>
                                        <li className={cx('menu-item')} onClick={handleLogoutDevice}>
                                            <FontAwesomeIcon icon={faUser} />
                                            Đăng xuất 1 thiết bị
                                        </li>
                                        <li className={cx('menu-item')} onClick={handleLogoutAllDevices}>
                                            <FontAwesomeIcon icon={faUser} />
                                            Đăng xuất tất cả thiết bị
                                        </li>
                                    </ul>
                                </>
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
