# Plans

## Chat and Booking
- Replace phrase-based routing with a real `conversationState` layer across the core scenarios: tooth pain, missing tooth, implant, orthopedics, cancellation, and pricing.
- Let GigaChat drive the conversational layer, but keep backend decisions deterministic for `show_availability`, `show_booking_form`, `confirm_booking`, and `cancel_booking`.
- Add a structured action payload from the model so the frontend can react to intent without brittle text parsing.
- Expand symptom triage into a calmer consultation flow that helps patients choose a specialist before offering booking.
- Improve copy tone across all deterministic replies so the assistant sounds like one consistent clinic administrator.
- Add a cleaner booking confirmation UI and a dedicated cancellation UI path.

## Reliability
- Add end-to-end session state persistence so local flows survive refreshes and development restarts more gracefully.
- Keep GigaChat resilient with retries, timeouts, circuit breaker logic, and better fallback behavior for temporary outages.
- Add logging around action selection and fallback routing to make chat regressions easier to diagnose.
- Cover the main chat branches with integration tests, especially slot selection, contact capture, symptom triage, and cancellation.

## Product and Content
- Create `/privacy` for the contact form and booking flow.
- Add per-page SEO meta tags and improve page-specific content for `/doctors`, `/reviews`, and `/about`.
- Add real before/after cases instead of placeholder text cards.
- Enhance the contact page with Yandex Maps and branch switching.
- Continue tightening trust-building content so the chat and the website feel like one coherent patient journey.
