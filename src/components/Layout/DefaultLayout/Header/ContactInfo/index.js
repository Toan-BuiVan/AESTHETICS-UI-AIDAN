import { forwardRef, useRef, useState, useEffect } from 'react';

import axios from 'axios';

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

    const [failedImages, setFailedImages] = useState({});

    const [messages, setMessages] = useState([
        { type: 'text', text: 'Chào bạn! Hãy gửi tin nhắn để chúng tôi hỗ trợ tự động ngay lập tức.', isSystem: true },
    ]);

    const [conversationHistory, setConversationHistory] = useState([]);

    const [showBooking, setShowBooking] = useState(false);

    const [selectedDate, setSelectedDate] = useState(null);

    const [selectedServiceID, setSelectedServiceID] = useState(null);

    const validateForm = () => {
        const newErrors = {};

        if (!messageRef.current.value.trim()) newErrors.message = 'Vui lòng nhập tin nhắn';

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleImageError = (imageFileName) => {
        setFailedImages((prev) => ({
            ...prev,
            [imageFileName]: true,
        }));
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

        setMessages((prev) => [
            ...prev,
            { type: 'text', text: content, isSystem: false },
            { type: 'typing', isSystem: true }
        ]);

        try {
            const customerId = localStorage.getItem('customerId');
            const userId = parseInt(customerId) || null;

            // Cập nhật conversation history với tin nhắn người dùng
            const updatedHistory = [
                ...conversationHistory,
                { role: 'user', content: content }
            ];

            const payload = {
                userQuery: content,
                userId: userId,
                conversationHistory: updatedHistory
            };

            const response = await axios.post(
                'http://localhost:5122/api/AIFunctionCalling/process-user-query',
                payload
            );

            const apiData = response.data;

            // Xóa typing indicator
            setMessages((prev) => prev.filter((msg, index) => !(index === prev.length - 1 && msg.type === 'typing')));

            // Cập nhật conversation history
            setConversationHistory(updatedHistory);

            console.log('🔍 API Response:', {
                toolUsed: apiData.toolUsed,
                hasData: !!apiData.data,
                dataKeys: apiData.data ? Object.keys(apiData.data) : null
            });

            // Xử lý response từ API theo toolUsed hoặc structure của data
            if (apiData?.toolUsed === 'getDoctorAvailableSlots' && apiData.data?.availableSlots) {
                // Kiểu 1-2: Doctor available slots
                setMessages((prev) => [...prev, {
                    type: 'doctorSlots',
                    data: apiData.data,
                    isSystem: true
                }]);
            } else if (apiData?.toolUsed === 'getDoctorsForService' && apiData.data?.doctors) {
                // Kiểu 3: Doctors for service
                setMessages((prev) => [...prev, {
                    type: 'doctorsForService',
                    data: apiData.data,
                    isSystem: true
                }]);
            } else if (apiData?.toolUsed === 'getMostPopularServices' && apiData.data?.serviceId) {
                // Kiểu 4: Most popular services
                setMessages((prev) => [...prev, {
                    type: 'popularService',
                    data: apiData.data,
                    isSystem: true
                }]);
            } else if (apiData?.toolUsed === 'getBestDoctorForService' && apiData.data?.staffId) {
                // Kiểu 5: Best doctor for service
                setMessages((prev) => [...prev, {
                    type: 'bestDoctor',
                    data: apiData.data,
                    isSystem: true
                }]);
            } else if (apiData?.toolUsed === 'getServicesByPriceRange' && apiData.data?.services) {
                // Kiểu 6: Services by price range
                setMessages((prev) => [...prev, {
                    type: 'servicesByPrice',
                    data: apiData.data,
                    isSystem: true
                }]);
            } else if (apiData?.toolUsed === 'getTopSellingProducts' && apiData.data?.products) {
                // Kiểu 7: Top selling products
                setMessages((prev) => [...prev, {
                    type: 'topSellingProducts',
                    data: apiData.data,
                    isSystem: true
                }]);
            } else if (apiData?.toolUsed === 'getRecommendedProductsByCategory' && apiData.data?.products) {
                // Kiểu 8-9: Recommended products by category
                setMessages((prev) => [...prev, {
                    type: 'recommendedProducts',
                    data: apiData.data,
                    isSystem: true
                }]);
            } else if (apiData?.toolUsed === 'bookAppointment' && apiData.data?.appointmentId) {
                // Kiểu 10: Booking appointment success
                setMessages((prev) => [...prev, {
                    type: 'bookingSuccess',
                    data: apiData.data,
                    isSystem: true
                }]);
            } else if (apiData?.toolUsed === 'getTreatmentPackagesByServiceName' && apiData.data?.service) {
                // Kiểu 11-12: Treatment packages (with or without sessions)
                if (apiData.data.treatmentPackages && apiData.data.treatmentPackages.length > 0) {
                    // Has treatment packages
                    setMessages((prev) => [...prev, {
                        type: 'treatmentPackages',
                        data: apiData.data,
                        isSystem: true
                    }]);
                } else {
                    // No treatment packages
                    setMessages((prev) => [...prev, {
                        type: 'noTreatmentPackages',
                        data: apiData.data,
                        isSystem: true
                    }]);
                }
            } else if (apiData?.toolUsed === 'cancelAppointment' && apiData.data?.cancelledCount !== undefined) {
                // Kiểu 13-15: Cancel appointment
                setMessages((prev) => [...prev, {
                    type: 'cancelAppointment',
                    data: apiData.data,
                    isSystem: true
                }]);
            } else if (apiData?.toolUsed === 'getProductDetail' && apiData.data?.productId) {
                // Kiểu 18: Product detail
                setMessages((prev) => [...prev, {
                    type: 'productDetail',
                    data: apiData.data,
                    isSystem: true
                }]);
            } else if ((apiData?.toolUsed === 'chatbot_llm' || apiData?.toolUsed === 'chatbot_friendly') && !apiData.data) {
                // Kiểu 16-17: Chatbot responses (data: null)
                const message = apiData.conversationUpdate?.content || apiData.message;
                const isFriendly = apiData.toolUsed === 'chatbot_friendly';
                console.log(`💬 ${isFriendly ? '👋 Friendly' : '🤖 LLM'} Chatbot response:`, message);
                setMessages((prev) => [...prev, {
                    type: 'text',
                    text: message,
                    isSystem: true,
                    isChatbotFriendly: isFriendly
                }]);
            } else if (apiData?.data) {
                // Fallback: Display based on data structure
                const toolData = apiData.data;
                if (toolData.availableSlots && toolData.doctorName) {
                    setMessages((prev) => [...prev, {
                        type: 'doctorSlots',
                        data: toolData,
                        isSystem: true
                    }]);
                } else if (toolData.doctors && toolData.serviceName) {
                    setMessages((prev) => [...prev, {
                        type: 'doctorsForService',
                        data: toolData,
                        isSystem: true
                    }]);
                } else {
                    const message = apiData.conversationUpdate?.content || apiData.message || JSON.stringify(apiData);
                    setMessages((prev) => [...prev, {
                        type: 'text',
                        text: message,
                        isSystem: true
                    }]);
                }
            } else if (apiData?.conversationUpdate?.content) {
                // Handle any response with conversationUpdate content
                const message = apiData.conversationUpdate.content || apiData.message;
                setMessages((prev) => [...prev, {
                    type: 'text',
                    text: message,
                    isSystem: true
                }]);
            } else {
                // Final fallback
                const message = apiData?.message || 'Không thể xử lý phản hồi từ API';
                console.log('⚠️ Fallback response:', message);
                setMessages((prev) => [...prev, {
                    type: 'text',
                    text: message,
                    isSystem: true
                }]);
            }
        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn:', error.message);

            const errorMessage = 'Gửi tin nhắn thất bại. Vui lòng thử lại! Vui lòng liên hệ hotline 0383102388.';

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
                        {msg.type === 'typing' ? (
                            <div className={cx('typing-indicator')}>
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        ) : msg.type === 'text' ? (
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
                        ) : msg.type === 'doctorSlots' ? (
                            // Type 1 & 2: Doctor availability slots with treatment plans
                            <div className={cx('doctor-slots-container')}>
                                <div className={cx('doctor-header-luxury')}>
                                    <h3 className={cx('doctor-name-luxury')}>{msg.data.doctorName}</h3>
                                    <p className={cx('doctor-message')}>{msg.data.message}</p>
                                </div>

                                <div className={cx('slots-grid')}>
                                    {msg.data.availableSlots && msg.data.availableSlots.map((slot, idx) => (
                                        <div key={idx} className={cx('slot-card')}>
                                            <div className={cx('slot-date')}>{slot.date}</div>
                                            <div className={cx('slot-time-display')}>
                                                {slot.startTime} - {slot.endTime}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {msg.data.treatmentPlans && msg.data.treatmentPlans.length > 0 && (
                                    <div className={cx('treatment-plans')}>
                                        <h4 className={cx('treatment-title')}>Gói điều trị khuyên cáo</h4>
                                        {msg.data.treatmentPlans.map((plan, idx) => (
                                            <div key={idx} className={cx('treatment-plan-card')}>
                                                <h5 className={cx('plan-name')}>{plan.name}</h5>
                                                <p className={cx('plan-desc')}>{plan.description}</p>
                                                <p className={cx('plan-price')}>
                                                    {Number(plan.price).toLocaleString('vi-VN')} VND
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : msg.type === 'doctorsForService' ? (
                            // Type 3: Doctors for service
                            <div className={cx('doctors-for-service-container')}>
                                <div className={cx('service-header-luxury')}>
                                    <h3 className={cx('service-name-luxury')}>{msg.data.serviceName}</h3>
                                    <p className={cx('service-desc')}>{msg.data.serviceDescription}</p>
                                    <p className={cx('service-message')}>{msg.data.message}</p>
                                </div>

                                <div className={cx('doctors-list')}>
                                    {msg.data.doctors && msg.data.doctors.map((doctor, idx) => (
                                        <div key={idx} className={cx('doctor-card')}>
                                            <div className={cx('doctor-card-header')}>
                                                <h4 className={cx('doctor-card-name')}>{doctor.name}</h4>
                                                <span className={cx('rating-badge')}>★ {doctor.rating || 0}</span>
                                            </div>
                                            <div className={cx('doctor-card-info')}>
                                                {doctor.specialization && (
                                                    <p><span className={cx('label')}>Chuyên khoa:</span> {doctor.specialization}</p>
                                                )}
                                                {doctor.degree && (
                                                    <p><span className={cx('label')}>Bằng cấp:</span> {doctor.degree}</p>
                                                )}
                                                {doctor.experience > 0 && (
                                                    <p><span className={cx('label')}>Kinh nghiệm:</span> {doctor.experience} năm</p>
                                                )}
                                                <p><span className={cx('label')}>Lịch hẹn:</span> {doctor.appointmentCount}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : msg.type === 'popularService' ? (
                            // Type 4: Most popular services
                            <div className={cx('popular-service-container')}>
                                <p className={cx('popular-message')}>{msg.data.message}</p>
                                <div className={cx('popular-service-card')}>
                                    <h4 className={cx('service-rank-title')}>🏆 Dịch vụ Hàng Đầu</h4>
                                    <h3 className={cx('service-rank-name')}>{msg.data.serviceName}</h3>
                                    <div className={cx('service-stats')}>
                                        <div className={cx('stat-item')}>
                                            <span className={cx('stat-label')}>Giá:</span>
                                            <span className={cx('stat-value')}>
                                                {Number(msg.data.price).toLocaleString('vi-VN')} VND
                                            </span>
                                        </div>
                                        <div className={cx('stat-item')}>
                                            <span className={cx('stat-label')}>Số khách hàng:</span>
                                            <span className={cx('stat-value')}>{msg.data.userCount}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : msg.type === 'bestDoctor' ? (
                            // Type 5: Best doctor for service
                            <div className={cx('best-doctor-container')}>
                                <p className={cx('best-doctor-message')}>{msg.data.message}</p>
                                <div className={cx('best-doctor-card')}>
                                    <div className={cx('best-doctor-badge')}>🌟 Bác Sĩ Hàng Đầu</div>
                                    <div className={cx('doctor-profile-section')}>
                                        {msg.data.staffImage ?  (
                                            <img
                                                src={`http://localhost:5122/Images/${msg.data.staffImage}`}
                                                alt={msg.data.staffName}
                                                className={cx('doctor-profile-image')}
                                                onError={() => handleImageError(msg.data.staffImage)}
                                            />
                                        ) : (
                                            <div className={cx('doctor-profile  -avatar-fallback')}>
                                                <span className={cx('avatar-initials')}>
                                                    {msg.data.staffName
                                                        .split(' ')
                                                        .map((word) => word[0])
                                                        .join('')
                                                        .toUpperCase()
                                                        .slice(0, 2)}
                                                </span>
                                            </div>
                                        )}
                                        <div className={cx('doctor-profile-info')}>
                                            <h3 className={cx('profile-name')}>{msg.data.staffName}</h3>
                                            {msg.data.specialization && (
                                                <p className={cx('profile-spec')}>{msg.data.specialization}</p>
                                            )}
                                            {msg.data.degree && (
                                                <p className={cx('profile-degree')}>{msg.data.degree}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className={cx('doctor-profile-stats')}>
                                        <div className={cx('stat-box')}>
                                            <span className={cx('stat-icon')}>📚</span>
                                            <p><strong>{msg.data.experienceYears}</strong> năm kinh nghiệm</p>
                                        </div>
                                        <div className={cx('stat-box')}>
                                            <span className={cx('stat-icon')}>📅</span>
                                            <p><strong>{msg.data.appointmentCount}</strong> lịch hẹn</p>
                                        </div>
                                    </div>
                                </div>
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
                        ) : msg.type === 'servicesByPrice' ? (
                            // Type 6: Services by price range
                            <div className={cx('services-by-price-container')}>
                                <p className={cx('services-message')}>{msg.data.message}</p>
                                <div className={cx('services-list')}>
                                    {msg.data.services && msg.data.services.map((service, idx) => (
                                        <div key={idx} className={cx('service-price-card')}>
                                            <h4 className={cx('service-price-name')}>{service.serviceName}</h4>
                                            <p className={cx('service-price-desc')}>{service.description}</p>
                                            <div className={cx('service-price-footer')}>
                                                <span className={cx('service-price-tag')}>
                                                    {Number(service.price).toLocaleString('vi-VN')} VND
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : msg.type === 'topSellingProducts' ? (
                            // Type 7: Top selling products
                            <div className={cx('top-selling-container')}>
                                <p className={cx('top-selling-message')}>{msg.data.message}</p>
                                <div className={cx('products-grid')}>
                                    {msg.data.products && msg.data.products.map((product, idx) => (
                                        <div key={idx} className={cx('product-top-card')}>
                                            <div className={cx('product-top-badge')}>🔥 Bán chạy</div>
                                            <h4 className={cx('product-top-name')}>{product.productName}</h4>
                                            <div className={cx('product-top-stats')}>
                                                <span className={cx('sales-count')}>
                                                    📊 {product.salesCount} lần bán
                                                </span>
                                            </div>
                                            <p className={cx('product-top-price')}>
                                                {Number(product.price).toLocaleString('vi-VN')} VND
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : msg.type === 'recommendedProducts' ? (
                            // Type 8: Recommended products by category
                            <div className={cx('recommended-products-container')}>
                                <p className={cx('recommended-message')}>{msg.data.message}</p>
                                <div className={cx('recommended-grid')}>
                                    {msg.data.products && msg.data.products.map((product, idx) => (
                                        <div key={idx} className={cx('product-recommended-card')}>
                                            <div className={cx('product-rec-badge')}>✨ Gợi ý</div>
                                            <h4 className={cx('product-rec-name')}>{product.productName}</h4>
                                            <p className={cx('product-rec-desc')}>{product.description}</p>
                                            <div className={cx('product-rec-info')}>
                                                <span className={cx('stock-info')}>📦 {product.quantity} sản phẩm</span>
                                            </div>
                                            <p className={cx('product-rec-price')}>
                                                {Number(product.price).toLocaleString('vi-VN')} VND
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : msg.type === 'bookingSuccess' ? (
                            // Booking appointment confirmation
                            <div className={cx('booking-success-container')}>
                                <div className={cx('booking-success-card')}>
                                    <div className={cx('success-icon')}>✅</div>
                                    <h3 className={cx('success-title')}>Đặt lịch thành công!</h3>
                                    <p className={cx('success-message')}>{msg.data.message}</p>
                                    <div className={cx('appointment-id')}>
                                        Mã lịch hẹn: <strong>#{msg.data.appointmentId}</strong>
                                    </div>
                                </div>
                            </div>
                        ) : msg.type === 'treatmentPackages' ? (
                            // Type 10: Treatment packages with sessions
                            <div className={cx('treatment-packages-container')}>
                                <p className={cx('treatment-msg')}>{msg.data.message}</p>
                                
                                {msg.data.service && (
                                    <div className={cx('service-info-card')}>
                                        <h3 className={cx('service-title')}>{msg.data.service.serviceName}</h3>
                                        <p className={cx('service-description')}>{msg.data.service.description}</p>
                                        <div className={cx('service-meta')}>
                                            <span className={cx('service-price')}>💰 {Number(msg.data.service.price).toLocaleString('vi-VN')} VND</span>
                                            <span className={cx('service-duration')}>⏱️ {msg.data.service.duration} phút</span>
                                        </div>
                                    </div>
                                )}

                                {msg.data.treatmentPackages && msg.data.treatmentPackages.map((pkg, pkgIdx) => (
                                    <div key={pkgIdx} className={cx('package-card')}>
                                        <div className={cx('package-header')}>
                                            <h4 className={cx('package-name')}>{pkg.planName}</h4>
                                            <span className={cx('package-badge')}>📋 {pkg.totalSessions} buổi</span>
                                        </div>
                                        <p className={cx('package-description')}>{pkg.description}</p>
                                        <div className={cx('package-details')}>
                                            <span>💵 {Number(pkg.price).toLocaleString('vi-VN')} VND</span>
                                            <span>⏰ Cách nhau {pkg.sessionInterval} ngày</span>
                                        </div>

                                        {pkg.sessions && pkg.sessions.length > 0 && (
                                            <div className={cx('sessions-section')}>
                                                <h5 className={cx('sessions-title')}>Chi tiết buổi điều trị</h5>
                                                <div className={cx('sessions-list')}>
                                                    {pkg.sessions.map((session, sessionIdx) => (
                                                        <div key={sessionIdx} className={cx('session-item')}>
                                                            <div className={cx('session-number')}>Buổi {session.sessionNumber}</div>
                                                            <div className={cx('session-info')}>
                                                                <p className={cx('session-name')}>{session.sessionName}</p>
                                                                <p className={cx('session-desc')}>{session.description}</p>
                                                                <span className={cx('session-duration')}>⏱️ {session.duration} phút</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : msg.type === 'noTreatmentPackages' ? (
                            // Type 11: Service with no treatment packages
                            <div className={cx('no-packages-container')}>
                                <p className={cx('no-packages-msg')}>{msg.data.message}</p>
                                
                                {msg.data.service && (
                                    <div className={cx('service-no-packages-card')}>
                                        <div className={cx('service-icon-empty')}>ℹ️</div>
                                        <h3 className={cx('service-name-empty')}>{msg.data.service.serviceName}</h3>
                                        <p className={cx('service-desc-empty')}>{msg.data.service.description}</p>
                                        <div className={cx('service-meta-empty')}>
                                            <span className={cx('price-empty')}>💰 {Number(msg.data.service.price).toLocaleString('vi-VN')} VND</span>
                                            <span className={cx('duration-empty')}>⏱️ {msg.data.service.duration} phút</span>
                                        </div>
                                        <div className={cx('no-packages-notice')}>
                                            <p>📌 Dịch vụ này hiện không có gói điều trị nào</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : msg.type === 'cancelAppointment' ? (
                            // Type 13-15: Cancel appointment confirmation
                            <div className={cx('cancel-appointment-container')}>
                                <div className={cx('cancel-success-card')}>
                                    <div className={cx('cancel-icon')}>✅</div>
                                    <h3 className={cx('cancel-title')}>Hủy lịch hẹn thành công!</h3>
                                    <div className={cx('cancel-stats')}>
                                        <div className={cx('stat-item')}>
                                            <span className={cx('stat-label')}>Lịch đã hủy:</span>
                                            <span className={cx('stat-value')} style={{ color: '#d73d31', fontWeight: 'bold' }}>
                                                {msg.data.cancelledCount} appointment(s)
                                            </span>
                                        </div>
                                        {msg.data.assignmentCount !== undefined && (
                                            <div className={cx('stat-item')}>
                                                <span className={cx('stat-label')}>Assignment cập nhật:</span>
                                                <span className={cx('stat-value')}>{msg.data.assignmentCount}</span>
                                            </div>
                                        )}
                                    </div>
                                    {msg.data.details && msg.data.details.length > 0 && (
                                        <div className={cx('cancel-details')}>
                                            <p className={cx('details-title')}>Chi tiết hủy lịch:</p>
                                            <ul className={cx('details-list')}>
                                                {msg.data.details.map((detail, idx) => (
                                                    <li key={idx} className={cx('detail-item')}>
                                                        📅 {detail}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : msg.type === 'productDetail' ? (
                            // Type 18: Product detail
                            <div className={cx('product-detail-container')}>
                                <div className={cx('product-detail-card')}>
                                    <h3 className={cx('product-detail-name')}>{msg.data.productName}</h3>
                                    <p className={cx('product-detail-description')}>{msg.data.description}</p>
                                    
                                    <div className={cx('product-detail-specs')}>
                                        <div className={cx('spec-item')}>
                                            <span className={cx('spec-label')}>💰 Giá:</span>
                                            <span className={cx('spec-value')}>
                                                {Number(msg.data.price).toLocaleString('vi-VN')} VND
                                            </span>
                                        </div>
                                        <div className={cx('spec-item')}>
                                            <span className={cx('spec-label')}>📦 Kho:</span>
                                            <span className={cx('spec-value')}>{msg.data.quantity}</span>
                                        </div>
                                        <div className={cx('spec-item')}>
                                            <span className={cx('spec-label')}>👥 Lượng sử dụng:</span>
                                            <span className={cx('spec-value')}>{msg.data.userCount}</span>
                                        </div>
                                        {msg.data.improvementDays && (
                                            <div className={cx('spec-item')}>
                                                <span className={cx('spec-label')}>📅 Hiệu quả:</span>
                                                <span className={cx('spec-value')}>{msg.data.improvementDays} ngày</span>
                                            </div>
                                        )}
                                    </div>

                                    {msg.data.benefits && (
                                        <div className={cx('product-benefits')}>
                                            <h4>✨ Lợi Ích Chính</h4>
                                            <p>{msg.data.benefits}</p>
                                        </div>
                                    )}

                                    {msg.data.approvalResult && (
                                        <div className={cx('product-approval')}>
                                            <p>{msg.data.approvalResult}</p>
                                        </div>
                                    )}
                                </div>
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
