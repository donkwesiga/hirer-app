import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { amount, phoneNumber, externalId, payerMessage } = req.body;

  if (!amount || !phoneNumber) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const momoUser = process.env.MOMO_API_USER;
    const momoKey = process.env.MOMO_API_KEY;
    const momoSub = process.env.MOMO_SUBSCRIPTION_KEY;
    const momoBaseUrl =
      process.env.MOMO_BASE_URL || "https://sandbox.momodeveloper.mtn.com/collection";

    // 🔑 Generate access token
    const tokenResponse = await axios.post(
      `${momoBaseUrl}/token/`,
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

    // 💸 Make payment request
    const referenceId = externalId || Date.now().toString();

    const paymentResponse = await axios.post(
      `${momoBaseUrl}/v1_0/requesttopay`,
      {
        amount,
        currency: "RWF",
        externalId: referenceId,
        payer: {
          partyIdType: "MSISDN",
          partyId: phoneNumber,
        },
        payerMessage: payerMessage || "Ride payment",
        payeeNote: "Hirer ride payment",
      },
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

    return res.status(200).json({
      message: "Payment initiated",
      data: paymentResponse.data,
    });
  } catch (error) {
    console.error("MoMo Payment Error:", error.response?.data || error.message);
    return res.status(500).json({
      error: "Payment failed",
      details: error.response?.data || error.message,
    });
  }
}
