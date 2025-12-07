import React from 'react';

const OrderCard = ({ order }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      processing: 'bg-purple-100 text-purple-800 border-purple-300',
      shipped: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      delivered: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-50 text-yellow-700',
      completed: 'bg-green-50 text-green-700',
      failed: 'bg-red-50 text-red-700'
    };
    return colors[status] || 'bg-gray-50 text-gray-700';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#f0fcf6] to-[#e8faf2] px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-900 text-lg">
            {order.orderId}
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.orderStatus)}`}>
            {order.orderStatus.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>{formatDate(order.orderDate)}</span>
          <span className="font-semibold text-[#0e540b]">
            {order.orderType === 'custom' ? '🛒 Custom Order' : '📦 Basket Order'}
          </span>
        </div>
      </div>

      {/* Order Items */}
      <div className="px-4 py-3 max-h-48 overflow-y-auto">
        <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
          Items ({order.selectedVegetables.length})
        </h4>
        <div className="space-y-2">
          {order.selectedVegetables.map((item) => (
            <div key={item._id.$oid} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  Vegetable ID: {item.vegetable.$oid.slice(-6)}
                </p>
                <p className="text-xs text-gray-500">
                  {item.weight} × {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  ₹{item.subtotal.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  @₹{item.pricePerUnit.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Vegetables Total</span>
            <span>₹{order.vegetablesTotal.toFixed(2)}</span>
          </div>
          
          {order.couponCode && (
            <div className="flex justify-between text-green-600">
              <span className="flex items-center gap-1">
                <span className="text-xs bg-green-100 px-2 py-0.5 rounded font-mono">
                  {order.couponCode}
                </span>
                Discount
              </span>
              <span>-₹{order.couponDiscount.toFixed(2)}</span>
            </div>
          )}
          
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Additional Discount</span>
              <span>-₹{order.discount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-gray-600">
            <span>Delivery Charges</span>
            <span>₹{order.deliveryCharges.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t border-gray-300">
            <span>Total Amount</span>
            <span className="text-[#0e540b]">₹{order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="px-4 py-3 bg-white border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">Payment Method</p>
            <p className="text-sm font-semibold text-gray-900">
              {order.paymentMethod === 'COD' ? '💵 Cash on Delivery' : '💳 Online Payment'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(order.paymentStatus)}`}>
              {order.paymentStatus.toUpperCase()}
            </span>
          </div>
        </div>
        
        {order.razorpayPaymentId && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">Payment ID</p>
            <p className="text-xs font-mono text-gray-700">{order.razorpayPaymentId}</p>
          </div>
        )}
      </div>

      {/* Customer Info (if populated) */}
      {order.customerInfo && typeof order.customerInfo === 'object' && order.customerInfo.name && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Customer</p>
          <p className="text-sm font-medium text-gray-900">{order.customerInfo.name}</p>
          {order.customerInfo.phone && (
            <p className="text-xs text-gray-600">{order.customerInfo.phone}</p>
          )}
        </div>
      )}

      {/* Footer Timestamps */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Created: {formatDate(order.createdAt)}</span>
          <span>Updated: {formatDate(order.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;