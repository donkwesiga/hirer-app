// ✅ Firebase Functions + MTN MoMo Sandbox Integration
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

// ✅ Load MoMo credentials from Firebase Config
const momoConfig = functions.config().momo;
const MOMO_API_USER = momoConfig.api_user;
const MOMO_API_KEY = momoConfig.api_key;
const MOMO_SUB_KEY = momoConfig.sub_key;
const MOMO_BASE_URL = "https://sandbox.momodeveloper.mtn.com";

// === Function: Create MoMo Payment Request ===
exports.requestPayment = functions.https.onCall(async (data, context) => {
  try {
    const { amount, phoneNumber, rideId } = data;

    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be logged in");
    }

    if (!amount || !phoneNumber) {
      throw new functions.https.HttpsError("invalid-argument", "Missing required fields");
    }

    const transactionId = `txn-${Date.now()}`;

    // === Step 1: Get Access Token ===
    const tokenResponse = await axios.post(
      `${MOMO_BASE_URL}/collection/token/`,
      {},
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${MOMO_API_USER}:${MOMO_API_KEY}`).toString("base64")}`,
          "Ocp-Apim-Subscription-Key": MOMO_SUB_KEY,
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log("✅ MoMo Access Token retrieved");

    // === Step 2: Initiate Payment ===
    const requestResponse = await axios.post(
      `${MOMO_BASE_URL}/collection/v1_0/requesttopay`,
      {
        amount: amount.toString(),
        currency: "EUR",
        externalId: transactionId,
        payer: { partyIdType: "MSISDN", partyId: phoneNumber },
        payerMessage: "Ride payment",
        payeeNote: "Hirer App Ride",
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Reference-Id": transactionId,
          "X-Target-Environment": "sandbox",
          "Ocp-Apim-Subscription-Key": MOMO_SUB_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    // === Step 3: Save to Firestore ===
    await db.collection("payments").doc(transactionId).set({
      rideId,
      userId: context.auth.uid,
      phoneNumber,
      amount,
      status: "PENDING",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ MoMo payment initiated for ${phoneNumber}`);

    return {
      success: true,
      transactionId,
      momoResponse: requestResponse.data || {},
    };
  } catch (err) {
    console.error("❌ MoMo payment error:", err.response?.data || err.message);
    throw new functions.https.HttpsError("internal", "Payment request failed", {
      details: err.response?.data || err.message,
    });
  }
});
