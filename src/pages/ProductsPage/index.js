import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './ProductsPage.module.scss';
import ItemProduct from './ItemProduct';
import ProductDetailsPage from '~/pages/ProductDetailsPage';
import useDebounce from '~/hooks/useDebounce';
import SuccessMessage from '~/components/Layout/DefaultLayout/Header/SuccessMessage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';

function ProductsPage() {
    const [productName, setProductName] = useState('');
    const [selectedServiceTypeId, setSelectedServiceTypeId] = useState(null);
    const [selectedSupplierId, setSelectedSupplierId] = useState(null);
    const [products, setProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [successMessage, setSuccessMessage] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [serviceTypes, setServiceTypes] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const pageSize = 12;

    const debouncedProductName = useDebounce(productName, 300);
    const debouncedSelectedServiceTypeId = useDebounce(selectedServiceTypeId, 300);
    const debouncedSelectedSupplierId = useDebounce(selectedSupplierId, 300);

    // Fetch service types and suppliers on component mount
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                // Fetch service types
                const typesResponse = await axios.post('http://localhost:5122/api/ServiceType/getservicetypelist', {
                    pageNo: 1,
                    pageSize: 1000,
                    serviceCategory: 1,
                });
                if (typesResponse.data && typesResponse.data.baseDatas) {
                    setServiceTypes(typesResponse.data.baseDatas);
                }
            } catch (error) {
                console.error('Error fetching service types:', error);
            }

            try {
                // Fetch suppliers
                const suppliersResponse = await axios.post('http://localhost:5122/api/Supplier/paging', {
                    pageNo: 1,
                    pageSize: 1000,
                });
                if (suppliersResponse.data && suppliersResponse.data.baseDatas) {
                    setSuppliers(suppliersResponse.data.baseDatas);
                }
            } catch (error) {
                console.error('Error fetching suppliers:', error);
            }
        };
        fetchFilters();
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.post('http://localhost:5122/api/Product/getproductlist', {
                    pageNo: currentPage - 1,
                    pageSize: pageSize,
                    id: null,
                    productName: debouncedProductName || null,
                    supplierName: null,
                    serviceTypeName: null,
                    productId: null,
                    serviceTypeId: debouncedSelectedServiceTypeId || null,
                    supplierId: debouncedSelectedSupplierId || null,
                });
                const { baseDatas, totalRecordCount, pageCount } = response.data;
                setProducts(Array.isArray(baseDatas) ? baseDatas : []);
                setTotalPages(pageCount || Math.ceil(totalRecordCount / pageSize));
            } catch (error) {
                console.error('Error fetching products:', error);
                setProducts([]);
                setTotalPages(1);
            }
        };
        fetchProducts();
    }, [debouncedProductName, debouncedSelectedServiceTypeId, debouncedSelectedSupplierId, currentPage]);

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
                    <div className={styles.pageContainer}>
                        {/* Search and Filter Bar */}
                        <div className={styles.searchFilterBar}>
                            {/* Search Input */}
                            <div className={styles.searchBox}>
                                <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm sản phẩm..."
                                    value={productName}
                                    onChange={(e) => {
                                        setProductName(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className={styles.searchInput}
                                />
                                {productName && (
                                    <button
                                        className={styles.clearBtn}
                                        onClick={() => {
                                            setProductName('');
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                )}
                            </div>

                            {/* Filter Dropdowns */}
                            <div className={styles.filterGroup}>
                                {/* Service Type Filter */}
                                <select
                                    value={selectedServiceTypeId || ''}
                                    onChange={(e) => {
                                        setSelectedServiceTypeId(e.target.value ? parseInt(e.target.value) : null);
                                        setCurrentPage(1);
                                    }}
                                    className={styles.filterSelect}
                                >
                                    <option value="">Tất cả loại dịch vụ</option>
                                    {serviceTypes.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.serviceTypeName || type.name}
                                        </option>
                                    ))}
                                </select>

                                {/* Supplier Filter */}
                                <select
                                    value={selectedSupplierId || ''}
                                    onChange={(e) => {
                                        setSelectedSupplierId(e.target.value ? parseInt(e.target.value) : null);
                                        setCurrentPage(1);
                                    }}
                                    className={styles.filterSelect}
                                >
                                    <option value="">Tất cả nhà cung cấp</option>
                                    {suppliers.map((supplier) => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.supplierName || supplier.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Reset Filters */}
                            {(productName || selectedServiceTypeId || selectedSupplierId) && (
                                <button
                                    className={styles.resetBtn}
                                    onClick={() => {
                                        setProductName('');
                                        setSelectedServiceTypeId(null);
                                        setSelectedSupplierId(null);
                                        setCurrentPage(1);
                                    }}
                                >
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>

                        {/* Products Grid */}
                        <div className={styles.productsGrid}>
                            {products.length > 0 ? (
                                products.map((product) => (
                                    <div
                                        key={product.id}
                                        className={styles.productItem}
                                        onClick={() => handleProductClick(product)}
                                    >
                                        <ItemProduct product={product} onSuccess={handleSuccessMessage} />
                                    </div>
                                ))
                            ) : (
                                <div className={styles.noProducts}>Không tìm thấy sản phẩm</div>
                            )}
                        </div>

                        {/* Pagination */}
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
