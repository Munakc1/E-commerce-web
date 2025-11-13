export type EsewaInitPayload = {
  amount: number;
  productName: string;
  transactionId: string;
  orderId?: number | string | null;
};

export async function initiateEsewaPayment(
  apiBase: string,
  payload: EsewaInitPayload,
  token?: string
): Promise<void> {
  const base = apiBase.replace(/\/$/, "");
  const res = await fetch(`${base}/api/payments/esewa/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to initiate eSewa: ${res.status} ${text}`);
  }

  const data = await res.json();
  const endpoint: string = data.endpoint;
  const esewaConfig: Record<string, string | number> = data.esewaConfig || {};
  if (!endpoint || !esewaConfig || typeof esewaConfig !== 'object') {
    throw new Error('Invalid response from server for eSewa initiation');
  }

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = endpoint;
  form.style.display = 'none';

  Object.entries(esewaConfig).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = String(value);
    form.appendChild(input);
  });

  document.body.appendChild(form);
  setTimeout(() => form.submit(), 0);
}
