# Audio and image free allowances — public documentation review

Reviewed 2026-11-03. Only provider-owned sources were used. This is a public-page review, not an account signup, payment verification, successful API request, output download, or license opinion. Region, abuse checks, account eligibility, model availability, and quotas can change. “Not stated” must not be rendered as “no card required” or “commercial use allowed.” Web credits must not be presented as API credits.

## Twelve publication candidates

| Provider / category | Allowance and renewal | Surface / payment evidence | Restrictions and recommended wording |
| --- | --- | --- | --- |
| ElevenLabs / speech, transcription, SFX | 10,000 credits monthly on Free; TTS character output depends on model. | Creative web and API pricing both show Free. Billing docs say new signups automatically enter Free; no payment test performed. | Free output is non-commercial with attribution. Commercial license starts on paid plans. Free Voice Library access is unavailable via API. Do not convert all credits into a guaranteed number of minutes. |
| Deepgram / transcription, speech, voice agents | $200 signup credit, then usage billing; pricing says credit does not expire. One-time trial, not $200 monthly. | API; pricing explicitly says no card required. | Different products consume credit differently. Commercial-output or watermark guarantees are not established by the reviewed pricing page. |
| AssemblyAI / transcription | Official support explicitly identifies a limited $50 trial. Pricing separately advertises up to 185 prerecorded hours and 333 streaming hours. | Async and streaming API; pricing explicitly says no card required to start; adding card upgrades trial. | Use "$50 one-time trial; model-dependent duration" as conservative headline; do not promise both hour quantities as separate balances. LLM Gateway excluded. Stops when credits are exhausted. |
| Speechmatics / transcription, speech synthesis | $100 signup credits, valid 12 months. TTS pricing additionally advertises first 1 million characters free. | API / Portal; pricing explicitly says no card required. | Free API pauses when credits run out. Do not label signup credits monthly. Do not assume the TTS promotion recurs or combine it into a single monetary balance. Commercial/watermark terms not established here. |
| Cartesia / TTS and STT | 20,000 shared model credits monthly; also $1 monthly prepaid voice-agent dollars. | API and playground. Card requirement not established by reviewed page. | Pro explicitly adds commercial-use license, so Free should be tagged non-commercial / paid license required. Model credits and agent dollars are different pools; approximate voice-agent minutes exclude telephony. |
| Fish Audio / TTS | 8,000 credits monthly; 500 characters per web generation. | Web allowance; official page says no card required. Separate API exists, but this allowance must not be promised for API. | Free audio is personal and non-commercial; commercial work needs eligible paid plan and voice/content rights. |
| Suno / music | 50 generation credits replenished daily, enough for up to 10 songs under current help. | Web/app allowance; not an official free API offer. Card requirement not established. | Non-commercial. **New accounts since 2026-09-03 only occasionally get trial downloads; free export is not guaranteed.** Good for in-app experiments, not guaranteed downloadable assets. |
| Leonardo.Ai / image and selected multimedia | 150 fast tokens daily; Free creations public; current pricing restricts model access to Auto Only. | Consumer web plan; separate API pricing must not inherit daily tokens. Card requirement not established. | Official audio FAQ permits commercial use across plans, with Leonardo owning free outputs and granting commercial-use license. Public generations lack privacy/exclusivity. Avoid promising every advertised model is free. |
| Recraft / image and vector | Current image-generator landing page says 30 credits renewed every 24 hours. | Studio web; API is separate. Card requirement not established. | Free outputs public, owned by Recraft, and **not licensed commercially**. Another official landing page still says 50 daily: mark numeric quota with an official-page-conflict note or verify account before stronger claims. |
| Krea / image and creative tools | 100 compute units daily. Models consume different units; no fixed image/video count. | Consumer web; explicitly no card required. API balance billed separately from consumer subscription. | Pricing FAQ names commercial license only for Basic, Pro, Max, Business, Enterprise. Do not claim commercial rights on Free. Text extraction lists unavailable features without visual strike-through; only promise limited free model access, not all models. |
| Clipdrop / image editing | Background removal, x2 upscaling, Cleanup and Relight each listed at 20/24h; text remover 50/24h. | Web free plan; API explicitly usage-priced separately. Card requirement not established. | Cleanup free export limited to 720px. Free text-to-image has no readable numeric allowance on current pricing: do not invent one. Commercial/watermark rights not established by reviewed pages. |
| Adobe Firefly / images and creative media | Limited daily free generations; current official FAQ does not promise a fixed universal count. | Consumer web/apps on curated models; do not transfer to Firefly API. Card requirement not established here. | Label “free allowance; quantity varies,” not old 25-monthly-credit claims. Complimentary premium trials vary. Output commercial permission and Content Credentials require separate feature-specific policy review; no blanket watermark-free claim. |

## Exact official sources

### ElevenLabs
- https://elevenlabs.io/pricing — 10k monthly Creative credits and paid commercial-license feature.
- https://elevenlabs.io/pricing/api — Free / PAYG comparison; model-specific included TTS characters.
- https://elevenlabs.io/docs/overview/administration/billing — default Free signup; non-commercial output with attribution.
- https://elevenlabs.io/docs/eleven-creative/quickstart — free API Voice Library limitation.
- https://elevenlabs.io/use-policy — prohibits commercial use on a free plan. Prefer this and billing docs over marketing SFX pages implying free commercial use with attribution.

### Deepgram
- https://deepgram.com/pricing — $200 signup credit, no card, no expiration, product-specific consumption.
- https://developers.deepgram.com/guides/fundamentals/make-your-first-api-request — free API signup credit.

### AssemblyAI
- https://www.assemblyai.com/pricing/ — no-card signup, model-dependent hour examples.
- https://support.assemblyai.com/articles/5370767329-can-i-sign-up-for-free — explicit $50 limited trial; async and streaming eligibility; LLM Gateway excluded.

### Speechmatics
- https://www.speechmatics.com/pricing — $100 no-card signup, 12-month signup-credit expiry, free-tier pause; first million TTS characters promotion.

### Cartesia
- https://www.cartesia.ai/pricing — monthly Free allowance; shared model pool; separate agent dollar pool; commercial license added at Pro.

### Fish Audio
- https://fish.audio/ai-voice-generator/ — 8,000 monthly credits, 500-character Free limit, no card, free non-commercial restriction.
- https://fish.audio/developers/ — separate API promotion: `s2.1-pro-free` free through 2026-11-30, no card, no SLA; requests may improve models.
- https://fish.audio/blog/s2-1-pro-free-api/ — promotion details: no hard character cap subject to Fair Use; may throttle; some commercial scenarios restricted, products above $1M ARR must contact provider. This is separate from 8,000 monthly consumer credits.

### Suno
- https://help.suno.com/en/articles/2410049 — 50 daily generation credits, up to ten songs.
- https://help.suno.com/en/articles/9601601 — free personal/non-commercial rights.
- https://help.suno.com/en/articles/13876865 — **2026-09-03 download-policy update**; older Free users up to seven trial downloads; newer users only occasional trial downloads.
- https://help.suno.com/en/articles/2425729 — paying later does not automatically retroactively license Free songs commercially.

### Leonardo.Ai
- https://leonardo.ai/pricing?plan=api — retrieved Solo pricing shows Free 150 daily tokens, Auto Only model access, public creations. Query parameter does not make the consumer allowance an API credit offer.
- https://leonardo.ai/ai-music-generator — free/public ownership and royalty-free commercial-use license; daily tokens shared with creative tools.
- https://leonardo.ai/terms-of-service — underlying ownership terms; review for intended use.

### Recraft
- https://www.recraft.ai/ai-image-generator — 30 daily credits, public Free outputs, non-commercial.
- https://www.recraft.ai/pricing — Free ownership and non-commercial status; paid images retain rights after cancellation.
- https://www.recraft.ai/legal/terms — Free Assets personal-use-only restrictions.
- https://www.recraft.ai/ai-image-combiner — conflicting 50-daily marketing claim; do not silently use the larger number.

### Krea
- https://www.krea.ai/pricing — 100 units/day, no card; daily refill FAQ; paid tiers listed for commercial license.
- https://www.krea.ai/app/api/pricing — consumer subscription and API balances billed separately.

### Clipdrop
- https://clipdrop.co/pricing?openSubscriptionModal=true — separate per-tool 24-hour web quotas and usage-based API.
- https://clipdrop.co/en-US/cleanup — free 720px Cleanup export limit.

### Adobe Firefly
- https://helpx.adobe.com/creative-cloud/apps/generative-ai/generative-credits-faq.html — limited daily free generations on curated models; Free quantity listed as Limited.
- https://helpx.adobe.com/firefly/web/firefly-ai-assistant/ai-assistant-faq.html — complimentary Free daily limit; resets at midnight GMT; no fixed universal count.

## Exclusions / secondary candidates

**Udio: keep out of “free downloadable music assets.”** Free generation still has ten daily credits plus an additional monthly limit of 100; no rollover. But official partnership help says audio/video/stem downloads are disabled. Include only with a prominent in-platform-only limitation. Do not imply a public free API, downloadable commercial music, or current commercial-output rights.
- https://help.udio.com/en/articles/10739134-credits-and-credit-limits
- https://help.udio.com/en/articles/12683565-changes-associated-with-the-universal-music-group-umg-partnership

**Ideogram: eligible variable allowance, not a fixed free-credit promise.** Current pricing FAQ says eligible free accounts signing in with Google, Apple, or Microsoft receive weekly credits and that the amount may vary. It says generated images may be used commercially, subject to terms. Safe secondary record: “eligible accounts receive variable weekly web credits.” Exclude stale “ten credits each week for everyone” and never transfer to API.
- https://ideogram.ai/pricing/

## Editorial guidance

Publish recurring, one-time-trial, and variable allowance badges separately. Show API/web scope, credit unit, renewal, export availability, and commercial restriction beside the quota. Use “documentation reviewed” rather than “tested,” “verified working,” or “no payment required” without explicit source support. Quotas are not a guarantee of successful generation or region/account eligibility.
