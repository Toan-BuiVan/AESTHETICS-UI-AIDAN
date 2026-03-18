import React, { useState, useEffect } from 'react';
import axios from 'axios';
import classNames from 'classnames/bind';
import styles from './ItemMenuSupplier.module.scss';

const cx = classNames.bind(styles);

function ItemMenuSupplier({ onSelectSupplier, selectedSupplier }) {
    const [suppliers, setSuppliers] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.post('http://localhost:5262/api/Supplier/GetList_SearchSupplier', {});
                if (response.data && response.data.data && Array.isArray(response.data.data)) {
                    setSuppliers(response.data.data);
                } else if (Array.isArray(response.data)) {
                    setSuppliers(response.data);
                } else {
                    setSuppliers([]);
                    console.warn('Dữ liệu API không đúng định dạng mong đợi:', response.data);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setSuppliers([]);
            }
        };
        fetchData();
    }, []);

    const handleRadioChange = (supplierName) => {
        onSelectSupplier(supplierName);
    };

    return (
        <>
            {suppliers.map((supplier) => (
                <li key={supplier.supplierID} className={cx('menuItem')}>
                    <label className={cx('label')}>
                        <input
                            type="radio"
                            name="supplier"
                            value={supplier.supplierName}
                            checked={selectedSupplier === supplier.supplierName}
                            onChange={() => handleRadioChange(supplier.supplierName)}
                            className={cx('radio')}
                        />
                        <span className={cx('text')}>{supplier.supplierName}</span>
                    </label>
                </li>
            ))}
        </>
    );
}

export default ItemMenuSupplier;
