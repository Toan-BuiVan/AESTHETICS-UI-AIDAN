import React, { useState, useEffect } from 'react';
import axios from 'axios';
import classNames from 'classnames/bind';
import styles from './ItemServicesType.module.scss';

const cx = classNames.bind(styles);

function ItemServicesType({ onSelectTypes }) {
    const [items, setItems] = useState([]);
    const [selectedType, setSelectedType] = useState(null); 

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

                // Lọc dữ liệu để chỉ giữ các bản ghi có productsOfServicesType là "Servicess"
                const filteredData = data.filter((item) => item.productsOfServicesType === 'Servicess');
                setItems(filteredData);
            } catch (error) {
                console.error('Error fetching data:', error);
                setItems([]);
            }
        };
        fetchData();
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
