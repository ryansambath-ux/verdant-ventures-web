# Customer profile release steps

Customer profiles are staged on `feature/customer-profiles`. The Android APK displays the live website, so the same account page will work in the installed app after launch; no new APK is required.

The owner supplied the complete current Firestore rules on 2026-09-26. `firestore.customer-profile-candidate.rules` extends those exact rules with customer ownership. Before merging, publish the tested candidate to Firebase project `verdant-ventures-62ab6` and confirm the publish succeeded. It adds:

1. Add `customer_profiles/{uid}` with create/read/update restricted to the signed-in account's UID; validate name, email, phone, and immutable creation time.
2. Extend `payments` create to accept `customer_uid` only when it equals the signed-in UID and the order email matches the verified auth identity; preserve anonymous guest orders.
3. Permit the signed-in owner to read only their orders using `customer_uid`; leave all payment updates and inventory access admin-only.
4. Keep card numbers, voucher codes, and CVVs out of the customer profile and payments documents. Card display and messaging are outside this phase.

Confirm Firebase Authentication **Email/Password** is enabled in the project's Sign-in method settings (the current admin sign-in already uses it). Confirm `ryansambath-ux.github.io` is an authorized domain. Then test registration, profile editing, guest orders, signed-in orders, owner-only order history, admin approvals, and a different account's denied access. Historical guest orders must not be linked by email or phone alone.

The emulator tests pass against the candidate rules. They do not publish rules to Firebase. Do not launch the account page until the owner publishes the tested rules and registration is checked. The current rules, like this candidate, validate the BSP reference format but do not themselves enforce reference uniqueness; that is a separate feature.
