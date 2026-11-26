# Official-source audit — 2026-11-03

This audit checks public documents. It does not claim account eligibility, redeemed credits, live model calls or performance benchmarks. Findings are dated snapshots; provider terms and account dashboards take precedence.

| Resource | Finding | Primary source |
| --- | --- | --- |
| OpenRouter | Free model usage has platform limits and upstream capacity constraints; the account key endpoint exposes daily request counters. Do not describe it as unlimited. | https://openrouter.ai/docs/api_reference/limits |
| Gemini | Free access is model-specific; pricing distinguishes data use in free and paid tiers. | https://ai.google.dev/gemini-api/docs/pricing |
| Groq | Free-plan limits vary by model and organization; requests and tokens have separate windows. | https://console.groq.com/docs/rate-limits |
| Workers AI | 10,000 Neurons daily, resetting at 00:00 UTC; not a monthly request count. Some models require paid billing. | https://developers.cloudflare.com/workers-ai/platform/pricing/ |
| Mistral | Current terminology is Free mode with included monthly usage; effective API limits are shown in the organization Limits page. Do not reuse old Experiment-plan screenshots as universal limits. | https://docs.mistral.ai/admin/billing-usage/usage-limits |
| Cohere | Evaluation keys are free and limited; trial keys have 1,000 API calls per month plus endpoint-specific rate limits. | https://docs.cohere.com/docs/rate-limits |
| Modal | Starter includes $30 monthly compute; Shared Endpoints are excluded and billed from the first token since September 1, 2026. | https://modal.com/pricing |
| Cerebras | Verified payment method required; $5 trial expires after 30 days. No recurring always-free tier. | https://inference-docs.cerebras.ai/support/rate-limits |
| Hugging Face | Current pricing table lists no monthly credits for ordinary free accounts. Retain the old URL as a correction, not a free offer. | https://huggingface.co/docs/inference-providers/pricing |
| GitHub Models | Fully retired July 30, 2026; unrelated to Copilot service availability. | https://docs.github.com/en/github-models |

## Original guides

The three bilingual guides explain selection, first-call setup and bounded retry design. They provide original decision frameworks and engineering advice, not copied announcements or claimed hands-on measurements. Groq's documented request endpoint and compatibility notes are at https://console.groq.com/docs/quickstart and https://console.groq.com/docs/openai .

## SEO and publisher references

- Pagination pages should use their own canonical URLs: https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading
- Localized alternate pages must actually be localized: https://developers.google.com/search/docs/specialty/international/localized-versions
- Sitemap modification dates should represent significant actual changes: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Publisher privacy disclosures: https://support.google.com/adsense/answer/1348695
- Ads.txt format: https://support.google.com/adsense/answer/12171612
- EEA/UK/Swiss personalized-ad consent requirements: https://support.google.com/adsense/answer/13554116 . The site does not claim a certified CMP has been configured; the AdSense account configuration still needs checking before relevant ad serving.

## Scope and limitations

Ten existing resource pages were rewritten with source links and dates. Other historical entries were preserved, marked as unreviewed and separated from current recommendations; their remaining claims were not independently established. No fabricated author biography, contact mailbox, benchmark or provider affiliation was added. Correction links use the repository's existing, enabled GitHub Issues channel.

## Three improvement rounds

1. Correct current resource facts, distinguish trial/compute/free tiers, preserve dated corrections for withdrawn offers.
2. Add three bilingual practical guides, source/review notes, editorial and contact pages, updated privacy and terms, and internal resource comparison links.
3. Correct pagination canonical/hreflang, translate reviewed resources, restrict ads on utility/error/unreviewed pages, exclude drafts from public export, replace generated free-use FAQ promises, add ads.txt and a crawlable 1200×630 Open Graph PNG. Regression coverage includes positive and negative routes and structured-data parsing.
