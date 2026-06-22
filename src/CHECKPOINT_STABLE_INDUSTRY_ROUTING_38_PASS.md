# CHECKPOINT: STABLE_INDUSTRY_ROUTING_38_PASS

**Date:** 2026-06-22  
**Status:** FROZEN ✅  
**Tests:** 38/38 PASS

---

## Frozen Files

| File | Reason |
|------|--------|
| `lib/industryClassifier.js` | Core routing engine — 38/38 verified |
| `entities/Case.json` (category enum) | Banking / insurance / telco / utilities / tenancy / government / education / other |
| `pages/NewCase.jsx` (category save logic) | Uses `detectIndustry()` on form submit |
| Existing case reclassification logic | Any OCR/evidence-based reclassification |
| `getEscalationBody()` mapping | All 8 industry→body mappings verified |

---

## Verified Routing Results

### Banking
| Input | Result |
|-------|--------|
| NAB transaction dispute | ✅ banking |
| Commonwealth Bank locked my account | ✅ banking |
| Westpac card dispute | ✅ banking |
| PayPal refused refund | ✅ banking |
| Afterpay account issue | ✅ banking |
| Revolut transfer missing | ✅ banking |

### Insurance
| Input | Result |
|-------|--------|
| NRMA insurance claim denied | ✅ insurance |
| AAMI claim delay | ✅ insurance |
| Allianz settlement offer | ✅ insurance |
| Budget Direct repair dispute | ✅ insurance |
| Bupa health insurance complaint | ✅ insurance |
| TAL life insurance claim | ✅ insurance |

### Telco
| Input | Result |
|-------|--------|
| Optus phone bill overcharge | ✅ telco |
| Telstra NBN issue | ✅ telco |
| TPG internet disconnection | ✅ telco |
| Vodafone handset contract | ✅ telco |
| Aussie Broadband service failure | ✅ telco |

### Utilities
| Input | Result |
|-------|--------|
| AGL electricity bill shock | ✅ utilities |
| AGL gas bill | ✅ utilities |
| Origin Energy bill shock | ✅ utilities |
| Sydney Water meter issue | ✅ utilities |
| Endeavour Energy disconnection | ✅ utilities |

### Tenancy
| Input | Result |
|-------|--------|
| Housing NSW landlord refusing repairs | ✅ tenancy |
| LJ Hooker bond dispute | ✅ tenancy |
| Ray White termination notice | ✅ tenancy |
| Housing NSW repairs | ✅ tenancy |
| landlord refused repairs | ✅ tenancy |
| NCAT tenancy application | ✅ tenancy |

### Government
| Input | Result |
|-------|--------|
| JOBNETWORK / Centrelink demerit point | ✅ government |
| Centrelink payment issue | ✅ government |
| Revenue NSW fine dispute | ✅ government |
| Workforce Australia provider complaint | ✅ government |
| Local council rates dispute | ✅ government |

### Education
| Input | Result |
|-------|--------|
| Local school student suspension | ✅ education |
| School suspension | ✅ education |
| Principal refused support plan | ✅ education |
| Department of Education complaint | ✅ education |
| TAFE NSW enrolment dispute | ✅ education |

---

## Key Design Decisions

- **Priority scoring:** Provider name match = 10 pts, keyword match = 3 pts. Highest total score wins.
- **No false positive on "dispute":** Generic words score low; named providers dominate.
- **Government vs Education conflict resolved:** "Department of Education" removed from government providers list; lives only in education providers.
- **`detectIndustryDebug()` returns:**
  ```json
  {
    "category": "banking",
    "matchedProvider": "nab",
    "matchedKeywords": ["transaction dispute"],
    "confidence": "medium",
    "escalationBody": "Australian Financial Complaints Authority (AFCA)"
  }
  ```
- **`detectIndustry()`** returns simple string — fully backwards-compatible with all existing callers.

---

## Escalation Body Mapping

| Industry | Escalation Body |
|----------|----------------|
| banking | Australian Financial Complaints Authority (AFCA) |
| insurance | Australian Financial Complaints Authority (AFCA) |
| telco | Telecommunications Industry Ombudsman (TIO) |
| utilities | Energy & Water Ombudsman (EWON / relevant state ombudsman) |
| tenancy | NSW Civil and Administrative Tribunal (NCAT) |
| government | Relevant agency complaints team / Commonwealth Ombudsman |
| education | School principal / Department of Education complaints |
| other | Relevant ombudsman or tribunal |

---

## Provider Coverage Summary

| Industry | Named Providers |
|----------|----------------|
| Banking | NAB, CBA, ANZ, Westpac, St George, BankSA, Bank of Melbourne, Macquarie Bank, ING, Bendigo Bank, Adelaide Bank, Bankwest, Suncorp Bank, BOQ, Heritage Bank, Great Southern Bank, ME Bank, UBank, Up Bank, Revolut, Wise, PayPal, Afterpay, Zip Pay, Humm, Latitude, Visa, Mastercard, PayID, Osko, BPAY |
| Insurance | NRMA, IAG, AAMI, Allianz, Budget Direct, GIO, QBE, Youi, Suncorp, RACQ, RACV, RAA, SGIC, SGIO, Bingle, Coles Insurance, Woolworths Insurance, Real Insurance, Medibank, Bupa, NIB, HCF, Australian Unity, TAL, AIA, Zurich, AMP Life, MLC Life |
| Telco | Optus, Telstra, Vodafone, TPG, iiNet, Internode, Aussie Broadband, Belong, Amaysim, Boost Mobile, Dodo, Exetel, Superloop, More Telecom, Southern Phone, Kogan Mobile, Spintel, Vocus |
| Utilities | AGL, Origin Energy, EnergyAustralia, Red Energy, Alinta Energy, Simply Energy, Momentum Energy, Powershop, Lumo Energy, ActewAGL, Jemena, Ausgrid, Endeavour Energy, Essential Energy, Sydney Water, WaterNSW, Hunter Water, SA Water, Icon Water |
| Tenancy | Ray White, LJ Hooker, McGrath, Belle Property, Raine & Horne, Harcourts, Professionals Real Estate, First National, Richardson & Wrench, Housing NSW, DCJ Housing |
| Government | Centrelink, Services Australia, Medicare, Revenue NSW, Transport for NSW, Service NSW, NSW Police, Legal Aid NSW, DCJ, Workforce Australia, Local Council, ATO, Fair Trading NSW |
| Education | Department of Education, TAFE NSW, University of Sydney, UNSW, UOW, University of Newcastle, Western Sydney University, Macquarie University |

---

## Modification Protocol

**DO NOT modify industry routing unless ALL of the following are provided:**

1. A specific failed real-world case (not hypothetical)
2. The incorrect category it currently returns
3. The exact provider name or keyword that is missing or wrong
4. The new test case added to the suite
5. Confirmation that all 38 previous tests still pass after the change

**Any modification without meeting all 5 criteria is a freeze violation.**