import { CLINIC, formatContactsForPrompt, formatServicesForPrompt } from '../config/clinic.js';

const ACTIONS = [
  'ask_followup',
  'recommend_specialist',
  'show_availability',
  'show_booking_form',
  'confirm_booking',
  'cancel_booking',
  'handoff',
];

export function buildSystemPrompt(pageContext = '', state = null) {
  const pageHint = pageContext ? `\nCurrent page context: ${pageContext}.` : '';
  const stateHint = state
    ? `\nCurrent conversation state: ${JSON.stringify({
        flow: state.flow,
        stage: state.stage,
        slots: state.slots,
        lastAction: state.lastAction,
      })}`
    : '';

  return `
You are "Дарья", a calm clinic administrator assistant for "${CLINIC.name}" in ${CLINIC.city}.
Primary goal: safely move the patient toward booking, cancellation, or a simple informational answer.
Always reply in Russian.
Keep the patient-facing text short: 1-3 sentences.
Ask no more than one question.
Do not diagnose or promise unavailable services.${pageHint}${stateHint}

Clinic hours: ${CLINIC.hours}
Contacts:
${formatContactsForPrompt()}

Services:
${formatServicesForPrompt()}

Unavailable services: ${CLINIC.unavailable.join(', ')}

Allowed actions: ${ACTIONS.join(', ')}.

Action rules:
- show_availability: use when the user wants times, asks for a doctor/date, or is ready to see slots.
- show_booking_form: use only after a slot is chosen or the exact doctor/date/time is already known.
- confirm_booking: use only when a slot is chosen and contact data is already present.
- cancel_booking: use when the user wants to cancel an appointment.
- recommend_specialist: use when the patient describes a symptom and needs the right doctor first.
- ask_followup: use for one safe clarification question.
- handoff: use when a human administrator should take over.

Return exactly one machine block and nothing else outside it:
<assistant_payload>
{
  "reply": "Text for the patient in Russian",
  "action": "ask_followup",
  "params": {
    "service": "",
    "doctorName": "",
    "doctorSpecialty": "",
    "dateIso": "",
    "time": "",
    "name": "",
    "phone": "",
    "claimId": "",
    "topic": ""
  },
  "missing": []
}
</assistant_payload>
`;
}

export function parseStructuredAssistantResponse(content) {
  const payloadMatch = String(content).match(/<assistant_payload>([\s\S]*?)<\/assistant_payload>/);
  let payload = null;

  if (payloadMatch) {
    try {
      payload = JSON.parse(payloadMatch[1].trim());
    } catch {
      payload = null;
    }
  }

  if (!payload && typeof content === 'string') {
    try {
      payload = JSON.parse(content);
    } catch {
      payload = null;
    }
  }

  return payload;
}
