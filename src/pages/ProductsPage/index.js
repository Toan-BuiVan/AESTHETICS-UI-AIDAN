import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './ProductsPage.module.scss';
import ItemMenuType from './ItemMenuType';
import ItemMenuSupplier from './ItemMenuSupplier';
import ItemProduct from './ItemProduct';
import ProductDetailsPage from '~/pages/ProductDetailsPage';
import useDebounce from '~/hooks/useDebounce';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';

function ProductsPage() {
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [selectedType, setSelectedType] = useState(null);
    const [selectedPriceRanges, setSelectedPriceRanges] = useState([]);
    const [products, setProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [successMessage, setSuccessMessage] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const pageSize = 12;

    const debouncedSelectedSupplier = useDebounce(selectedSupplier, 300);
    const debouncedSelectedType = useDebounce(selectedType, 300);
    const debouncedSelectedPriceRanges = useDebounce(selectedPriceRanges, 300);

    const priceRanges = [
        { id: 1, label: '100k - 300k', min: 100000, max: 300000 },
        { id: 2, label: '300k - 500k', min: 300000, max: 500000 },
        { id: 3, label: '500k - 1tr', min: 500000, max: 1000000 },
        { id: 4, label: 'Lớn hơn 1tr', min: 1000000, max: null },
    ];

    const handlePriceRangeChange = (rangeId) => {
        setSelectedPriceRanges((prev) => {
            if (prev.includes(rangeId)) {
                return prev.filter((id) => id !== rangeId);
            } else {
                return [...prev, rangeId];
            }
        });
    };

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                let minPriceToSend = null;
                let maxPriceToSend = null;

                if (debouncedSelectedPriceRanges.length > 0) {
                    const selectedRanges = priceRanges.filter((range) =>
                        debouncedSelectedPriceRanges.includes(range.id),
                    );
                    const minPrices = selectedRanges.map((range) => range.min);
                    const maxPrices = selectedRanges.map((range) => range.max || Infinity);
                    minPriceToSend = Math.min(...minPrices);
                    maxPriceToSend = Math.max(...maxPrices);
                    if (maxPriceToSend === Infinity) maxPriceToSend = null;
                }

                const supplierNameToSend = debouncedSelectedSupplier || null;
                const productsOfServicesNameToSend = debouncedSelectedType || null;

                const response = await axios.post('http://localhost:5262/api/Products/GetSortedPagedProducts', {
                    pageIndex: currentPage,
                    pageSize: pageSize,
                    minPrice: minPriceToSend,
                    maxPrice: maxPriceToSend,
                    supplierName: supplierNameToSend,
                    productsOfServicesName: productsOfServicesNameToSend,
                });
                const { countProducts, data } = response.data;
                setProducts(Array.isArray(data) ? data : []);
                setTotalPages(Math.ceil(countProducts / pageSize));
            } catch (error) {
                console.error('Error fetching products:', error);
                setProducts([]);
                setTotalPages(1);
            }
        };
        fetchProducts();
    }, [debouncedSelectedSupplier, debouncedSelectedType, debouncedSelectedPriceRanges, currentPage]);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const getPaginationItems = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    const handleSuccessMessage = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), 2000);
    };

    const handleProductClick = (product) => {
        setSelectedProduct(product);
    };

    const handleBackToList = () => {
        setSelectedProduct(null);
    };

    const handleSelectProduct = (product) => {
        setSelectedProduct(product);
    };

    return (
        <div className={styles.wrapper}>
            {selectedProduct ? (
                <ProductDetailsPage
                    product={selectedProduct}
                    onBack={handleBackToList}
                    onSelectProduct={handleSelectProduct}
                />
            ) : (
                <>
                    <div className={styles.sidebar}>
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>Khoảng Giá</h2>
                            <div className={styles.scrollableList}>
                                <ul className={styles.menuList}>
                                    {priceRanges.map((range) => (
                                        <li key={range.id} className={styles.menuItem}>
                                            <label className={styles.label}>
                                                <input
                                                    type="checkbox"
                                                    className={styles.checkbox}
                                                    checked={selectedPriceRanges.includes(range.id)}
                                                    onChange={() => handlePriceRangeChange(range.id)}
                                                />
                                                <span className={styles.text}>{range.label}</span>
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>Loại Sản Phẩm</h2>
                            <div className={styles.scrollableList}>
                                <ItemMenuType onSelectType={setSelectedType} selectedType={selectedType} />
                            </div>
                        </div>
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>Nhà Cung Cấp</h2>
                            <div className={styles.scrollableList}>
                                <ItemMenuSupplier
                                    onSelectSupplier={setSelectedSupplier}
                                    selectedSupplier={selectedSupplier}
                                />
                            </div>
                        </div>
                    </div>
                    <div className={styles.contentProducts}>
                        <div className={styles.content}>
                            {products.length > 0 ? (
                                products.map((product) => (
                                    <div key={product.productID} onClick={() => handleProductClick(product)}>
                                        <ItemProduct product={product} onSuccess={handleSuccessMessage} />
                                    </div>
                                ))
                            ) : (
                                <p>Loading...</p>
                            )}
                        </div>
                        <div className={styles.pagination}>
                            {getPaginationItems().map((page, index) =>
                                page === '...' ? (
                                    <span key={`ellipsis-${index}`} className={styles.ellipsis}>
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={currentPage === page ? styles.activePage : ''}
                                    >
                                        {page}
                                    </button>
                                ),
                            )}
                        </div>

                        {successMessage && <SuccessMessage message={successMessage} />}
                    </div>
                </>
            )}
        </div>
    );
}

export default ProductsPage;
