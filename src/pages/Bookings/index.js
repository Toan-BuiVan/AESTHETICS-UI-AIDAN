import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import classNames from 'classnames/bind';
import styles from './Bookings.module.scss';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';
import debounce from 'lodash/debounce';
import IncompleteBookings from './IncompleteBookings';
import CompleteBookings from './CompleteBookings';

const cx = classNames.bind(styles);

function Bookings() {
    const [bookings, setBookings] = useState([]);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [bookingDetailsMap, setBookingDetailsMap] = useState({});
    const [quantities, setQuantities] = useState({});
    const [successMessage, setSuccessMessage] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState('Chưa Hoàn Thành');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [invoiceItems, setInvoiceItems] = useState([]);

    const fetchAllBookings = async () => {
        try {
            const userID = localStorage.getItem('userID') || '';
            const deviceName = localStorage.getItem('deviceName') || '';
            const refreshToken = localStorage.getItem('refreshToken') || '';
            const token = localStorage.getItem('token') || '';

            const headers = {
                'Content-Type': 'application/json',
                DeviceName: deviceName,
                RefreshToken: refreshToken,
                Authorization: token ? `Bearer ${token}` : '',
                UserID: userID,
            };

            const response = await axios.post(
                'http://localhost:5262/api/Bookings/GetList_SearchBooking',
                { userID: userID },
                { headers },
            );
            const allBookings = response.data.data || [];
            setBookings(allBookings);

            const detailsMap = {};
            const initialQuantities = {};
            for (const booking of allBookings) {
                const detailsResponse = await axios.post(
                    'http://localhost:5262/api/Bookings/GetList_SearchBooking_Assignment',
                    { bookingID: booking.bookingID },
                    { headers },
                );
                detailsMap[booking.bookingID] = detailsResponse.data.data || [];
                detailsMap[booking.bookingID].forEach((detail) => {
                    initialQuantities[detail.assignmentID] = detail.quantityServices || 1;
                });
            }
            setBookingDetailsMap(detailsMap);
            setQuantities(initialQuantities);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách đặt lịch:', error);
            setSuccessMessage('Không thể tải danh sách đặt lịch. Vui lòng thử lại sau.');
        }
    };

    useEffect(() => {
        fetchAllBookings();
    }, []);

    const handleFilterByDate = async () => {
        if (!startDate || !endDate) {
            setSuccessMessage('Vui lòng chọn cả ngày bắt đầu và ngày kết thúc.');
            setTimeout(() => setSuccessMessage(null), 2000);
            return;
        }

        try {
            const userID = localStorage.getItem('userID') || '';
            const deviceName = localStorage.getItem('deviceName') || '';
            const refreshToken = localStorage.getItem('refreshToken') || '';
            const token = localStorage.getItem('token') || '';

            const headers = {
                'Content-Type': 'application/json',
                DeviceName: deviceName,
                RefreshToken: refreshToken,
                Authorization: token ? `Bearer ${token}` : '',
                UserID: userID,
            };

            const requestData = {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            };

            const response = await axios.post('http://localhost:5262/api/Bookings/GetList_SearchBooking', requestData, {
                headers,
            });
            const filteredBookings = response.data.data || [];
            setBookings(filteredBookings);
        } catch (error) {
            console.error('Lỗi khi lọc booking theo ngày:', error);
            setSuccessMessage('Không thể lọc booking. Vui lòng thử lại sau.');
            setTimeout(() => setSuccessMessage(null), 2000);
        }
    };

    const updateQuantity = async (assignmentID, quantity) => {
        const deviceName = localStorage.getItem('deviceName') || '';
        const refreshToken = localStorage.getItem('refreshToken') || '';
        const token = localStorage.getItem('token') || '';
        const userID = localStorage.getItem('userID') || '';

        const requestData = {
            assignmentID: assignmentID,
            quantity: quantity,
        };

        const headers = {
            'Content-Type': 'application/json',
            DeviceName: deviceName,
            RefreshToken: refreshToken,
            Authorization: token ? `Bearer ${token}` : '',
            UserID: userID,
        };

        try {
            const response = await fetch('http://localhost:5262/api/Bookings/UpdateQuantity', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestData),
            });
            const data = await response.json();
            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            if (!response.ok) {
                throw new Error('Lỗi khi cập nhật số lượng');
            }

            setSuccessMessage(data.resposeMessage || 'Cập nhật số lượng thành công');
            setTimeout(() => {
                setSuccessMessage(null);
            }, 2000);
        } catch (error) {
            console.error('Lỗi khi cập nhật số lượng:', error);
            setSuccessMessage(error.message || 'Có lỗi xảy ra khi cập nhật số lượng');
            setTimeout(() => {
                setSuccessMessage(null);
            }, 2000);
        }
    };

    const debouncedUpdateQuantity = useCallback(
        debounce((assignmentID, quantity) => {
            updateQuantity(assignmentID, quantity);
        }, 800),
        [],
    );

    const handleIncreaseQuantity = (assignmentID) => {
        setQuantities((prev) => {
            const newQuantity = (prev[assignmentID] || 1) + 1;
            debouncedUpdateQuantity(assignmentID, newQuantity);
            return { ...prev, [assignmentID]: newQuantity };
        });
    };

    const handleDecreaseQuantity = (assignmentID) => {
        setQuantities((prev) => {
            const newQuantity = Math.max((prev[assignmentID] || 1) - 1, 1);
            debouncedUpdateQuantity(assignmentID, newQuantity);
            return { ...prev, [assignmentID]: newQuantity };
        });
    };

    const handleToggleDetails = (bookingID) => {
        if (selectedBookingId === bookingID) {
            setSelectedBookingId(null);
            setSearchTerm('');
            setSearchResults([]);
        } else {
            setSelectedBookingId(bookingID);
            setSearchTerm('');
            setSearchResults([]);
        }
    };

    const handleDeleteBooking = async (bookingID) => {
        const userID = localStorage.getItem('userID');
        if (!userID || isNaN(userID)) {
            setSuccessMessage('Bạn cần đăng nhập để xóa booking.');
            setTimeout(() => {
                setSuccessMessage(null);
            }, 2000);
            return;
        }

        const requestData = {
            bookingID: bookingID,
        };

        const headers = {
            'Content-Type': 'application/json',
            DeviceName: localStorage.getItem('deviceName') || '',
            RefreshToken: localStorage.getItem('refreshToken') || '',
            Authorization: localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
            UserID: userID,
        };

        try {
            const response = await fetch('http://localhost:5262/api/Bookings/Delete_Booking', {
                method: 'DELETE',
                headers: headers,
                body: JSON.stringify(requestData),
            });

            const data = await response.json();
            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            setBookings((prevBookings) => prevBookings.filter((booking) => booking.bookingID !== bookingID));
            setBookingDetailsMap((prevMap) => {
                const newMap = { ...prevMap };
                delete newMap[bookingID];
                return newMap;
            });
            setSuccessMessage(data.resposeMessage);
            setTimeout(() => {
                setSuccessMessage(null);
            }, 5000);
        } catch (error) {
            console.error('Lỗi khi xóa booking:', error);
            setSuccessMessage(error.message || 'Có lỗi xảy ra khi xóa booking');
            setTimeout(() => {
                setSuccessMessage(null);
            }, 2000);
        }
    };

    const handleDeleteService = async (assignmentID) => {
        const userID = localStorage.getItem('userID');
        if (!userID || isNaN(userID)) {
            setSuccessMessage('Bạn cần đăng nhập để xóa dịch vụ.');
            setTimeout(() => {
                setSuccessMessage(null);
            }, 2000);
            return;
        }

        const requestData = {
            bookingServiceID: assignmentID,
        };

        const headers = {
            'Content-Type': 'application/json',
            DeviceName: localStorage.getItem('deviceName') || '',
            RefreshToken: localStorage.getItem('refreshToken') || '',
            Authorization: localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
            UserID: userID,
        };

        try {
            const response = await fetch('http://localhost:5262/api/Bookings/Delete_BookingSer_Assi', {
                method: 'DELETE',
                headers: headers,
                body: JSON.stringify(requestData),
            });

            const data = await response.json();
            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            if (!response.ok) {
                throw new Error(data.resposeMessage || 'Lỗi khi xóa dịch vụ');
            }

            setBookingDetailsMap((prevMap) => {
                const newMap = { ...prevMap };
                newMap[selectedBookingId] = newMap[selectedBookingId].filter(
                    (detail) => detail.assignmentID !== assignmentID,
                );
                return newMap;
            });
            setSuccessMessage(data.resposeMessage || 'Xóa dịch vụ thành công');
            setTimeout(() => {
                setSuccessMessage(null);
            }, 2000);
        } catch (error) {
            console.error('Lỗi khi xóa dịch vụ:', error);
            setSuccessMessage(error.message || 'Có lỗi xảy ra khi xóa dịch vụ');
            setTimeout(() => {
                setSuccessMessage(null);
            }, 2000);
        }
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleSearch = async () => {
        const serviceName = searchTerm.trim();
        if (!serviceName) {
            setSuccessMessage('Vui lòng nhập tên dịch vụ để tìm kiếm.');
            return;
        }

        const deviceName = localStorage.getItem('deviceName') || '';
        const refreshToken = localStorage.getItem('refreshToken') || '';
        const token = localStorage.getItem('token') || '';
        const userID = localStorage.getItem('userID') || '';

        const requestData = {
            serviceName: serviceName,
        };

        const headers = {
            'Content-Type': 'application/json',
            DeviceName: deviceName,
            RefreshToken: refreshToken,
            Authorization: token ? `Bearer ${token}` : '',
            UserID: userID,
        };

        try {
            const response = await fetch('http://localhost:5262/api/Servicess/GetList_SearchServicess', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestData),
            });

            const data = await response.json();
            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            if (!response.ok) {
                throw new Error('Lỗi khi tìm kiếm dịch vụ');
            }
            if (Array.isArray(data)) {
                setSearchResults(data);
            } else if (data && data.data && Array.isArray(data.data)) {
                setSearchResults(data.data);
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Lỗi khi tìm kiếm dịch vụ:', error);
            setSearchResults([]);
        }
    };

    const handleAddService = async (service) => {
        if (!selectedBookingId) {
            setSuccessMessage('Vui lòng chọn một booking trước khi thêm dịch vụ.');
            setTimeout(() => {
                setSuccessMessage(null);
            }, 2000);
            return;
        }

        const userID = localStorage.getItem('userID');
        if (!userID || isNaN(userID)) {
            setSuccessMessage('Bạn cần đăng nhập để thêm dịch vụ.');
            setTimeout(() => {
                setSuccessMessage(null);
            }, 2000);
            return;
        }

        const requestData = {
            bookingID: selectedBookingId,
            serviceID: service.serviceID,
        };

        const headers = {
            'Content-Type': 'application/json',
            DeviceName: localStorage.getItem('deviceName') || '',
            RefreshToken: localStorage.getItem('refreshToken') || '',
            Authorization: localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
            UserID: userID,
        };

        try {
            const response = await fetch('http://localhost:5262/api/Bookings/Insert_BookingSer_Assi', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestData),
            });

            const data = await response.json();
            const newAccessToken = response.headers.get('New-AccessToken');
            const newRefreshToken = response.headers.get('New-RefreshToken');
            if (newAccessToken) localStorage.setItem('token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

            if (!response.ok) {
                throw new Error(data.resposeMessage || 'Lỗi khi thêm dịch vụ');
            }
            const detailsResponse = await axios.post(
                'http://localhost:5262/api/Bookings/GetList_SearchBooking_Assignment',
                { bookingID: selectedBookingId },
                { headers },
            );
            setBookingDetailsMap((prevMap) => ({
                ...prevMap,
                [selectedBookingId]: detailsResponse.data.data || [],
            }));

            setSuccessMessage(data.resposeMessage || 'Thêm dịch vụ thành công');
            setTimeout(() => {
                setSuccessMessage(null);
            }, 2000);
        } catch (error) {
            console.error('Lỗi khi thêm dịch vụ:', error);
            setSuccessMessage(error.message || 'Có lỗi xảy ra khi thêm dịch vụ');
            setTimeout(() => {
                setSuccessMessage(null);
            }, 2000);
        }
    };

    const handlePayment = (detailOrBookingId) => {
        if (typeof detailOrBookingId === 'object') {
            const serviceItem = {
                serviceID: detailOrBookingId.serviceID,
                serviceName: detailOrBookingId.serviceName,
                priceService: detailOrBookingId.priceService || 0,
                quantity: quantities[detailOrBookingId.assignmentID] || detailOrBookingId.quantityServices || 1,
                serviceImages: detailOrBookingId.serviceImages || 'default.jpg',
            };
            setInvoiceItems((prevItems) => {
                if (prevItems.some((item) => item.serviceID === serviceItem.serviceID)) {
                    return prevItems;
                }
                return [...prevItems, serviceItem];
            });
        } else {
            const bookingId = detailOrBookingId;
            const details = bookingDetailsMap[bookingId] || [];
            const serviceItems = details
                .filter((detail) => detail.status === 'Đã Hoàn Thành')
                .map((detail) => ({
                    serviceID: detail.serviceID,
                    serviceName: detail.serviceName,
                    priceService: detail.priceService || 0,
                    quantity: quantities[detail.assignmentID] || detail.quantityServices || 1,
                    serviceImages: detail.serviceImages || 'default.jpg',
                }));
            setInvoiceItems((prevItems) => {
                const newItems = serviceItems.filter(
                    (item) => !prevItems.some((prev) => prev.serviceID === item.serviceID),
                );
                return [...prevItems, ...newItems];
            });
        }
    };

    return (
        <div className={cx('wrapper')}>
            {successMessage && <SuccessMessage message={successMessage} />}
            <header className={cx('header-content')}>
                <ul className={cx('status-tabs')}>
                    <li
                        className={cx('tab', { active: selectedStatus === 'Chưa Hoàn Thành' })}
                        onClick={() => setSelectedStatus('Chưa Hoàn Thành')}
                    >
                        Chưa Hoàn Thành
                    </li>
                    <li
                        className={cx('tab', { active: selectedStatus === 'Hoàn Thành' })}
                        onClick={() => setSelectedStatus('Hoàn Thành')}
                    >
                        Hoàn Thành
                    </li>
                    <div className={cx('date-filter')}>
                        <label htmlFor="startDate">Từ ngày:</label>
                        <input
                            type="date"
                            id="startDate"
                            value={startDate ? startDate.toISOString().split('T')[0] : ''}
                            onChange={(e) => setStartDate(new Date(e.target.value))}
                        />
                        <label htmlFor="endDate">Đến ngày:</label>
                        <input
                            type="date"
                            id="endDate"
                            value={endDate ? endDate.toISOString().split('T')[0] : ''}
                            onChange={(e) => setEndDate(new Date(e.target.value))}
                        />
                        <button onClick={handleFilterByDate}>Lọc</button>
                    </div>
                </ul>
            </header>
            <div className={cx('content-Bookings')}>
                {selectedStatus === 'Chưa Hoàn Thành' ? (
                    <IncompleteBookings
                        bookings={bookings}
                        selectedBookingId={selectedBookingId}
                        bookingDetailsMap={bookingDetailsMap}
                        quantities={quantities}
                        searchTerm={searchTerm}
                        searchResults={searchResults}
                        handleToggleDetails={handleToggleDetails}
                        handleDeleteBooking={handleDeleteBooking}
                        handleDeleteService={handleDeleteService}
                        handleSearchChange={handleSearchChange}
                        handleSearch={handleSearch}
                        handleAddService={handleAddService}
                        handleIncreaseQuantity={handleIncreaseQuantity}
                        handleDecreaseQuantity={handleDecreaseQuantity}
                    />
                ) : (
                    <CompleteBookings
                        bookings={bookings}
                        selectedBookingId={selectedBookingId}
                        bookingDetailsMap={bookingDetailsMap}
                        invoiceItems={invoiceItems}
                        setInvoiceItems={setInvoiceItems}
                        handleToggleDetails={handleToggleDetails}
                        handlePayment={handlePayment}
                        successMessage={successMessage}
                        setSuccessMessage={setSuccessMessage}
                        handleDeleteService={handleDeleteService}
                    />
                )}
            </div>
        </div>
    );
}

export default Bookings;
