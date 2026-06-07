The LemonSqueezy customer portal always requires the customer to authenticate first before they can manage their subscription. This is by design for security.

For real users the flow is:

1. Click "Manage billing →"
2. LS asks them to enter their email
3. LS sends a magic link to that email
4. They click the link and land on their billing portal to cancel, update payment, view invoices etc.

It's a bit friction-heavy but it's standard for LS — they don't support embedding the portal directly. Nothing to fix on your end.

`lemon_squeezy_order_id` is not used anywhere in the app code. It's just stored for reference/audit purposes.

The fields that actually matter are all set correctly for your test account:

- `plan` = `plus` ✓
- `billing_interval` = `year` ✓
- `lemon_squeezy_subscription_id` = `2237378` ✓ (needed for the portal URL)
- `status` = `active` ✓

The `NULL` order ID won't affect any functionality.
