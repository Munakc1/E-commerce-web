const crypto = require('crypto');

function getEsewaEndpoint(env) {
  const e = String(env || 'sandbox').toLowerCase();
  return e === 'live'
    ? 'https://epay.esewa.com.np/api/epay/main/v2/form'
    : 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
}

function signEsewa(secretKey, message) {
  return crypto.createHmac('sha256', String(secretKey))
    .update(message)
    .digest('base64');
}

function buildEsewaConfig({ amount, productCode, successUrl, failureUrl, transactionUuid }) {
  const amt = String(amount);
  return {
    amount: amt,
    tax_amount: '0',
    total_amount: amt,
    transaction_uuid: transactionUuid,
    product_code: productCode,
    product_service_charge: '0',
    product_delivery_charge: '0',
    success_url: successUrl,
    failure_url: failureUrl,
    signed_field_names: 'total_amount,transaction_uuid,product_code',
  };
}

module.exports = { getEsewaEndpoint, signEsewa, buildEsewaConfig };
