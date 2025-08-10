import { get, deletes, post, patch, put } from './base'


// 1. 获取定价信息
export const getPricingApi = () => {
    return get('/api/payment/pricing', {});
}

// 2. 创建支付订单
// params: { membershipType: 'plus' | 'pro', subscriptionType: 'monthly' | 'yearly' }
export const createPaymentApi = (params) => {
    return post('/api/payment/create-payment', params);
}

// 3. 获取支付状态
export const getPaymentStatusApi = (paymentId) => {
    return get(`/api/payment/payment/${paymentId}`, {});
}

// 4. 获取用户支付历史
export const getPaymentsApi = () => {
    return get('/api/payment/payments', {});
}

// 5. 获取用户会员状态
export const getMembershipStatusApi = () => {
    return get('/api/payment/membership-status', {});
}


export const calculateAwePriceApi = (data) => {
    return get(`/api/payment/calculate-awe-price`,data);
}

export const confirmAwePaymentApi = (params) => {
    return post('/api/payment/confirm-awe-payment',params);
}


export const getAwePaymentStatusApi = (paymentId) => {
    return get(`/api/payment/awe-payment/${paymentId}`,{});
}

export const getAwePaymentsApi = () => {
    return get('/api/payment/awe-payments',{});
}

