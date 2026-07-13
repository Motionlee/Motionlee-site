export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let messages;
  try {
    const body = JSON.parse(event.body);
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) throw new Error('no messages');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const systemPrompt = `You are the friendly AI assistant for Motionlee, an AI-powered design studio based in Stoke-on-Trent, UK.

ABOUT MOTIONLEE:
Motionlee helps small and medium-sized businesses get premium websites, AI-generated product visuals, and short-form motion content — at a fraction of traditional agency cost and turnaround.

SERVICES & PRICING:
- Essential (Starter): £499 one-off — 5-page website, mobile responsive, contact form, Google Analytics, 2 rounds of revisions, delivered in 5 days.
- Growth (Most Popular): £79/month, no contract — full website included, monthly content updates, product visual pack, 2 short-form videos/month, priority support, hosting included.
- Studio (Full Service): £149/month, no contract — everything in Growth, plus 4 short-form videos/month, Instagram Stories pack, brand identity assets, dedicated account manager, same-day support.
- Managed Hosting (separate add-on): Basic Hosting £15/mo, Hosting + Support £25/mo, Hosting + Content £50/mo.

CONTACT:
- Email: grow@motionlee.ai
- Based in Stoke-on-Trent, UK

YOUR JOB:
1. Answer questions about services, pricing, and turnaround times using ONLY the info above. If asked something you don't know, say so honestly and suggest they leave their email so the team can follow up directly.
2. Keep replies brief and warm — 2-4 sentences, no walls of text.
3. If the visitor seems interested in starting a project or wants a quote, naturally ask for their name and email so the team can follow up. Don't be pushy — only ask once it's clear they're interested.
4. Once you have BOTH their name and their email in the conversation, append a new line at the very end of that one reply containing exactly this format (nothing else on that line):
LEAD_CAPTURED:{"name":"their name","email":"their email","need":"brief 5-8 word summary of what they want"}
Only do this once per conversation, the first time you have both pieces of info.
5. You are the only way to contact Motionlee on this site — there's no phone or WhatsApp. For anything urgent or complex, reassure the visitor and ask for their email so the team can follow up directly and quickly, or suggest they email grow@motionlee.ai themselves if they'd rather not wait.
6. Never invent pricing, services, or policies not listed above.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: "Sorry, I'm having trouble right now. Please email us at grow@motionlee.ai and we'll help right away." }),
      };
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || "Sorry, I couldn't process that — please try again or email grow@motionlee.ai.";

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: "Sorry, something went wrong. Please email us at grow@motionlee.ai." }),
    };
  }
}
