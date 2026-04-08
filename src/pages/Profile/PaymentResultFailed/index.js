import React, { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './PaymentResultFailed.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle, faClock, faPhone, faHeadset, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { useSearchParams, useNavigate } from 'react-router-dom';

const cx = classNames.bind(styles);

function PaymentResultFailed() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [paymentInfo, setPaymentInfo] = useState(null);

    useEffect(() => {
        // Lấy thông tin từ URL parameters
        const invoiceId = searchParams.get('invoiceId');
        const amount = searchParams.get('amount');
        const errorCode = searchParams.get('errorCode');
        const errorMessage = searchParams.get('errorMessage');
        const timestamp = searchParams.get('timestamp');

        if (invoiceId) {
            setPaymentInfo({
                invoiceId,
                amount: amount ? parseInt(amount) : 0,
                errorCode: errorCode || 'UNKNOWN_ERROR',
                errorMessage: decodeURIComponent(errorMessage) || 'Thanh toán không thành công',
                timestamp: timestamp || new Date().toISOString(),
            });
        }
    }, [searchParams]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN');
    };

    const getErrorDescription = (errorCode) => {
        const errors = {
            'PAYMENT_CANCELLED': 'Bạn đã hủy giao dịch thanh toán',
            'PAYMENT_TIMEOUT': 'Giao dịch đã hết thời gian. Vui lòng thử lại',
            'INVALID_AMOUNT': 'Số tiền không hợp lệ',
            'INSUFFICIENT_FUNDS': 'Số dư tài khoản không đủ',
            'CARD_DECLINED': 'Thẻ của bạn đã bị từ chối',
            'NETWORK_ERROR': 'Lỗi kết nối mạng',
            'BANK_ERROR': 'Lỗi từ ngân hàng. Vui lòng liên hệ với ngân hàng',
            'UNKNOWN_ERROR': 'Lỗi không xác định. Vui lòng thử lại sau',
        };
        return errors[errorCode] || errors['UNKNOWN_ERROR'];
    };

    const handleRetryPayment = () => {
        if (paymentInfo?.invoiceId) {
            navigate('/profile', { 
                state: { 
                    section: 'awaitingPayment',
                    invoiceIdToRetry: paymentInfo.invoiceId
                } 
            });
        }
    };

    const handleBackHome = () => {
        navigate('/');
    };

    const handleViewOrders = () => {
        navigate('/profile', { state: { section: 'awaitingPayment' } });
    };

    return (
        <div className={cx('payment-failed')}>
            <div className={cx('failed-container')}>
                {/* Failed Icon */}
                <div className={cx('icon-wrapper')}>
                    <div className={cx('icon-background')}>
                        <FontAwesomeIcon icon={faTimesCircle} className={cx('failed-icon')} />
                    </div>
                </div>

                {/* Failed Message */}
                <h1 className={cx('title')}>Thanh Toán Thất Bại</h1>
                <p className={cx('subtitle')}>
                    Rất tiếc, giao dịch của bạn không thể được hoàn tất
                </p>

                {/* Error Details */}
                {paymentInfo && (
                    <div className={cx('error-details')}>
                        <div className={cx('error-code')}>
                            <span className={cx('label')}>Mã Lỗi:</span>
                            <span className={cx('code')}>{paymentInfo.errorCode}</span>
                        </div>
                        <div className={cx('error-message')}>
                            {getErrorDescription(paymentInfo.errorCode)}
                        </div>
                    </div>
                )}

                {/* Transaction Details */}
                {paymentInfo && (
                    <div className={cx('details-card')}>
                        <h2 className={cx('details-title')}>Thông Tin Giao Dịch</h2>
                        
                        <div className={cx('details-grid')}>
                            <div className={cx('detail-item')}>
                                <span className={cx('detail-label')}>Mã Hóa Đơn</span>
                                <span className={cx('detail-value', 'invoice-id')}>
                                    #{paymentInfo.invoiceId}
                                </span>
                            </div>

                            <div className={cx('detail-item')}>
                                <span className={cx('detail-label')}>Số Tiền</span>
                                <span className={cx('detail-value', 'amount')}>
                                    {formatCurrency(paymentInfo.amount)}
                                </span>
                            </div>

                            <div className={cx('detail-item')}>
                                <span className={cx('detail-label')}>Thời Gian</span>
                                <span className={cx('detail-value')}>
                                    <FontAwesomeIcon icon={faClock} style={{ marginRight: '6px' }} />
                                    {formatDateTime(paymentInfo.timestamp)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Possible Reasons */}
                <div className={cx('reasons-card')}>
                    <h2 className={cx('reasons-title')}>Nguyên Nhân Có Thể Là</h2>
                    <ul className={cx('reasons-list')}>
                        <li>
                            <span className={cx('reason-icon')}>💳</span>
                            <div>
                                <strong>Vấn đề với thẻ/tài khoản</strong>
                                <p>Kiểm tra xem thẻ của bạn còn hạn sử dụng và có đủ số dư</p>
                            </div>
                        </li>
                        <li>
                            <span className={cx('reason-icon')}>🌐</span>
                            <div>
                                <strong>Lỗi kết nối</strong>
                                <p>Kiểm tra kết nối internet của bạn và thử lại</p>
                            </div>
                        </li>
                        <li>
                            <span className={cx('reason-icon')}>⏱️</span>
                            <div>
                                <strong>Hết thời gian chờ</strong>
                                <p>Giao dịch đã vượt quá thời gian chờ, vui lòng thử lại</p>
                            </div>
                        </li>
                        <li>
                            <span className={cx('reason-icon')}>🔒</span>
                            <div>
                                <strong>An toàn giao dịch</strong>
                                <p>Ngân hàng của bạn có thể đã chặn giao dịch vì lý do bảo mật</p>
                            </div>
                        </li>
                    </ul>
                </div>

                {/* Support Info */}
                <div className={cx('support-info')}>
                    <h3>Cần Hỗ Trợ?</h3>
                    <div className={cx('support-items')}>
                        <div className={cx('support-item')}>
                            <FontAwesomeIcon icon={faPhone} className={cx('support-icon')} />
                            <div>
                                <p className={cx('support-label')}>Liên Hệ Hỗ Trợ</p>
                                <p className={cx('support-value')}>0986 897 756</p>
                            </div>
                        </div>
                        <div className={cx('support-item')}>
                            <FontAwesomeIcon icon={faHeadset} className={cx('support-icon')} />
                            <div>
                                <p className={cx('support-label')}>Email</p>
                                <p className={cx('support-value')}>support@aestheticsui.com</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className={cx('action-buttons')}>
                    <button 
                        className={cx('btn', 'btn-secondary')}
                        onClick={handleBackHome}
                    >
                        ← Quay Về Trang Chủ
                    </button>
                    <button 
                        className={cx('btn', 'btn-primary')}
                        onClick={handleRetryPayment}
                    >
                        <FontAwesomeIcon icon={faRotateLeft} />
                        Thử Lại
                    </button>
                </div>

                {/* Alternative Option */}
                <div className={cx('alternative-option')}>
                    <p>Hoặc</p>
                    <button 
                        className={cx('btn-link')}
                        onClick={handleViewOrders}
                    >
                        Xem các hóa đơn chờ thanh toán
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PaymentResultFailed;
