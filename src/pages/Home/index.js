import React, { useState } from 'react';
import images from '~/assets/images';
import classNames from 'classnames/bind';
import styles from './Home.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faPlay } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

const features = [
    {
        icon: images.doiNguChuyenGia,
        title: 'Đội ngũ chuyên gia',
        description: 'Không ngừng học hỏi, trao đổi những công nghệ làm đẹp hàng đầu thế giới',
    },
    {
        icon: images.chatLuongVang,
        title: 'Thương hiệu uy tín',
        description: 'Được đánh giá bằng những phản hồi và sự hài lòng của khách hàng',
    },
    {
        icon: images.mayMocHienDai,
        title: 'Máy móc hiện đại',
        description: 'Luôn đi đầu trong việc cập nhật những máy móc mới, hiện đại trên thế giới',
    },
    {
        icon: images.phucVutanTinh,
        title: 'Phục vụ chuyên nghiệp',
        description: 'Niềm tin và sự hài lòng của khách hàng là thành công của chúng tôi',
    },
];

const techCards = [
    {
        image: images.post4,
        title: 'TẠM BIỆT THÂM NÁM, TÀN NHANG ĐẾN 99% VỚI CÔNG NGHỆ FRACTIONAL CO2',
        description:
            'Bạn tự ti với khuôn mặt đầy những khuyết điểm, sử dụng nhiều phương pháp can thiệp nhưng không đem lại hiệu quả, đừng lo chúng tôi sẽ [...]',
    },
    {
        image: images.post2,
        title: 'TRẺ HÓA DA, XÓA NHĂN CÙNG CÔNG NGHỆ NÂNG CƠ RF',
        description:
            'Ngoài 25 tuổi, làn da của bạn sẽ bắt đầu có những dấu hiệu của việc lão hoá, vì thế bạn cần một chế độ chăm sóc đặc [...]',
    },
    {
        image: images.post,
        title: 'TẠM BIỆT MÁI TÓC XƠ RỐI, KÉM SỨC SỐNG, TẠO KIỂU TÓC HỢP THỜI',
        description:
            'Xu hướng kiểu tóc mới luôn được các nhà tạo mẫu cập nhật để tư vấn cho khách hàng lựa chọn kiểu phù hợp sở thích và [...]',
    },
];

const stories = [
    {
        image: images.ngoisao11,
        alt: '11 Ngôi Sao',
        title: 'Hành trình "thay số phận, đổi cuộc đời" của chàng trai mang tâm hồn con gái',
        content:
            'Chàng trai mê làm hoa hậu từ nhỏ. Mời các bạn cùng lắng nghe những lời tâm sự từ bạn Minh Tiến – chàng trai luôn khát khao sống đúng với con người mình. Đỗ Minh Tiến (23 tuổi) là tên khai sinh của chàng trai quê ở Tây [...]',
    },
    {
        image: images.bamethuyvy,
        alt: 'Thuy Vy',
        title: 'Đây là câu chuyện tiếp theo.',
        content:
            'Sinh ra không may mắn sở hữu khuôn mặt khả ái đã khiến Ngọc Anh (Cần Thơ) luôn cảm thấy bế tắc trong cuộc sống. Ngọc Anh đã có cuộc lột xác ngoạn mục sau phẫu thuật thẩm mỹ từ nâng mũi, độn cằm, cắt mí, trở nên xinh đẹp [...]',
    },
];

const salesItems = [
    {
        image: images.post0,
        title: 'NHÂN DỊP 30/4, KHUYẾN MÃI THẢ GA, LÀM ĐẸP CHỈ TỪ 150.000Đ',
        description:
            'Nhân kỷ niệm 43 năm giải phóng miền Nam, thống nhất đất nước, Thẩm mỹ viện Minh Anh triển khai chương trình khuyễn mãi đặc biệt. Khách hàng đến Minh Anh để sử dụng các dịch vụ làm đẹp, spa,... để được hưởng ưu đãi đặc biệt [...]',
    },
    {
        image: images.post4,
        title: 'GÓI LÀM ĐẸP ĐẶC BIỆT NGÀY 8/3 – MÓN QUÀ GỬI GẮM YÊU THƯƠNG',
        description:
            'GÓI RELATIONSHIP STT TÊN DỊCH VỤ THỜI GIAN GIÁ DỊCH VỤ SỐ LƯỢNG GIÁ GỐC 1 Tảo sống Silic – Nuôi dưỡng Thanh Xuân (Điều trị tái tạo da , thay đổi biểu bì da mới , săn chắc da , ... ) 4h 8.400.000đ 1 8.400.000đ [...]',
    },
    {
        image: images.trangDiemNheNhang,
        title: 'Tuần lễ Flash Sale tại Chi nhánh Trần Hưng Đạo',
        description:
            'Duy nhất tại chi nhánh TRẦN HƯNG ĐẠO tuần lễ từ ngày 19/3 đến ngày 25/3. Dịch vụ hăm sóc - Trị liệu da - Off 50% masage thư giãn mặt - Body - Foot: mua 10 tặng 3 mua 6 tặng 1 Thanh Tẩy Làn Da: Mua 10 tặng 3[...]',
    },
    {
        image: images.post0,
        title: 'Nhân dịp 30/4, khuyến mãi thả ga, làm đẹp chỉ từ 150.000đ',
        description:
            'Nhân kỷ niệm 43 năm giải phóng miền Nam, thống nhất đất nước, Thẩm mỹ viện Minh Anh triển khai chương trình khuyễn mãi đặc biệt. Khách hàng đến Minh Anh để sử dụng các dịch vụ làm đẹp, spa,... để được hưởng ưu đãi đặc biệt [...]',
    },
];

const videos = [
    {
        image: images.post7,
        title: 'SILIC TẢO SỐNG – THẦN DƯỢC TRẺ HÓA LÀN DA',
    },
    {
        image: images.hoangHongSpa,
        title: 'TVC GIỚI THIỆU VIỆN THẨM MỸ MINH ANH SPA – TP. NINH BÌNH',
    },
    {
        image: images.post2,
        title: 'TIN VIDEO LỄ CHUYỂN GIAO CÔNG NGHỆ HELIOS III – VIỆN THẨM MỸ MINH ANH',
    },
    {
        image: images.dichVuTaoMauToc,
        title: 'TIN VIDEO LỄ CHUYỂN GIAO CÔNG NGHỆ HELIOS III – VIỆN THẨM MỸ MINH ANH',
    },
];

const FeatureItem = ({ icon, title, description }) => (
    <div className={cx('feature-item')}>
        <div className={cx('feature-icon')}>
            <img src={icon} alt={title} />
        </div>
        <h3 className={cx('feature-title')}>{title}</h3>
        <p className={cx('feature-description')}>{description}</p>
    </div>
);

const TechCard = ({ image, title, description }) => (
    <div className={cx('tech-card')}>
        <img src={image} alt={title} />
        <h3>{title}</h3>
        <p>{description}</p>
        <button className={cx('btn-detail')}>+ Xem chi tiết</button>
    </div>
);

const BeautyStory = ({ story }) => (
    <div className={cx('beauty-story')}>
        <div className={cx('story-image')}>
            <img src={story.image} alt={story.alt} />
        </div>
        <div className={cx('story-content')}>
            <p>{story.title}</p>
            <p>{story.content}</p>
            <button className={cx('read-more')}>+ Xem chi tiết</button>
        </div>
    </div>
);

const SalesItem = ({ image, title, description }) => (
    <div className={cx('sales-item')}>
        <div className={cx('sales-image')}>
            <img src={image} alt="Feature Image" />
        </div>
        <div className={cx('sales-content')}>
            <h3 className={cx('sales-title')}>{title}</h3>
            <p className={cx('sales-description')}>{description}</p>
            <button className={cx('btn-detail-seales')}>+ Xem chi tiết</button>
        </div>
    </div>
);

function Home() {
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [currentSalesIndex, setCurrentSalesIndex] = useState(0);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

    const reviews = [
        {
            image: images.thanhBi,
            name: 'Diễn viên Thanh Bi',
            text: 'Thẩm mỹ viện MINH ANH thực sự là một địa chỉ uy tín, tin cậy để chị em đặt niềm tin và kỳ vọng vào sự thay đổi tích cực của nhan sắc. Cảm ơn đội ngũ y bác sĩ đã phục vụ chu đáo và nhiệt tình cũng như theo sát tình hình sức khoẻ của bệnh nhân.',
        },
        {
            image: images.namEm,
            name: 'Nguyễn Thị Lệ Nam Em',
            text: 'Cám ơn đội ngũ bác sỹ đã nhiệt tình phục vụ và rất chu đáo trong việc chăm sóc sức khỏe và tình trang của bệnh nhân. Mọi thành công đều nhờ sự tận tình của đội ngũ bác sỹ và chuyên viên Spa.',
        },
    ];

    const faqItems = [
        {
            question: 'Sử dụng phương pháp nào để làm đẹp an toàn?',
            content: (
                <div>
                    <p>– Chọn địa chỉ làm đẹp uy tín, tin cậy và tìm hiểu kỹ về họ trước khi quyết định.</p>
                    <p>– Lựa chọn công nghệ đã được kiểm chứng an toàn trên thế giới.</p>
                </div>
            ),
        },
        {
            question: 'Địa chỉ spa làm đẹp uy tín tại Hà Nội.',
            content: (
                <p>
                    – Hà Nội là thủ đô của Việt Nam, trung tâm kinh tế, văn hóa và chính trị lớn của cả nước. Vì vậy,
                    nền kinh tế tại địa phương này không ngừng phát triển, chị em ngày càng quan tâm hơn đến nhu cầu làm
                    đẹp cũng như giữ gìn nét đẹp cho mình.
                </p>
            ),
        },
        {
            question: 'Công nghệ trẻ hóa làn da nào tốt nhất hiện nay?',
            content: (
                <p>
                    – Với chị em phụ nữ, niềm vui và hạnh phúc to lớn đó là sự trẻ trung. Sự phát triển vượt bậc của
                    khoa học kỹ thuật đã đem lại rất nhiều công nghệ trẻ hóa da, nhằm giúp phái đẹp có được làn da trẻ
                    lâu với thời gian. Tuy nhiên, rất nhiều khách hàng chia sẻ với <b>Minh Anh</b> rằng họ hoang mang
                    không biết lựa chọn công nghệ trẻ hóa nào để chống lại sự lão hóa của làn da.
                </p>
            ),
        },
    ];

    const [openStates, setOpenStates] = useState(new Array(faqItems.length).fill(false));

    const toggleFaq = (index) => {
        setOpenStates((prev) => {
            const newStates = [...prev];
            newStates[index] = !newStates[index];
            return newStates;
        });
    };

    const handlePrevReview = () => {
        setCurrentReviewIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    };

    const handleNextReview = () => {
        setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
    };

    const handleDotClick = (index) => {
        setCurrentReviewIndex(index);
    };

    const itemsPerPage = 2;
    const totalItems = salesItems.length;

    const handleNextSales = () => {
        setCurrentSalesIndex((prev) => (prev + itemsPerPage) % totalItems);
    };

    const handlePrevSales = () => {
        setCurrentSalesIndex((prev) => (prev - itemsPerPage + totalItems) % totalItems);
    };

    const visibleSalesItems = salesItems.slice(currentSalesIndex, currentSalesIndex + itemsPerPage);

    const handleNextVideo = () => {
        setCurrentVideoIndex((prev) => Math.min(prev + 1, videos.length - 3));
    };

    const handlePrevVideo = () => {
        setCurrentVideoIndex((prev) => Math.max(prev - 1, 0));
    };

    const visibleVideos = videos.slice(currentVideoIndex, currentVideoIndex + 3);

    return (
        <div className={cx('wrapper')}>
            <div className={cx('heder')}>
                <img src={images.imageHomePage} alt="Image-Banner" />
            </div>
            <div className={cx('title')}>
                <h2>ĐÔI NÉT VỀ MINH ANH SPA</h2>
                <div className="decorative-divider"></div>
                <p>
                    Đội ngũ kĩ thuật viên dày dặn kinh nghiệm, giàu thành tích, luôn đi đầu trong việc ứng dụng những
                    công nghệ hiện đại, phong cách phục vụ chuyên nghiệp, thẩm mỹ viện Minh Anh tự hào là hệ thống thẩm
                    mỹ viện uy tín tại Việt Nam, đem đến cho khách hàng vẻ đẹp hoàn mỹ nhất.
                </p>
            </div>
            <div className={cx('features-container')}>
                <div className={cx('feature-row')}>
                    {features.map((feature, index) => (
                        <FeatureItem key={index} {...feature} />
                    ))}
                </div>
            </div>
            <div className={cx('img-inner')}>
                <img src={images.banner2} alt="Banner" />
            </div>
            <section id="section-content" className={cx('section-content')}>
                <div className={cx('container')}>
                    <h2 className={cx('section-title')}>CÔNG NGHỆ HIỆN ĐẠI TẠI MINH ANH SPA</h2>
                    <div className={cx('tech-cards')}>
                        {techCards.map((card, index) => (
                            <TechCard key={index} {...card} />
                        ))}
                    </div>
                </div>
            </section>

            <section id="section-relative" className={cx('section-relative')}>
                <div className={cx('section-title-container')}>
                    <h2 className={cx('section-title-relative')}>CÂU CHUYỆN THẬT VỀ LÀM ĐẸP</h2>
                </div>
                <BeautyStory story={stories[currentStoryIndex]} />

                <div className={cx('slider-nav-relative')}>
                    <button
                        className={cx('slider-left')}
                        onClick={() => setCurrentStoryIndex((prev) => (prev - 1 + stories.length) % stories.length)}
                    >
                        <FontAwesomeIcon className={cx('fa-solid')} icon={faChevronLeft} />
                    </button>
                    <button
                        className={cx('slider-right')}
                        onClick={() => setCurrentStoryIndex((prev) => (prev + 1) % stories.length)}
                    >
                        <FontAwesomeIcon className={cx('fa-solid')} icon={faChevronRight} />
                    </button>
                </div>
            </section>

            <section id="section-sales" className={cx('section-sales')}>
                <div className={cx('block-title')}>
                    <h2>CHƯƠNG TRÌNH KHUYẾN MẠI</h2>
                </div>
                <div className={cx('sales-container')}>
                    {visibleSalesItems.map((item, index) => (
                        <SalesItem key={index} {...item} />
                    ))}
                    <div className={cx('navigation-buttons')}>
                        <button className={cx('prev-button')} onClick={handlePrevSales}>
                            <FontAwesomeIcon className={cx('fa-solid fa-chevron-left')} icon={faChevronLeft} />
                        </button>
                        <button className={cx('next-button')} onClick={handleNextSales}>
                            <FontAwesomeIcon className={cx('fa-solid fa-chevron-right')} icon={faChevronRight} />
                        </button>
                    </div>
                </div>
            </section>

            <section id="setion-tintuc" className={cx('setion-tintuc')}>
                <div className={cx('block-tintuc')}>
                    <h2>BÀI VIẾT - TIN TỨC</h2>
                    <div className={cx('articles-container')}>
                        <div className={cx('left-article')}>
                            <img src={images.post7} alt="Image" />
                            <h3>LỄ CHUYỂN GIAO CÔNG NGHỆ HÀN QUỐC VỀ XOÁ NHĂN, GIẢM MỠ THỪA</h3>
                            <p>
                                Tiếp tục đưa công nghệ làm đẹp Hàn Quốc về phục vụ chị em, ngày 25/5 Thẩm mỹ viện Minh
                                Anh đã tổ chức buổi chuyển giao công nghệ Thermas – xoá nhăn, nâng cơ và Lipozero – giảm
                                mỡ thừa trước sự chứng kiến của chuyên gia Hàn Quốc [...]
                            </p>
                        </div>

                        <div className={cx('right-articles')}>
                            <div className={cx('right-article')}>
                                <img src={images.post2} alt="Image 1" />
                                <p>Xoá nhăn, trẻ hoá cùng công nghệ mới Thermas – Minh Anh Spa</p>
                            </div>
                            <div className={cx('right-article')}>
                                <img src={images.post6} alt="Image 2" />
                                <p>Công nghệ nâng cơ DUET RF là gì mà chị em mê mẩn?</p>
                            </div>
                            <div className={cx('right-article')}>
                                <img src={images.post} alt="Image 3" />
                                <p>Gạt bỏ nỗi ám ảnh mỡ thừa cùng Lipozero</p>
                            </div>
                            <div className={cx('right-article')}>
                                <img src={images.post10} alt="Image 4" />
                                <p>Trải nghiệm công nghệ làm đẹp đỉnh cao cùng chuyên gia Hàn Quốc</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className={cx('section-video')}>
                <h2>VIDEO TRẢI NGHIỆM DỊCH VỤ</h2>
                <div className={cx('video-navigation')}>
                    <FontAwesomeIcon
                        className={cx('nav-left', { hidden: currentVideoIndex === 0 })}
                        icon={faChevronLeft}
                        onClick={handlePrevVideo}
                    />
                    <div className={cx('video-container')}>
                        {visibleVideos.map((video, index) => (
                            <div className={cx('video-item')} key={index}>
                                <img src={video.image} alt={video.title} />
                                <FontAwesomeIcon className={cx('play-icon')} icon={faPlay} />
                                <p>{video.title}</p>
                            </div>
                        ))}
                    </div>
                    <FontAwesomeIcon
                        className={cx('nav-right', { hidden: currentVideoIndex >= videos.length - 3 })}
                        icon={faChevronRight}
                        onClick={handleNextVideo}
                    />
                </div>
            </section>

            <section id="section-nhan-xet" className={cx('section-nhan-xet')}>
                <div className={cx('customer-review')}>
                    <h2>NHẬN XÉT CỦA KHÁCH HÀNG</h2>
                    <div className={cx('title-underline')}></div>
                    <div className={cx('review-container')}>
                        <button className={cx('arrow-left')} onClick={handlePrevReview}>
                            &lt;
                        </button>
                        {reviews.map((review, index) => (
                            <div key={index} className={cx('review-wrapper', { active: index === currentReviewIndex })}>
                                <div className={cx('review-content')}>
                                    <div className={cx('review-image')}>
                                        <img src={review.image} alt={review.name} />
                                    </div>
                                    <div className={cx('text-content')}>
                                        <p className={cx('reviewer-name')}>{review.name}</p>
                                        <p className={cx('review-text')}>{review.text}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button className={cx('arrow-right')} onClick={handleNextReview}>
                            &gt;
                        </button>
                        <div className={cx('pagination-dots')}>
                            {reviews.map((_, index) => (
                                <span
                                    key={index}
                                    className={cx('dot', { active: index === currentReviewIndex })}
                                    onClick={() => handleDotClick(index)}
                                ></span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className={cx('section-nhan-tin')}>
                <div className={cx('containerr')}>
                    <div className={cx('content-wrapper')}>
                        <div className={cx('text-content')}>
                            <h2 className={cx('section-titlee')}>GIUSEART – NƠI ĐẶT NIỀM TIN TRỌN VẸN</h2>
                            <p className={cx('description')}>
                                Đăng ký nhận thông tin khuyến mãi để không bỏ lỡ bất cứ điều tuyệt vời nào dành riêng
                                cho bạn:
                            </p>
                        </div>
                        <div className={cx('form-content')}>
                            <form className={cx('form-dang-ky')}>
                                <div className={cx('input-group')}>
                                    <input type="email" id="email" name="email" placeholder="Địa chỉ email (*)" />
                                    <button className={cx('btn-submit')}>Đăng ký</button>
                                </div>
                                <div className={cx('error-message')}>
                                    <p>Mục này là bắt buộc.</p>
                                    <p>Có một hoặc nhiều mục nhập có lỗi. Vui lòng kiểm tra và thử lại.</p>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            <section className={cx('section-cau-hoi')}>
                <div className={cx('cauhoi-container')}>
                    <div className={cx('cauhoi-left-section')}>
                        <h2 className={cx('cauhoi-title')}>CÂU HỎI THƯỜNG GẶP</h2>
                        <div className={cx('cauhoi-faq')}>
                            {faqItems.map((item, index) => (
                                <div key={index} className={cx('cauhoi-question')}>
                                    <div
                                        className={cx('cauhoi-header')}
                                        onClick={() => toggleFaq(index)}
                                        role="button"
                                        aria-expanded={openStates[index]}
                                    >
                                        <span className={cx('cauhoi-icon-arrow')}>{openStates[index] ? '▲' : '▼'}</span>
                                        <span className={cx('cauhoi-question-title')}>{item.question}</span>
                                    </div>
                                    {openStates[index] && <div className={cx('cauhoi-content')}>{item.content}</div>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={cx('cauhoi-right-section')}>
                        <h2 className={cx('cauhoi-title')}>CHÚNG TÔI CÓ GÌ?</h2>
                        <div className={cx('cauhoi-features')}>
                            <div className={cx('cauhoi-feature')}>
                                <div className={cx('cauhoi-feature-image')}>
                                    <img src={images.chatLuongVang} alt="Thương hiệu uy tín" />
                                </div>
                                <div className={cx('cauhoi-feature-content')}>
                                    <h3>Thương hiệu uy tín</h3>
                                    <p>
                                        Thẩm mỹ viện MINH ANH đã nhận được nhiều giải thưởng giá trị trong ngành làm
                                        đẹp.
                                    </p>
                                </div>
                            </div>
                            <div className={cx('cauhoi-feature')}>
                                <div className={cx('cauhoi-feature-image')}>
                                    <img src={images.mayMocHienDai} alt="Máy móc hiện đại" />
                                </div>
                                <div className={cx('cauhoi-feature-content')}>
                                    <h3>Máy móc hiện đại</h3>
                                    <p>
                                        Luôn tiên phong trong việc ứng dụng công nghệ làm đẹp hiện đại của Hàn Quốc,
                                        Mỹ...
                                    </p>
                                </div>
                            </div>
                            <div className={cx('cauhoi-feature')}>
                                <div className={cx('cauhoi-feature-image')}>
                                    <img src={images.phucVutanTinh} alt="An toàn cho bạn" />
                                </div>
                                <div className={cx('cauhoi-feature-content')}>
                                    <h3>An toàn cho bạn</h3>
                                    <p>
                                        Chúng tôi luôn bảo hành cho sự an toàn của quý khách hàng. Sự hài lòng của quý
                                        khách chính là giá trị của chúng tôi.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;
