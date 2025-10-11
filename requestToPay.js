import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { amount, phoneNumber, externalId } = req.body;

  try {
    // Environment variables from Vercel
    const baseURL = process.env.MOMO_BASE_URL;
    const subscriptionKey = process.env.MOMO_SUB_KEY;
    const apiUser = process.env.MOMO_API_USER;
    const apiKey = process.env.MOMO_API_KEY;

    // Step 1: Get access token
    const auth = Buffer.from(`${apiUser}:${apiKey}`).toString("base64");
    const tokenResponse = await axios.post(
      `${baseURL}/collection/token/`,
      {},
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Ocp-Apim-Subscription-Key": subscriptionKey,
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Step 2: Request to pay
    const uuid = crypto.randomUUID();
    const requestResponse = await axios.post(
      `${baseURL}/collection/v1_0/requesttopay`,
      {
        amount: amount,
        currency: "EUR",
        externalId: externalId || "HirerAppRide",
        payer: {
          partyIdType: "MSISDN",
          partyId: phoneNumber,
        },
        payerMessage: "Ride Payment",
        payeeNote: "Hirer App",
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Reference-Id": uuid,
          "Ocp-Apim-Subscription-Key": subscriptionKey,
          "X-Target-Environment": "sandbox",
          "Content-Type": "application/json",
        },
      }
    );

    return res.status(200).json({
      success: true,
      transactionId: uuid,
      momoResponse: requestResponse.data,
    });
  } catch (error) {
    console.error("MoMo API Error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "MoMo payment failed",
      details: error.response?.data || error.message,
    });
  }
}
