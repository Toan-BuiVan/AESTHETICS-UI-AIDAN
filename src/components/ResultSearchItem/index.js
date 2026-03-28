import classNames from 'classnames/bind';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import styles from './ResultSearchItem.module.scss';
import image from '~/assets/images';

const cx = classNames.bind(styles);
function ResultSearchItem({ data, onNavigate }) {
    const navigate = useNavigate();

    const handleClick = (e) => {
        e.stopPropagation();
        
        if (data.serviceName && data.id) {
            navigate(`/services/${data.id}`, { replace: false });
            onNavigate?.();
        } else if (data.productName && data.productID) {
            navigate(`/productDetails/${data.productID}`, { replace: false });
            onNavigate?.();
        }
    };

    const formatPrice = (price) => {
        if (!price) return 'Liên hệ';
        return `${price.toLocaleString('vi-VN')}đ`;
    };

    return (
        <div 
            className={cx('wrapper')} 
            onClick={handleClick}
            role="button"
            tabIndex={0}
        >
            <img
                className={cx('result-image')}
                src={
                    data.productImages
                        ? `http://localhost:5262/Images/${data.productImages}`
                        : data.serviceImage
                        ? `http://localhost:5262/Images/${data.serviceImage}`
                        : 'http://localhost:5262/Images/default.jpg'
                }
                alt={data.serviceName || data.productName}
            />
            <div className={cx('result-info')}>
                <p className={cx('result-name')}>{data.productName || data.serviceName}</p>
                {data.description && <p className={cx('result-desc')}>{data.description}</p>}
                <div className={cx('footer-info')}>
                    {data.duration && <span className={cx('duration')}>⏱ {data.duration} phút</span>}
                    <p className={cx('result-price')}>
                        {formatPrice(data.price || data.sellingPrice || data.priceService)}
                    </p>
                </div>
            </div>
            <div 
                className={cx('arrow-icon')}
                onClick={handleClick}
            >
                <FontAwesomeIcon icon={faArrowRight} />
            </div>
        </div>
    );
}
export default ResultSearchItem;
