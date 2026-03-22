import React, { useState, useEffect } from 'react';
import axios from 'axios';
import classNames from 'classnames/bind';
import styles from './ItemServicesType.module.scss';

const cx = classNames.bind(styles);

function ItemServicesType({ onSelectTypes }) {
    const [items, setItems] = useState([]);
    const [selectedType, setSelectedType] = useState(null); 

    // API call removed - no data source for items
    useEffect(() => {
        setItems([]);
    }, []);

    const handleCheckboxChange = (typeName) => {
        const newSelectedType = selectedType === typeName ? null : typeName; // Toggle: chọn hoặc hủy chọn
        setSelectedType(newSelectedType);
        onSelectTypes(newSelectedType ? [newSelectedType] : []); // Gửi mảng chứa 1 phần tử hoặc rỗng
    };

    return (
        <>
            {items.map((item) => (
                <li key={item.productsOfServicesID} className={cx('menuItem')}>
                    <label className={cx('label')}>
                        <input
                            type="checkbox"
                            className={cx('checkbox')}
                            checked={selectedType === item.productsOfServicesName}
                            onChange={() => handleCheckboxChange(item.productsOfServicesName)}
                        />
                        <span className={cx('text')}>{item.productsOfServicesName}</span>
                    </label>
                </li>
            ))}
        </>
    );
}

export default ItemServicesType;
