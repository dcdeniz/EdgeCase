# Screen specifications

- Status: Implemented
- Last updated: 2026-07-25

Every screen specifies: objective, required data, primary and secondary actions,
safety state, loading, empty, error, simulated-data behaviour, responsive behaviour,
and its API dependency.

Two conventions apply everywhere and are not repeated per screen:

- **Responsive.** Single column at 16px gutters below 480px; content column capped at
  `--ps-shell-max` (30rem) and centred above it. Layouts reflow rather than clip at a
  150% text scale. Wide content scrolls inside its own container.
- **Loading.** Skeletons match the shape of the content they replace, carry a
  visually-hidden label naming what is loading, and are not announced as live regions.

Operation IDs reference
[`docs/project/contracts/http/openapi.yaml`](../project/contracts/http/openapi.yaml).
"Not implemented" means no contract exists — see [dependencies](dependencies.md).

---

## Entry and consent

### `/` Welcome

| Field | Specification |
| --- | --- |
| Objective | Understand what PreSeed is and what it refuses to do, in under a minute |
| Required data | None. The hero uses a fixture marker and its reasoning chain |
| Primary action | Get started → `/start/account` |
| Secondary actions | Screen map → `/prototype` |
| Safety state | Persistent prototype label in the header; "What PreSeed will not do" is a first-screen section, not a terms page; full disclaimer in the footer |
| Empty / error | Not applicable — static content |
| Simulated data | The hero result carries a simulated badge |
| API | None |

### `/start/account` Create account or sign in

| Field | Specification |
| --- | --- |
| Objective | Establish an account |
| Required data | Email, password |
| Primary action | Create account / Sign in → `/start/privacy` |
| Secondary actions | Toggle between create and sign in |
| Safety state | A card states plainly that no real account is created and no credentials are sent |
| Error | Field-level, shown only after the value is committed (`:user-invalid`), with icon and text |
| Simulated data | Whole screen is non-functional by design and says so |
| API | Supabase Auth in production. Not wired in the prototype |

### `/start/privacy` Privacy summary

| Field | Specification |
| --- | --- |
| Objective | Understand data handling before being asked to consent |
| Required data | None |
| Primary action | Continue → `/start/consent` |
| Secondary actions | Two disclosures: what is stored, what is never stored |
| Safety state | Four explicit promises, including no partner/clinic/employer access |
| API | None |

### `/start/consent` Health-data consent

| Field | Specification |
| --- | --- |
| Objective | Give explicit, informed permission to process special-category data |
| Required data | Consent checkbox |
| Primary action | Continue, disabled until consent is given |
| Secondary actions | None — the screen has one job |
| Safety state | Separates what is consented to from what is not (no research use, no third parties, no marketing); states withdrawal is available from Account |
| API | `putOnboarding` carries `healthDataConsent`; the profile stores `health_data_consented_at` |

### `/start/disclaimer` Research-prototype disclaimer

| Field | Specification |
| --- | --- |
| Objective | Acknowledge the limits once, properly, so later screens can use short labels |
| Required data | Acknowledgement checkbox |
| Primary action | I understand, disabled until ticked |
| Safety state | This *is* the safety screen: full disclaimer plus eight named limits |
| API | None |

### `/start/track` Track selection

| Field | Specification |
| --- | --- |
| Objective | Choose the situation that fits, knowing what each changes |
| Required data | Track |
| Primary action | Continue → branches by track |
| Secondary actions | None |
| Safety state | Preservation is chipped *Time-critical*; selecting it reveals a card explaining the questionnaire is being skipped deliberately |
| Empty | Continue disabled until a track is chosen |
| API | `putOnboarding` (`fertilityTrack`) |

---

## Onboarding

### `/onboarding/goal` Goal and timeline

| Field | Specification |
| --- | --- |
| Objective | Set urgency, and make the dated protocol concrete immediately |
| Required data | Goal timing; protocol length (default 100 days) |
| Primary action | Continue → `/onboarding/lifestyle` |
| Secondary actions | Adjust protocol length; the start date, closing-analysis date and week count update live |
| Safety state | States that the target date changes the plan and urgency, not the underlying biology or any claim |
| Empty | Continue disabled until a timing is chosen |
| API | `putOnboarding` (`answers`) |

### `/onboarding/lifestyle` Lifestyle

| Field | Specification |
| --- | --- |
| Objective | Collect the behaviours with real evidence, and nothing else |
| Required data | Sleep duration and regularity, nicotine, alcohol, diet pattern, produce, activity, sedentary time, heat exposure |
| Primary action | Continue → `/onboarding/health` |
| Secondary actions | Disclosure: why these questions and not more |
| Safety state | Every group carries a "why we ask"; "Prefer not to say" on every sensitive question; recovery question appears only for high training frequency |
| Empty | Nothing is required. Skipping lowers data confidence, never readiness |
| API | `putOnboarding` |

### `/onboarding/health` Clinical history

| Field | Specification |
| --- | --- |
| Objective | Capture history that changes interpretation or routes to a clinician |
| Required data | Conditions, medicines, sexual and reproductive health, free-text notes |
| Primary action | Continue → `/onboarding/exposure` |
| Secondary actions | Disclosures: why steroids are asked about; what "prefer not to say" does |
| Safety state | **Clinical gates fire inline.** Testosterone/anabolic steroids → escalation alert. Non-modifiable conditions → attention alert with the chip "Does not affect your readiness score" |
| API | `putOnboarding` |

### `/onboarding/exposure` Environmental exposure

| Field | Specification |
| --- | --- |
| Objective | Record modifiable exposures, weighted by evidence strength |
| Required data | Exposure multi-select |
| Primary action | Continue → `/onboarding/review` |
| Secondary actions | Disclosures on what the evidence supports and why microplastics carry little weight |
| Safety state | Each option's note states its evidence strength; the screen refuses the "one fewer plastic cup equals a known change" conversion |
| Not implemented | Live AQI tracking renders as a pending-integration block naming `POST /v1/environment/snapshots` and an absent AQI provider |
| API | `putOnboarding` |

### `/onboarding/review` Review

| Field | Specification |
| --- | --- |
| Objective | See the first readiness score and understand it is behaviour only |
| Required data | All onboarding answers |
| Primary action | Add a clinical result → `/tests/new` (reversal track → `/reversal`) |
| Secondary actions | None |
| Safety state | Gates render above the score; the modifiable-behaviours sentence sits on the card; missing inputs shown with the chip "Missing data never reduces readiness" |
| Empty | Score renders as `—` with band "Insufficient data" when under 40 weight points are covered |
| API | `putOnboarding` with `complete: true` |

---

## Clinical

### `/tests/new` Add a clinical result

| Field | Specification |
| --- | --- |
| Objective | Record a laboratory result with enough context to compare it later |
| Required data | Mode; panel; marker values; collection date, abstinence, laboratory, completeness, fever |
| Primary action | Continue → Continue → Save result |
| Secondary actions | Switch mode; switch panel; back |
| Safety state | Step 2 opens with feedforward on why collection conditions decide comparability. A concentration of `0` renders the mandatory azoospermia message and records *reported as zero, confirmation required*. The review step states that typed values are stored as entered by you, not as a lab report |
| Empty | Continue disabled until at least one marker has a value (manual mode) |
| Error | Non-numeric values are dropped rather than saved; date and unit are structural |
| Simulated data | Demo mode shows an information card before the picker, and every sample is described with its date and what it demonstrates |
| Not implemented | Upload mode is a pending-integration block naming `POST /v1/uploads/intents`, `POST /v1/uploads/:id/confirm` and an extraction service, plus a four-step description of the intended confirmation flow and a route back to manual entry |
| API | `createClinicalTest`, then `putClinicalMarkers` |

### `/results` Results hub

| Field | Specification |
| --- | --- |
| Objective | Understand what is known, in descending order of reliability |
| Required data | Latest semen test and markers; readiness; confidence; risk states |
| Primary action | Open the reasoning chain for the largest gap |
| Secondary actions | All markers; all four risks; what raises confidence; compare against baseline |
| Safety state | Four outputs numbered and never merged; risk section states none is a diagnosis; the modifiable-behaviours sentence travels on the readiness card |
| Empty | No clinical result → empty state naming the one action that unblocks it |
| Simulated data | A simulated badge sits beside the collection date and on every marker card |
| API | `listClinicalTests`; readiness and confidence are **not implemented** |

### `/results/profile` Clinical profile

| Field | Specification |
| --- | --- |
| Objective | See every measured value with its provenance and reference context |
| Required data | Latest and prior semen test; hormone panel |
| Primary action | Open a marker |
| Secondary actions | Add another result; disclosure on reading a reference interval |
| Safety state | Collection-comparability card when conditions differ from the previous sample; zero results chipped *confirmation required*; missing markers rendered explicitly as "Not measured — lowers confidence, not readiness" |
| Empty | Nothing measured → empty state stating this screen never shows an estimate |
| Simulated data | Badge on the test header and each marker card |
| API | `getClinicalTest`, `listClinicalTests` |

### `/results/profile/[code]` Marker detail

| Field | Specification |
| --- | --- |
| Objective | Understand one measurement completely |
| Required data | Marker value, unit, reference set, provenance, verification, collection context, prior value |
| Primary action | Open the reasoning chain, when one exists |
| Secondary actions | Ask PreSeed about this |
| Safety state | Reference attribution names the source and states a limit describes a distribution, not a boundary. Any delta is tested against the ±25% variability band and carries the chip "PreSeed does not claim to have caused this" |
| Empty | Marker not measured → dedicated card with the confidence chip; unknown marker code → empty state |
| Simulated data | Simulated badge in the provenance block |
| API | `getClinicalTest`, `getTrends` |

### `/results/readiness` Readiness detail

| Field | Specification |
| --- | --- |
| Objective | See exactly what moved the score and by how much |
| Required data | Domain scores, drivers, weights, windows, evidence confidence, missing inputs, gates, rule version |
| Primary action | Open a citation drawer or a domain explanation |
| Secondary actions | Ask PreSeed about a domain; three disclosures on calculation, smoothing and what the score is not |
| Safety state | Gates render in their own section above the breakdown with the explanation that they are not point deductions; the modifiable-behaviours sentence is given a bordered treatment; missing inputs carry the confidence chip |
| Empty | Score `—`, band "Insufficient data" |
| API | **Not implemented.** Production readiness is a server-side versioned rules engine writing append-only score snapshots |

### `/results/risks` Screening risks

| Field | Specification |
| --- | --- |
| Objective | Understand which endpoints have an output, which do not, and why |
| Required data | Endpoint, state, band, uncertainty, model version, generation date and context, missing inputs, confirmation requirement, next action |
| Primary action | None. This screen mostly reports absence |
| Secondary actions | Ask PreSeed about an externally generated band; two disclosures on bands versus percentages and what would have to change |
| Safety state | Grouped by state under headings *Hard limit*, *Imported*, *Not available*. Azoospermia is **unavailable by design** with the mandatory message. Every card states "A screening risk is not a diagnosis" |
| Empty | The empty states *are* the content — four distinct treatments |
| Simulated data | The externally generated band carries an attention card stating it was produced off-device and did not use recent data |
| API | **Not implemented.** Assessments are reserved pending the model-owner pull requests |

### `/results/confidence` Data confidence

| Field | Specification |
| --- | --- |
| Objective | Understand how much sits under everything else, and how to raise it |
| Required data | Six weighted factors: provenance, recency, marker completeness, hormone context, comparability, behavioural coverage |
| Primary action | The highest-impact raiser, contextual to the current state |
| Secondary actions | Two disclosures on why confidence is separate and what a low score does not mean |
| Safety state | States that missing data lands here, never on readiness |
| API | **Not implemented** |

### `/results/reasoning/[id]` Parameter reasoning — signature screen

| Field | Specification |
| --- | --- |
| Objective | Understand why a recommendation applies to this specific result |
| Required data | Marker value and reference context; applicability; mechanism; bounded action; evidence IDs; limitations; escalation |
| Primary action | Open an evidence card |
| Secondary actions | Ask PreSeed; expand limitations |
| Safety state | A recommendation cannot render without its result — if the marker is absent the screen says so and routes to test entry. Non-citable references are counted and excluded, not hidden. Integrative framing card prevents reading parameters as independent dials |
| Empty | Missing chain or missing marker → dedicated states |
| Simulated data | Badge in station 1 |
| API | **Not implemented.** Recommendations require an evidence registry and a recommendation engine |

### `/trends` Trends

| Field | Specification |
| --- | --- |
| Objective | See measured change without inferring cause |
| Required data | Baseline and latest test, all comparable markers, collection conditions, active protocol version, adherence over the interval |
| Primary action | Add the closing analysis, when only one result exists |
| Secondary actions | View any chart as a table; two disclosures on causal refusal and laboratory differences |
| Safety state | The causal refusal renders **before** any number. Every delta is classified against the ±25% variability band. Comparability issues render as an attention card |
| Empty | Zero results → empty state. One result → a dedicated screen explaining one analysis is a starting point, not a trend |
| Simulated data | Provenance row shows source→source; simulated badge on the interval card |
| API | `getTrends` |

---

## Protocol

### `/today` Today

| Field | Specification |
| --- | --- |
| Objective | Answer "what do I do now" |
| Required data | Gates, adaptation proposal, protocol day and week, weekly focus, today's actions, adherence window, readiness, latest result |
| Primary action | Log an action as done, partly or skipped |
| Secondary actions | Start check-in; open full plan; enter retest; open results |
| Safety state | Gates render above everything including the protocol card |
| Empty | No protocol → empty state offering a real result or the demo baseline |
| Simulated data | Badge on the latest-result card |
| API | `getCurrentProtocol`, `putAdherenceEvent` |

### `/protocol` Protocol

| Field | Specification |
| --- | --- |
| Objective | See the whole plan and its version history |
| Required data | Protocol metadata, items by week, weekly focus, adherence window, category counts |
| Primary action | Log an action |
| Secondary actions | Expand any week; open a reasoning chain; open citations; two disclosures on how changes work and why supplements are information |
| Safety state | Supplement items are labelled *General guidance*, never evidence-backed, with the reason stated |
| Empty | No protocol → empty state |
| API | `getCurrentProtocol`, `createProtocol`. Adaptations are **not implemented** |

### `/protocol/check-in` Check-in

| Field | Specification |
| --- | --- |
| Objective | Log honestly, in two minutes |
| Required data | Per-item status; manageability 1–5; wellbeing 1–5; notes |
| Primary action | Save check-in |
| Secondary actions | Back to step 1 |
| Safety state | Copy frames a low rating as a problem with the plan, not the person. A card states nothing changes without the user pressing accept. Explicitly not a medical assessment |
| Empty | No scheduled actions → a card saying so; the two questions still work |
| API | `putAdherenceEvent`, `createCheckIn` |

---

## Tracks

### `/reversal` Reversal tracking

| Field | Specification |
| --- | --- |
| Objective | Track recovery across real laboratory results |
| Required data | Every semen analysis with laboratory, abstinence, provenance and zero flag |
| Primary action | Enter a laboratory result |
| Secondary actions | Load a demo series; two disclosures on why there is no 100-day protocol and what home kits cannot do |
| Safety state | **The mandatory azoospermia notice renders at the top and cannot be dismissed.** Any zero is labelled *reported as zero — confirmation required*. Escalation criteria are listed. The next-analysis interval states the surgeon's direction takes priority |
| Empty | No results → the azoospermia notice still renders, above an empty state |
| Simulated data | Badge per analysis |
| API | `listClinicalTests`, `getTrends` |

### `/preservation` Preservation priority

| Field | Specification |
| --- | --- |
| Objective | Get to a fertility specialist before treatment starts |
| Required data | Treatment start date; four-item checklist state |
| Primary action | Tick the highest-impact action |
| Secondary actions | Share the question list; two disclosures |
| Safety state | Escalation alert states preservation comes before anything else in the app and that no testing claim is made on this track. A disclosure lists what PreSeed will not claim here |
| Empty | No treatment date → the countdown card is simply absent; the checklist still works |
| Not implemented | Banking-service directory renders as a pending-integration block naming an unsourced licensed-service directory |
| API | None. This track writes only `putOnboarding` |

---

## Evidence and explanation

### `/evidence` Evidence library

| Field | Specification |
| --- | --- |
| Objective | Read the evidence base, and see how far each claim has been checked |
| Required data | All claims with review status, confidence, endpoints, direction |
| Primary action | Open an evidence card |
| Secondary actions | Filter by review status; two disclosures on the three statuses and on naming endpoints |
| Safety state | A library-level attention card states no claim has completed clinical review. Research candidates carry a dashed escalation border and the line "Not usable. Source unverified, so this cannot appear in a recommendation" |
| Empty | A filter with no matches renders a zero count in the section header |
| API | `getEvidence` exists for a single claim. Library listing and search are **not implemented** |

### `/evidence/[id]` Evidence card

| Field | Specification |
| --- | --- |
| Objective | Judge one claim on its merits |
| Required data | Claim, endpoints, study type, population, direction, confidence, causal flag, limitations, source, review date, review status |
| Primary action | Open the source |
| Secondary actions | Ask PreSeed; see where the claim is used in the account |
| Safety state | Limitations are a required section, never collapsed away. Candidates render their warning above the claim text |
| Empty | Unknown ID → empty state; unused claim → a card saying it is present as context |
| API | `getEvidence` |

### `/coach` Ask PreSeed

| Field | Specification |
| --- | --- |
| Objective | Answer "why?" about one specific thing, with citations |
| Required data | Context ID and label from the query string; prepared responses |
| Primary action | Ask one of the questions available in this context |
| Secondary actions | Ask something else; open a citation; browse the library |
| Safety state | Context is pinned in a sticky bar and never scrolls away. A card states what the layer can and cannot do. Every answer ends with its limitations. A closing card states the prototype answers are authored, and lists what production output is forbidden from doing |
| Empty | No prepared response for a context → pending-integration block naming the reserved coach contract, with a route to the library |
| Error | Two designed refusal states: *evidence insufficient* and *explanation unavailable* |
| API | **Not implemented.** The coach contract is reserved for on-demand retrieval once account outputs exist |

---

## Account and handoff

### `/account` Account

| Field | Specification |
| --- | --- |
| Objective | Reach settings, see what is on record, and control the demo |
| Required data | Email, track, onboarding state, record counts, confidence |
| Primary action | Open a settings destination |
| Secondary actions | Five demo loaders; reset |
| Safety state | Demo controls are visually separated with a dashed border and labelled *Prototype only*. Reset requires a confirmation sheet |
| API | `getMe` |

### `/account/display` Display and accessibility

| Field | Specification |
| --- | --- |
| Objective | Adjust theme, text size, motion and contrast |
| Required data | Settings |
| Primary action | Change a setting — applied immediately |
| Secondary actions | None |
| Safety state | A closing card lists the four guarantees that hold regardless of settings |
| API | Local only |

### `/account/data` Your data

| Field | Specification |
| --- | --- |
| Objective | See every stored value with its provenance, and exercise control |
| Required data | All tests and markers with codes, units and verification; consent state |
| Primary action | Withdraw consent (confirmed via sheet) |
| Secondary actions | Two disclosures on provenance and append-only records |
| Safety state | Withdrawal states what stops and offers export first |
| Empty | No results → a plain line |
| Not implemented | Export renders as a pending-integration block naming an absent export operation |
| API | `getMe`, `listClinicalTests` |

### `/account/safety` Safety centre

| Field | Specification |
| --- | --- |
| Objective | Find the limits, the escalation criteria, and how the interface protects |
| Required data | None |
| Primary action | None — reference screen |
| Secondary actions | Five disclosures on the structural protections |
| Safety state | This is the accessible safety centre the persistent label routes to. Seven escalation criteria in an escalation alert; seven hard limits as cards; a crisis note |
| API | None |

### `/design` Design system reference

| Field | Specification |
| --- | --- |
| Objective | Hand off the implemented system |
| Required data | Live tokens read at runtime |
| Primary action | None |
| Secondary actions | Open sheets and confirmations to inspect overlay behaviour |
| Notes | Reflects the current theme, text scale and contrast settings, so it doubles as an accessibility test surface |
| API | None |

### `/prototype` Screen map

| Field | Specification |
| --- | --- |
| Objective | Navigate the prototype and load a coherent demo state |
| Required data | Route inventory |
| Primary action | Load demo state |
| Secondary actions | Clear everything; jump to any screen |
| Notes | The critical path is numbered and ordered; all other screens are grouped by flow |
| API | None |
