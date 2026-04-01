import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './VoucherSection.module.scss';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGift, faStar, faSpinner, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import useDebounce from '~/hooks/useDebounce';

const cx = classNames.bind(styles);

// Mapping Vietnamese ranks to English for API
const rankMapping = {
    'Kim Cương': 'Diamond',
    'Vàng': 'Gold',
    'Bạc': 'Silver',
    'Đồng': 'Bronze',
};

function VoucherSection() {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const pageSize = 8;
    const [filterCode, setFilterCode] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterRankMember, setFilterRankMember] = useState('');
    const [pointType, setPointType] = useState(0); // 0 = AccumulatedPoints, 1 = RatingPoints
    
    // Track selected point type for each voucher (voucherId -> pointType)
    const [voucherPointTypes, setVoucherPointTypes] = useState({});
    
    // Debounce for individual voucher exchange
    const debouncedVoucherPointTypes = useDebounce(voucherPointTypes, 3000);

    // Debounced filter values (2 seconds delay)
    const debouncedFilterCode = useDebounce(filterCode, 2000);
    const debouncedFilterStartDate = useDebounce(filterStartDate, 2000);
    const debouncedFilterEndDate = useDebounce(filterEndDate, 2000);
    const debouncedFilterRankMember = useDebounce(filterRankMember, 2000);

    useEffect(() => {
        const fetchVouchers = async () => {
            try {
                const data = {
                    pageNo: currentPage,
                    pageSize: pageSize,
                    code: debouncedFilterCode,
                    startDate: debouncedFilterStartDate ? new Date(debouncedFilterStartDate).toISOString() : null,
                    endDate: debouncedFilterEndDate ? new Date(debouncedFilterEndDate).toISOString() : null,
                    rankMember: debouncedFilterRankMember ? rankMapping[debouncedFilterRankMember] : '',
                    pointType: pointType, // 0 or 1
                };

                const response = await fetch('http://localhost:5122/api/Voucher/getvoucherlist', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                if (!response.ok) {
                    throw new Error('Lỗi khi gọi API');
                }

                const result = await response.json();
                const voucherData = result.baseDatas || [];
                
                if (Array.isArray(voucherData)) {
                    setVouchers(voucherData);
                    setTotalPages(result.pageCount || 1);
                    setTotalRecords(result.totalRecordCount || 0);
                    setLoading(false);
                } else {
                    throw new Error('Dữ liệu voucher không hợp lệ');
                }
            } catch (err) {
                setError('Không thể tải kho voucher. Vui lòng thử lại sau.');
                setLoading(false);
                console.error('Lỗi khi lấy voucher:', err);
            }
        };

        fetchVouchers();
    }, [currentPage, debouncedFilterCode, debouncedFilterStartDate, debouncedFilterEndDate, debouncedFilterRankMember, pointType]);

    // Handle debounced voucher exchange when point type changes
    useEffect(() => {
        Object.entries(debouncedVoucherPointTypes).forEach(async ([voucherId, selectedPointType]) => {
            const customerId = localStorage.getItem('customerId');
            if (!customerId) {
                setSuccessMessage('Không tìm thấy customerId trong localStorage');
                return;
            }

            const data = {
                customerId: parseInt(customerId),
                voucherId: parseInt(voucherId),
                pointType: selectedPointType,
            };

            try {
                const response = await fetch('http://localhost:5122/api/Wallet/exchangevoucher', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                const result = await response.json();

                if (result.success) {
                    setSuccessMessage(`Đổi voucher thành công!`);
                } else {
                    setSuccessMessage('Đổi voucher thất bại');
                }
            } catch (err) {
                setSuccessMessage('Đổi voucher thất bại');
                console.error('Lỗi khi đổi voucher:', err);
            }
        });
    }, [debouncedVoucherPointTypes]);

    const handleVoucherPointTypeChange = (voucherId, pointType) => {
        setVoucherPointTypes(prev => ({
            ...prev,
            [voucherId]: pointType
        }));
    };

    const handleClaimVoucher = async (voucher) => {
        const customerId = localStorage.getItem('customerId');
        if (!customerId) {
            setSuccessMessage('Không tìm thấy customerId trong localStorage');
            return;
        }

        const data = {
            customerId: parseInt(customerId),
            voucherId: voucher.id,
        };

        try {
            const response = await fetch('http://localhost:5122/api/Wallet/createwallet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (result.success) {
                setSuccessMessage('Lưu thành công!');
            } else {
                setSuccessMessage('Lưu thất bại');
            }
        } catch (err) {
            setSuccessMessage('Lưu thất bại');
            console.error('Lỗi khi lưu voucher:', err);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleFilterChange = () => {
        // Reset to page 1 when filter changes (will wait for debounce before API call)
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilterCode('');
        setFilterStartDate('');
        setFilterEndDate('');
        setFilterRankMember('');
        setPointType(0);
        setCurrentPage(1);
    };

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    if (loading) {
        return (
            <div className={cx('voucher-section')}>
                <div className={cx('loading-container')}>
                    <FontAwesomeIcon icon={faSpinner} className={cx('spinner-icon')} />
                    <p>Đang tải kho voucher...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cx('voucher-section')}>
                <div className={cx('error-container')}>
                    <FontAwesomeIcon icon={faExclamationCircle} className={cx('error-icon')} />
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cx('voucher-section')}>
            {successMessage && <SuccessMessage message={successMessage} />}
            
            <div className={cx('section-header')}>
                <div className={cx('header-content')}>
                    <h2><FontAwesomeIcon icon={faGift} className={cx('header-icon')} /> Kho Voucher</h2>
                    <p className={cx('header-subtitle')}>Khám phá và nhận các voucher khuyến mãi</p>
                </div>
                {totalRecords > 0 && (
                    <div className={cx('voucher-count')}>
                        <span>{totalRecords}</span> Voucher
                    </div>
                )}
            </div>
            
            {/* Filter Section */}
            <div className={cx('filter-section')}>
                <div className={cx('filter-group')}>
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm mã voucher..."
                        value={filterCode}
                        onChange={(e) => {
                            setFilterCode(e.target.value);
                            handleFilterChange();
                        }}
                        className={cx('filter-input')}
                    />
                </div>
                <div className={cx('filter-group')}>
                    <label className={cx('filter-label')}>Từ ngày:</label>
                    <input 
                        type="date" 
                        value={filterStartDate}
                        onChange={(e) => {
                            setFilterStartDate(e.target.value);
                            handleFilterChange();
                        }}
                        className={cx('filter-input')}
                    />
                </div>
                <div className={cx('filter-group')}>
                    <label className={cx('filter-label')}>Đến ngày:</label>
                    <input 
                        type="date" 
                        value={filterEndDate}
                        onChange={(e) => {
                            setFilterEndDate(e.target.value);
                            handleFilterChange();
                        }}
                        className={cx('filter-input')}
                    />
                </div>
                <div className={cx('filter-group')}>
                    <label className={cx('filter-label')}>Hạng hội viên:</label>
                    <select 
                        value={filterRankMember}
                        onChange={(e) => {
                            setFilterRankMember(e.target.value);
                            handleFilterChange();
                        }}
                        className={cx('filter-select')}
                    >
                        <option value="">Tất cả hạng</option>
                        <option value="Kim Cương">Kim Cương</option>
                        <option value="Vàng">Vàng</option>
                        <option value="Bạc">Bạc</option>
                        <option value="Đồng">Đồng</option>
                    </select>
                </div>
                <button className={cx('btn-clear-filter')} onClick={handleClearFilters}>
                    Xóa bộ lọc
                </button>
            </div>
            
                <div className={cx('voucher-list')}>
                    {vouchers.map((voucher) => (
                        <div key={voucher.id} className={cx('voucher-row')}>
                            {/* Discount Badge */}
                            <div className={cx('row-discount')}>
                                <span className={cx('discount-percent')}>{voucher.discountValue}%</span>
                            </div>

                            {/* Code and Description */}
                            <div className={cx('row-code-description')}>
                                <h4 className={cx('code-text')}>{voucher.code}</h4>
                                <p className={cx('description')}>{voucher.description}</p>
                            </div>

                            {/* Details */}
                            <div className={cx('row-details')}>
                                <span className={cx('detail-item')}>Giảm tối đa: <strong>{voucher.maxValue?.toLocaleString('vi-VN') || '0'}đ</strong></span>
                                <span className={cx('detail-item')}>Đơn tối thiểu: <strong>{voucher.minimumOrderValue?.toLocaleString('vi-VN') || '0'}đ</strong></span>
                            </div>

                            {/* Dates and Rank */}
                            <div className={cx('row-meta')}>
                                <span className={cx('meta-item')}>Hết hạn: <strong>{new Date(voucher.endDate).toLocaleDateString('vi-VN')}</strong></span>
                                <span className={cx('meta-item', 'rank')}><FontAwesomeIcon icon={faStar} /> {voucher.rankMember}</span>
                            </div>

                            {/* Claim Button */}
                            <div className={cx('row-action')}>
                                <div className={cx('voucher-point-options')}>
                                    <label className={cx('point-option')}>
                                        <input 
                                            type="radio" 
                                            name={`voucher-${voucher.id}`} 
                                            value="0"
                                            checked={(voucherPointTypes[voucher.id] ?? -1) === 0}
                                            onChange={() => handleVoucherPointTypeChange(voucher.id, 0)}
                                            className={cx('point-radio')}
                                        />
                                        <span className={cx('point-label')}>Giới Thiệu</span>
                                    </label>
                                    <label className={cx('point-option')}>
                                        <input 
                                            type="radio" 
                                            name={`voucher-${voucher.id}`} 
                                            value="1"
                                            checked={(voucherPointTypes[voucher.id] ?? -1) === 1}
                                            onChange={() => handleVoucherPointTypeChange(voucher.id, 1)}
                                            className={cx('point-radio')}
                                        />
                                        <span className={cx('point-label')}>Mua Hàng</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className={cx('pagination-container')}>
                            <button 
                                className={cx('pagination-btn', 'prev-btn')} 
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                            >
                                ← Trang trước
                            </button>

                            <div className={cx('pagination-info')}>
                                Trang <strong>{currentPage}</strong> / {totalPages}
                            </div>

                            <div className={cx('pagination-pages')}>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        className={cx('page-btn', { active: page === currentPage })}
                                        onClick={() => goToPage(page)}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>

                            <button 
                                className={cx('pagination-btn', 'next-btn')} 
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                            >
                                Trang sau →
                            </button>
                        </div>
                    )}
                </div>

        </div>
    );
}

export default VoucherSection;