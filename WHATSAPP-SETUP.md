# WhatsApp automatic replies - setup

You need: a Facebook/Meta Business account, a phone number for the chatbot, and the server hosted online with HTTPS (for example on Render). WhatsApp cannot reach `localhost`.

Note: a number already registered in the normal WhatsApp or WhatsApp Business app must be removed from it before it can be used with the Cloud API. Many institutes use a separate new number. Check Meta's current pricing and policies before launch.

1. Go to https://developers.facebook.com, create an app (type: Business), and add the **WhatsApp** product.
2. In WhatsApp > API Setup, note the **Phone number ID**. Add your real number and verify it. Until then you can test with Meta's free test number.
3. Create a **permanent access token**: Business Settings > System users > add a system user > generate token with `whatsapp_business_messaging` and `whatsapp_business_management`.
4. App settings > Basic: copy the **App secret**.
5. Put these in the server's `.env` (or the host's environment settings):
   `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` (any secret word you choose), and `WHATSAPP_NUMBER` (digits only, e.g. 919865577224).
6. Start/redeploy the server. In WhatsApp > Configuration > Webhook:
   - Callback URL: `https://YOUR-SERVER/webhook/whatsapp`
   - Verify token: the same word as `WHATSAPP_VERIFY_TOKEN`
   - Click Verify, then subscribe to the **messages** field.
7. Send "Hi" to the WhatsApp number. A menu list should appear.

How it behaves: "Hi" or "Menu" opens the tap-to-choose list. Typed questions are answered by the AI. Enquiries are asked for in two short messages and saved with the sender's number.
