import { useSearchParams } from 'react-router-dom';
import React from 'react';
import classNames from 'classnames/bind';
import styles from './PaymentResult.module.scss';

const cx = classNames.bind(styles);

function PaymentResult() {
    const [searchParams] = useSearchParams();
    const status = searchParams.get('status');
    const invoiceId = searchParams.get('invoiceId');

    if (status === 'success') {
        return (
            <div className={cx('payment-result', 'success')}>
                <div className={cx('success-icon')}></div>
                <h2 className={cx('success-title')}>Thanh Toán Thành Công</h2>
                <p>Hóa đơn {invoiceId} đã được thanh toán thành công.</p>
                <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
                <div className={cx('transaction-details')}>
                    <div>
                        <span>Mã tra cứu</span>
                        <p>{invoiceId}</p>
                    </div>
                    <div>
                        <span>Thời gian giao dịch</span>
                        <p>{new Date().toLocaleString('vi-VN')}</p>
                    </div>
                </div>
                <a href="/profile" className={cx('back-link')}>
                    Quay lại
                </a>
            </div>
        );
    } else if (status === 'failure') {
        return (
            <div className={cx('payment-result', 'failure')}>
                <div className={cx('failure-icon')}></div>
                <h2 className={cx('failure-title')}>Thất Bại</h2>
                <p>Đơn hàng không được thực hiện</p>
                <div className={cx('transaction-details')}>
                    <div>
                        <span>
                            Mã tra cứu: <p>{invoiceId}</p>
                        </span>
                    </div>
                    <div>
                        <span>Thời gian giao dịch</span>
                        <p>{new Date().toLocaleString('vi-VN')}</p>
                    </div>
                </div>
                <a href="/profile" className={cx('back-link')}>
                    Quay lại
                </a>
            </div>
        );
    } else {
        return (
            <div className={cx('payment-result')}>
                <h2 className={cx('error-title')}>Lỗi Xử Lý Thanh Toán</h2>
                <p>Đã xảy ra lỗi trong quá trình xử lý thanh toán cho hóa đơn {invoiceId}.</p>
                <p>Vui lòng liên hệ hỗ trợ để được trợ giúp.</p>
                <a href="/profile" className={cx('back-link')}>
                    Quay lại
                </a>
            </div>
        );
    }
}

export default PaymentResult;
