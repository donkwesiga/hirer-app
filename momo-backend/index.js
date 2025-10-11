import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

// MTN MoMo Config (keep these secret in Vercel dashboard, not in code)
const { MOMO_API_USER, MOMO_API_KEY, MOMO_SUB_KEY } = process.env;
const MOMO_BASE_URL = "https://sandbox.momodeveloper.mtn.com";

// Generate access token
app.post("/get-token", async (req, res) => {
  try {
    const response = await axios.post(
      `${MOMO_BASE_URL}/collection/token/`,
      {},
      {
        headers: {
          "Ocp-Apim-Subscription-Key": MOMO_SUB_KEY,
          Authorization:
            "Basic " +
            Buffer.from(`${MOMO_API_USER}:${MOMO_API_KEY}`).toString("base64"),
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Example: request a payment
app.post("/request-payment", async (req, res) => {
  const { amount, phone, rideId } = req.body;

  try {
    const tokenResponse = await axios.post(
      `${MOMO_BASE_URL}/collection/token/`,
      {},
      {
        headers: {
          "Ocp-Apim-Subscription-Key": MOMO_SUB_KEY,
          Authorization:
            "Basic " +
            Buffer.from(`${MOMO_API_USER}:${MOMO_API_KEY}`).toString("base64"),
        },
      }
    );

    const token = tokenResponse.data.access_token;

    const paymentResponse = await axios.post(
      `${MOMO_BASE_URL}/collection/v1_0/requesttopay`,
      {
        amount,
        currency: "EUR",
        externalId: rideId,
        payer: {
          partyIdType: "MSISDN",
          partyId: phone,
        },
        payerMessage: "Ride Payment",
        payeeNote: "Hirer App",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Reference-Id": crypto.randomUUID(),
          "X-Target-Environment": "sandbox",
          "Ocp-Apim-Subscription-Key": MOMO_SUB_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ success: true, data: paymentResponse.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server locally (only for testing)
app.listen(4000, () => {
  console.log("MoMo backend running on http://localhost:4000");
});
