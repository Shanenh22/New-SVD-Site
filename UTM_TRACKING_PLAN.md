# Spring Valley Dental — UTM Campaign Tracking Plan

## Convention
utm_source=SOURCE&utm_medium=MEDIUM&utm_campaign=CAMPAIGN

## Sources and Mediums

| Channel | source | medium | example campaign |
|---|---|---|---|
| Google Search Ads | google | cpc | emergency-dallas |
| Google Display | google | display | implants-awareness |
| Facebook/Instagram | facebook | paid-social | invisalign-spring |
| Email newsletter | email | email | monthly-offer |
| Google Business Profile | google | organic-gmb | n/a |
| Nextdoor | nextdoor | paid-social | new-patient |
| Yelp | yelp | referral | n/a |

## Standard Campaign Names (use lowercase, hyphens)
- emergency-dallas
- implants-north-dallas
- invisalign-consultation
- new-patient-offer
- teeth-whitening
- sedation-anxiety
- dental-anxiety

## Example Tagged URLs
Google Ads — emergency:
https://springvalleydentistry.com/emergency.html?utm_source=google&utm_medium=cpc&utm_campaign=emergency-dallas

Facebook — implants:
https://springvalleydentistry.com/dental-implants.html?utm_source=facebook&utm_medium=paid-social&utm_campaign=implants-awareness

Email — new patient:
https://springvalleydentistry.com/patient-info.html?utm_source=email&utm_medium=email&utm_campaign=new-patient-offer

## GA4 Setup Required
1. In GA4: Admin > Data Streams > configure your web stream
2. Admin > Events — mark as conversions: generate_lead, form_submit, phone_call
3. Admin > Reporting > Traffic Acquisition — add utm_campaign secondary dimension
4. Create an Exploration report: Source/Medium x Conversions to measure ROI per channel

## Google Ads Call Tracking
If running Google Ads, enable call extensions with a forwarding number.
This allows GA4 to attribute phone calls back to specific ad campaigns.

## Ready-to-Use Tagged Links (organic profiles)

Copy these exact URLs into the corresponding profile fields. They let GA4
distinguish traffic from each owned channel instead of lumping it into
"direct" or generic "referral."

### 1. Google Business Profile — "Book / Appointment" link
Use as the appointment/booking URL on your Google Business Profile:

https://springvalleydentistry.com/contact.html?utm_source=google&utm_medium=gbp&utm_campaign=gbp-cta

### 2. Instagram — bio link
Use as the website link in your Instagram bio (or the destination behind a
link-in-bio tool):

https://springvalleydentistry.com/?utm_source=instagram&utm_medium=social&utm_campaign=bio

### 3. Facebook — page link
Use as the website button/link on your Facebook Page:

https://springvalleydentistry.com/?utm_source=facebook&utm_medium=social&utm_campaign=fb-page

> Note: The site already captures UTM parameters on landing (sessionStorage),
> persists them, populates the hidden UTM fields on the contact form, and
> reports source attribution to GA4 — so once these tagged links are live,
> attribution flows through to form conversions automatically. No code change
> is needed to use them.
