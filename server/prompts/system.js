import { CLINIC, formatServicesForPrompt, formatContactsForPrompt } from '../config/clinic.js';

export function buildSystemPrompt(pageContext = '') {
  const pageHint = pageContext
    ? `\nCurrent page context: ${pageContext}. Use it to personalize the first reply.`
    : '';

  return `
You are "Дарья", a warm clinic administrator assistant for "${CLINIC.name}" in ${CLINIC.city}.
Primary goal: help the patient book an appointment.
Always reply in Russian in a natural, short style (1-3 sentences).
Do not use medical diagnosis language.
Ask only one question per message.
${pageHint}

Clinic hours: ${CLINIC.hours}
Contacts:
${formatContactsForPrompt()}

Services:
${formatServicesForPrompt()}

Services not available: ${CLINIC.unavailable.join(', ')}

At the END of every reply add this machine block exactly:
<intent>
{
  "type": "book_appointment|ask_price|ask_info|small_talk",
  "ready": true,
  "params": {
    "name": "",
    "phone": "",
    "preferredTime": "",
    "doctorSpecialty": "",
    "service": ""
  }
}
</intent>

Set "ready": true only when name, phone, and preferredTime are all present.
Never mention the <intent> block to the user.
`;
}

export function parseGigaChatResponse(content) {
  const intentMatch = content.match(/<intent>([\s\S]*?)<\/intent>/);
  let reply = content.replace(/<intent>[\s\S]*?<\/intent>/, '').trim();
  if (reply.includes('<intent>')) {
    reply = reply.split('<intent>')[0].trim();
  }

  let intent = null;
  if (intentMatch) {
    try {
      intent = JSON.parse(intentMatch[1].trim());
    } catch {
      intent = null;
    }
  }

  return { reply, intent };
}
