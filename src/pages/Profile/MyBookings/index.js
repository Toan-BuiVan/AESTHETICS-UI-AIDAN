import React, { useState, useEffect } from 'react';
import axios from 'axios';
import classNames from 'classnames/bind';
import styles from './MyBookings.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faClock, faUserMd, faTimes, faCheckCircle, faTrash } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function MyBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('booked'); // booked, inprogress, completed, canceled (no 'all')
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(3); // 8 items per page
    const [totalRecords, setTotalRecords] = useState(0);

    // Date range filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Detail modal
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    
    // Cancel confirmation
    const [cancelConfirmation, setCancelConfirmation] = useState({
        open: false,
        appointmentId: null,
        appointmentName: null,
        booking: null
    });
    const [cancelLoading, setCancelLoading] = useState(false);

    // Fetch when filter changes (immediately)
    useEffect(() => {
        fetchMyBookings(1);
    }, [filter]);

    // Debounce fetch when date range changes (3 second delay)
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchMyBookings(1);
        }, 3000);

        return () => clearTimeout(debounceTimer);
    }, [startDate, endDate]);

    const getStatusCode = (filterStatus) => {
        // Map filter to API status code as STRING
        // Status codes from API: "1" = booked, "2" = inprogress, "3" = completed, "4" = canceled
        const statusMap = {
            'booked': '1',        // 📅 Đã đặt lịch
            'inprogress': '2',    // 🔄 Đang thực hiện
            'completed': '3',     // ✓ Hoàn tất
            'canceled': '4'       // ❌ Hủy
        };
        return statusMap[filterStatus];
    };

    const fetchMyBookings = async (pageNo = 1) => {
        try {
            setLoading(true);
            setError(null);

            // Get customerId from localStorage
            let customerId = parseInt(localStorage.getItem('customerId') || 0);
            const staffId = parseInt(localStorage.getItem('staffId') || 0);
            
            if (!customerId || customerId === 0) {
                customerId = staffId;
            }

            if (!customerId || customerId === 0) {
                setError('Vui lòng đăng nhập');
                setLoading(false);
                return;
            }

            // Build request payload
            const requestData = {
                pageNo: pageNo,
                pageSize: pageSize,
                customerId: customerId,
                staffId: null,  // Default null as per requirement
                status: getStatusCode(filter),
                startDate: startDate || null,    // Convert empty string to null
                endDate: endDate || null         // Convert empty string to null
            };

            console.log('📋 Fetching appointments with params:', requestData);

            const response = await axios.post(
                'http://localhost:5122/api/Appointment/getappointmentlist',
                requestData
            );

            console.log('✅ Appointments response:', response.data);

            // Parse response with new API format
            if (response.data?.baseDatas && Array.isArray(response.data.baseDatas)) {
                setBookings(response.data.baseDatas);
                setTotalRecords(response.data.totalRecordCount || response.data.baseDatas.length);
                setCurrentPage(pageNo);
            } else {
                setBookings([]);
                setTotalRecords(0);
            }
        } catch (err) {
            console.error('❌ Error fetching bookings:', err);
            setError('Không thể tải danh sách đặt lịch: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        // Handle both string and numeric status values
        const statusStr = String(status).toLowerCase();
        
        // Check for string representation
        if (statusStr === '1' || statusStr.includes('đã') || statusStr === 'booked') return 'booked';
        if (statusStr === '2' || statusStr.includes('đang') || statusStr === 'inprogress') return 'inprogress';
        if (statusStr === '3' || statusStr.includes('hoàn') || statusStr === 'completed') return 'completed';
        if (statusStr === '4' || statusStr.includes('hủy') || statusStr === 'canceled') return 'canceled';
        
        // Check for numeric status (for backward compatibility)
        if (status === 1 || status === '1') return 'booked';
        if (status === 2 || status === '2') return 'inprogress';
        if (status === 3 || status === '3') return 'completed';
        if (status === 4 || status === '4') return 'canceled';
        
        return 'default';
    };

    const getStatusText = (status) => {
        const statusMap = {
            'ChoDatLich': '⏳ Chờ đặt lịch',
            'DaDatLich': '📅 Đã đặt lịch',
            'DangThucHien': '🔄 Đang thực hiện',
            'HoanTat': '✓ Hoàn tất',
            'Huy': '❌ Hủy',
            'booked': '📅 Đã đặt lịch',
            'inprogress': '🔄 Đang thực hiện',
            'completed': '✓ Hoàn tất',
            'canceled': '❌ Hủy',
            '1': '📅 Đã đặt lịch',
            '2': '🔄 Đang thực hiện',
            '3': '✓ Hoàn tất',
            '4': '❌ Hủy',
            1: '📅 Đã đặt lịch',
            2: '🔄 Đang thực hiện',
            3: '✓ Hoàn tất',
            4: '❌ Hủy'
        };
        return statusMap[status] || status;
    };

    const totalPages = Math.ceil(totalRecords / pageSize);

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            fetchMyBookings(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            fetchMyBookings(currentPage + 1);
        }
    };

    const shouldShowPaymentButton = (booking) => {
        // Show payment button if:
        // 1. Status is InProgress OR Completed (handle both string and numeric formats)
        // 2. AND paymentStatus is 0 or 1 (unpaid)
        const statusStr = String(booking.status).toLowerCase();
        const isInProgressOrCompleted = 
            statusStr.includes('inprogress') || 
            statusStr.includes('in progress') || 
            statusStr.includes('đang') ||
            statusStr === '2' || 
            statusStr.includes('completed') || 
            statusStr.includes('hoàn') ||
            statusStr === '3';
        const isUnpaid = booking.paymentStatus === 0 || booking.paymentStatus === 1;
        
        console.log(`🔍 Payment Button Check - Status: "${booking.status}", StatusStr: "${statusStr}", IsInProgOrCompleted: ${isInProgressOrCompleted}, PaymentStatus: ${booking.paymentStatus}, ShowButton: ${isInProgressOrCompleted && isUnpaid}`);
        
        return isInProgressOrCompleted && isUnpaid;
    };

    const shouldShowPaidBadge = (booking) => {
        // Show "đã thanh toán" if:
        // 1. Status is InProgress OR Completed (handle both string and numeric formats)
        // 2. AND paymentStatus is 2 (paid)
        const statusStr = String(booking.status).toLowerCase();
        const isInProgressOrCompleted = 
            statusStr.includes('inprogress') || 
            statusStr.includes('in progress') || 
            statusStr.includes('đang') ||
            statusStr === '2' || 
            statusStr.includes('completed') || 
            statusStr.includes('hoàn') ||
            statusStr === '3';
        const isPaid = booking.paymentStatus === 2;
        
        console.log(`🔍 Paid Badge Check - Status: "${booking.status}", StatusStr: "${statusStr}", IsInProgOrCompleted: ${isInProgressOrCompleted}, PaymentStatus: ${booking.paymentStatus}, ShowBadge: ${isInProgressOrCompleted && isPaid}`);
        
        return isInProgressOrCompleted && isPaid;
    };

    const shouldShowCancelButton = (booking) => {
        // Show cancel button if status is Booked (1) or InProgress (2)
        const statusStr = String(booking.status).toLowerCase();
        return statusStr === '1' || statusStr === '2' || 
               statusStr.includes('booked') || 
               statusStr.includes('đã') || 
               statusStr.includes('inprogress') || 
               statusStr.includes('đang');
    };

    const handleCancelClick = (appointmentId, appointmentName, booking) => {
        setCancelConfirmation({
            open: true,
            appointmentId: appointmentId,
            appointmentName: appointmentName,
            booking: booking
        });
    };

    const confirmCancel = async () => {
        if (!cancelConfirmation.appointmentId || !cancelConfirmation.booking) return;

        try {
            setCancelLoading(true);
            
            const booking = cancelConfirmation.booking;
            const customerTreatmentSessionId = booking.customerTreatmentSession?.id || 0;
            const customerId = booking.customer?.id || parseInt(localStorage.getItem('customerId') || 0);
            const serviceId = booking.service?.id || 0;
            
            console.log('🗑️ Canceling appointment:', cancelConfirmation.appointmentId, {
                customerTreatmentSessionId: customerTreatmentSessionId,
                customerId: customerId,
                serviceId: serviceId,
                status: 4
            });

            const response = await axios.post(
                'http://localhost:5122/api/Appointment/updateappointmentstatus',
                { 
                    customerTreatmentSessionId: customerTreatmentSessionId,
                    serviceId: serviceId,
                    customerId: customerId,
                    status: 4
                }
            );

            console.log('✅ Cancel appointment response:', response.data);

            // Close confirmation dialog
            setCancelConfirmation({ open: false, appointmentId: null, appointmentName: null, booking: null });
            setSelectedAppointment(null);
            
            // Refresh bookings
            setError(null);
            await fetchMyBookings(currentPage);
        } catch (err) {
            console.error('❌ Error canceling appointment:', err);
            setError('Lỗi khi hủy lịch: ' + (err.response?.data?.message || err.message));
        } finally {
            setCancelLoading(false);
        }
    };

    const cancelCancelDialog = () => {
        setCancelConfirmation({ open: false, appointmentId: null, appointmentName: null, booking: null });
    };

    const filterBookings = () => {
        // Filtering is now done server-side, just return all bookings
        return bookings;
    };

    const filteredBookings = filterBookings();

    if (loading) {
        return (
            <div className={cx('container')}>
                <div className={cx('loading')}>Đang tải...</div>
            </div>
        );
    }

    return (
        <div className={cx('container')}>
            <div className={cx('header')}>
                <h2>Đặt Lịch Của Tôi</h2>
                <p>Theo dõi và quản lý các buổi điều trị của bạn</p>
            </div>

            <div className={cx('filterTabs')}>
                <button 
                    className={cx('tab', { active: filter === 'booked' })}
                    onClick={() => setFilter('booked')}
                >
                    📅 Đã đặt lịch
                </button>
                <button 
                    className={cx('tab', { active: filter === 'inprogress' })}
                    onClick={() => setFilter('inprogress')}
                >
                    🔄 Đang thực hiện
                </button>
                <button 
                    className={cx('tab', { active: filter === 'completed' })}
                    onClick={() => setFilter('completed')}
                >
                    ✓ Hoàn tất
                </button>
                <button 
                    className={cx('tab', { active: filter === 'canceled' })}
                    onClick={() => setFilter('canceled')}
                >
                    ❌ Hủy
                </button>
            </div>

            {/* Date Range Filter */}
            <div className={cx('dateRangeFilter')}>
                <div className={cx('dateInputGroup')}>
                    <label htmlFor="startDate">Từ ngày:</label>
                    <input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={cx('dateInput')}
                    />
                </div>
                <div className={cx('dateInputGroup')}>
                    <label htmlFor="endDate">Đến ngày:</label>
                    <input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={cx('dateInput')}
                    />
                </div>
                {(startDate || endDate) && (
                    <button
                        className={cx('clearDateBtn')}
                        onClick={() => {
                            setStartDate('');
                            setEndDate('');
                        }}
                    >
                        Xóa bộ lọc ngày
                    </button>
                )}
            </div>

            {error && (
                <div className={cx('error')}>
                    {error}
                </div>
            )}

            <div className={cx('bookingsList')}>
                {filteredBookings.length > 0 ? (
                    filteredBookings.map((booking, index) => (
                        <div 
                            key={index} 
                            className={cx('bookingCard', getStatusColor(booking.status))}
                            onClick={() => setSelectedAppointment(booking)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={cx('bookingHeader')}>
                                <div className={cx('bookingInfo')}>
                                    <h3 className={cx('sessionName')}>
                                        {(() => {
                                            const sessionNum = booking.treatmentSession?.sessionNumber || booking.sessionNumber;
                                            const sessionName = booking.treatmentSession?.sessionName || booking.sessionName;
                                            
                                            if (sessionNum && sessionName) {
                                                return `Buổi: ${sessionNum} : ${sessionName}`;
                                            } else {
                                                return booking.service?.serviceName || booking.serviceName || `Buổi ${sessionNum || 'N/A'}`;
                                            }
                                        })()}
                                    </h3>
                                    <p className={cx('planName')}>
                                        {booking.service?.serviceName || booking.serviceName || 'Dịch vụ'}
                                    </p>
                                </div>
                                <span className={cx('statusBadge', getStatusColor(booking.status))}>
                                    {getStatusText(booking.status)}
                                </span>
                            </div>

                            <div className={cx('bookingDetails')}>
                                {booking.startTime && (
                                    <div className={cx('detail')}>
                                        <FontAwesomeIcon icon={faCalendarAlt} className={cx('icon')} />
                                        <span>
                                            {new Date(booking.startTime).toLocaleDateString('vi-VN', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit'
                                            })} {new Date(booking.startTime).toLocaleTimeString('vi-VN', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                )}
                                {booking.staff?.fullName && (
                                    <div className={cx('detail')}>
                                        <FontAwesomeIcon icon={faUserMd} className={cx('icon')} />
                                        <span>{booking.staff.fullName}</span>
                                    </div>
                                )}
                            </div>

                            <div className={cx('detailsLink')} style={{ marginTop: '8px', color: '#0066cc', fontSize: '12px' }}>
                                Xem chi tiết →
                            </div>

                            {(shouldShowPaymentButton(booking) || shouldShowPaidBadge(booking) || shouldShowCancelButton(booking)) && (
                                <div className={cx('actionButtonContainer')}>
                                    {shouldShowPaymentButton(booking) && (
                                        <button 
                                            className={cx('paymentButton')}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                console.log('Thanh toán cho appointment:', booking.id);
                                            }}
                                        >
                                            💳 Thanh Toán
                                        </button>
                                    )}

                                    {shouldShowPaidBadge(booking) && (
                                        <button 
                                            className={cx('paidButton')}
                                            disabled
                                        >
                                            ✓ Đã Thanh Toán
                                        </button>
                                    )}

                                    {shouldShowCancelButton(booking) && (
                                        <button 
                                            className={cx('cancelButton')}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const sessionNum = booking.treatmentSession?.sessionNumber || booking.sessionNumber;
                                                const sessionName = booking.treatmentSession?.sessionName || booking.sessionName;
                                                const displayName = (sessionNum && sessionName) 
                                                    ? `Buổi: ${sessionNum} : ${sessionName}`
                                                    : booking.service?.serviceName || booking.serviceName || `Buổi ${sessionNum || 'N/A'}`;
                                                handleCancelClick(
                                                    booking.id, 
                                                    displayName,
                                                    booking
                                                );
                                            }}
                                            title="Hủy đặt lịch"
                                        >
                                            <FontAwesomeIcon icon={faTrash} /> Hủy Lịch
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className={cx('emptyState')}>
                        <FontAwesomeIcon icon={faCalendarAlt} className={cx('emptyIcon')} />
                        <p>Không có đặt lịch nào</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className={cx('paginationContainer')}>
                    <button
                        className={cx('paginationBtn')}
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                    >
                        ← Trang trước
                    </button>
                    <span className={cx('pageInfo')}>
                        Trang {currentPage} / {totalPages}
                    </span>
                    <button
                        className={cx('paginationBtn')}
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                    >
                        Trang sau →
                    </button>
                </div>
            )}

            {/* Cancel Confirmation Dialog */}
            {cancelConfirmation.open && (
                <div className={cx('confirmationOverlay')} onClick={cancelCancelDialog}>
                    <div className={cx('confirmationDialog')} onClick={(e) => e.stopPropagation()}>
                        <div className={cx('confirmationHeader')}>
                            <h3>Xác Nhận Hủy Lịch</h3>
                        </div>
                        <div className={cx('confirmationBody')}>
                            <p>Bạn có chắc chắn muốn hủy lịch <strong>{cancelConfirmation.appointmentName}</strong>?</p>
                            <p style={{ color: '#666', fontSize: '12px', marginTop: '10px' }}>Hành động này không thể hoàn tác.</p>
                        </div>
                        <div className={cx('confirmationFooter')}>
                            <button 
                                className={cx('cancelDialogBtn')}
                                onClick={cancelCancelDialog}
                                disabled={cancelLoading}
                            >
                                Không, giữ lịch
                            </button>
                            <button 
                                className={cx('confirmCancelBtn')}
                                onClick={confirmCancel}
                                disabled={cancelLoading}
                            >
                                {cancelLoading ? 'Đang hủy...' : 'Hủy lịch'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedAppointment && (
                <div className={cx('detailModalOverlay')} onClick={() => setSelectedAppointment(null)}>
                    <div className={cx('detailModalContent')} onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className={cx('detailModalHeader')}>
                            <h2>Chi Tiết Lịch Khám</h2>
                            <button
                                className={cx('closeBtn')}
                                onClick={() => setSelectedAppointment(null)}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className={cx('detailModalBody')}>
                            {/* Appointment Status & Timing */}
                            <div className={cx('detailSection')}>
                                <h3 className={cx('sectionTitle')}>Thông Tin Lịch Khám</h3>
                                <div className={cx('formGrid')}>
                                    <div className={cx('formGroup')}>
                                        <label>Trạng Thái</label>
                                        <div className={cx('statusBadge', getStatusColor(selectedAppointment.status))}>
                                            {getStatusText(selectedAppointment.status)}
                                        </div>
                                    </div>
                                    <div className={cx('formGroup')}>
                                        <label>Thanh Toán</label>
                                        <span>{selectedAppointment.paymentStatus ? '✓ Đã thanh toán' : '⏳ Chưa thanh toán'}</span>
                                    </div>
                                    <div className={cx('formGroup')}>
                                        <label>Ngày & Giờ</label>
                                        <span>
                                            {new Date(selectedAppointment.startTime).toLocaleDateString('vi-VN', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })} - {new Date(selectedAppointment.startTime).toLocaleTimeString('vi-VN', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <div className={cx('formGroup')}>
                                        <label>Kết Thúc</label>
                                        <span>
                                            {new Date(selectedAppointment.endTime).toLocaleTimeString('vi-VN', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Service & Treatment Plan & Session */}
                            <div className={cx('detailSection')}>
                                <h3 className={cx('sectionTitle')}>📋 Thông Tin Dịch Vụ & Gói Điều Trị</h3>
                                <div className={cx('formGrid')}>
                                    <div className={cx('formGroup', 'fullWidth')}>
                                        <label>Tên Dịch Vụ</label>
                                        <span className={cx('serviceName')}>
                                            {selectedAppointment.service?.serviceName || 'N/A'}
                                        </span>
                                    </div>
                                    <div className={cx('formGroup')}>
                                        <label>Thời Lượng / Buổi</label>
                                        <span>{selectedAppointment.service?.duration || 'N/A'} phút</span>
                                    </div>
                                    <div className={cx('formGroup')}>
                                        <label>💰 Giá Toàn Bộ Gói</label>
                                        <span className={cx('packagePrice')}>
                                            {selectedAppointment.service?.price?.toLocaleString('vi-VN') || 'N/A'} ₫
                                        </span>
                                    </div>
                                </div>

                                {/* Treatment Plan Info */}
                                {selectedAppointment.treatmentPlan && (
                                    <div className={cx('treatmentPlanSection')}>
                                        <h4 className={cx('subsectionTitle')}>📦 Gói Điều Trị</h4>
                                        <div className={cx('formGrid')}>
                                            <div className={cx('formGroup', 'fullWidth')}>
                                                <label>Tên Gói</label>
                                                <span className={cx('planName')}>
                                                    {selectedAppointment.treatmentPlan.planName || 'N/A'}
                                                </span>
                                            </div>
                                            <div className={cx('formGroup')}>
                                                <label>Tổng Buổi</label>
                                                <span>{selectedAppointment.treatmentPlan.totalSessions || 0} buổi</span>
                                            </div>
                                        </div>
                                        {selectedAppointment.treatmentPlan.description && (
                                            <div className={cx('description')}>
                                                <label>Mô Tả Gói</label>
                                                <p>{selectedAppointment.treatmentPlan.description}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Treatment Session Info */}
                                {selectedAppointment.treatmentSession && (
                                    <div className={cx('treatmentSessionSection')}>
                                        <h4 className={cx('subsectionTitle')}>🏥 Buổi Điều Trị</h4>
                                        <div className={cx('formGrid')}>
                                            <div className={cx('formGroup')}>
                                                <label>Tên Buổi</label>
                                                <span>
                                                    {(() => {
                                                        const sessionNum = selectedAppointment.treatmentSession?.sessionNumber || selectedAppointment.sessionNumber;
                                                        const sessionName = selectedAppointment.treatmentSession?.sessionName || selectedAppointment.sessionName;
                                                        
                                                        if (sessionNum && sessionName) {
                                                            return `Buổi: ${sessionNum} : ${sessionName}`;
                                                        } else {
                                                            return selectedAppointment.service?.serviceName || selectedAppointment.serviceName || `Buổi ${sessionNum || 'N/A'}`;
                                                        }
                                                    })()}
                                                </span>
                                            </div>
                                            <div className={cx('formGroup')}>
                                                <label>Buổi Thứ</label>
                                                <span>{selectedAppointment.treatmentSession.sessionNumber || 'N/A'}</span>
                                            </div>
                                            <div className={cx('formGroup')}>
                                                <label>Thời Lượng</label>
                                                <span>{selectedAppointment.treatmentSession.duration || 'N/A'} phút</span>
                                            </div>
                                        </div>
                                        {selectedAppointment.treatmentSession.description && (
                                            <div className={cx('description')}>
                                                <label>Mô Tả Buổi</label>
                                                <p>{selectedAppointment.treatmentSession.description}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Service Description */}
                                {selectedAppointment.service?.description && (
                                    <div className={cx('description')}>
                                        <label>Mô Tả Dịch Vụ</label>
                                        <p>{selectedAppointment.service.description}</p>
                                    </div>
                                )}
                            </div>

                            {/* Customer Information */}
                            <div className={cx('detailSection')}>
                                <h3 className={cx('sectionTitle')}>Thông Tin Khách Hàng</h3>
                                <div className={cx('formGrid')}>
                                    <div className={cx('formGroup', 'fullWidth')}>
                                        <label>Họ & Tên</label>
                                        <span>{selectedAppointment.customer?.fullName || 'N/A'}</span>
                                    </div>
                                    <div className={cx('formGroup')}>
                                        <label>Email</label>
                                        <span>{selectedAppointment.customer?.email || 'N/A'}</span>
                                    </div>
                                    <div className={cx('formGroup')}>
                                        <label>Điện Thoại</label>
                                        <span>{selectedAppointment.customer?.phoneNumber || 'N/A'}</span>
                                    </div>
                                    <div className={cx('formGroup')}>
                                        <label>Ngày Sinh</label>
                                        <span>
                                            {selectedAppointment.customer?.dateOfBirth 
                                                ? new Date(selectedAppointment.customer.dateOfBirth).toLocaleDateString('vi-VN')
                                                : 'N/A'
                                            }
                                        </span>
                                    </div>
                                    <div className={cx('formGroup')}>
                                        <label>Giới Tính</label>
                                        <span>
                                            {selectedAppointment.customer?.gender || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Doctor/Staff Information */}
                            <div className={cx('detailSection')}>
                                <h3 className={cx('sectionTitle')}>Thông Tin Bác Sĩ</h3>
                                <div className={cx('formGrid')}>
                                    <div className={cx('formGroup', 'fullWidth')}>
                                        <label>Họ & Tên</label>
                                        <span>{selectedAppointment.staff?.fullName || 'N/A'}</span>
                                    </div>
                                    <div className={cx('formGroup')}>
                                        <label>Email</label>
                                        <span>{selectedAppointment.staff?.email || 'N/A'}</span>
                                    </div>
                                    <div className={cx('formGroup')}>
                                        <label>Điện Thoại</label>
                                        <span>{selectedAppointment.staff?.phoneNumber || 'N/A'}</span>
                                    </div>
                                    <div className={cx('formGroup')}>
                                        <label>Chuyên Ngành</label>
                                        <span>{selectedAppointment.staff?.specialization || 'N/A'}</span>
                                    </div>
                                    <div className={cx('formGroup')}>
                                        <label>Kinh Nghiệm</label>
                                        <span>{selectedAppointment.staff?.yearsOfExperience || 0} năm</span>
                                    </div>
                                </div>
                            </div>

                            {/* Clinic Assignment Information */}
                            {selectedAppointment.assignment && (
                                <div className={cx('detailSection')}>
                                    <h3 className={cx('sectionTitle')}>Thông Tin Phòng Khám</h3>
                                    <div className={cx('formGrid')}>
                                        <div className={cx('formGroup', 'fullWidth')}>
                                            <label>Tên Phòng Khám</label>
                                            <span className={cx('clinicName')}>
                                                {selectedAppointment.assignment?.clinicName || 'N/A'}
                                            </span>
                                        </div>
                                        <div className={cx('formGroup')}>
                                            <label>Số Thứ Tự</label>
                                            <span>{selectedAppointment.assignment?.numberOrder || 'N/A'}</span>
                                        </div>
                                        <div className={cx('formGroup')}>
                                            <label>Giá Tại Phòng</label>
                                            <span className={cx('price')}>
                                                {selectedAppointment.assignment?.price?.toLocaleString('vi-VN') || 'N/A'} ₫
                                            </span>
                                        </div>
                                        <div className={cx('formGroup')}>
                                            <label>Thanh Toán Phòng</label>
                                            <span>
                                                {selectedAppointment.assignment?.paymentStatus ? '✓ Đã thanh toán' : '⏳ Chưa thanh toán'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Additional Info */}
                            <div className={cx('detailSection')}>
                                <h3 className={cx('sectionTitle')}>Thông Tin Khác</h3>
                                <div className={cx('formGrid')}>
                                    <div className={cx('formGroup')}>
                                        <label>Ngày Tạo</label>
                                        <span>
                                            {new Date(selectedAppointment.creationDate).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className={cx('detailModalFooter')}>
                            {/* Pricing Summary */}
                            <div className={cx('pricingSummary')}>
                                <div className={cx('priceRow')}>
                                    <span>💰 Loại Mua:</span>
                                    <strong>{selectedAppointment.purchaseType || 'N/A'}</strong>
                                </div>
                                <div className={cx('priceRow')}>
                                    <span>📦 Giá Toàn Bộ Gói:</span>
                                    <strong className={cx('packagePriceText')}>
                                        {selectedAppointment.service?.price?.toLocaleString('vi-VN') || 'N/A'} ₫
                                    </strong>
                                </div>
                                <div className={cx('priceRow')}>
                                    <span>📋 Giá / Buổi:</span>
                                    <strong className={cx('sessionPriceText')}>
                                        {selectedAppointment.price?.toLocaleString('vi-VN') || 'N/A'} ₫
                                    </strong>
                                </div>
                            </div>

                            <button
                                className={cx('closeButtonFooter')}
                                onClick={() => setSelectedAppointment(null)}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyBookings;
