import { forwardRef, useRef, useState, useEffect } from 'react';

import classNames from 'classnames/bind';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { faClose, faPaperPlane, faCalendarCheck, faShoppingCart } from '@fortawesome/free-solid-svg-icons';

import image from '~/assets/images';

import styles from './ContactInfo.module.scss';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const cx = classNames.bind(styles);

const ContactInfo = forwardRef(({ onClose, setSuccessMessage }, ref) => {
    const messageRef = useRef(null);

    const chatBodyRef = useRef(null);

    const [errors, setErrors] = useState({});

    const [isLoading, setIsLoading] = useState(false);

    const [messages, setMessages] = useState([
        { type: 'text', text: 'Chào bạn! Hãy gửi tin nhắn để chúng tôi hỗ trợ tự động ngay lập tức.', isSystem: true },
    ]);

    const [showBooking, setShowBooking] = useState(false);

    const [selectedDate, setSelectedDate] = useState(null);

    const [selectedServiceID, setSelectedServiceID] = useState(null);

    const validateForm = () => {
        const newErrors = {};

        if (!messageRef.current.value.trim()) newErrors.message = 'Vui lòng nhập tin nhắn';

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleAddToCart = async (productID) => {
        // Lấy các giá trị từ localStorage

        const deviceName = localStorage.getItem('deviceName') || '';

        const refreshToken = localStorage.getItem('refreshToken') || '';

        const token = localStorage.getItem('token') || '';

        const userID = localStorage.getItem('userID') || '';

        if (!userID) {
            setSuccessMessage('Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.');

            return;
        }

        const requestData = {
            userID: userID,

            productID: productID,

            quantity: 1,
        };

        const headers = {
            'Content-Type': 'application/json',

            DeviceName: deviceName,

            RefreshToken: refreshToken,

            Authorization: token ? `Bearer ${token}` : '',

            UserID: userID,
        };

        const apiUrl = 'http://localhost:5262/api/CartProduct/Insert_CartProduct';

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',

                headers: headers,

                body: JSON.stringify(requestData),
            });

            const responseData = await response.json();

            // Cập nhật token mới nếu có

            const newAccessToken = response.headers.get('New-AccessToken');

            const newRefreshToken = response.headers.get('New-RefreshToken');

            if (newAccessToken) localStorage.setItem('token', newAccessToken);

            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            if (response.ok) {
                setSuccessMessage(responseData.resposeMessage); // Giả sử typo 'resposeMessage' là 'responseMessage'
            } else {
                throw new Error('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng.');
            }
        } catch (error) {
            console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', error);

            // Tùy chọn: Thêm thông báo lỗi vào chat

            setMessages((prev) => [
                ...prev,

                { type: 'text', text: 'Thêm vào giỏ hàng thất bại. Vui lòng thử lại.', isSystem: true },
            ]);
        }
    };

    const handleBooking = (serviceID) => {
        setSelectedServiceID(serviceID);

        setShowBooking(true);
    };

    const callInsertBookingAPI = async (data) => {
        const deviceName = localStorage.getItem('deviceName') || '';

        const refreshToken = localStorage.getItem('refreshToken') || '';

        const token = localStorage.getItem('token') || '';

        const headers = {
            'Content-Type': 'application/json',

            DeviceName: deviceName,

            RefreshToken: refreshToken,

            Authorization: token ? `Bearer ${token}` : '',

            UserID: data.userID,
        };

        try {
            const response = await fetch('http://localhost:5262/api/Bookings/Insert_Booking', {
                method: 'POST',

                headers: headers,

                body: JSON.stringify({
                    serviceIDs: data.serviceIDs,

                    userID: data.userID,

                    scheduledDate: data.scheduledDate.toISOString(),
                }),
            });

            const responseData = await response.json();

            const newAccessToken = response.headers.get('New-AccessToken');

            const newRefreshToken = response.headers.get('New-RefreshToken');

            if (newAccessToken) localStorage.setItem('token', newAccessToken);

            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            if (response.ok) {
                setSuccessMessage(responseData.resposeMessage);

                setTimeout(() => {
                    setSuccessMessage(null);
                }, 2000);

                setShowBooking(false); // Ẩn DatePicker sau thành công

                setSelectedDate(null);
            } else {
                throw new Error('Có lỗi xảy ra khi đặt lịch.');
            }
        } catch (error) {
            setSuccessMessage(error.message || 'Có lỗi xảy ra khi đặt lịch');

            setTimeout(() => {
                setSuccessMessage(null);
            }, 2000);
        }
    };

    const handleConfirmBooking = async () => {
        const userID = localStorage.getItem('userID') || '';

        if (!selectedDate) {
            setSuccessMessage('Vui lòng chọn ngày đặt lịch.');

            return;
        }

        if (!userID) {
            setSuccessMessage('Bạn cần đăng nhập để đặt lịch.');

            return;
        }

        const data = {
            userID: userID,

            serviceIDs: [selectedServiceID], // Giả sử serviceIDs là array chứa selectedServiceID

            scheduledDate: selectedDate,
        };

        await callInsertBookingAPI(data);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateForm()) return;

        const content = messageRef.current.value.trim();

        setIsLoading(true);

        setMessages((prev) => [...prev, { type: 'text', text: content, isSystem: false }]);

        try {
            // API call removed
        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn:', error.message);

            const errorMessage = 'Gửi tin nhắn thất bại. Vui lòng thử lại.';

            setMessages((prev) => [...prev, { type: 'text', text: errorMessage, isSystem: true }]);
        } finally {
            setIsLoading(false);

            messageRef.current.value = '';
        }
    };

    // Hàm parse text để render multiline và image

    const renderMessageText = (text) => {
        const parsedText = text.replace(/Hình ảnh: ([^\s,]+(?:\.(png|jpg|jpeg|gif))?)/g, (match, filename) => {
            const imgPath = `http://localhost:5262/Images/${filename}`;

            return `<img src="${imgPath}" alt="Product Image" style="max-width: 50%; border-radius: 8px; margin-top: 8px;" />`;
        });

        return <div dangerouslySetInnerHTML={{ __html: parsedText.replace(/\n/g, '<br />') }} />;
    };

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className={cx('wrapper', { show: true })} ref={ref}>
            <div className={cx('headerContact')}>
                <div className={cx('avatar')}>
                    <img src={image.avatarContactInfo} alt="Avatar" />

                    <span className={cx('online-indicator')}></span>
                </div>

                <div className={cx('header-info')}>
                    <h2 className={cx('header-info-h2')}>Thẩm mỹ viện Minh Anh</h2>

                    <p className={cx('header-info-p')}>
                        Minh Anh sẵn sàng trợ giúp. Hãy nhắn tin để bắt đầu cuộc trò chuyện tự động.
                    </p>

                    <FontAwesomeIcon className={cx('icon-Close')} icon={faClose} onClick={onClose} />
                </div>
            </div>

            <div className={cx('chat-body')} ref={chatBodyRef}>
                {messages.map((msg, index) => (
                    <div key={index} className={cx('message-bubble', msg.isSystem ? 'system-message' : 'user-message')}>
                        {msg.type === 'text' ? (
                            renderMessageText(msg.text)
                        ) : msg.type === 'product' ? (
                            <div className={cx('product-item')}>
                                <p>
                                    <strong>Mã:</strong> {msg.data.productID || msg.data.productId}
                                </p>

                                <p>
                                    <strong>Tên:</strong> {msg.data.productName || msg.data.name}
                                </p>

                                {(msg.data.productDescription || msg.data.description) && (
                                    <p>
                                        <strong>Mô tả:</strong> {msg.data.productDescription || msg.data.description}
                                    </p>
                                )}

                                <p>
                                    <strong>Giá:</strong> {Number(msg.data.sellingPrice).toLocaleString('vi-VN')} VND
                                </p>

                                {msg.data.soldCount !== undefined && (
                                    <p>
                                        <strong>Đã bán:</strong> {msg.data.soldCount}
                                    </p>
                                )}

                                {msg.data.quantity !== undefined && (
                                    <p>
                                        <strong>Kho:</strong> {msg.data.quantity}
                                    </p>
                                )}

                                {msg.data.serviceType && (
                                    <p>
                                        <strong>Loại:</strong> {msg.data.serviceType}
                                    </p>
                                )}

                                {msg.data.productImages && (
                                    <img
                                        src={`http://localhost:5262/Images/${msg.data.productImages}`}
                                        alt="Product Image"
                                        style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '8px' }}
                                    />
                                )}

                                <button onClick={() => handleAddToCart(msg.data.productID || msg.data.productId)}>
                                    <FontAwesomeIcon icon={faShoppingCart} /> Thêm vào giỏ hàng
                                </button>
                            </div>
                        ) : msg.type === 'service' ? (
                            <div className={cx('service-item')}>
                                <p>Mã: {msg.data.serviceID}</p>

                                <p>Tên: {msg.data.serviceName}</p>

                                <p>Mô tả: {msg.data.description}</p>

                                <p>Giá: {Number(msg.data.priceService).toLocaleString('vi-VN')} VND</p>

                                <FontAwesomeIcon
                                    icon={faCalendarCheck}
                                    className={cx('booking-icon')}
                                    onClick={() => handleBooking(msg.data.serviceID)}
                                />
                            </div>
                        ) : msg.type === 'loading' ? (
                            <div className={cx('loading-indicator')}>
                                <span>Đang trả lời</span>
                                <span className={cx('dots')}>...</span>
                            </div>
                        ) : msg.type === 'slot' ? (
                            <div className={cx('slot-item')}>
                                <div className={cx('slot-time')}>
                                    <span className={cx('time')}>{msg.data.time}</span>
                                </div>
                                <div className={cx('slot-info')}>
                                    {msg.data.staffName ? (
                                        <>
                                            <p className={cx('staff-name')}>{msg.data.staffName}</p>
                                            <p className={cx('slot-date')}>{msg.data.date}</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className={cx('slot-status')}>
                                                {msg.data.available ? '✓ Còn trống' : '✗ Đã có lịch'}
                                            </p>
                                        </>
                                    )}
                                </div>
                                <button className={cx('slot-button')} onClick={() => handleBooking(null)}>
                                    <FontAwesomeIcon icon={faCalendarCheck} /> Đặt
                                </button>
                            </div>
                        ) : msg.type === 'doctor' ? (
                            <div className={cx('doctor-item')}>
                                <div className={cx('doctor-header')}>
                                    <h3 className={cx('doctor-name')}>{msg.data.doctorName}</h3>
                                    <p className={cx('doctor-spec')}>{msg.data.specialization}</p>
                                </div>
                                <div className={cx('doctor-slots')}>
                                    {msg.data.availableSlots && msg.data.availableSlots.map((slot, idx) => (
                                        <button
                                            key={idx}
                                            className={cx('slot-btn', { unavailable: !slot.available })}
                                            disabled={!slot.available}
                                            onClick={() => handleBooking(null)}
                                        >
                                            {slot.time}
                                        </button>
                                    ))}
                                </div>
                                {/* <p className={cx('doctor-info')}>
                                    Còn lại: {msg.data.remainingSlots} / {msg.data.maxDailyLimit} slot
                                </p> */}
                            </div>
                        ) : null}
                    </div>
                ))}
            </div>

            {showBooking && (
                <div className={cx('booking-section')} style={{ padding: '10px', borderTop: '1px solid #ccc' }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Chọn ngày đặt lịch"
                            value={selectedDate}
                            onChange={(newValue) => setSelectedDate(newValue)}
                            slotProps={{ textField: { helperText: 'DD/MM/YYYY' } }}
                        />
                    </LocalizationProvider>

                    <button
                        onClick={handleConfirmBooking}
                        style={{ fontSize: '12px', padding: '4px 8px', marginTop: '8px' }} // Style nhỏ nhỏ
                    >
                        Đặt lịch
                    </button>
                </div>
            )}

            <form className={cx('chat-form')} onSubmit={handleSubmit}>
                <div className={cx('chat-input-group')}>
                    <textarea
                        id="message"
                        name="message"
                        rows="1"
                        placeholder="Nhập tin nhắn của bạn..."
                        ref={messageRef}
                        className={cx('chat-input')}
                    />

                    {errors.message && <span className={cx('error')}>{errors.message}</span>}

                    <button type="submit" className={cx('btn-send')} disabled={isLoading}>
                        <FontAwesomeIcon icon={faPaperPlane} />

                        {isLoading ? 'Đang gửi...' : ' Gửi'}
                    </button>
                </div>
            </form>
        </div>
    );
});

export default ContactInfo;
