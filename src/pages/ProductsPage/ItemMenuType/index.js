import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './ItemMenuType.module.scss';

const cx = classNames.bind(styles);

function ItemMenuType({ onSelectType, selectedType }) {
    const [items, setItems] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const requestBody = {};

                const response = await fetch(
                    'http://localhost:5262/api/TypeProductsServices/GetList_SreachProductsOfServices',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestBody),
                    },
                );

                if (!response.ok) {
                    throw new Error(`https error! status: ${response.status}`);
                }

                const responseData = await response.json();
                let data;
                if (responseData && responseData.data && Array.isArray(responseData.data)) {
                    data = responseData.data;
                } else if (Array.isArray(responseData)) {
                    data = responseData;
                } else {
                    data = [];
                }

                const filteredData = data.filter((item) => item.productsOfServicesType === 'Products');
                setItems(filteredData);
            } catch (error) {
                console.error('Error fetching data:', error);
                setItems([]);
            }
        };
        fetchData();
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
