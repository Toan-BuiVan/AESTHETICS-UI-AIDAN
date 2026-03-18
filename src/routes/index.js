// Pages
import HomePage from '~/pages/Home';
import ProductsPage from '~/pages/ProductsPage';
import Profile from '~/pages/Profile';
import PaymentResult from '~/pages/PaymentResult';
import CartProduct from '~/pages/CartProduct';
import ServicesPage from '~/pages/ServicesPage';
import Bookings from '~/pages/Bookings';

const publicRoutes = [
    { path: '/', component: HomePage },
    { path: '/productsPage', component: ProductsPage },
    { path: '/servicesPage', component: ServicesPage },
    { path: '/profile', component: Profile },
    { path: '/payment-result', component: PaymentResult },
    { path: '/cartProduct', component: CartProduct },
    { path: '/bookings', component: Bookings },
];

const privateRoutes = [];

export { publicRoutes, privateRoutes };
