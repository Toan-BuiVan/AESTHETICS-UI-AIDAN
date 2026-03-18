import React from 'react';
import classNames from 'classnames/bind';
import styles from './IncompleteBookings.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDeleteLeft, faCaretDown } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function IncompleteBookings({
    bookings,
    selectedBookingId,
    bookingDetailsMap,
    quantities,
    searchTerm,
    searchResults,
    handleToggleDetails,
    handleDeleteBooking,
    handleDeleteService,
    handleSearchChange,
    handleSearch,
    handleAddService,
    handleIncreaseQuantity,
    handleDecreaseQuantity,
}) {
    const filteredBookings = bookings.filter((booking) => booking.status === 'Chưa Hoàn Thành');

    const filteredDetails = (bookingDetailsMap[selectedBookingId] || []).filter((detail) =>
        detail.serviceName.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
        <div className={cx('booking-list')}>
            {filteredBookings.length === 0 ? (
                <p style={{ textAlign: 'center' }}>Không có đặt lịch nào để hiển thị.</p>
            ) : (
                filteredBookings.map((booking) => (
                    <div key={booking.bookingID} className={cx('booking-item')}>
                        <div className={cx('booking-header')}>
                            <div className={cx('booking-info')}>
                                <p>
                                    <strong>Họ Tên:</strong> {booking.userName}
                                </p>
                                <p>
                                    <strong>Email:</strong> {booking.email ? booking.email : 'N/A'}
                                </p>
                                <p>
                                    <strong>Điện Thoại:</strong> {booking.phone ? booking.phone : 'N/A'}
                                </p>
                                <p>
                                    <strong>Ngày Đặt:</strong> {new Date(booking.assignedDate).toLocaleDateString()}
                                </p>
                                <p>
                                    <strong>Trạng Thái:</strong> {booking.status}
                                </p>
                            </div>
                            <div className={cx('group-icon')}>
                                {booking.status === 'Chưa Hoàn Thành' &&
                                    !bookingDetailsMap[booking.bookingID]?.some(
                                        (detail) => detail.status === 'Đã Hoàn Thành',
                                    ) && (
                                        <FontAwesomeIcon
                                            icon={faDeleteLeft}
                                            className={cx('delete-icon', {
                                                active: selectedBookingId === booking.bookingID,
                                            })}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleDeleteBooking(booking.bookingID);
                                            }}
                                        />
                                    )}
                                <FontAwesomeIcon
                                    icon={faCaretDown}
                                    className={cx('caret-icon', {
                                        active: selectedBookingId === booking.bookingID,
                                    })}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleToggleDetails(booking.bookingID);
                                    }}
                                />
                            </div>
                        </div>
                        {selectedBookingId === booking.bookingID && (
                            <div className={cx('booking-details')}>
                                <div className={cx('details-headers')}>
                                    <div className={cx('booking-details-header')}>Chi Tiết Đặt Lịch</div>
                                    <div className={cx('search-container')}>
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm dịch vụ..."
                                            value={searchTerm}
                                            onChange={handleSearchChange}
                                            className={cx('search-input')}
                                        />
                                        <button onClick={handleSearch} className={cx('btnSearch')}>
                                            Tìm Kiếm
                                        </button>
                                    </div>
                                </div>
                                {searchResults.length > 0 && (
                                    <div className={cx('search-results')}>
                                        <h2>Kết quả tìm kiếm</h2>
                                        {searchResults.map((service) => (
                                            <div key={service.serviceID} className={cx('service-item')}>
                                                <span className={cx('serviceName')}>{service.serviceName}</span>
                                                <button onClick={() => handleAddService(service)}>Thêm</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {filteredDetails.length > 0 ? (
                                    filteredDetails.map((detail) => (
                                        <div key={detail.assignmentID} className={cx('detail-card')}>
                                            <span className={cx('detail-item')}>
                                                <strong>Phòng Khám:</strong> {detail.clinicName}
                                            </span>
                                            <span className={cx('detail-item')}>
                                                <strong>Số Thứ Tự:</strong> {detail.numberOrder}
                                            </span>
                                            <span className={cx('detail-item')}>
                                                <strong>Dịch Vụ:</strong> {detail.serviceName}
                                            </span>
                                            <div className={cx('quantity-selector')}>
                                                <button
                                                    className={cx('decrease-btn')}
                                                    onClick={() => handleDecreaseQuantity(detail.assignmentID)}
                                                >
                                                    −
                                                </button>
                                                <span className={cx('quantity')}>
                                                    {quantities[detail.assignmentID] || 1}
                                                </span>
                                                <button
                                                    className={cx('increase-btn')}
                                                    onClick={() => handleIncreaseQuantity(detail.assignmentID)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <span className={cx('detail-item')}>
                                                <strong>Trạng Thái:</strong> {detail.status}
                                            </span>
                                            {detail.status === 'Chưa Hoàn Thành' && (
                                                <button
                                                    className={cx('btnDeleteItem')}
                                                    onClick={() => handleDeleteService(detail.assignmentID)}
                                                >
                                                    Xóa
                                                </button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ textAlign: 'center' }}>Không có chi tiết để hiển thị.</p>
                                )}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}

export default IncompleteBookings;
