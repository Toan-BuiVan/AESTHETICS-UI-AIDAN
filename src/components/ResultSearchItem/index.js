import classNames from 'classnames/bind';
import styles from './ResultSearchItem.module.scss';
import image from '~/assets/images';

const cx = classNames.bind(styles);
function ResultSearchItem({ data }) {
    return (
        <div className={cx('wrapper')}>
            <img
                className={cx('result-image')}
                src={
                    data.productImages
                        ? `http://localhost:5262/Images/${data.productImages}`
                        : data.serviceImage
                        ? `http://localhost:5262/Images/${data.serviceImage}`
                        : 'http://localhost:5262/Images/default.jpg'
                }
                alt=""
            />
            <div className={cx('result-info')}>
                <p className={cx('result-name')}>{data.productName || data.serviceName}</p>
                <p className={cx('result-price')}>
                    {data.sellingPrice ? `${data.sellingPrice}đ` : `${data.priceService}đ`}
                </p>
            </div>
        </div>
    );
}
export default ResultSearchItem;
