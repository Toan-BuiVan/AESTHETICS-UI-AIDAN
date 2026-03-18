import React from 'react';
import classNames from 'classnames/bind';
import styles from './CompleteBookings.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import BookingsInvoice from '../BookingsInvoice';

const cx = classNames.bind(styles);

function CompleteBookings({
    bookings,
    selectedBookingId,
    bookingDetailsMap,
    invoiceItems,
    setInvoiceItems,
    handleToggleDetails,
    handlePayment,
    handleDeleteService,
    setSuccessMessage,
}) {
    const filteredBookings = bookings.filter(
        (booking) =>
            booking.status === 'Đã Hoàn Thành' ||
            (booking.status === 'Chưa Hoàn Thành' &&
                bookingDetailsMap[booking.bookingID]?.some((detail) => detail.status === 'Đã Hoàn Thành')),
    );

    const filteredDetails = bookingDetailsMap[selectedBookingId] || [];

    return (
        <div className={cx('content-Bookings')}>
            <div className={cx('booking-list')}>
                {filteredBookings.length === 0 ? (
                    <p style={{ textAlign: 'center', fontSize: '1.2rem', color: '#718096' }}>
                        Không có đặt lịch nào để hiển thị.
                    </p>
                ) : (
                    filteredBookings.map((booking) => (
                        <div key={booking.bookingID} className={cx('booking-item')}>
                            <div className={cx('booking-header')}>
                                <div className={cx('booking-info')}>
                                    <p>
                                        <strong>Họ Tên:</strong> {booking.userName}
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
                                    {booking.status === 'Đã Hoàn Thành' &&
                                        booking.paymentStatus === 'Chưa Thanh Toán' && (
                                            <button
                                                className={cx('btnPayment')}
                                                onClick={() => handlePayment(booking.bookingID)}
                                            >
                                                Thanh Toán
                                            </button>
                                        )}
                                </div>
                            </div>
                            {selectedBookingId === booking.bookingID && (
                                <div className={cx('booking-details')}>
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
                                                <span className={cx('detail-item')}>
                                                    <strong>Số Lượng:</strong> {detail.quantityServices}
                                                </span>
                                                <span className={cx('detail-item')}>
                                                    <strong>Trạng Thái:</strong> {detail.status}
                                                </span>
                                                {booking.status === 'Chưa Hoàn Thành' &&
                                                    detail.status === 'Đã Hoàn Thành' &&
                                                    detail.paymentStatus === 'Chưa Thanh Toán' && (
                                                        <button
                                                            className={cx('btnPayment')}
                                                            onClick={() => handlePayment(detail)}
                                                        >
                                                            Thanh Toán
                                                        </button>
                                                    )}
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
                                        <p style={{ textAlign: 'center', fontSize: '1.1rem', color: '#718096' }}>
                                            Không có chi tiết để hiển thị.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
            <div className={cx('invoicePayment')}>
                <h1>Hóa Đơn</h1>
                {invoiceItems.length === 0 ? (
                    <p style={{ textAlign: 'center', fontSize: '1.1rem', color: '#718096' }}>
                        Chưa có dịch vụ nào được chọn.
                    </p>
                ) : (
                    <BookingsInvoice
                        invoiceItems={invoiceItems}
                        setInvoiceItems={setInvoiceItems}
                        setParentSuccessMessage={setSuccessMessage}
                    />
                )}
            </div>
        </div>
    );
}

export default CompleteBookings;
