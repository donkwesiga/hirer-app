import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { amount, phoneNumber, externalId, payerMessage } = req.body;

  if (!amount || !phoneNumber) {
    return res.status(400).json({ error: "Missing amount or phone number" });
  }

  // ✅ Environment variables
  const momoUser = process.env.MOMO_API_USER;
  const momoKey = process.env.MOMO_API_KEY;
  const momoSub = process.env.MOMO_SUBSCRIPTION_KEY;
  const baseUrl =
    process.env.MOMO_BASE_URL || "https://sandbox.momodeveloper.mtn.com";

  if (!momoUser || !momoKey || !momoSub) {
    console.error("❌ Missing MoMo environment variables");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  try {
    console.log("🌍 Using base URL:", baseUrl);

    // ✅ Step 1: Generate Access Token
    const tokenResponse = await axios.post(
      `${baseUrl}/collection/token/`,
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
    console.log("✅ Access token generated");

    // ✅ Step 2: Make payment request
    const referenceId = externalId || Date.now().toString();

    const paymentBody = {
      amount,
      currency: "RWF",
      externalId: referenceId,
      payer: {
        partyIdType: "MSISDN",
        partyId: phoneNumber,
      },
      payerMessage: payerMessage || "Ride payment",
      payeeNote: "Hirer ride payment",
    };

    console.log("💳 Sending payment request:", paymentBody);

    const paymentResponse = await axios.post(
      `${baseUrl}/collection/v1_0/requesttopay`,
      paymentBody,
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

    console.log("✅ MoMo API response:", paymentResponse.status);

    return res.status(200).json({
      message: "Payment initiated",
      referenceId,
      data: paymentResponse.data,
    });
  } catch (error) {
    console.error("❌ MoMo API error:", error.response?.data || error.message);
    return res.status(500).json({
      error: "Payment failed",
      details: error.response?.data || error.message,
    });
  }
}
