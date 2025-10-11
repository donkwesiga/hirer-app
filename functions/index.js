// Firebase Functions + MoMo API integration

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
require("dotenv").config();

admin.initializeApp();
const db = admin.firestore();

// 🔐 Load MoMo credentials from .env
const MOMO_API_USER = process.env.MOMO_API_USER;
const MOMO_API_KEY = process.env.MOMO_API_KEY;
const MOMO_SUB_KEY = process.env.MOMO_SUB_KEY;
const MOMO_BASE_URL = process.env.MOMO_BASE_URL || "https://sandbox.momodeveloper.mtn.com";

// === Function: Create MoMo Payment Request ===
exports.requestPayment = functions.https.onCall(async (data, context) => {
  try {
    const { amount, currency, phoneNumber, rideId } = data;

    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be logged in");
    }

    // Unique transaction ID
    const transactionId = `txn-${Date.now()}`;

    // MoMo request
    const momoResponse = await axios.post(
      `${MOMO_BASE_URL}/collection/v1_0/requesttopay`,
      {
        amount: amount.toString(),
        currency,
        externalId: transactionId,
        payer: {
          partyIdType: "MSISDN",
          partyId: phoneNumber
        },
        payerMessage: "Ride payment",
        payeeNote: "Hirer App Ride"
      },
      {
        headers: {
          "X-Reference-Id": transactionId,
          "X-Target-Environment": "sandbox",
          "Ocp-Apim-Subscription-Key": MOMO_SUB_KEY,
          "Authorization": `Basic ${Buffer.from(`${MOMO_API_USER}:${MOMO_API_KEY}`).toString("base64")}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Save transaction in Firestore
    await db.collection("payments").doc(transactionId).set({
      rideId,
      userId: context.auth.uid,
      amount,
      currency,
      phoneNumber,
      status: "PENDING",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, transactionId, momoResponse: momoResponse.data };
  } catch (err) {
    console.error("MoMo payment error:", err.response?.data || err.message);
    throw new functions.https.HttpsError("internal", "Payment request failed");
  }
});
