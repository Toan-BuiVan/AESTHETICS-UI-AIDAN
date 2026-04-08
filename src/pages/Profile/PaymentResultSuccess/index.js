import React, { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './PaymentResultSuccess.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faClock, faMapMarkerAlt, faPhone, faGift } from '@fortawesome/free-solid-svg-icons';
import { useSearchParams, useNavigate } from 'react-router-dom';

const cx = classNames.bind(styles);

function PaymentResultSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [invoiceInfo, setInvoiceInfo] = useState(null);

    useEffect(() => {
        // Lấy thông tin từ URL parameters
        const invoiceId = searchParams.get('invoiceId');
        const amount = searchParams.get('amount');
        const paymentMethod = searchParams.get('paymentMethod');
        const transactionId = searchParams.get('transactionId');
        const timestamp = searchParams.get('timestamp');

        if (invoiceId) {
            setInvoiceInfo({
                invoiceId,
                amount: amount ? parseInt(amount) : 0,
                paymentMethod: paymentMethod || 'Không xác định',
                transactionId: transactionId || 'N/A',
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

    const handleBackHome = () => {
        navigate('/');
    };

    const handleViewOrder = () => {
        navigate('/profile', { state: { section: 'paymentSuccessful' } });
    };

    return (
        <div className={cx('payment-success')}>
            <div className={cx('success-container')}>
                {/* Success Icon */}
                <div className={cx('icon-wrapper')}>
                    <div className={cx('icon-background')}>
                        <FontAwesomeIcon icon={faCheckCircle} className={cx('success-icon')} />
                    </div>
                </div>

                {/* Success Message */}
                <h1 className={cx('title')}>Thanh Toán Thành Công!</h1>
                <p className={cx('subtitle')}>
                    Chúng tôi đã nhận được thanh toán của bạn. Đơn hàng của bạn sẽ được xử lý sớm.
                </p>

                {/* Transaction Details */}
                {invoiceInfo && (
                    <div className={cx('details-card')}>
                        <h2 className={cx('details-title')}>Thông Tin Giao Dịch</h2>
                        
                        <div className={cx('details-grid')}>
                            <div className={cx('detail-item')}>
                                <span className={cx('detail-label')}>Mã Hóa Đơn</span>
                                <span className={cx('detail-value', 'invoice-id')}>
                                    #{invoiceInfo.invoiceId}
                                </span>
                            </div>

                            <div className={cx('detail-item')}>
                                <span className={cx('detail-label')}>Số Tiền</span>
                                <span className={cx('detail-value', 'amount')}>
                                    {formatCurrency(invoiceInfo.amount)}
                                </span>
                            </div>

                            <div className={cx('detail-item')}>
                                <span className={cx('detail-label')}>Phương Thức Thanh Toán</span>
                                <span className={cx('detail-value')}>
                                    {invoiceInfo.paymentMethod === 'vnpay' ? '🏦 VNPay' 
                                    : invoiceInfo.paymentMethod === 'momo' ? '📱 Momo'
                                    : invoiceInfo.paymentMethod}
                                </span>
                            </div>

                            <div className={cx('detail-item')}>
                                <span className={cx('detail-label')}>Mã Giao Dịch</span>
                                <span className={cx('detail-value', 'transaction-id')}>
                                    {invoiceInfo.transactionId}
                                </span>
                            </div>

                            <div className={cx('detail-item')}>
                                <span className={cx('detail-label')}>Thời Gian</span>
                                <span className={cx('detail-value')}>
                                    <FontAwesomeIcon icon={faClock} style={{ marginRight: '6px' }} />
                                    {formatDateTime(invoiceInfo.timestamp)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Next Steps */}
                <div className={cx('next-steps')}>
                    <h2 className={cx('steps-title')}>Bước Tiếp Theo</h2>
                    <ul className={cx('steps-list')}>
                        <li>
                            <span className={cx('step-number')}>1</span>
                            <div>
                                <div className={cx('step-title')}>Xác Nhận Tự Động</div>
                                <p>Chúng tôi sẽ gửi email xác nhận đến địa chỉ email của bạn trong vòng 5 phút</p>
                            </div>
                        </li>
                        <li>
                            <span className={cx('step-number')}>2</span>
                            <div>
                                <div className={cx('step-title')}>Xử Lý Đơn Hàng</div>
                                <p>Đơn hàng của bạn sẽ được xử lý và chuẩn bị trong 24-48 giờ</p>
                            </div>
                        </li>
                        <li>
                            <span className={cx('step-number')}>3</span>
                            <div>
                                <div className={cx('step-title')}>Giao Hàng</div>
                                <p>Chúng tôi sẽ cập nhật thông tin vận chuyển qua email của bạn</p>
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
                                <p className={cx('support-label')}>Gọi Chúng Tôi</p>
                                <p className={cx('support-value')}>0986 897 756</p>
                            </div>
                        </div>
                        <div className={cx('support-item')}>
                            <FontAwesomeIcon icon={faGift} className={cx('support-icon')} />
                            <div>
                                <p className={cx('support-label')}>Email Hỗ Trợ</p>
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
                        onClick={handleViewOrder}
                    >
                        Xem Đơn Hàng Của Tôi
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PaymentResultSuccess;
