# Customer profile release steps

Customer profiles are staged on `feature/customer-profiles`. The Android APK displays the live website, so the same account page will work in the installed app after launch; no new APK is required.

Before merging, inspect the **current published** Firebase Firestore rules for project `verdant-ventures-62ab6`. The saved rules snapshot used to prepare `firestore.customer-profile-candidate.rules` may predate duplicate BSP-reference checks. Preserve all newer duplicate-reference and inventory protections. Merge the following changes into the live rules rather than replacing them blindly:

1. Add `customer_profiles/{uid}` with create/read/update restricted to the signed-in account's UID; validate name, email, phone, and immutable creation time.
2. Extend `payments` create to accept `customer_uid` only when it equals the signed-in UID and the order email matches the verified auth identity; preserve anonymous guest orders.
3. Permit the signed-in owner to read only their orders using `customer_uid`; leave all payment updates and inventory access admin-only.
4. Keep card numbers, voucher codes, and CVVs out of the customer profile and payments documents. Card display and messaging are outside this phase.

Enable Firebase Authentication **Email/Password** in the project's Sign-in method settings, if it is not already enabled. Confirm `ryansambath-ux.github.io` is an authorized domain. Then test registration, profile editing, guest orders, signed-in orders, owner-only order history, admin approvals, and a different account's denied access. Historical guest orders must not be linked by email or phone alone.

The candidate rules and the local emulator tests document the intended access checks, but they are **not** proof that the deployed rules currently match them. Do not launch the account page until the live rules have been reviewed and the provider enabled.
