import axios from 'axios';
import classNames from 'classnames/bind';
import { useEffect, useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock, faCode, faUserPlus, faTimes } from '@fortawesome/free-solid-svg-icons'; // Thêm faTimes cho close icon
import styles from './Login.module.scss';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { jwtDecode } from 'jwt-decode';

const cx = classNames.bind(styles);

function Login({ onClose, setSuccessMessage }) {
    const [isLoginForm, setIsLoginForm] = useState(true);
    const [error, setError] = useState(null);
    const wrapperRef = useRef(null);
    const loginTitleRef = useRef(null);
    const registerTitleRef = useRef(null);

    const loginFunction = () => {
        setIsLoginForm(true);
        if (wrapperRef.current) {
            wrapperRef.current.style.height = '500px';
        }
        if (loginTitleRef.current) {
            loginTitleRef.current.style.top = '50%';
            loginTitleRef.current.style.opacity = '1';
        }
        if (registerTitleRef.current) {
            registerTitleRef.current.style.top = '50px';
            registerTitleRef.current.style.opacity = '0';
        }
    };

    const registerFunction = () => {
        setIsLoginForm(false);
        if (wrapperRef.current) {
            wrapperRef.current.style.height = '580px';
        }
        if (loginTitleRef.current) {
            loginTitleRef.current.style.top = '-60px';
            loginTitleRef.current.style.opacity = '0';
        }
        if (registerTitleRef.current) {
            registerTitleRef.current.style.top = '50%';
            registerTitleRef.current.style.opacity = '1';
        }
    };

    useEffect(() => {
        loginFunction();
    }, []);

    const handleLogin = async (event) => {
        event.preventDefault();

        const userName = document.getElementById('log-email').value;
        const password = document.getElementById('log-pass').value;

        try {
            const response = await axios.post('http://localhost:5122/api/Authentication/login', {
                userName,
                password,
            });
            const data = response.data;

            // Check if login was successful - either by token presence or responseCode
            if (data.token && data.refreshToken) {
                const message = 'Đăng nhập thành công!';
                setSuccessMessage(message);

                try {
                    // Decode JWT token to extract claims
                    const decodedToken = jwtDecode(data.token);
                    
                    // Extract claims from token
                    const userNameFromToken = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
                    let userIDFromToken = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/primarysid'];
                    const roleFromToken = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
                    const customerIdFromToken = decodedToken['CustomerId'];
                    const staffIdFromToken = decodedToken['StaffId'];

                    // Fallback: if primarysid not found, use CustomerId or StaffId
                    if (!userIDFromToken) {
                        userIDFromToken = customerIdFromToken || staffIdFromToken;
                    }

                    // Store token and refresh token
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('refreshToken', data.refreshToken);

                    // Store user info extracted from token
                    if (userNameFromToken) localStorage.setItem('userName', userNameFromToken);
                    if (userIDFromToken) localStorage.setItem('userID', userIDFromToken);
                    if (roleFromToken) localStorage.setItem('role', roleFromToken);
                    if (customerIdFromToken) localStorage.setItem('customerId', customerIdFromToken);
                    if (staffIdFromToken) localStorage.setItem('staffId', staffIdFromToken);

                    // Debug log
                    console.log('Token decoded:', {
                        userID: userIDFromToken,
                        customerId: customerIdFromToken,
                        staffId: staffIdFromToken
                    });

                    // Clear unnecessary fields
                    localStorage.removeItem('typePerson');
                    localStorage.removeItem('deviceName');
                } catch (decodeError) {
                    console.error('Lỗi giải mã token:', decodeError);
                    // If decode fails, still store the tokens and try to get ID from data object
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('refreshToken', data.refreshToken);
                    
                    // Try to get IDs from data object if available
                    const fallbackId = data.userID || data.customerId || data.staffId;
                    if (fallbackId) localStorage.setItem('userID', fallbackId);
                    if (data.customerId) localStorage.setItem('customerId', data.customerId);
                    if (data.staffId) localStorage.setItem('staffId', data.staffId);
                    
                    // Dispatch custom event to notify all components of user authentication change
                    window.dispatchEvent(new Event('userAuthenticated'));
                    
                    // Dispatch custom event to notify all components of user authentication change
                    window.dispatchEvent(new Event('userAuthenticated'));
                    
                    console.warn('Fallback to data object for IDs:', { 
                        userID: fallbackId,
                        customerId: data.customerId,
                        staffId: data.staffId 
                    });
                }

                setTimeout(() => {
                    setSuccessMessage(null);
                    onClose();
                }, 2500);
            } else if (data.responseCode === 1) {
                // Fallback for API responses with responseCode
                const message = data.responseMessage || 'Đăng nhập thành công!';
                setSuccessMessage(message);

                // Store token and refresh token
                localStorage.setItem('token', data.token);
                localStorage.setItem('refreshToken', data.refreshToken);

                // Store user info if available (with fallback)
                const userId = data.userID || data.customerId || data.id;
                if (userId) localStorage.setItem('userID', userId);
                if (data.customerId) localStorage.setItem('customerId', data.customerId);
                if (data.userName) localStorage.setItem('userName', data.userName);
                if (data.role) localStorage.setItem('role', data.role);

                // Clear unnecessary fields
                localStorage.removeItem('typePerson');
                localStorage.removeItem('deviceName');

                // Dispatch custom event to notify all components of user authentication change
                window.dispatchEvent(new Event('userAuthenticated'));

                setTimeout(() => {
                    setSuccessMessage(null);
                    onClose();
                }, 2500);
            } else {
                const message = data.responseMessage || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
                setSuccessMessage(message);
                
                // Clear token and refreshToken on failed login
                localStorage.setItem('token', null);
                localStorage.setItem('refreshToken', null);
                localStorage.removeItem('userID');
                localStorage.removeItem('userName');
                localStorage.removeItem('role');
                localStorage.removeItem('typePerson');
                localStorage.removeItem('deviceName');
                
                // Dispatch custom event to notify all components of user authentication change
                window.dispatchEvent(new Event('userLoggedOut'));
                
                setTimeout(() => {
                    setSuccessMessage(null);
                }, 2000);
            }
        } catch (err) {
            console.error('Lỗi đăng nhập:', err);
            setSuccessMessage('Có lỗi xảy ra khi đăng nhập.');
            
            // Clear token and refreshToken on error
            localStorage.setItem('token', null);
            localStorage.setItem('refreshToken', null);
            localStorage.removeItem('userID');
            localStorage.removeItem('userName');
            localStorage.removeItem('role');
            localStorage.removeItem('typePerson');
            localStorage.removeItem('deviceName');
            
            // Dispatch custom event to notify all components of user authentication change
            window.dispatchEvent(new Event('userLoggedOut'));
            
            setTimeout(() => {
                setSuccessMessage(null);
            }, 2000);
        }
    };

    const handleRegister = async (event) => {
        event.preventDefault();

        const userName = document.getElementById('reg-name').value;
        const passWord = document.getElementById('reg-pass').value;
        const referralCode = document.getElementById('reg-code').value || null;
        const agree = document.getElementById('agree').checked;

        if (!userName || !passWord) {
            setSuccessMessage('Vui lòng nhập đầy đủ tên người dùng và mật khẩu.');
            return;
        }

        if (!agree) {
            setSuccessMessage('Vui lòng đồng ý với các điều khoản và điều kiện.');
            return;
        }

        try {
            const response = await axios.post('http://localhost:5122/api/Account/createaccount', {
                userName,
                passWord,
                referralCode,
                accountType: 0,
            });
            const data = response.data;
            console.log('Phản hồi từ API:', data);
            if (data === true || data.success === true) {
                const message = 'Đăng ký thành công!';
                setSuccessMessage(message);
                setTimeout(() => {
                    setSuccessMessage(null);
                    loginFunction();
                }, 3500);
            } else {
                const message = 'Đăng ký thất bại.';
                setSuccessMessage(message);
            }
        } catch (err) {
            console.error('Lỗi đăng ký:', err);
            setSuccessMessage('Có lỗi xảy ra khi đăng ký.');
        }
    };

    const handleGoogleLogin = () => {
        // Logic Google login nếu có, tạm thời alert
        alert('Chức năng đăng nhập Google đang phát triển.');
    };

    return (
        <div className={cx('wrapper')} ref={wrapperRef}>
            {/* Thêm icon close ở đây */}
            <FontAwesomeIcon icon={faTimes} className={cx('close-icon')} onClick={onClose} />
            <div className={cx('form-header')}>
                <div className={cx('titles')}>
                    <span ref={loginTitleRef} className={cx('title-login')}>
                        Đăng Nhập
                    </span>
                    <span ref={registerTitleRef} className={cx('title-register')}>
                        Đăng Ký
                    </span>
                </div>
            </div>
            <form onSubmit={handleLogin} className={cx('login-form', { active: isLoginForm })} autoComplete="off">
                <div className={cx('input-box')}>
                    <input type="text" className={cx('input-field')} id="log-email" required />
                    <label htmlFor="log-email" className={cx('label')}>
                        Tài Khoản
                    </label>
                    <FontAwesomeIcon className={cx('bx', 'bx-envelope', 'icon')} icon={faEnvelope} />
                </div>
                <div className={cx('input-box')}>
                    <input type="password" className={cx('input-field')} id="log-pass" required />
                    <label htmlFor="log-pass" className={cx('label')}>
                        Mật Khẩu
                    </label>
                    <FontAwesomeIcon className={cx('bx', 'bx-lock-alt', 'icon')} icon={faLock} />
                </div>
                <div className={cx('form-cols')}>
                    <div className={cx('col-1')}></div>
                    <div className={cx('col-2')}>
                        <a href="#">Quên mật khẩu?</a>
                    </div>
                </div>
                <div className={cx('input-box')}>
                    <button type="submit" className={cx('btn-submit')} id="SignInBtn">
                        Đăng Nhập
                        <FontAwesomeIcon className={cx('bx', 'bx-log-in')} icon={faUserPlus} />
                    </button>
                </div>
                {/* Thêm button Google login ở đây */}
                {/* <div className={cx('input-box')}>
                    <button type="button" className={cx('btn-submit', 'btn-google')} onClick={handleGoogleLogin}>
                        Đăng nhập bằng Google
                        <FontAwesomeIcon icon={faGoogle} className={cx('google-icon')} />
                    </button>
                </div> */}
                <div className={cx('switch-form')}>
                    <span>
                        Chưa có tài khoản?{' '}
                        <a href="#" onClick={registerFunction}>
                            Đăng Kí
                        </a>
                    </span>
                </div>
            </form>
            <form
                onSubmit={handleRegister}
                className={cx('register-form', { active: !isLoginForm })}
                autoComplete="off"
            >
                <div className={cx('input-box')}>
                    <input type="text" className={cx('input-field')} id="reg-name" required />
                    <label htmlFor="reg-name" className={cx('label')}>
                        Tài Khoản
                    </label>
                    <FontAwesomeIcon className={cx('bx', 'bx-user', 'icon')} icon={faUser} />
                </div>
                <div className={cx('input-box')}>
                    <input type="password" className={cx('input-field')} id="reg-pass" required />
                    <label htmlFor="reg-pass" className={cx('label')}>
                        Mật Khẩu
                    </label>
                    <FontAwesomeIcon className={cx('bx', 'bx-lock-alt', 'icon')} icon={faLock} />
                </div>
                <div className={cx('input-box')}>
                    <input type="text" className={cx('input-field')} id="reg-code" />
                    <label htmlFor="reg-code" className={cx('label')}>
                        Mã Giới Thiệu
                    </label>
                    <FontAwesomeIcon className={cx('fa-solid', 'fa-code')} icon={faCode} />
                </div>
                <div className={cx('form-cols')}>
                    <div className={cx('col-1')}>
                        <input type="checkbox" id="agree" />
                        <label htmlFor="agree">Đồng ý với các điều khoản và điều kiện</label>
                    </div>
                    <div className={cx('col-2')}></div>
                </div>
                <div className={cx('input-box')}>
                    <button className={cx('btn-submit')} id="SignUpBtn">
                        Đăng Kí
                        <FontAwesomeIcon className={cx('bx', 'bx-user-plus')} icon={faUserPlus} />
                    </button>
                </div>
                <div className={cx('switch-form')}>
                    <span>
                        Bạn đã có tài khoản?{' '}
                        <a href="#" onClick={loginFunction}>
                            Đăng Nhập
                        </a>
                    </span>
                </div>
            </form>
        </div>
    );
}

export default Login;
