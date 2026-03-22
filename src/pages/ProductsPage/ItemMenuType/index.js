import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './ItemMenuType.module.scss';

const cx = classNames.bind(styles);

function ItemMenuType({ onSelectType, selectedType }) {
    const [items, setItems] = useState([]);

    // API call removed - no data source for items
    useEffect(() => {
        setItems([]);
    }, []);

    const handleRadioChange = (typeName) => {
        onSelectType(typeName);
    };

    return (
        <>
            {items.map((item) => (
                <li key={item.productsOfServicesID} className={cx('menuItem')}>
                    <label className={cx('label')}>
                        <input
                            type="radio"
                            name="productType"
                            value={item.productsOfServicesName}
                            checked={selectedType === item.productsOfServicesName}
                            onChange={() => handleRadioChange(item.productsOfServicesName)}
                            className={cx('radio')}
                        />
                        <span className={cx('text')}>{item.productsOfServicesName}</span>
                    </label>
                </li>
            ))}
        </>
    );
}

export default ItemMenuType;
