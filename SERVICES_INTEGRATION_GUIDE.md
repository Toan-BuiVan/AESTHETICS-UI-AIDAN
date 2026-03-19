# 🎯 Hướng Dẫn Tích Hợp Services Pages

## 📋 Tổng Quan
Bạn vừa có 3 pages cho hệ thống dịch vụ:
1. **ServicesPage** - Trang đặt lịch khám (Shopping Cart-like)
2. **ServicesListPage** - Danh sách tất cả dịch vụ với bộ lọc
3. **ServiceDetailsPage** - Chi tiết dịch vụ (view appointment history hoặc treatment plans)

---

## 📁 Cấu Trúc Thư Mục

```
src/pages/
├── ServicesPage/                    # Đặt lịch khám (existing)
│   ├── index.js
│   ├── ServicesPage.module.scss
│   ├── ServicePackageCard.js
│   ├── DoctorCard.js
│   ├── BookingSummary.js
│   └── ...
├── ServicesListPage/                # Danh sách dịch vụ (NEW)
│   ├── index.js
│   └── ServicesListPage.module.scss
└── ServiceDetailsPage/              # Chi tiết dịch vụ (NEW)
    ├── index.js
    └── ServiceDetailsPage.module.scss
```

---

## 🔌 Tích Hợp Routes

### Cập nhật `src/routes/index.js`

```javascript
import ServicesPage from '~/pages/ServicesPage';
import ServicesListPage from '~/pages/ServicesListPage';
import ServiceDetailsPage from '~/pages/ServiceDetailsPage';

const publicRoutes = [
    // ... existing routes
    {
        path: '/services',
        component: ServicesPage,
        layout: DefaultLayout
    },
    {
        path: '/services-list',           // Danh sách tất cả dịch vụ
        component: ServicesListPage,
        layout: DefaultLayout
    },
    {
        path: '/services/:serviceId',     // Chi tiết 1 dịch vụ
        component: ServiceDetailsPage,
        layout: DefaultLayout
    },
];

export default publicRoutes;
```

---

## 🎨 Flow Dữ Liệu

### 1️⃣ Services List Page Flow
```
Services List Page
    ↓
User searches/filters
    ↓
Click on a service
    ↓ (Link to /services/:serviceId)
Service Details Page
```

### 2️⃣ Service Details Page Logic
```
Load Service Details
    ↓
IF isCourse == 0 (Single Service):
    └─ Fetch Appointments
       Display: Appointment history
    
IF isCourse == 1 (Package Service):
    └─ Fetch Treatment Plans
       ├─ User selects a plan
       └─ Fetch Treatment Sessions for that plan
          Display: Sessions with products used
```

### 3️⃣ Services Booking Page (Existing)
```
User selects: Service + Doctor + Date/Time
    ↓
Booking Summary shows all selections
    ↓
User clicks "Đặt lịch khám"
    ↓
Creates appointment & updates treatment session status
```

---

## 🔄 API Endpoints Used

### Services List Page
```
POST /api/Servicess/GetSortedPagedServicess
```

### Service Details Page
```
GET /api/Services/{serviceId}
GET /api/TreatmentPlans/ByService/{serviceId}        [if isCourse=1]
GET /api/TreatmentSessions/ByPlan/{planId}           [if isCourse=1]
GET /api/Appointments/ByService/{serviceId}          [if isCourse=0]
```

> ⚠️ **Note**: Adjust endpoints based on your actual API structure

---

## 🎯 Tính Năng Chi Tiết

### ServicesListPage
✅ Search services by name/description  
✅ Filter by type (All / Single / Package)  
✅ Sort by name or price  
✅ Responsive grid layout  
✅ Links to service details  
✅ Shows ratings and price  

### ServiceDetailsPage
✅ Complete service information  
✅ Tabs: Overview / Treatment Plans / Sessions / Appointments  
✅ For Single Services: Display appointment history  
✅ For Packages: Show all treatment plans + session details  
✅ Display products used in each session  
✅ Responsive design  

### ServicesPage (Existing - Enhanced)
✅ Filter services by type  
✅ Select service, doctor, date & time  
✅ Booking summary sidebar  
✅ Modern card-based UI  

---

## 📱 Responsive Breakpoints

- **Desktop (>1024px)**: Full grid layout
- **Tablet (768px - 1024px)**: Optimized grid
- **Mobile (<768px)**: Single column / 2 columns

---

## 🚀 Usage Examples

### Navigate to Services List
```javascript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/services-list');
```

### Navigate to Service Details
```javascript
navigate(`/services/${serviceId}`);
```

### Link Component
```jsx
<Link to={`/services/${serviceId}`}>View Details</Link>
```

---

## 🔧 Customization Guide

### Change API Endpoints
Edit endpoints in each component:
- `ServiceDetailsPage/index.js` - Line ~80+
- `ServicesListPage/index.js` - Line ~50+

### Modify Styling
- Update `*.module.scss` files
- Colors: Primary `#1ca07d`, Secondary `#169d72`
- Fonts: Headers use 700 weight, body uses 400/500/600

### Add More Filters
Edit `ServicesListPage/index.js`:
```javascript
// Add to filterAndSortServices()
if (myFilter) {
    results = results.filter(s => /* condition */);
}
```

---

## ✅ Testing Checklist

- [ ] Routes work correctly
- [ ] Services load from API
- [ ] Search & filter functionality works
- [ ] Links navigate to detail pages
- [ ] Single vs Package services display correctly
- [ ] Responsive design on mobile
- [ ] Doctor selection in booking works
- [ ] Date/time selection in booking works
- [ ] Booking submission works
- [ ] Success messages appear

---

## 🐛 Troubleshooting

### Issue: Routes not found
**Solution**: Add routes to `src/routes/index.js`

### Issue: API errors
**Solution**: Check endpoint URLs match your backend

### Issue: Styling issues
**Solution**: Check CSS modules are imported correctly

### Issue: Images not loading
**Solution**: Placeholder emojis used by default, add image URLs in API

---

## 📞 API Response Examples

### Service with isCourse = 0 (Single)
```json
{
    "serviceID": 2,
    "serviceName": "Massage mặt",
    "isCourse": 0,
    "priceService": 500000,
    "description": "Massage chuyên sâu..."
}
```

### Service with isCourse = 1 (Package)
```json
{
    "serviceID": 1,
    "serviceName": "Trị nám",
    "isCourse": 1,
    "priceService": 5000000,
    "description": "Gói trị nám toàn diện..."
}
```

### Treatment Plan
```json
{
    "treatmentPlanID": 1,
    "serviceID": 1,
    "planName": "Gói 5 buổi trị nám",
    "totalSessions": 5
}
```

---

## 🎓 Best Practices

1. **Always load data with error handling**
2. **Show loading states for better UX**
3. **Validate API responses**
4. **Use responsive grid layouts**
5. **Test on multiple screen sizes**
6. **Cache data when possible**
7. **Show meaningful error messages**

---

Happy coding! 🚀
