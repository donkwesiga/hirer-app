import axios from "axios";
import { randomUUID } from "crypto";

export default async function handler(req, res) {
  console.log("📥 Incoming request to /api/momo");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { amount, phoneNumber } = req.body;
  if (!amount || !phoneNumber) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const momoUser = process.env.MOMO_API_USER;
    const momoKey = process.env.MOMO_API_KEY;
    const momoSub = process.env.MOMO_SUBSCRIPTION_KEY;
    const momoBase =
      process.env.MOMO_BASE_URL || "https://sandbox.momodeveloper.mtn.com";

    console.log("🔑 MOMO_USER:", momoUser ? "Loaded ✅" : "Missing ❌");
    console.log("🔑 MOMO_KEY:", momoKey ? "Loaded ✅" : "Missing ❌");
    console.log("🔑 MOMO_SUB:", momoSub ? "Loaded ✅" : "Missing ❌");

    // ✅ Generate Access Token
    const tokenResponse = await axios.post(
      `${momoBase}/collection/token/`,
      {},
      {
        headers: {
          "Ocp-Apim-Subscription-Key": momoSub,
          Authorization:
            "Basic " + Buffer.from(`${momoUser}:${momoKey}`).toString("base64"),
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;
    const referenceId = randomUUID();

    console.log("💸 Reference ID:", referenceId);

    // ✅ Payment payload
    const payload = {
      amount: String(amount),
      currency: "EUR",
      externalId: referenceId,
      payer: { partyIdType: "MSISDN", partyId: phoneNumber },
      payerMessage: "Ride payment",
      payeeNote: "Hirer ride payment",
    };

    const response = await axios.post(
      `${momoBase}/collection/v1_0/requesttopay`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Reference-Id": referenceId,
          "X-Target-Environment": "sandbox",
          "Ocp-Apim-Subscription-Key": momoSub,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ MoMo response:", response.data);

    return res.status(200).json({
      success: true,
      message: "Payment initiated successfully",
      referenceId,
      data: response.data,
    });
  } catch (error) {
    console.error("💥 ERROR in MoMo handler:", error.response?.data || error.message);
    return res.status(500).json({
      error: "Payment failed",
      details: error.response?.data || error.message,
    });
  }
}
