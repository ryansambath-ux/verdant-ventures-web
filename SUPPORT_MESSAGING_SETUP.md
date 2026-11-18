# Verdant customer support messaging

## What was added
- Admin inbox inside `/admin.html`, with live conversations, reply composer, search, and "awaiting reply" status.
- Secure signed-in customer chat inside `/account.html`.
- Website "Message Verdant" link. Support contact: `info@verdantventures.online`.
- Messages use Firestore collection `support_messages`. Customers must sign in; messages are append-only; a customer can only read their own messages.
- No email is automatically sent. This is in-app messaging, independent of Porkbun email forwarding.

## Required Firebase setup (not handled by GitHub Pages)
1. In the Firebase console, open the existing `verdant-ventures-62ab6` project.
2. Open Firestore Database → Rules.
3. Review the **currently deployed** rules. Keep the existing payment, voucher inventory, and profile protections unchanged.
4. Inside the `match /databases/{database}/documents` block, add the content of `firestore.support-messaging.snippet.rules` **before** the catch-all deny rule.
5. The snippet expects the existing `admin()` function to identify the single authorised administrator (same UID as the admin dashboard).
6. Publish the merged rules. GitHub Pages does **not** deploy Firestore security rules.
7. Test with two different accounts: customer A must not see customer B messages; admin can read and reply to each; anonymous users cannot read or send.

## Notes
- Existing website enquiry form still uses Web3Forms; this new chat is for signed-in account holders.
- The customer must sign in at `account.html` to send a support message.
- App functions remain visible even if Firestore rule deployment is pending; they show an access error until rules are enabled.
- Never ask customers to share card PINs, passwords, voucher redemption secrets, or one-time codes.
- The admin feed loads the latest 500 messages (MVP); scale with paginated queries and moderation when traffic grows.
- No SMS, push or email notifications are configured at this stage.
