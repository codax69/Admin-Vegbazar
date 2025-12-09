import React from 'react';

const OrderCard = ({ order }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
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
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-200 overflow-hidden w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#f0fcf6] to-[#e8faf2] px-2 sm:px-3 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between mb-1.5 gap-2">
          <h3 className="font-bold text-gray-900 text-xs sm:text-sm truncate">
            {order.orderId}
          </h3>
          <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold border whitespace-nowrap ${getStatusColor(order.orderStatus)}`}>
            {order.orderStatus.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-gray-600 gap-2">
          <div className="min-w-0">
            <span className="block font-medium truncate">{formatDate(order.orderDate)}</span>
            <span className="block text-gray-500">{formatTime(order.orderDate)}</span>
          </div>
          <span className="font-semibold text-[#0e540b] text-[10px] sm:text-xs whitespace-nowrap">
            {order.orderType === 'basket' ? 'Basket' : 'Custom '}
          </span>
        </div>
      </div>

      {/* Order Items */}
      <div className="px-2 sm:px-3 py-2 max-h-32 sm:max-h-40 overflow-y-auto">
        <h4 className="text-[9px] sm:text-[10px] font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
          Items ({order.selectedVegetables.length})
        </h4>
        <div className="space-y-1.5">
          {order.selectedVegetables.map((item) => (
            <div key={item._id.$oid} className="flex items-center justify-between py-1 sm:py-1.5 border-b border-gray-100 last:border-0 gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-medium text-gray-800 truncate">
                  Veg-{item.vegetable.$oid.slice(-6)}
                </p>
                <p className="text-[9px] sm:text-[10px] text-gray-500">
                  {item.weight} × {item.quantity}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] sm:text-xs font-semibold text-gray-900">
                  ₹{item.subtotal.toFixed(2)}
                </p>
                <p className="text-[9px] sm:text-[10px] text-gray-500">
                  @₹{item.pricePerUnit.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="px-2 sm:px-3 py-2 bg-gray-50 border-t border-gray-200">
        <div className="space-y-1 text-[10px] sm:text-xs">
          <div className="flex justify-between text-gray-600 gap-2">
            <span className="truncate">Vegetables Total</span>
            <span className="flex-shrink-0">₹{order.vegetablesTotal.toFixed(2)}</span>
          </div>
          
          {order.couponCode && order.couponDiscount > 0 && (
            <div className="flex justify-between text-green-600 gap-2">
              <span className="flex items-center gap-1 min-w-0">
                <span className="text-[9px] sm:text-[10px] bg-green-100 px-1 sm:px-1.5 py-0.5 rounded font-mono truncate">
                  {order.couponCode}
                </span>
                <span className="text-[9px] sm:text-[10px] whitespace-nowrap">Disc.</span>
              </span>
              <span className="flex-shrink-0">-₹{order.couponDiscount.toFixed(2)}</span>
            </div>
          )}
          
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600 text-[9px] sm:text-[10px] gap-2">
              <span className="truncate">Additional Discount</span>
              <span className="flex-shrink-0">-₹{order.discount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-gray-600 text-[9px] sm:text-[10px] gap-2">
            <span className="truncate">Delivery Charges</span>
            <span className="flex-shrink-0">₹{order.deliveryCharges.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between font-bold text-xs sm:text-sm text-gray-900 pt-1.5 border-t border-gray-300 gap-2">
            <span>Total</span>
            <span className="text-[#0e540b] flex-shrink-0">₹{order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="px-2 sm:px-3 py-2 bg-white border-t border-gray-200">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] text-gray-500 mb-0.5">Payment</p>
            <p className="text-[10px] sm:text-xs font-semibold text-gray-900 truncate">
              {order.paymentMethod === 'COD' ? '💵 COD' : '💳 Online'}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[9px] sm:text-[10px] text-gray-500 mb-0.5">Status</p>
            <span className={`inline-block px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold whitespace-nowrap ${getPaymentStatusColor(order.paymentStatus)}`}>
              {order.paymentStatus.toUpperCase()}
            </span>
          </div>
        </div>
        
        {order.razorpayPaymentId && (
          <div className="mt-1.5 pt-1.5 border-t border-gray-100">
            <p className="text-[9px] sm:text-[10px] text-gray-500">Payment ID</p>
            <p className="text-[9px] sm:text-[10px] font-mono text-gray-700 truncate">{order.razorpayPaymentId}</p>
          </div>
        )}
      </div>

      {/* Customer Info (if populated) */}
      {order.customerInfo && typeof order.customerInfo === 'object' && order.customerInfo.name && (
        <div className="px-2 sm:px-3 py-2 bg-gray-50 border-t border-gray-200">
          <p className="text-[9px] sm:text-[10px] text-gray-500 mb-0.5">Customer</p>
          <p className="text-[10px] sm:text-xs font-medium text-gray-900 truncate">{order.customerInfo.name}</p>
          {order.customerInfo.phone && (
            <p className="text-[9px] sm:text-[10px] text-gray-600 truncate">{order.customerInfo.phone}</p>
          )}
        </div>
      )}

      {/* Footer Timestamps */}
      <div className="px-2 sm:px-3 py-1.5 bg-gray-50 border-t border-gray-100 text-[9px] sm:text-[10px] text-gray-500">
        <div className="flex justify-between gap-2">
          <div className="min-w-0">
            <span className="block font-medium truncate">Created: {formatDate(order.createdAt)}</span>
            <span className="block text-[8px] sm:text-[9px]">{formatTime(order.createdAt)}</span>
          </div>
          <div className="text-right min-w-0">
            <span className="block font-medium truncate">Updated: {formatDate(order.updatedAt)}</span>
            <span className="block text-[8px] sm:text-[9px]">{formatTime(order.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;