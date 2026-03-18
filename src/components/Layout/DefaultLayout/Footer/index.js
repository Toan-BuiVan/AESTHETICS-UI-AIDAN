import classNames from 'classnames/bind';
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faInstagram, faLinkedin, faPinterest, faTwitter } from '@fortawesome/free-brands-svg-icons';

import styles from './Footer.module.scss';
import images from '~/assets/images';
const cx = classNames.bind(styles);
function Footer() {
    return (
        <div className={cx('wrapper')}>
            <footer className={cx('footer-wrapper')}>
                <div className={cx('footer-upper')}>
                    <div className={cx('footer-column', 'footer-bizhost')}>
                        <h2>Bizhostvn.com</h2>
                        <p>Đẳng cấp - Khác biệt</p>
                        <div className={cx('footer-social-icons')}>
                            <FontAwesomeIcon className={cx('fa-facebook')} icon={faFacebook} />
                            <FontAwesomeIcon className={cx('fa-instagram')} icon={faInstagram} />
                            <FontAwesomeIcon className={cx('fa-twitter')} icon={faTwitter} />
                            <FontAwesomeIcon className={cx('fa-pinterest')} icon={faPinterest} />
                            <FontAwesomeIcon className={cx('fa-linkedin')} icon={faLinkedin} />
                        </div>
                        <p>- Giấy phép hoạt động số 1542/SYT-GPHĐ </p>
                        <p>- Chứng chỉ hành nghề số 2473/HNO-CC-HN </p>
                        <p>- Giấy chứng nhận KD số 01A8013838</p>
                    </div>

                    <div className={cx('footer-column', 'footer-services')}>
                        <h2>Dịch vụ nổi bật</h2>
                        <ul>
                            <li>Phun môi thẩm mỹ</li>
                            <li>Nâng mũi Sline</li>
                            <li>Trị nám mặt sau sinh</li>
                            <li>Tạo mặt V-line sau 90 phút</li>
                            <li>Căng da mặt không phẫu thuật</li>
                            <li>Giảm cân sau sinh</li>
                            <li>Giảm cân an toàn</li>
                            <li>Trị nám Pigment Control</li>
                            <li>Nâng mũi sụn mềm Hàn Quốc</li>
                            <li>Cấy tóc tự nhiên</li>
                        </ul>
                    </div>

                    <div className={cx('footer-column', 'footer-fanpage')}>
                        <h2>Fanpage</h2>
                        <div className={cx('footer-fanpage-content')}>
                            <img src={images.footer} alt="Fanpage" />
                        </div>
                    </div>
                </div>

                <div className={cx('footer-lower')}>
                    <div className={cx('footer-hotline')}>
                        <p>
                            Hotline: <span>0383.1023.***</span>
                        </p>
                    </div>
                    <div className={cx('footer-info')}>
                        <p>MinhAnhSpaWeb.com | Copyright 2025 © webdesign.com</p>
                        <p>* Kết quả điều trị tùy thuộc vào cơ địa của mỗi người</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Footer;
