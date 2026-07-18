import api from '../api/axios';

let scriptPromise = null;

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
  return scriptPromise;
}

// Creates a Razorpay order on the server, opens the checkout, and verifies the
// payment on success. `plan` is 'essential' | 'premium' | 'master'.
export async function startSubscriptionCheckout(plan, user, { onSuccess, onError } = {}) {
  const ok = await loadRazorpay();
  if (!ok) { onError?.('Could not load the payment gateway. Check your connection.'); return; }

  try {
    const { data } = await api.post('/subscriptions/order', { plan });
    const rzp = new window.Razorpay({
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      name: 'A1 Deal',
      description: `${data.planName} — monthly subscription`,
      order_id: data.orderId,
      prefill: { name: user?.name || '', email: user?.email || '', contact: user?.phone || '' },
      theme: { color: '#6628B0' },
      handler: async (resp) => {
        try {
          await api.post('/subscriptions/verify', {
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
          });
          onSuccess?.();
        } catch (err) {
          onError?.(err.response?.data?.message || 'Payment verification failed.');
        }
      },
      modal: { ondismiss: () => onError?.(null) }, // null = user closed, not an error
    });
    rzp.on('payment.failed', (r) => onError?.(r.error?.description || 'Payment failed.'));
    rzp.open();
  } catch (err) {
    onError?.(err.response?.data?.message || 'Could not start the payment.');
  }
}
