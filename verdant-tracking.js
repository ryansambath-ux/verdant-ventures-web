
// Verdant Ventures — customer order tracking
// New orders are saved as PENDING.
// Payment is never automatically approved.

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Your Verdant Ventures Firebase project
const firebaseConfig = {
  apiKey: "AIzaSyBLt_hpMacVEdkvBLSn4bGq4OMscTSey4A",
  authDomain: "verdant-ventures-62ab6.firebaseapp.com",
  projectId: "verdant-ventures-62ab6",
  storageBucket: "verdant-ventures-62ab6.firebasestorage.app",
  messagingSenderId: "305122502323",
  appId: "1:305122502323:web:fd46608c5b6152d05b72c6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Must match the prices in your published Firestore rules.
const VOUCHER_PRICES = {
  5: 28,
  10: 55,
  15: 75,
  20: 96
};

/**
 * Submit a customer's voucher order.
 *
 * Required fields:
 *   voucher_usd
 *   customer_name
 *   customer_phone
 *   customer_email
 *   transfer_reference
 *   amount_paid_pgk
 *
 * Optional:
 *   transfer_description
 */
export async function submitVoucherOrder(order) {
  const voucherUsd = Number(order.voucher_usd);
  const amountPaid = Number(order.amount_paid_pgk);

  const customerName =
    String(order.customer_name ?? "").trim();

  const customerPhone =
    String(order.customer_phone ?? "").trim();

  const customerEmail =
    String(order.customer_email ?? "").trim();

  const transferReference =
    String(order.transfer_reference ?? "").trim();

  const transferDescription =
    String(order.transfer_description ?? "").trim();

  if (!Object.hasOwn(VOUCHER_PRICES, voucherUsd)) {
    throw new Error("Please select a valid voucher.");
  }

 if (!customerName || (!customerPhone && !customerEmail)) {
  throw new Error(
    "Please enter your name and either a phone number or email."
  );
}

  if (!/^[0-9]{16}$/.test(transferReference)) {
    throw new Error(
      "Please enter the 16-digit BSP reference number."
    );
  }

  if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
    throw new Error(
      "Please enter a valid amount paid in PGK."
    );
  }

  // These field names match your published Firestore rules.
  const newOrder = {
    voucher_usd: voucherUsd,
    voucher_price_pgk: VOUCHER_PRICES[voucherUsd],

    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: customerEmail,

    transfer_reference: transferReference,
    transfer_description: transferDescription,
    amount_paid_pgk: amountPaid,

    status: "pending",
    fulfilment_status: "not_delivered",

    createdAt: serverTimestamp()
  };

  // Firebase generates a unique document ID for this order.
  const savedOrder = await addDoc(
    collection(db, "payments"),
    newOrder
  );

  return {
    orderId: savedOrder.id,
    status: "pending"
  };
}
