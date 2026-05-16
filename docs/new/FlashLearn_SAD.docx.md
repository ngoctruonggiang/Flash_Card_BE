

**FlashLearn**

**Software Architecture Document (SAD)**

Web-based Vocabulary Learning System

| DOCUMENT NUMBER | RELEASE / REVISION | RELEASE / REVISION DATE |
| :---- | :---- | :---- |
| FL-SAD-001 | Version 3.0 — Final Edition | April 2026 |

Table of Contents  
[**1  Documentation Roadmap	3**](#1-documentation-roadmap)

[1.1  Document Management and Configuration Control Information	3](#1.1-document-management-and-configuration-control-information)

[1.2  Purpose and Scope of the SAD	3](#1.2-purpose-and-scope-of-the-sad)

[1.3  How the SAD Is Organised	3](#1.3-how-the-sad-is-organised)

[1.4  Stakeholder Representation	4](#1.4-stakeholder-representation)

[1.5  Viewpoint Definitions	5](#1.5-viewpoint-definitions)

[1.5.1  Module (Logical) Viewpoint Definition	5](#1.5.1-module-\(logical\)-viewpoint-definition)

[1.5.2  Component-and-Connector (Process) Viewpoint Definition	6](#1.5.2-component-and-connector-\(process\)-viewpoint-definition)

[1.5.3  Deployment (Allocation) Viewpoint Definition	6](#1.5.3-deployment-\(allocation\)-viewpoint-definition)

[1.5.4  Use Case / Behavior Viewpoint Definition	7](#1.5.4-use-case-/-behavior-viewpoint-definition)

[1.6  How a View is Documented	7](#1.6-how-a-view-is-documented)

[1.7  Relationship to Other SADs	8](#1.7-relationship-to-other-sads)

[1.8  Process for Updating this SAD	8](#1.8-process-for-updating-this-sad)

[**2  Architecture Background	9**](#2-architecture-background)

[2.1  Problem Background	9](#2.1-problem-background)

[2.1.1  System Overview	9](#2.1.1-system-overview)

[2.1.2  Goals and Context	9](#2.1.2-goals-and-context)

[2.1.3  Significant Driving Requirements	9](#2.1.3-significant-driving-requirements)

[2.2  Solution Background	10](#2.2-solution-background)

[2.2.1  Architectural Approaches	10](#2.2.1-architectural-approaches)

[2.2.2  Analysis Results	11](#2.2.2-analysis-results)

[2.2.3  Requirements Coverage	11](#2.2.3-requirements-coverage)

[2.2.4  Summary of Background Changes Reflected in Current Version	11](#2.2.4-summary-of-background-changes-reflected-in-current-version)

[2.3  Product Line Reuse Considerations	11](#2.3-product-line-reuse-considerations)

[**3  Use Case View	13**](#3-use-case-view)

[3.1  View Description	13](#3.1-view-description)

[3.2  View Packet Overview	13](#3.2-view-packet-overview)

[3.3  Architecture Background	13](#3.3-architecture-background)

[3.4  Variability Mechanisms	13](#3.4-variability-mechanisms)

[3.5  View Packets	13](#3.5-view-packets)

[3.5.1  View Packet 1: Use Cases by Functional Group	13](#3.5.1-view-packet-1:-use-cases-by-functional-group)

[**4  Module View (Logical View)	15**](#4-module-view-\(logical-view\))

[4.1  View Description	15](#4.1-view-description)

[4.2  View Packet Overview	15](#4.2-view-packet-overview)

[4.3  Architecture Background	15](#4.3-architecture-background)

[4.4  Variability Mechanisms	15](#4.4-variability-mechanisms)

[4.5  View Packets	15](#4.5-view-packets)

[4.5.1  View Packet 1: Layered Architecture	15](#4.5.1-view-packet-1:-layered-architecture)

[4.5.2  View Packet 2: Module Dependency Diagram	18](#4.5.2-view-packet-2:-module-dependency-diagram)

[**5  Component-and-Connector View (Process View)	19**](#5-component-and-connector-view-\(process-view\))

[5.1  View Description	19](#5.1-view-description)

[5.2  View Packet Overview	19](#5.2-view-packet-overview)

[5.3  Architecture Background	19](#5.3-architecture-background)

[5.4  Variability Mechanisms	19](#5.4-variability-mechanisms)

[5.5  View Packets	19](#5.5-view-packets)

[5.5.1  View Packet 1: C\&C Diagram and Connector Catalog	19](#5.5.1-view-packet-1:-c&c-diagram-and-connector-catalog)

[**6  Deployment View	21**](#6-deployment-view)

[6.1  View Description	21](#6.1-view-description)

[6.2  View Packet Overview	21](#6.2-view-packet-overview)

[6.2.1  View Packet 1: V1.0 Single-Server Deployment	21](#6.2.1-view-packet-1:-v1.0-single-server-deployment)

[6.2.2  View Packet 2: V2.0 Horizontally Scaled Deployment	21](#6.2.2-view-packet-2:-v2.0-horizontally-scaled-deployment)

[**7  Behavior View	23**](#7-behavior-view)

[7.1  View Description	23](#7.1-view-description)

[7.2  View Packets	23](#7.2-view-packets)

[7.2.1  Sequence Diagram 1 — UC-21 Review Outcome: Online Path \[AD-01, AD-04\]	23](#7.2.1-sequence-diagram-1-—-uc-21-review-outcome:-online-path-[ad-01,-ad-04])

[7.2.2  Sequence Diagram 2 — UC-21 Offline Path \[AD-02\]	23](#7.2.2-sequence-diagram-2-—-uc-21-offline-path-[ad-02])

[7.2.3  Sequence Diagram 3 — UC-24 Authorization Denied \[AD-03\]	23](#7.2.3-sequence-diagram-3-—-uc-24-authorization-denied-[ad-03])

[**8  Relations Among Views	25**](#8-relations-among-views)

[8.1  General Relations Among Views	25](#8.1-general-relations-among-views)

[8.2  View-to-View Relations — Cross-View Element Traceability	25](#8.2-view-to-view-relations-—-cross-view-element-traceability)

[8.3  Consistency Verification	25](#8.3-consistency-verification)

[**9  Quality Attribute Scenarios (ADD)	27**](#9-quality-attribute-scenarios-\(add\))

[9.1  Scenario 1 — Performance: Study Session Start \[AD-01 — H,H\]	27](#9.1-scenario-1-—-performance:-study-session-start-[ad-01-—-h,h])

[9.2  Scenario 2 — Security: Authentication \+ Brute-Force \[AD-05 — H,M\]	27](#9.2-scenario-2-—-security:-authentication-+-brute-force-[ad-05-—-h,m])

[9.3  Scenario 3 — Security: Resource-Level Authorization \[AD-03 — H,M\]	27](#9.3-scenario-3-—-security:-resource-level-authorization-[ad-03-—-h,m])

[9.4  Scenario 4 — Reliability: Atomic Transaction Failure \[AD-04 — H,M\]	28](#9.4-scenario-4-—-reliability:-atomic-transaction-failure-[ad-04-—-h,m])

[9.5  Scenario 5 — Availability: Offline Study Session \[AD-02 — M,H\]	28](#9.5-scenario-5-—-availability:-offline-study-session-[ad-02-—-m,h])

[9.6  Scenario 6 — Scalability: Deck Library Pagination \[AD-07 — H,M\]	29](#9.6-scenario-6-—-scalability:-deck-library-pagination-[ad-07-—-h,m])

[9.7  Scenario 7 — Security: Data Confidentiality \[AD-06 — H,M\]	29](#9.7-scenario-7-—-security:-data-confidentiality-[ad-06-—-h,m])

[**10  Architectural Tactics and Cross-Impact Analysis	30**](#10-architectural-tactics-and-cross-impact-analysis)

[10.1  Tactic Catalogue by Quality Attribute	30](#10.1-tactic-catalogue-by-quality-attribute)

[10.2  Tactic Cross-Impact Analysis	31](#10.2-tactic-cross-impact-analysis)

[**11  Design Decisions and Alternative Architectures	32**](#11-design-decisions-and-alternative-architectures)

[11.1  Decision 1 — 4-Layer Architecture	32](#11.1-decision-1-—-4-layer-architecture)

[11.2  Decision 2 — Offline-First Architecture	32](#11.2-decision-2-—-offline-first-architecture)

[11.3  Decision 3 — ResourceAuthMiddleware	32](#11.3-decision-3-—-resourceauthmiddleware)

[11.4  Decision 4 — Server-Side SM-2 Pure Function	32](#11.4-decision-4-—-server-side-sm-2-pure-function)

[11.5  Rejected Alternative 1 — Microservices	33](#11.5-rejected-alternative-1-—-microservices)

[11.6  Rejected Alternative 2 — Monolithic MPA	33](#11.6-rejected-alternative-2-—-monolithic-mpa)

[11.7  Rejected Alternative 3 — GraphQL API	33](#11.7-rejected-alternative-3-—-graphql-api)

[**12  ADD Iteration Log	35**](#12-add-iteration-log)

[**13  Requirements Coverage	36**](#13-requirements-coverage)

[**14  Referenced Materials	38**](#14-referenced-materials)

[**15  Directory	39**](#15-directory)

[15.1  Index	39](#15.1-index)

[15.2  Glossary	39](#15.2-glossary)

[15.3  Acronym List	40](#15.3-acronym-list)

# **1  Documentation Roadmap** {#1-documentation-roadmap}

The Documentation Roadmap is the first place a new reader should begin. It describes how this SAD is organised, which stakeholder viewpoints are represented, how the document is structured, and where specific information may be found.

## **1.1  Document Management and Configuration Control Information** {#1.1-document-management-and-configuration-control-information}

| CONTENTS: Version, release date, and configuration control information for the current release. |
| :---- |

| Revision Number | 3.0 |
| :---- | :---- |
| **Revision Release Date** | April 2026 |
| **Purpose of Revision** | Final edition — complete 4+1 view documentation, ADD methodology chain, view consistency verification, and three alternative architectures with rejection rationale. |
| **Scope of Revision** | All sections updated from v2.0 baseline. New in v3.0: Section 5 (Use Case View), Section 14 (Behavior View — three sequence diagrams), Section 15 (View Consistency and Cross-View Traceability). Utility Tree expanded to 16 scenarios. ADD Iteration Log formalised (5 iterations). Interface contracts updated with error-handling specifications. |
| **Content Owner** | FlashLearn Architecture Team |
| **Source Artifacts** | SRS v2.0, Utility Tree V2, User Stories V2, FlashLearn\_Algorithm v1.0 |

## **1.2  Purpose and Scope of the SAD** {#1.2-purpose-and-scope-of-the-sad}

| CONTENTS: Overall purpose, scope, and the criteria for deciding which design decisions are architectural. |
| :---- |

This SAD specifies the software architecture for FlashLearn, a web-based English vocabulary learning platform supporting spaced-repetition study, offline resilience, and resource-level access control.

The document translates requirements from three source artifacts into a coherent, multi-view architectural description satisfying IEEE 1471 and the 4+1 View Model (Kruchten, 1995). It applies:

* Chapter 8 — Architectural Design principles: Separation of Concerns, Low Coupling, High Cohesion, Single Responsibility.  
* Chapter 9 — Attribute-Driven Design (ADD): Utility Tree → Architectural Drivers → QA Scenarios → Tactics → Iteration Log.  
* Chapter 10 — Architecture Documentation: Module View, Component & Connector View, Deployment View, Use Case View, and Behavior View (full 4+1 model).

Design decisions documented in this SAD are those that: (a) affect how elements interact across layer or component boundaries; (b) address a rated Architectural Driver (BV=H, TR∈{H,M}); or (c) establish a cross-cutting constraint such as authentication, transaction scope, or offline synchronisation. Private implementation details within a single module are not architectural and are not documented here.

## **1.3  How the SAD Is Organised** {#1.3-how-the-sad-is-organised}

| CONTENTS: Narrative description of each section and what information it contains. |
| :---- |

| Section 1 — Documentation Roadmap | Provides roadmap, version info, scope, stakeholders, viewpoint definitions, and conventions used throughout. |
| :---- | :---- |
| **Section 2 — Architecture Background** | Explains why the architecture is what it is: system overview, goals, constraints, significant driving requirements, architectural approaches, and requirements coverage. |
| **Section 3 — Use Case View** | Formal Use Case View (4+1 Scenarios View): actors, UML use-case groupings, architecturally significant use cases. |
| **Section 4 — Module View (Logical View)** | Layered architecture diagram, module dependency diagram, interface contracts with error handling, element catalog, and design rationale. |
| **Section 5 — C\&C View (Process View)** | Runtime components, connectors with types and multiplicity, request-flow narratives, element catalog. |
| **Section 6 — Deployment View** | V1.0 single-server deployment and V2.0 horizontally scaled topology with port mapping and rationale. |
| **Section 7 — Behavior View** | Three sequence diagrams: UC-21 online review, UC-21 offline sync, UC-24 authorization enforcement. |
| **Section 8 — Relations Among Views** | Cross-view element traceability matrix and consistency verification. |
| **Section 9 — Quality Attribute Scenarios** | Seven ADD scenarios using the 6-part template (Source / Stimulus / Environment / Artifact / Response / Measure). |
| **Section 10 — Architectural Tactics** | 21 tactics grouped by QA, cross-impact analysis, and tactic-to-scenario summary matrix. |
| **Section 11 — Design Decisions & Rationale** | Five major decisions, trade-off summary, and three rejected alternative architectures. |
| **Section 12 — ADD Iteration Log** | Five ADD iterations tracing Utility Tree → Drivers → Decisions → Elements. |
| **Section 13 — Requirements Coverage** | 22-row mapping of use cases and NFRs to architectural components and drivers. |
| **Section 14 — Referenced Materials** | Citations for IEEE 1471, Bass 2003, Clements 2002, SM-2 algorithm, and RFC 7519\. |
| **Section 15 — Directory** | Index of key elements, glossary of terms, and acronym list. |

## **1.4  Stakeholder Representation** {#1.4-stakeholder-representation}

| CONTENTS: Stakeholder roles, their concerns, and the viewpoints that address them. |
| :---- |

**Table 1:  Stakeholders and Relevant Viewpoints**

| Stakeholder | Primary Concerns | Viewpoints That Apply |
| :---- | :---- | :---- |
| Learner (End User) | Study session latency (≤500ms), offline availability, data privacy, intuitive UI. | Use Case View, Behavior View, Deployment View |
| Administrator | Resource-level authorization — cannot mutate other users' data. Read-only deck access. | Use Case View, Behavior View (UC-24) |
| Application Developer | Low coupling, testability, interface contracts, clear module boundaries, no circular dependencies. | Module View, C\&C View |
| DevOps / Infrastructure | Deployment topology, Docker config, horizontal scaling procedure, port mapping, health endpoints. | Deployment View |
| Security Engineer | JWT strategy, bcrypt rounds, brute-force protection, HTTPS enforcement, data isolation. | Module View, C\&C View, Behavior View |
| Project Manager | Requirements coverage, ADD traceability, work-assignment-aligned modules, schedule risk. | All views, ADD Iteration Log |
| Architect / Examiner | ADD chain completeness, view consistency, alternative architectures, tactic cross-impact. | All views, Sections 10–13, 15 |
| Tester / QA | Testable interfaces, pure-function SM2Service, repository mock-ability, transaction rollback behaviour. | Module View, Behavior View |

## **1.5  Viewpoint Definitions** {#1.5-viewpoint-definitions}

This SAD employs the IEEE 1471-2000 stakeholder-focused, multiple-view approach. Four viewpoints are defined below; each has a corresponding view in Section 3–7.

### **1.5.1  Module (Logical) Viewpoint Definition** {#1.5.1-module-(logical)-viewpoint-definition}

#### **1.5.1.1  Abstract**

Views conforming to this viewpoint partition the system into a unique, non-overlapping, hierarchically organised set of implementation units (modules) arranged in layers, and specify the dependency relations among them.

#### **1.5.1.2  Stakeholders and Concerns Addressed**

* Developers: what functional responsibility is assigned to each module; what module interfaces must be implemented.  
* Testers: which modules can be unit-tested in isolation (e.g., SM2Service — zero dependencies).  
* Maintainers: which modules are affected by a given change (Low Coupling evidence).  
* Project Managers: work-assignment boundaries aligned with layered decomposition.

#### **1.5.1.3  Elements, Relations, Properties, and Constraints**

Elements: modules (layers, services, repositories, controllers). Relations: uses (allowed dependency), is-part-of (layer membership). Properties: name, layer, responsibility, interface contracts. Constraints: all dependencies flow downward only; no controller calls a repository directly.

#### **1.5.1.4  Languages to Model/Represent Conforming Views**

UML 2.5 component diagram (module dependency), layered box diagram, tabular element catalog, interface contract tables.

#### **1.5.1.5  Applicable Evaluation/Analysis Techniques**

Completeness: every use case maps to at least one module. Consistency: no upward dependencies in Module Dependency Diagram. ATAM scenario-based evaluation for Low Coupling. Unit-test coverage achievable for SM2Service (pure function).

#### **1.5.1.6  Viewpoint Source**

Clements 2002, Section 2.1 (Module Decomposition style). Bass, Clements, Kazman — Software Architecture in Practice, 3rd ed. (ADD methodology).

### **1.5.2  Component-and-Connector (Process) Viewpoint Definition** {#1.5.2-component-and-connector-(process)-viewpoint-definition}

#### **1.5.2.1  Abstract**

Views conforming to this viewpoint describe the system's runtime components and the typed connectors through which they communicate, along with connector multiplicity and synchronisation mode.

#### **1.5.2.2  Stakeholders and Concerns Addressed**

* Developers: which components communicate, via which protocol, with what multiplicity.  
* Security Engineers: connector types confirm HTTPS enforcement and JWT propagation path.  
* Performance Analysts: connector synchrony and pool sizes relevant to latency targets.

#### **1.5.2.3  Elements, Relations, Properties, and Constraints**

Elements: components (Browser SPA, Nginx, Node.js App, SM2Service, PostgreSQL DB). Connectors: C1 HTTPS REST, C2 HTTP internal, C3 in-process, C4 SQL/TCP, C5 HTTP Batch. Properties: sync/async, multiplicity, protocol, JWT carriage. Constraints: DB reachable only from Node.js containers; C3 zero serialisation.

#### **1.5.2.4  Languages**

UML 2.5 component diagram with connector stereotypes, tabular connector catalog, numbered request-flow narratives.

#### **1.5.2.5  Evaluation Techniques**

Verify no component bypasses authentication middleware. Verify connection pool size consistent with DB max\_connections. Confirm C5 batch connector is only path for offline sync.

#### **1.5.2.6  Viewpoint Source**

Clements 2002, Section 4 (Component-and-Connector style). Kruchten 1995 (Process View).

### **1.5.3  Deployment (Allocation) Viewpoint Definition** {#1.5.3-deployment-(allocation)-viewpoint-definition}

#### **1.5.3.1  Abstract**

Views conforming to this viewpoint show the mapping of software components onto physical or virtual execution environments (Docker containers, VMs, user devices) and the network connectors between them.

#### **1.5.3.2  Stakeholders and Concerns Addressed**

* DevOps: Docker container configuration, port exposure, persistent volume mounting.  
* Security Engineers: network isolation — which ports are exposed externally vs. Docker-internal only.  
* Architects: horizontal scaling topology and stateless design enabling v2.0 growth.

#### **1.5.3.3  Elements, Relations, Properties, and Constraints**

Elements: execution nodes (User Device/Browser, Docker Host, VPS/Cloud VM), containers (nginx, node:18-alpine, postgres:15-alpine). Relations: deployed-on, communicates-over. Properties: port, protocol, network zone (public/internal). Constraints: PostgreSQL port :5432 not exposed externally; only Nginx port :443 is public-facing.

#### **1.5.3.4  Languages**

UML 2.5 deployment diagram (node/artifact notation), port mapping table.

#### **1.5.3.5  Evaluation Techniques**

Port mapping table audit: all DB ports must be internal-only. Stateless guarantee check: no Node.js instance stores session state.

#### **1.5.3.6  Viewpoint Source**

Clements 2002, Section 6 (Deployment style). Kruchten 1995 (Physical View).

### **1.5.4  Use Case / Behavior Viewpoint Definition** {#1.5.4-use-case-/-behavior-viewpoint-definition}

#### **1.5.4.1  Abstract**

Views conforming to this viewpoint capture the architecturally significant scenarios that drive and validate the architecture, showing how architectural elements collaborate at runtime to realise use-case goals.

#### **1.5.4.2  Stakeholders and Concerns Addressed**

* Users and Product Owners: confirmation that system supports described functional flows.  
* Architects / Examiners: validation that every element in Module and C\&C views participates in at least one runtime scenario.  
* Testers: expected interaction sequences for integration test case derivation.

#### **1.5.4.3  Elements, Relations, Properties, and Constraints**

Elements: actors (Guest, Learner, Admin, System), use cases, lifelines (in sequence diagrams), messages, transaction boundaries. Relations: association (actor–use case), uses, include, synchronous/asynchronous message. Constraints: SM2Service receives no asynchronous calls; all v1.0 flows are synchronous.

#### **1.5.4.4  Languages**

UML 2.5 Use Case Diagram, UML 2.5 Sequence Diagrams.

#### **1.5.4.5  Evaluation Techniques**

Completeness: every ASUC (Table in Section 3\) has at least one sequence diagram or narrative. Cross-view consistency: every lifeline in sequence diagrams maps to an element in Module and C\&C views.

#### **1.5.4.6  Viewpoint Source**

Kruchten 1995 (Scenarios / Use Case View). Clements 2002, Chapter 10\.

## **1.6  How a View is Documented** {#1.6-how-a-view-is-documented}

| CONTENTS: Standard organisation used to document each architectural view in this SAD. |
| :---- |

Each view in Sections 3–7 follows this structure:

* View Description — purpose, conforming viewpoint, and scope of the view.  
* View Packet Overview — list of view packets and rationale for the chosen decomposition.  
* Architecture Background — constraints and drivers specific to this view.  
* Variability Mechanisms — any architectural variabilities described by this view.  
* View Packets — one or more packets, each containing:  
* Primary Presentation — diagram or notation representing elements and relations.  
* Element Catalog — elements, relations, interfaces, behavior, constraints.  
* Context Diagram — system context and external interactions.  
* Variability Mechanisms — view-packet-specific variabilities.  
* Architecture Background — rationale for decisions scoped to this packet.  
* Related View Packets — references to parent, child, and sibling packets.

## **1.7  Relationship to Other SADs** {#1.7-relationship-to-other-sads}

Not applicable. FlashLearn v1.0 is a single-system deployment; no parent system-of-systems architecture document exists. The SRS v2.0 and User Stories V2 are source requirements documents, not architecture documents.

## **1.8  Process for Updating this SAD** {#1.8-process-for-updating-this-sad}

To report discrepancies, errors, inconsistencies, or omissions: (1) Identify the section number and nature of the issue. (2) Submit a written report to the Content Owner (FlashLearn Architecture Team) including proposed correction. (3) The Content Owner will review, update the affected sections, increment the revision number, and update Section 1.1 with a summary of changes. All revisions must be approved by the Content Owner prior to release. This document was last saved: April 2026\.

# **2  Architecture Background** {#2-architecture-background}

## **2.1  Problem Background** {#2.1-problem-background}

### **2.1.1  System Overview** {#2.1.1-system-overview}

| CONTENTS: General function and purpose of FlashLearn. |
| :---- |

FlashLearn is a web-based English vocabulary learning platform that enables learners to create flashcard decks, study using the SM-2 spaced-repetition algorithm, track progress through statistics, and continue studying offline when network connectivity is unavailable. The system supports three actor classes — Guest (unauthenticated), Learner (registered user), and Administrator — and enforces resource-level data isolation such that each user's decks and cards are accessible only to their creator, with read-only admin oversight.

The system comprises 24 use cases (UC-01 through UC-24) across five functional groups: User Management, Deck Management, Card Management & I/O, Study Activities, and Admin & Advanced Authorization.

### **2.1.2  Goals and Context** {#2.1.2-goals-and-context}

| CONTENTS: Goals and major contextual factors for the software architecture. |
| :---- |

Primary architectural goals, in priority order:

* Study session performance: due-card query ≤ 500ms P95 on a 50,000-card database (AD-01, highest BV+TR rating).  
* Offline availability: reviews queued locally in browser IndexedDB during network outage; zero data loss; batch sync on reconnect (AD-02, highest Technical Risk).  
* Resource-level authorization: owner-only mutation of decks and cards enforced at middleware tier (AD-03).  
* Reliability: all mutations wrapped in atomic DB transactions with rollback on failure (AD-04).  
* Authentication security: JWT stateless tokens \+ brute-force lockout after 5 failures (AD-05).  
* Data confidentiality: password\_hash never exposed in API responses; HTTPS-only (AD-06).  
* Scalability: pagination for 100+ decks ≤ 1s; architecture supports horizontal scaling in v2.0 without code changes (AD-07).

Contextual constraints:

* Web-based SPA (React) in browser; no native mobile app in v1.0.  
* Single-server Docker deployment in v1.0; stateless design must enable horizontal scaling for v2.0.  
* Team expertise in Node.js/JavaScript; relational DB required for ACID transactions and aggregation queries.

### **2.1.3  Significant Driving Requirements** {#2.1.3-significant-driving-requirements}

| CONTENTS: Behavioral and quality attribute requirements that shaped the architecture, derived from the Utility Tree. |
| :---- |

The following Architectural Drivers are extracted from the Utility Tree (Section 9\) by the criterion BV=H AND TR∈{H,M}. Each driver must be traceable from Utility Tree → QA Scenario → Tactic → Design Decision → Implementation Element.

| Driver ID | Quality Attribute | Scenario Summary | BV | TR |
| :---- | :---- | :---- | :---- | :---- |
| AD-01 | Performance / Latency | Due-card query ≤ 500ms on 50k-card DB | H | H |
| AD-02 | Availability / Offline | Study continues offline; sync on reconnect | M | H |
| AD-03 | Security / Authorization | Resource-level auth: owner-only mutation (UC-24) | H | M |
| AD-04 | Reliability / Transactions | All mutations atomic with rollback on failure | H | M |
| AD-05 | Security / Authentication | JWT auth \+ brute-force lockout after 5 failures | H | M |
| AD-06 | Security / Confidentiality | password\_hash never sent to client | H | M |
| AD-07 | Scalability / Data Volume | 100+ decks load ≤ 1s via pagination | H | M |

## **2.2  Solution Background** {#2.2-solution-background}

### **2.2.1  Architectural Approaches** {#2.2.1-architectural-approaches}

| CONTENTS: Rationale for major design decisions, architectural styles, patterns, and rejected alternatives. |
| :---- |

**Decision 1 — 4-Layer Architecture (AD-01, AD-04, AD-07):**  
Presentation → Business Logic → Data Access → Database. DB index optimization (T1) is localised to the Data Access Layer without propagating to Business or Presentation layers. Transaction management resides in ReviewService, isolated from HTTP routing. Pagination was added to DeckRepository without altering DeckController's API contract.

**Decision 2 — Offline-First Architecture (AD-02):**  
Browser IndexedDB \+ OfflineSyncService for offline review queuing and batch reconciliation. AD-02 carries the highest Technical Risk (H). IndexedDB is selected over localStorage: asynchronous, transaction-safe, larger capacity, no serialisation overhead. Batch sync preferred over per-review retry to prevent repeated partial states during fluctuating connectivity.

**Decision 3 — ResourceAuthMiddleware (AD-03):**  
Role-based authorization alone is insufficient for UC-24: two Administrators must not mutate each other's data despite sharing the same role. Middleware pattern eliminates ownership-check duplication across controllers. DeckRepository.findByIdAndOwner() combines ownership verification with resource existence in a single SQL statement.

**Decision 4 — Server-side SM-2 as Pure Function (testability, security):**  
Client-side execution would allow users to forge SM-2 results. A pure function (SM2Service) with no I/O is verifiable by mathematical unit tests without infrastructure dependencies. Single authoritative implementation guarantees identical scheduling across platforms.

**Decision 5 — Technology Stack:**  
Node.js \+ Express (JSON-native, JWT/bcrypt ecosystem, non-blocking I/O). PostgreSQL 15+ (ACID transactions for AD-04, composite indexes for AD-01, SQL GROUP BY for statistics). JWT in HttpOnly SameSite=Strict cookie (prevents XSS token theft vs. localStorage). Docker \+ Nginx (network isolation, SSL termination, rate limiting, horizontal scale via upstream config).

**Rejected Alternative 1 — Microservices Architecture:**  
Rejected because: (a) complexity disproportionate to v1.0 scale (\<100 concurrent users); (b) SM-2 recalculation requires atomic card+review update — distributed transaction (saga) adds consistency risk; (c) single-team project. Module boundaries are service-aligned for future extraction.

**Rejected Alternative 2 — Monolithic MPA (server-rendered):**  
Rejected because: AD-02 offline requirement mandates IndexedDB/Service Worker — natural in SPA, awkward in MPA. REST API supports future mobile clients. Flashcard flip interaction requires client-side state management natural in React.

**Rejected Alternative 3 — GraphQL API:**  
Rejected because: adds schema, resolver, N+1 query (DataLoader), and client validation complexity. REST with DTO filtering (T2) achieves the same over-fetching reduction. REST responses are HTTP-cacheable; GraphQL POST requests are not.

### **2.2.2  Analysis Results** {#2.2.2-analysis-results}

| CONTENTS: Quantitative or qualitative analyses providing evidence the architecture is fit for purpose. |
| :---- |

* Performance (AD-01): EXPLAIN ANALYZE confirms index scan (not sequential scan) on composite index cards(deckId, userId, nextReviewDate). Query execution ≤ 300ms on 50k-record dataset. SM2Service pure-function execution \< 1ms — no async overhead justified.  
* Security (AD-03): 100% of cross-user DELETE/PATCH attempts blocked by ResourceAuthMiddleware in integration tests. DeckController never invoked on authorization failure — confirmed by test instrumentation.  
* Offline (AD-02): 0 review outcomes lost in network-drop simulation tests. Batch sync completes ≤ 5s for 30 queued reviews on reconnect.  
* Reliability (AD-04): Intentional connection kill mid-transaction confirms PostgreSQL rollback. Zero partial states observed across 100 test iterations.  
* Scalability (AD-07): findByUserIdPaginated() returns first page ≤ 1s for 150-deck dataset. Index on decks(userId, updated\_at) confirmed active.

### **2.2.3  Requirements Coverage** {#2.2.3-requirements-coverage}

| CONTENTS: Requirements addressed by the architecture, with location in the architecture. |
| :---- |

See Section 13 for the complete 22-row Requirement → Architecture Mapping table. Summary:

* All 24 use cases (UC-01 through UC-24) map to at least one architectural component.  
* All 7 Architectural Drivers (AD-01 through AD-07) map to at least one QA Scenario, Tactic, Design Decision, ADD Iteration, and code element.  
* All NFRs (Performance, Security, Availability, Scalability, Reliability) are addressed by the ADD tactic set (21 tactics, Section 10).

### **2.2.4  Summary of Background Changes Reflected in Current Version** {#2.2.4-summary-of-background-changes-reflected-in-current-version}

V3.0 changes from V2.0 baseline:

* Added formal Use Case View (Section 3\) with UML notation and Architecturally Significant Use Cases table.  
* Added Behavior View (Section 7\) with three sequence diagrams: UC-21 online, UC-21 offline, UC-24 authorization denial.  
* Added Section 8 (View Consistency & Cross-View Traceability) with element traceability matrix and 6-point consistency verification.  
* Expanded Utility Tree to 16 scenarios. ADD Iteration Log formalised to 5 iterations with explicit element creation records.  
* Interface contracts (Section 4.1.5.3) updated with explicit error-handling specifications per interface method.  
* Three alternative architectures (Microservices, MPA, GraphQL) documented with rejection rationale.  
* Tactic cross-impact analysis matrix added (Section 10.5). AdminView element added to element catalog.

## **2.3  Product Line Reuse Considerations** {#2.3-product-line-reuse-considerations}

FlashLearn v1.0 is not a product line. However, the following extensibility properties are designed in:

* Algorithm swap: SM2Service is a single-class replacement — SM-5 or FSRS replaces SM-2 with zero impact on ReviewService or repositories.  
* Mobile client: REST API is platform-agnostic; OfflineSyncService logic is portable to React Native / Flutter IndexedDB equivalents.  
* Microservices migration: SM2Service, StatisticsService, and ImportExportService are service-boundary-aligned and extractable without architectural refactoring.  
* RBAC expansion: ResourceAuthMiddleware is extensible to multi-level ownership (team decks, shared collections) by inserting a policy engine behind the middleware.

# **3  Use Case View** {#3-use-case-view}

## **3.1  View Description** {#3.1-view-description}

The Use Case View (Scenarios View in the 4+1 model) captures the architecturally significant use cases that drive the architecture. It serves as the unifying view that validates all other views by demonstrating that each architectural element participates in at least one significant scenario. This view conforms to the Use Case / Behavior Viewpoint defined in Section 1.5.4.

## **3.2  View Packet Overview** {#3.2-view-packet-overview}

This view contains one view packet covering all 24 use cases, organised by functional group, with the Architecturally Significant Use Cases (ASUCs) identified separately.

## **3.3  Architecture Background** {#3.3-architecture-background}

The Use Case View is the primary driver input for ADD. The seven ASUCs below carry the highest BV+TR ratings in the Utility Tree and directly shaped the module decomposition, middleware chain, and offline architecture.

## **3.4  Variability Mechanisms** {#3.4-variability-mechanisms}

Guest actor scope is fixed to public pages (registration, landing). Admin read-only access to all decks (UC-24) is enforced by ResourceAuthMiddleware — expanding Admin mutation rights requires only a policy change in the middleware, not a controller change.

## **3.5  View Packets** {#3.5-view-packets}

### **3.5.1  View Packet 1: Use Cases by Functional Group** {#3.5.1-view-packet-1:-use-cases-by-functional-group}

#### **3.5.1.1  Primary Presentation**

Actors: Guest, Learner, Administrator, System.

| Functional Group | Use Cases | Primary Actors | Primary QA Concerns |
| :---- | :---- | :---- | :---- |
| User Management | UC-01 Register, UC-02 Login, UC-03 Logout, UC-04 View Profile, UC-05 Update Profile, UC-06 Delete Account | Guest (UC-01,02), Learner | Security (Auth, Confidentiality, Brute-Force) |
| Deck Management | UC-07 View Library, UC-08 Create Deck, UC-09 Edit Deck, UC-10 Delete Deck, UC-11 View Stats, UC-12 View Adv. Stats | Learner | Performance (Latency), Scalability (Pagination) |
| Card Management & I/O | UC-13 Browse Cards, UC-14 Add Card, UC-15 Edit Card, UC-16 Delete Card, UC-17 View Card Stats, UC-18 Import JSON, UC-19 Export JSON | Learner | Interoperability, Reliability, Integrity |
| Study Activities | UC-20 Start Session, UC-21 Review Outcome, UC-22 Session Summary, UC-23 Session Stats | Learner | Performance (H,H), Availability/Offline (M,H), Reliability |
| Admin & Authorization | UC-24 Resource-Level Auth | Administrator | Security (Authorization H,M) |

#### **3.5.1.2  Architecturally Significant Use Cases**

| ASUC | Driver | Architectural Significance |
| :---- | :---- | :---- |
| UC-02 Login | AD-05 | JWT issuance \+ BruteForceGuard. Establishes authentication strategy for all secured endpoints. |
| UC-14 Add Card | — | SM-2 parameter initialisation (Interval=0, Reps=0, EFactor=2.5). BIDIRECTIONAL auto-reverse. Impacts card schema design. |
| UC-20 Start Session | AD-01 | Critical query: findDueCards(). Drives composite index design. Must complete ≤ 500ms. |
| UC-21 Review Outcome | AD-02, AD-04 | SM-2 recalculation \+ atomic transaction. Offline cache requirement. Two distinct paths (online/offline). |
| UC-11/12 Statistics | AD-07 | Aggregation queries across cards+reviews. Drive SQL GROUP BY and pagination decisions. |
| UC-18 Import JSON | — | Batch insert operation. Schema validation loop. Drives bulk-operation architecture (batchInsert). |
| UC-24 Authorization | AD-03 | Resource-Level Authorization middleware. Ownership verification per mutating request. DeckCtrl never invoked on failure. |

# **4  Module View (Logical View)** {#4-module-view-(logical-view)}

## **4.1  View Description** {#4.1-view-description}

The Module View partitions FlashLearn into implementation units arranged in four layers. It shows the dependency relations among modules (all downward), demonstrates Low Coupling and High Cohesion, and specifies interface contracts with error handling. This view conforms to the Module (Logical) Viewpoint defined in Section 1.5.1.

## **4.2  View Packet Overview** {#4.2-view-packet-overview}

This view contains two view packets: (1) the Layered Architecture showing the four-layer decomposition, and (2) the Module Dependency Diagram showing inter-module dependencies proving Low Coupling.

## **4.3  Architecture Background** {#4.3-architecture-background}

The Layered Architecture was chosen as Decision 1 (Section 2.2.1) because: DB index optimization (AD-01) is localised to Data Access Layer; transaction management (AD-04) resides in ReviewService; pagination (AD-07) was added to DeckRepository without altering DeckController. The 4-layer call stack adds 2–5ms per request — negligible relative to the 500ms performance target.

## **4.4  Variability Mechanisms** {#4.4-variability-mechanisms}

SM2Service is a swappable pure function — replacing SM-2 with SM-5 or FSRS requires changes to SM2Service only, with zero cascade to ReviewService, CardRepository, or controllers. PostgreSQL can be swapped for another RDBMS by replacing only the Data Access Layer implementations.

## **4.5  View Packets** {#4.5-view-packets}

### **4.5.1  View Packet 1: Layered Architecture** {#4.5.1-view-packet-1:-layered-architecture}

#### **4.5.1.1  Primary Presentation**

\[Layered Architecture Diagram — four horizontal layers with downward arrows\]

| Layer | Technology | Components |
| :---- | :---- | :---- |
| Presentation Layer | React SPA / HTML+CSS+JS | LoginPage, RegisterPage, Dashboard, DeckView, CardView, StudySessionView, StatisticsView, AdminView, OfflineCacheUI |
| Business Logic Layer | Node.js \+ Express | AuthController, AuthService, BruteForceGuard, AuthMiddleware, ResourceAuthMiddleware, DeckController, DeckService, CardController, CardService, StudyController, ReviewService, SM2Service, StatisticsService, ImportExportService, OfflineSyncService |
| Data Access Layer | ORM / Repository interfaces | UserRepository, DeckRepository, CardRepository, ReviewRepository |
| Database Layer | PostgreSQL 15+ | Tables: users, decks, cards, reviews, login\_attempts, offline\_queue. Indexes: cards(deckId,userId,nextReviewDate), decks(userId,updated\_at) |

#### **4.5.1.2  Element Catalog — Elements**

| Element | Layer | Responsibility | Driver |
| :---- | :---- | :---- | :---- |
| StudySessionView | Presentation | Flashcard review UI; offline detection banner; local queue counter | AD-02 |
| AdminView | Presentation | View-only deck browser for Admin actor (UC-24) | AD-03 |
| OfflineCacheUI | Presentation | Detects navigator.onLine; routes submissions to IndexedDB when offline; shows status banner | AD-02 |
| AuthController | Business | POST /auth/register, /auth/login, /auth/logout; delegates to AuthService \+ BruteForceGuard | AD-05 |
| BruteForceGuard | Business | Tracks login\_attempts per (email,IP); locks after 5; auto-unlocks; fail-open on DB error | AD-05 |
| ResourceAuthMiddleware | Business | Intercepts PATCH/DELETE on /decks/:id, /cards/:id; calls findByIdAndOwner(); 403 on null | AD-03 |
| SM2Service | Business | Pure function: calculate(card, rating) → SM2Result; no I/O; fully unit-testable; zero dependencies | AD-01 |
| ReviewService | Business | SM-2 update in atomic transaction; server-side batch reconciliation for offline syncs | AD-04 |
| StatisticsService | Business | SQL aggregation; paginated queries; degrades gracefully on DB failure (T16) | AD-07 |
| ImportExportService | Business | JSON schema validation; skip-invalid strategy; batch insert; Content-Disposition export header | — |
| OfflineSyncService | Business | Browser-side: queues reviews in IndexedDB. Server-side: batch reconciliation endpoint | AD-02 |
| DeckRepository | Data Access | findByUserIdPaginated(); findByIdAndOwner(); CRUD; cascade-delete transaction initiator | AD-03, AD-07 |
| CardRepository | Data Access | findDueCards() \[composite index\]; batchInsert() \[bulk INSERT\]; CRUD | AD-01 |
| ReviewRepository | Data Access | create() \[in transaction\]; aggregateStats() \[SQL GROUP BY\]; deleteAllReviews() | AD-04 |
| UserRepository | Data Access | CRUD on users; read/write login\_attempts; implements recordAttempt() | AD-05 |

#### **4.5.1.3  Relations**

All inter-layer relations are uses (downward only). No element in layer N uses an element from layer N-1 or above. No controller calls a repository directly — all data access is mediated through services. SM2Service has zero dependencies (pure function).

#### **4.5.1.4  Interfaces**

Key Interface Contracts with Error Handling:

| Interface | Method Signature | Success Return | Error Response |
| :---- | :---- | :---- | :---- |
| CardRepository | findDueCards(deckId:UUID, userId:UUID, today:Date): Promise\<Card\[\]\> | Sorted Card\[\] (overdue first, then new) | Throws DbConnectionError → ReviewService catches → 503 |
| CardRepository | batchInsert(cards:CardDTO\[\], deckId:UUID): Promise\<ImportResult\> | {created:N, skipped:M} | Throws ValidationError per item → item skipped (not thrown) |
| DeckRepository | findByUserIdPaginated(userId, page, size): Promise\<PageResult\<Deck\>\> | {decks:Deck\[\], total:int, page:int} | Throws DbConnectionError → 503\. Empty → {decks:\[\],total:0} |
| DeckRepository | findByIdAndOwner(deckId:UUID, userId:UUID): Promise\<Deck|null\> | Deck if owner; null if not owner or not found | Throws DbConnectionError → 503\. null → ResourceAuthMW sends 403 |
| SM2Service | calculate(card:Card, rating:Rating): SM2Result | {interval:int, eFactor:float, nextDate:Date} | Throws InvalidRatingError if rating not in enum → ReviewService sends 400 |
| BruteForceGuard | recordAttempt(email:string, ip:string): Promise\<GuardResult\> | {locked:bool, attemptsLeft:int, lockoutUntil?} | Throws DbConnectionError → fail-open (login proceeds; logged) |
| OfflineSyncService | syncPending(): Promise\<SyncResult\> | {synced:int, failed:int, errors:string\[\]} | Network error → retry with exponential backoff (max 3); partial result returned |

#### **4.5.1.5  Behavior**

See Section 7 (Behavior View) for sequence diagrams showing the runtime behavior of the study review flow (UC-21), offline sync flow (UC-21 offline), and authorization enforcement (UC-24).

#### **4.5.1.6  Constraints**

* All dependencies flow downward only — no module in layer N depends on a module in layer N-1 or above.  
* No controller calls a repository directly — Data Access Layer access is exclusively through Services.  
* SM2Service must remain a pure function with zero I/O dependencies (testability guarantee for AD-01).  
* ResourceAuthMiddleware must be the sole ownership-check insertion point for all mutating endpoints.

#### **4.5.1.7  Context Diagram**

External context: Browser SPA (Presentation Layer) communicates with Business Logic Layer via HTTP/REST with JWT. PostgreSQL DB (Database Layer) communicates with Data Access Layer via parameterised SQL over TCP :5432 (Docker internal only). Browser IndexedDB communicates with OfflineSyncService (Browser-side Business Logic) via the Web Storage API.

#### **4.5.1.8  Architecture Background (view-packet level)**

Rationale for Layered Architecture is provided in Section 2.2.1 Decision 1\. Trade-off: 4-layer call stack adds 2–5ms per request, accepted because this is negligible relative to the 500ms performance target and the Low Coupling benefits justify the overhead.

#### **4.5.1.9  Related View Packets**

View Packet 4.5.2 (Module Dependency Diagram) specialises this view by showing the inter-module dependency graph. Section 5 (C\&C View) shows the runtime manifestation of these modules as components. Section 7 (Behavior View) shows dynamic interactions.

### **4.5.2  View Packet 2: Module Dependency Diagram** {#4.5.2-view-packet-2:-module-dependency-diagram}

#### **4.5.2.1  Primary Presentation**

\[Module Dependency Diagram — component diagram with colour-coded layers, all arrows pointing downward\]

Dependency summary (all downward):

* StudyController → ReviewService, SM2Service, CardRepository  
* DeckController → DeckService → DeckRepository  
* AuthController → AuthService → UserRepository; AuthController → BruteForceGuard → UserRepository (login\_attempts)  
* ResourceAuthMiddleware → DeckRepository (findByIdAndOwner — single query)  
* StatisticsService → ReviewRepository, CardRepository  
* ImportExportService → CardRepository (batchInsert only)  
* ReviewService → ReviewRepository, OfflineSyncService (outbound: server-side reconcile)  
* SM2Service — zero dependencies (pure function)

#### **4.5.2.2  Rationale**

Low Coupling evidence: adding pagination to DeckRepository requires zero changes to DeckController. Replacing PostgreSQL requires changes only in the Data Access Layer. SM2Service's zero-dependency design enables mathematical unit testing without a live database. The Module Dependency Diagram contains no cycles and no upward dependencies.

# **5  Component-and-Connector View (Process View)** {#5-component-and-connector-view-(process-view)}

## **5.1  View Description** {#5.1-view-description}

The C\&C View describes the system's runtime components, the typed connectors through which they communicate, and their runtime properties including synchrony, multiplicity, and protocol. It conforms to the Component-and-Connector Viewpoint defined in Section 1.5.2.

## **5.2  View Packet Overview** {#5.2-view-packet-overview}

Two view packets: (1) the C\&C Diagram with connector catalog, and (2) request-flow narratives for the two primary runtime paths (online review submission and offline sync).

## **5.3  Architecture Background** {#5.3-architecture-background}

Client-Server pattern: SM-2 and business rules reside on the server, preventing client-side manipulation. ResourceAuthMiddleware is a cross-cutting concern placed at the connector entry point into the business layer. Connection pool (max 10, C4) balances resource utilisation against PostgreSQL connection limits.

## **5.4  Variability Mechanisms** {#5.4-variability-mechanisms}

In v2.0, C2 multiplicity changes from 1 Nginx : 1 Node.js to 1 Nginx : N Node.js (horizontal scaling). This requires only an Nginx upstream block update — zero component code changes.

## **5.5  View Packets** {#5.5-view-packets}

### **5.5.1  View Packet 1: C\&C Diagram and Connector Catalog** {#5.5.1-view-packet-1:-c&c-diagram-and-connector-catalog}

#### **5.5.1.1  Primary Presentation**

\[C\&C Diagram — five components with five typed connectors, notes showing protocol/multiplicity\]

Connector Catalog:

| Connector | Type | Protocol | Sync | Multiplicity | Properties |
| :---- | :---- | :---- | :---- | :---- | :---- |
| C1 | HTTP/REST | HTTPS :443 | Sync | 1 SPA : 1 Nginx | JSON body; JWT in Authorization header; SSL termination at Nginx |
| C2 | HTTP | HTTP :3000 | Sync | 1 Nginx : 1 Node.js | Docker internal network only; not exposed externally |
| C3 | In-process | Direct fn call | Sync | 1:1 | Same heap; zero serialisation; SM2Service, AuthMiddleware, ResourceAuthMW |
| C4 | SQL/TCP | TCP :5432 | Sync | Pool max 10 per instance | Parameterised queries; Docker internal only; PostgreSQL 15+ |
| C5 | HTTP Batch | HTTPS :443 (batch) | Sync | 1:1 | Triggered by browser 'online' event; queued reviews flushed; POST /review/batch |

#### **5.5.1.2  Element Catalog**

| Component | Role | Connector (to) | Multiplicity |
| :---- | :---- | :---- | :---- |
| Browser SPA \+ OfflineCacheUI | UI rendering; offline review queue (IndexedDB) | C1 to Nginx; C5 to Node.js | 1 SPA : 1 Nginx |
| Nginx Reverse Proxy | SSL termination; rate limiting (limit\_req); static SPA | C2 to Node.js | 1 Nginx : 1 Node.js (v1.0) |
| AuthMiddleware | JWT verification; req.user population | C3 in-process | 1:1 per request |
| ResourceAuthMiddleware | Ownership check (UC-24); 403 on null | C3 \+ C4 to DeckRepo | 1:1 per mutating request |
| SM2Service | Pure SM-2 calculation (\< 1ms) | C3 from ReviewService | 1:1 function call |
| OfflineSyncService | Offline review queue flush; server-side reconcile | C4 to ReviewRepo (batch) | 1:N reviews per sync |
| CardRepository.findDueCards() | Indexed query for study session init | C4 to PostgreSQL | 1:N cards returned |
| PostgreSQL DB | Persistent data; ACID; indexes | C4 from Node.js | Connection pool max 10 |

#### **5.5.1.3  Request Flow — Online Review Submission (UC-21)**

1\. User clicks 'Good'. SPA: POST /api/study/review {cardId, rating:'GOOD'} \+ JWT.  
2\. Nginx (C1): SSL termination → proxies to Node.js:3000 (C2).  
3\. AuthMiddleware (C3): verifyJWT() → extracts userId → injects req.user.  
4\. ResourceAuthMiddleware (C3+C4): DeckRepo.findByIdAndOwner(deckId, userId) → confirms ownership. 403 if null.  
5\. StudyController → ReviewService.submitReview(cardId, 'GOOD', userId).  
6\. ReviewService → SM2Service.calculate(card, 'GOOD') → {interval:4, eFactor:2.6, nextDate:+4d} (C3).  
7\. BEGIN TX → CardRepo.update(card) → ReviewRepo.create(review) → COMMIT TX (C4).  
8\. CardRepo.findDueCards() → next card (or summary trigger if queue empty).  
9\. 200 OK {nextCard} → SPA renders next card front.

#### **5.5.1.4  Request Flow — Offline Sync (UC-21, AD-02)**

10\. navigator.onLine \= false detected. SPA shows offline banner.  
11\. User rates card → OfflineSyncService.queueReview({cardId,rating,ts}) → IndexedDB.  
12\. Session continues from locally cached card queue (zero server calls).  
13\. Browser 'online' event fires → OfflineSyncService.syncPending().  
14\. POST /api/study/review/batch \[{queued reviews}\] (C5). Server processes atomically.  
15\. 200 OK {synced:N} → IndexedDB cleared.

# **6  Deployment View** {#6-deployment-view}

## **6.1  View Description** {#6.1-view-description}

The Deployment View shows the mapping of software components onto physical and virtual execution environments. It conforms to the Deployment (Allocation) Viewpoint defined in Section 1.5.3.

## **6.2  View Packet Overview** {#6.2-view-packet-overview}

Two view packets: (1) V1.0 single-server deployment, and (2) V2.0 horizontally scaled topology.

### **6.2.1  View Packet 1: V1.0 Single-Server Deployment** {#6.2.1-view-packet-1:-v1.0-single-server-deployment}

#### **6.2.1.1  Primary Presentation**

\[V1.0 Deployment Diagram — User Device node containing Web Browser with SPA+IndexedDB; Docker Host node containing three containers: nginx, node:18-alpine, postgres:15-alpine\]

| User's Device — Web Browser | React SPA (JS bundle) \+ IndexedDB (offline\_queue). Communicates via HTTPS :443 to Nginx. |
| :---- | :---- |
| **Docker Host — nginx:latest** | \[:443 → :3000\]. SSL termination. rate\_limit (limit\_req). Static SPA assets served directly. |
| **Docker Host — node:18-alpine** | Express App. Controllers, Services, SM2Service. ENV: JWT\_SECRET, DB\_URL, BCRYPT\_ROUNDS, POOL\_MAX=10. |
| **Docker Host — postgres:15-alpine** | Persistent Volume mounted at /var/lib/pg/data. Port :5432 (Docker internal only, not exposed). |

### **6.2.2  View Packet 2: V2.0 Horizontally Scaled Deployment** {#6.2.2-view-packet-2:-v2.0-horizontally-scaled-deployment}

#### **6.2.2.1  Primary Presentation**

\[V2.0 Deployment Diagram — Internet → Load Balancer → N Node.js instances → PostgreSQL Primary \+ Read Replica\]

Scaling triggers: CPU \> 70% → add Node.js instance. RAM \> 80% → scale DB. Stateless guarantee: JWT self-contained, no session affinity required. DB isolation: only Node.js containers reach PostgreSQL.

#### **6.2.2.2  Port Mapping**

| Service | Internal Port | External Port | Protocol | Accessible From |
| :---- | :---- | :---- | :---- | :---- |
| Nginx / LB | :443 | 443 | HTTPS | Internet (all users) |
| Node.js App \#1 | :3001 | NOT exposed | HTTP | Docker internal only |
| Node.js App \#N | :300N | NOT exposed | HTTP | Docker internal only |
| PostgreSQL Primary | :5432 | NOT exposed | TCP/SQL | Node.js instances only |
| PostgreSQL Replica | :5433 | NOT exposed | TCP/SQL | StatisticsService only (read) |

#### **6.2.2.3  Architecture Background**

* Stateless Node.js (AD-01, AD-07): JWT carries all auth state. Adding instances requires only Nginx upstream block update — zero code changes.  
* Nginx load balancer doubles as SSL termination and rate limiter (AD-05) — no separate security appliance needed.  
* PostgreSQL read replica: StatisticsService aggregation queries are read-heavy; routing to replica reduces write-path latency (AD-01).  
* Docker persistent volume: DB data survives container restarts (AD-04). Must be backed by cloud-attached storage (EBS/GCP disk) in production.  
* Health endpoint GET /api/health: returns 200 OK with DB connectivity status — required for load balancer health checks.

# **7  Behavior View** {#7-behavior-view}

## **7.1  View Description** {#7.1-view-description}

The Behavior View is the fifth view of the 4+1 model. It captures the dynamic interactions of architecturally significant use cases, demonstrating how architectural elements collaborate at runtime. This view conforms to the Use Case / Behavior Viewpoint (Section 1.5.4). Every element in the Module View and C\&C View participates in at least one runtime scenario in this view.

Three scenarios are documented: UC-21 Online (AD-01, AD-04), UC-21 Offline (AD-02), and UC-24 Authorization Denied (AD-03).

## **7.2  View Packets** {#7.2-view-packets}

## 

### **7.2.1  Sequence Diagram 1 — UC-21 Review Outcome: Online Path \[AD-01, AD-04\]** {#7.2.1-sequence-diagram-1-—-uc-21-review-outcome:-online-path-[ad-01,-ad-04]}

![][image1]

### **7.2.2  Sequence Diagram 2 — UC-21 Offline Path \[AD-02\]** {#7.2.2-sequence-diagram-2-—-uc-21-offline-path-[ad-02]}

![][image2]

### **7.2.3  Sequence Diagram 3 — UC-24 Authorization Denied \[AD-03\]** {#7.2.3-sequence-diagram-3-—-uc-24-authorization-denied-[ad-03]}

![][image3]

# **8  Relations Among Views** {#8-relations-among-views}

## **8.1  General Relations Among Views** {#8.1-general-relations-among-views}

All architectural views in this document are derived from the same seven Architectural Drivers (AD-01 through AD-07) and describe the same FlashLearn system from complementary perspectives. No element, connector, or node that appears in one view contradicts the description provided in any other view. The following table and consistency checks formally assert this property.

## **8.2  View-to-View Relations — Cross-View Element Traceability** {#8.2-view-to-view-relations-—-cross-view-element-traceability}

| Element | Module View (Sec 4\) | C\&C View (Sec 5\) | Deployment View (Sec 6\) | Use Case View (Sec 3\) | Behavior View (Sec 7\) |
| :---- | :---- | :---- | :---- | :---- | :---- |
| SM2Service | Layer: Business (4.5.1) | C3 connector from StudyCtrl (5.5.1) | Inside node:18-alpine (6.2.1) | \<\<uses\>\> by UC-21 (3.5.1) | Step 6 in SD1 (7.2.1) |
| ResourceAuthMiddleware | Layer: Business (4.5.1) | Interceptor on C1→C2 (5.5.1) | Inside node:18-alpine (6.2.1) | Enforces UC-24 (3.5.1) | Step 3–4 in SD3 (7.2.3) |
| CardRepo.findDueCards() | Data Access Layer (4.5.2) | C4 SQL connector (5.5.1) | Node.js→PostgreSQL (6.2.1) | ASUC UC-20 (3.5.1) | Step 4, 8 in SD1 (7.2.1) |
| OfflineSyncService | Layer: Business (4.5.1) | C5 batch connector (5.5.1) | Browser+Node.js (6.2.1) | UC-21 offline (3.5.1) | Full flow in SD2 (7.2.2) |
| BruteForceGuard | Layer: Business (4.5.1) | In-process C3 from AuthCtrl | login\_attempts in PostgreSQL | UC-02 ASUC (3.5.1) | Implicit in S2 scenario |
| PostgreSQL DB | Database Layer (4.5.1) | C4 target node (5.5.1) | postgres:15-alpine (6.2.1) | Persistence for all UCs | DB at right edge, SD1–SD3 |

## **8.3  Consistency Verification** {#8.3-consistency-verification}

| Consistency Check | Status | Evidence |
| :---- | :---- | :---- |
| Same elements in Module and C\&C views | PASS | All components in C\&C (Sec 5\) are elements defined in Module View (Sec 4). No C\&C component exists without a module definition. |
| C\&C components map to Deployment nodes | PASS | Node.js App (C\&C) → node:18-alpine container (Deployment). PostgreSQL → postgres:15 container. Browser SPA → Web Browser node. |
| Use Cases covered by Behavior View | PASS | All 3 sequence diagrams correspond to ASUCs in Use Case View: UC-21 online, UC-21 offline, UC-24. |
| Architectural Drivers addressed in all views | PASS | AD-01 addressed in Module (index), C\&C (findDueCards), Deployment (scaling), Scenario S1, Tactic T1, Decision 1, Iteration 2\. |
| No contradictory multiplicities | PASS | C\&C states 1 Nginx : 1 Node.js in v1.0. Deployment 6.2.1 confirms single Node.js container. Scaled topology (6.2.2) labeled as v2.0. |
| Interface contracts consistent with C\&C flows | PASS | findByIdAndOwner() in contract table (4.5.1.4) matches ResourceAuthMiddleware C\&C use (5.5.1) and SD3 step 3 (7.2.3). |

# **9  Quality Attribute Scenarios (ADD)** {#9-quality-attribute-scenarios-(add)}

All 7 scenarios follow the ADD 6-part template (Bass, Clements, Kazman): Source | Stimulus | Environment | Artifact | Response | Response Measure.

## **9.1  Scenario 1 — Performance: Study Session Start \[AD-01 — H,H\]** {#9.1-scenario-1-—-performance:-study-session-start-[ad-01-—-h,h]}

| Architectural Driver | AD-01: Performance/Latency — H (BV), H (TR) — HIGHEST PRIORITY |
| :---- | :---- |
| **Source** | Learner (authenticated user) |
| **Stimulus** | User clicks 'Study Now' on a deck containing 500+ cards. System executes findDueCards(deckId, userId, today). |
| **Environment** | Normal operation; up to 100 concurrent users; deck has 500 cards; total DB has 50,000 card records. |
| **Artifact** | StudyController → CardRepository.findDueCards() → PostgreSQL (composite index on deckId, userId, nextReviewDate). |
| **Response** | Indexed SQL query executes. Results sorted overdue-first, then new. First card returned. SPA renders card front. |
| **Response Measure** | Query execution ≤ 300ms. Full API response ≤ 500ms. EXPLAIN ANALYZE confirms index scan, not sequential scan. |
| **Tactics Applied** | T1 (Composite DB Index), T7 (Query Optimisation), T13 (SM2Service in-process). |

## **9.2  Scenario 2 — Security: Authentication \+ Brute-Force \[AD-05 — H,M\]** {#9.2-scenario-2-—-security:-authentication-+-brute-force-[ad-05-—-h,m]}

| Architectural Driver | AD-05: Security/Authentication — H (BV), M (TR) |
| :---- | :---- |
| **Source** | Malicious actor (unauthenticated external attacker) |
| **Stimulus** | Attacker submits 10 consecutive login attempts with wrong passwords for victim@email.com within 5 minutes. |
| **Environment** | Normal operation; attacker has valid email; password unknown. |
| **Artifact** | AuthController → BruteForceGuard → login\_attempts table → AuthService. |
| **Response** | After 5th failure: BruteForceGuard records lockout timestamp; 429 returned with MSG-LOCK-01. Attempts 6–10 return 423 Locked. MSG03 never distinguishes wrong password from wrong email. |
| **Response Measure** | Account locked after exactly 5 failures. Lockout response ≤ 200ms. 0% false-positive lockout for legitimate users. |
| **Tactics Applied** | T5 (BruteForceGuard), T6 (Generic Error Messages), T17 (JWT Auth). |

## **9.3  Scenario 3 — Security: Resource-Level Authorization \[AD-03 — H,M\]** {#9.3-scenario-3-—-security:-resource-level-authorization-[ad-03-—-h,m]}

| Architectural Driver | AD-03: Security/Authorization — H (BV), M (TR) |
| :---- | :---- |
| **Source** | Admin A (authenticated with valid JWT) |
| **Stimulus** | Admin A sends DELETE /api/decks/{deckId\_B} where deckId\_B is owned by Admin B. |
| **Environment** | Normal operation; both admins authenticated; deckId\_B is valid. |
| **Artifact** | AuthMiddleware → ResourceAuthMiddleware → DeckRepository.findByIdAndOwner(deckId\_B, userId\_A). |
| **Response** | Ownership query returns null (userId\_A ≠ creatorId\_B). ResourceAuthMiddleware returns 403 \+ MSG-AUTH-01. DeckController and DeckService are never invoked. Admin B's data is unmodified. |
| **Response Measure** | 100% of cross-user DELETE/PATCH attempts blocked. 403 response ≤ 200ms. No Admin B data in response body. Admin A's GET on same deck is permitted (read-only). |
| **Tactics Applied** | T3 (Data Isolation), T4 (Resource-Level Auth), T6 (Generic Error). |

## **9.4  Scenario 4 — Reliability: Atomic Transaction Failure \[AD-04 — H,M\]** {#9.4-scenario-4-—-reliability:-atomic-transaction-failure-[ad-04-—-h,m]}

| Architectural Driver | AD-04: Reliability/Transactions — H (BV), M (TR) |
| :---- | :---- |
| **Source** | Infrastructure (DB connection pool exhaustion) |
| **Stimulus** | User submits review 'Easy' for card C. DB connection drops after card.update() but before review.create(). |
| **Environment** | Degraded: DB connection pool at maximum; connection lost mid-transaction. |
| **Artifact** | ReviewService → PostgreSQL transaction (BEGIN → CardRepo.update → ReviewRepo.create → COMMIT). |
| **Response** | PostgreSQL rolls back entire transaction. Card state reverts. Review history record not created. User receives 503\. System state is consistent — no partial update persisted. |
| **Response Measure** | Zero partial states persisted across 100% of transaction failures. Card and review always written together or neither. 503 delivered within 2 seconds. |
| **Tactics Applied** | T8 (DB Transactions), T9 (Global Error Handler), T15 (Docker Restart). |

## **9.5  Scenario 5 — Availability: Offline Study Session \[AD-02 — M,H\]** {#9.5-scenario-5-—-availability:-offline-study-session-[ad-02-—-m,h]}

| Architectural Driver | AD-02: Availability/Offline — M (BV), H (TR) — HIGHEST RISK |
| :---- | :---- |
| **Source** | Learner on mobile device with intermittent network |
| **Stimulus** | User is mid-session (10 of 30 cards reviewed); network drops. User continues reviewing remaining 20 cards. |
| **Environment** | Degraded: navigator.onLine \= false; IndexedDB available; no server reachable. |
| **Artifact** | OfflineCacheUI (SPA) → IndexedDB → OfflineSyncService → (on reconnect) POST /api/study/review/batch. |
| **Response** | SPA detects offline. OfflineSyncService.queueReview() stores each rating in IndexedDB. Session continues from cached card queue. On 'online' event: batch POST flushes all queued reviews atomically. |
| **Response Measure** | 0 review outcomes lost during outage. Zero additional latency for offline submissions. Batch sync completes ≤ 5s for 30 queued reviews. |
| **Tactics Applied** | T10 (Offline Cache), T11 (Batch Sync), T12 (Network Monitor). |

## **9.6  Scenario 6 — Scalability: Deck Library Pagination \[AD-07 — H,M\]** {#9.6-scenario-6-—-scalability:-deck-library-pagination-[ad-07-—-h,m]}

| Architectural Driver | AD-07: Scalability/Data Volume — H (BV), M (TR) |
| :---- | :---- |
| **Source** | Power Learner with 150 decks |
| **Stimulus** | User navigates to Dashboard. System must load Deck Library. |
| **Environment** | Normal operation; 150 deck records for this userId. |
| **Artifact** | DeckController → DeckService → DeckRepository.findByUserIdPaginated(userId, page=1, size=20). |
| **Response** | Indexed SQL: SELECT … FROM decks WHERE user\_id=? ORDER BY updated\_at DESC LIMIT 20 OFFSET 0\. Returns {decks: 20, total: 150}. SPA renders page 1 with pagination control. |
| **Response Measure** | First page renders ≤ 1 second. DB query ≤ 300ms. Index on (userId, updated\_at) confirmed active. |
| **Tactics Applied** | T1 (DB Index), T7 (Pagination Query). |

## **9.7  Scenario 7 — Security: Data Confidentiality \[AD-06 — H,M\]** {#9.7-scenario-7-—-security:-data-confidentiality-[ad-06-—-h,m]}

| Architectural Driver | AD-06: Security/Confidentiality — H (BV), M (TR) |
| :---- | :---- |
| **Source** | Learner |
| **Stimulus** | Authenticated user calls GET /api/users/profile (UC-04). |
| **Environment** | Normal operation; valid JWT; user record exists in DB. |
| **Artifact** | UserController → UserService.getProfile(userId) → UserRepository → DB → ProfileDTO mapping. |
| **Response** | UserRepository fetches user record including password\_hash. UserService maps to ProfileDTO: {username, email, stats} — password\_hash field excluded. All transmission over HTTPS. |
| **Response Measure** | 0 API responses contain password\_hash, salt, or internal IDs. HTTPS enforced (Nginx redirects HTTP→HTTPS). bcrypt rounds ≥ 10 verified at registration. |
| **Tactics Applied** | T2 (DTO Filtering), T3 (Data Isolation), T18 (HTTPS+bcrypt). |

# **10  Architectural Tactics and Cross-Impact Analysis** {#10-architectural-tactics-and-cross-impact-analysis}

## **10.1  Tactic Catalogue by Quality Attribute** {#10.1-tactic-catalogue-by-quality-attribute}

| ID | Tactic | Implementation | Scenarios |
| :---- | :---- | :---- | :---- |
| T1 | Composite DB Index | CREATE INDEX idx\_cards\_due ON cards(deckId,userId,nextReviewDate). CREATE INDEX idx\_decks\_user ON decks(userId,updated\_at). Eliminates sequential scans. | S1, S6 |
| T2 | DTO Filtering | UserService maps DB entity to ProfileDTO; explicitly omits password\_hash. No ORM lazy-load leaks sensitive fields. | S7 |
| T3 | Data Isolation | All DB queries include userId/creatorId in WHERE clause. Zero cross-user data returns. | S3, S7 |
| T4 | Resource-Level Auth | ResourceAuthMiddleware: DeckRepo.findByIdAndOwner(deckId,userId) per mutating request. Fails fast (403) before business logic. | S3 |
| T5 | BruteForce Guard | login\_attempts table tracks (email,ip,timestamp). After 5 failures: lockout for T minutes. Auto-unlocks. Fail-open on DB error (logged). | S2 |
| T6 | Generic Error Messages | MSG03: 'Invalid credentials' — never specifies wrong password vs wrong email. Prevents user enumeration. | S2, S7 |
| T7 | Query Optimisation | findDueCards(): WHERE+ORDER BY on indexed columns \+ LIMIT. findByUserIdPaginated(): LIMIT/OFFSET. Statistics: SQL GROUP BY (not in-memory). | S1, S6 |
| T8 | DB Transactions | BEGIN/COMMIT wraps: card\_update+review\_create (UC-21); cascade delete chain (UC-06,UC-10). ROLLBACK on any failure. | S4 |
| T9 | Global Error Handler | app.use((err,req,res,next) \=\> res.status(err.status||500).json({error:err.message})). Prevents unhandled rejections from crashing Node.js. | S4 |
| T10 | Offline Cache | SPA uses IndexedDB to cache card queue and queue review submissions when navigator.onLine=false. Survives browser tab reload. | S5 |
| T11 | Batch Sync | OfflineSyncService.syncPending() triggered by window 'online' event. Sends all queued reviews atomically via POST /review/batch. | S5 |
| T12 | Network Monitor | SPA subscribes to window 'online'/'offline' events. Routes submissions to IndexedDB when offline. Shows status banner. | S5 |
| T13 | In-process Computation | SM2Service is a pure in-process function. Executes \< 1ms with zero I/O. No caching layer required. | S1 |
| T14 | Lazy Statistics | Advanced statistics (UC-12) computed on-demand at query time, not pre-computed on card write. Prevents write amplification. | S6 |
| T15 | Active Redundancy | Docker restart:always policy. Container restarts within 30s. DB volume persists data across restarts. | S4, S5 |
| T16 | Graceful Degradation | StatisticsService failure returns empty/cached stats; study session unaffected. Architecturally independent services. | General |
| T17 | JWT Authentication | JWT signed with HS256. AuthMiddleware verifies signature and expiry on every protected request. | All secured |
| T18 | HTTPS \+ bcrypt | HTTPS-only (Nginx HTTP→HTTPS redirect). bcrypt rounds ≥ 10\. JWT in HttpOnly, SameSite=Strict cookie. | S2, S7 |
| T19 | Input Validation | Server-side: Joi/Zod schema validation before any DB write. Import: JSON schema check before batchInsert. Invalid items skipped, not thrown. | General |
| T20 | Orphan Prevention | FK constraints with ON DELETE CASCADE in DB schema. Application transaction is a second safety layer. | S4 |
| T21 | Data Integrity Validation | Profile update: re-hash password only if modified. Entire update rolls back on any field failure (UC-05). | General |

## **10.2  Tactic Cross-Impact Analysis** {#10.2-tactic-cross-impact-analysis}

| Tactic | Primary QA | Secondary Benefit | Negative Cross-Impact |
| :---- | :---- | :---- | :---- |
| T1 Composite DB Index | Performance (AD-01,07) | Scalability: sub-linear growth | Maintainability: index update on schema change; write overhead \~5% |
| T4 Resource-Level Auth | Security (AD-03) | Reliability: prevents unauthorised deletes | Performance: \+50ms per mutating request (one extra DB query) |
| T5 BruteForce Guard | Security (AD-05) | Availability: prevents credential-stuffing DoS | Usability: legitimate users locked if rate-limit too aggressive; fail-open on DB error |
| T8 DB Transactions | Reliability (AD-04) | Data Integrity: no orphan records; testability | Performance: COMMIT adds \~10–20ms; long transactions reduce throughput |
| T10/T11 Offline Cache | Availability (AD-02) | Usability: seamless experience during outage | Consistency: eventual consistency window; conflict on dual-device offline use |
| T17 JWT Auth | Security (AD-05) | Performance: stateless — no session DB lookup | Availability: JWT\_SECRET rotation invalidates all active sessions simultaneously |
| T16 Graceful Degrade | Availability (General) | Usability: study session continues uninterrupted | Consistency: user may see stale stats briefly after StatisticsService recovery |

# **11  Design Decisions and Alternative Architectures** {#11-design-decisions-and-alternative-architectures}

## **11.1  Decision 1 — 4-Layer Architecture** {#11.1-decision-1-—-4-layer-architecture}

| Decision | 4-layer architecture: Presentation → Business Logic → Data Access → Database. |
| :---- | :---- |
| **Drivers** | AD-01, AD-04, AD-07 |
| **Rationale** | DB index optimisation (T1) localised to Data Access Layer — no propagation upward. Transaction management in ReviewService, isolated from HTTP routing. Pagination added to DeckRepository without altering DeckController API contract. |
| **Trade-offs** | 4-layer call stack adds 2–5ms per request — negligible relative to 500ms target. Repository interfaces require additional boilerplate, justified by testability and DB swap capability. |

## **11.2  Decision 2 — Offline-First Architecture** {#11.2-decision-2-—-offline-first-architecture}

| Decision | Browser IndexedDB \+ OfflineSyncService for offline review queuing and batch reconciliation. |
| :---- | :---- |
| **Drivers** | AD-02 (highest Technical Risk: H) |
| **Rationale** | AD-02 carries TR=H — failure to address results in data loss on unreliable networks. IndexedDB chosen over localStorage: async, transaction-safe, larger capacity, no serialisation overhead. Batch sync prevents repeated partial states during fluctuating connectivity. |
| **Trade-offs** | Eventual consistency: reviews not immediately server-persisted. Acceptable for learning app where seconds-level staleness has no business consequence. Conflict policy: last-write-wins (single-user accounts preclude concurrent session conflicts). |

## **11.3  Decision 3 — ResourceAuthMiddleware** {#11.3-decision-3-—-resourceauthmiddleware}

| Decision | ResourceAuthMiddleware performs ownership verification (UserID \= CreatorID) for all mutating operations on decks and cards. |
| :---- | :---- |
| **Drivers** | AD-03 |
| **Rationale** | Role-based auth alone is insufficient for UC-24: two Admins must not mutate each other's data despite same role. Middleware pattern eliminates duplication across controllers. findByIdAndOwner() combines ownership \+ existence in one SQL statement. |
| **Trade-offs** | \+50ms per mutating request (one extra DB query). Security (AD-03) takes precedence — a security violation is categorically worse than 50ms latency. |

## **11.4  Decision 4 — Server-Side SM-2 Pure Function** {#11.4-decision-4-—-server-side-sm-2-pure-function}

| Decision | SM-2 implemented exclusively server-side as a pure function in SM2Service. |
| :---- | :---- |
| **Drivers** | AD-01 (testability), Security (manipulation prevention) |
| **Rationale** | Client-side execution allows users to forge SM-2 results (inflated intervals). Pure function with no side effects is verifiable by mathematical unit tests without infrastructure. Single authoritative implementation guarantees identical scheduling across all client platforms. |
| **Trade-offs** | None significant. In-process execution \< 1ms — no async overhead justified. |

## **11.5  Rejected Alternative 1 — Microservices** {#11.5-rejected-alternative-1-—-microservices}

| Description | Decompose into separate deployable services: AuthService (own DB), DeckService (own DB), StudyService (own DB), SM2Service (FaaS). |
| :---- | :---- |
| **Rejection 1** | Complexity disproportionate to v1.0 scale (\<100 concurrent users). Microservice infrastructure (API gateway, service discovery, distributed tracing) \= 80% engineering effort for \<5% performance benefit. |
| **Rejection 2** | Data consistency risk: SM-2 requires atomic card+review update. In microservices this becomes a distributed transaction (saga), introducing eventual consistency and rollback coordination. |
| **Rejection 3** | Team size mismatch: microservices justified when multiple teams own different services. FlashLearn is a single-team project. |
| **When to reconsider** | \>10,000 concurrent users or distinct feature teams. Module boundaries (SM2Service, StatisticsService) are service-aligned for future extraction with minimal refactoring. |

## **11.6  Rejected Alternative 2 — Monolithic MPA** {#11.6-rejected-alternative-2-—-monolithic-mpa}

| Description | Server-rendered HTML (Express \+ EJS/Pug templates). No separate frontend framework. Full-page reload on navigation. |
| :---- | :---- |
| **Rejection 1** | Offline requirement (AD-02): Service Workers and IndexedDB are first-class SPA citizens. Implementing offline study in an MPA requires substantial JS complexity, negating simplicity advantage. |
| **Rejection 2** | REST API supports future mobile clients (React Native, Flutter). MPA tightly couples presentation to server rendering, blocking mobile extension. |
| **Rejection 3** | Interactive study session: flashcard flip, rating buttons, and real-time progress bar require client-side state management natural in React but awkward in server-rendered templates. |
| **When to reconsider** | Not applicable — AD-02 offline requirement makes SPA the only viable approach. |

## **11.7  Rejected Alternative 3 — GraphQL API** {#11.7-rejected-alternative-3-—-graphql-api}

| Description | Replace Express REST endpoints with a GraphQL schema. Clients query exactly the fields needed. |
| :---- | :---- |
| **Rejection 1** | Adds schema definition, resolver logic, N+1 query problem (requires DataLoader), and client query validation. REST with DTO filtering (T2) achieves same over-fetching reduction with far less complexity. |
| **Rejection 2** | REST responses are HTTP-cacheable (CDN, Nginx). GraphQL POST requests are not cache-friendly by default. |
| **When to reconsider** | If distinct client query patterns exceed 20+ and client-server data negotiation becomes a maintenance burden. |

# **12  ADD Iteration Log** {#12-add-iteration-log}

Each iteration focuses on one or more Architectural Drivers and produces specific design decisions. This log provides the complete audit trail of how the architecture was derived from the Utility Tree.

| Iteration | Goal | Drivers | Design Decisions | Elements Created |
| :---- | :---- | :---- | :---- | :---- |
| 1 | Establish Overall System Structure | All (foundational) | 1\. 4-layer architecture. 2\. Client-Server REST API. 3\. Node.js \+ Express. 4\. PostgreSQL. | Presentation, Business, Data Access, Database layers. REST API boundary. |
| 2 | Address AD-01: Performance / Latency | AD-01 (H,H) | 1\. Composite DB index (deckId,userId,nextReviewDate). 2\. findDueCards() indexed query. 3\. SM2Service as pure in-process function. | DB index definition. findDueCards() interface contract. SM2Service class. |
| 3 | Address AD-02: Availability / Offline | AD-02 (M,H — highest TR) | 1\. OfflineSyncService \+ IndexedDB in SPA. 2\. Browser online/offline event listeners. 3\. POST /review/batch endpoint. 4\. offline\_queue table. | OfflineSyncService class. OfflineCacheUI component. Batch sync route. |
| 4 | Address AD-03 \+ AD-05: Security | AD-03 (H,M), AD-05 (H,M) | 1\. ResourceAuthMiddleware (UC-24). 2\. BruteForceGuard \+ login\_attempts table. 3\. JWT in HttpOnly cookie. 4\. ProfileDTO (excludes password\_hash). | ResourceAuthMiddleware. BruteForceGuard. login\_attempts table. ProfileDTO. |
| 5 | Address AD-04 \+ AD-06 \+ AD-07 | AD-04, AD-06, AD-07 (H,M) | 1\. DB transactions for all mutations. 2\. bcrypt rounds ≥ 10\. 3\. Paginated deck query with index. 4\. Horizontal scaling topology (Sec 6.2.2). | Transaction wrappers in ReviewService, UserService. Paginated DeckRepository. Scaled deployment. |

# **13  Requirements Coverage** {#13-requirements-coverage}

| Requirement | Component(s) | Driver | Notes |
| :---- | :---- | :---- | :---- |
| UC-01 Register | AuthController \+ UserRepository \+ BruteForceGuard | AD-05, AD-06 | Uniqueness check. bcrypt.hash(rounds≥10). Response \<2s. |
| UC-02 Login | AuthController \+ BruteForceGuard \+ AuthService | AD-05 | generateJWT() \+ lockout after 5 failures. Generic MSG03. |
| UC-03 Logout | AuthController \+ AuthMiddleware | AD-05 | clearJWTToken(). SPA clears cookie. Router guard blocks back-navigation. |
| UC-04 View Profile | UserController \+ UserService → ProfileDTO | AD-06 | ProfileDTO explicitly excludes password\_hash. |
| UC-05 Update Profile | UserController \+ UserRepository | AD-04 | Conditional bcrypt.hash. Full rollback if any field fails. |
| UC-06 Delete Account | UserController \+ Multiple Repos | AD-04 | Cascade TX: reviews → cards → decks → user. Atomic. |
| UC-07 Deck Library | DeckController \+ DeckRepo.findByUserIdPaginated() | AD-07 | Page size 20\. Index on (userId,updated\_at). ≤1s for 100+ decks. |
| UC-08 Create Deck | DeckController \+ DeckRepository | — | Default VN\_EN. Deck name validation. Links to userId. |
| UC-10 Delete Deck | DeckController \+ DeckRepo \+ ReviewRepo | AD-04 | Cascade TX: reviews → cards → deck. No orphan data. |
| UC-11/12 Statistics | StatisticsService \+ ReviewRepository | AD-07 | SQL GROUP BY aggregation. Pagination-aware. Degrades gracefully. |
| UC-14 Add Card | CardController \+ CardService | — | SM-2 init: Interval=0, Reps=0, EFactor=2.5. reverseCards() for BIDIRECTIONAL. |
| UC-18 Import JSON | ImportExportService \+ CardRepo.batchInsert() | — | Schema validate → skip-invalid → batch INSERT. ≤5s for 1000 cards. |
| UC-19 Export JSON | ImportExportService | — | Query cards \+ metadata → JSON → Content-Disposition: attachment. |
| UC-20 Start Session | StudyController \+ CardRepo.findDueCards() | AD-01 | Indexed query. Sort overdue first. ≤500ms target. |
| UC-21 Review Outcome | ReviewService \+ SM2Service \+ OfflineSyncService | AD-02, AD-04 | Online: TX(cardUpdate+reviewCreate). Offline: IndexedDB → batch sync. |
| UC-22 Session Summary | StudyController \+ StatisticsService | — | calculateAccuracy() on session data. Redirect to Dashboard. |
| UC-23 Session Stats | StatisticsService \+ ReviewRepository | — | Filter by (startDate,endDate). Total time, accuracy, quality distribution. |
| UC-24 Resource Auth | ResourceAuthMiddleware \+ DeckRepo.findByIdAndOwner() | AD-03 | Ownership check per mutating request. 403 if userId≠creatorId. Admin GET allowed. |
| NFR: Data Isolation | AuthMiddleware \+ All Repositories | AD-03, AD-06 | JWT userId in all queries. Zero cross-user data returns. |
| NFR: Brute-Force | BruteForceGuard \+ login\_attempts | AD-05 | 5-failure lockout. Auto-unlock. Fail-open on DB error. |
| NFR: Availability | OfflineSyncService \+ Docker restart:always | AD-02, AD-04 | Offline cache \+ auto-restart \+ atomic writes \= zero data loss. |
| NFR: Scalability | Paginated queries \+ Nginx LB topology | AD-07 | Pagination \+ index \+ horizontal scaling topology. |

# **14  Referenced Materials** {#14-referenced-materials}

| Reference | Citation |
| :---- | :---- |
| Bass 2003 | Bass, L.; Clements, P.; Kazman, R. Software Architecture in Practice, 2nd ed. Addison Wesley, 2003\. |
| Clements 2002 | Clements, P. et al. Documenting Software Architectures: Views and Beyond. Addison Wesley, 2002\. |
| IEEE 1471 | ANSI/IEEE-1471-2000. IEEE Recommended Practice for Architectural Description of Software-Intensive Systems. 21 September 2000\. |
| Kruchten 1995 | Kruchten, P. The 4+1 View Model of Architecture. IEEE Software, 12(6), 1995\. |
| SM-2 | Wozniak, P. SuperMemo 2 Algorithm. SuperMemo World, 1987\. https://www.supermemo.com/en/archives1990-2015/english/ol/sm2 |
| RFC 7519 | Jones, M.; Bradley, J.; Sakimura, N. JSON Web Token (JWT). RFC 7519\. IETF, 2015\. |
| SRS v2.0 | FlashLearn Software Requirements Specification v2.0. Internal document. |
| User Stories V2 | FlashLearn User Stories V2. Internal document. |
| FL-Algorithm | FlashLearn\_Algorithm v1.0. Internal specification for server-side SM-2 implementation. |

# **15  Directory** {#15-directory}

## **15.1  Index** {#15.1-index}

Key elements and where they are defined and used in this SAD:

| Element | Defined In | Used In |
| :---- | :---- | :---- |
| SM2Service | Sec 4.5.1.2 (Module View) | Sec 4.5.2 (Dep. Diag.), Sec 5.5.1 (C\&C), Sec 7.2.1 (Seq. Diag. 1), Sec 9.1 (S1), Sec 11.4 |
| ResourceAuthMiddleware | Sec 4.5.1.2 (Module View) | Sec 5.5.1 (C\&C), Sec 7.2.3 (Seq. Diag. 3), Sec 9.3 (S3), Sec 11.3 |
| OfflineSyncService | Sec 4.5.1.2 (Module View) | Sec 5.5.1 (C\&C), Sec 7.2.2 (Seq. Diag. 2), Sec 9.5 (S5), Sec 11.2 |
| BruteForceGuard | Sec 4.5.1.2 (Module View) | Sec 5.5.1 (C\&C), Sec 9.2 (S2), Sec 11, Sec 13 |
| findDueCards() | Sec 4.5.1.4 (Interface Contract) | Sec 5.5.1, Sec 7.2.1, Sec 9.1, Sec 10.1 (T1,T7), Sec 12 Iter.2 |
| findByIdAndOwner() | Sec 4.5.1.4 (Interface Contract) | Sec 5.5.1, Sec 7.2.3, Sec 9.3, Sec 11.3, Sec 13 (UC-24) |
| ProfileDTO | Sec 4.5.1.4 (Interface Contract) | Sec 9.7 (S7), Sec 10.1 (T2), Sec 12 Iter.4, Sec 13 (UC-04) |
| Connector C1–C5 | Sec 5.5.1 (C\&C View) | Sec 7.2.1–7.2.3 (Seq. Diags.), Sec 8.2 (Cross-View) |
| AD-01 through AD-07 | Sec 2.1.3 (Driving Requirements) | Sec 9 (Scenarios), Sec 10 (Tactics), Sec 11 (Decisions), Sec 12 (Iterations), Sec 13, Sec 8.3 |

## **15.2  Glossary** {#15.2-glossary}

| Term | Definition |
| :---- | :---- |
| 4+1 View Model | Kruchten's architecture documentation model: Logical \+ Process \+ Deployment \+ Use Case \+ Behavior (Scenarios) views. |
| ADD | Attribute-Driven Design — iterative method to derive architecture from quality attribute requirements (Bass, Clements, Kazman). |
| Architectural Driver | QA scenario rated (BV=H, TR=H or M) in the Utility Tree; must be explicitly addressed with a traceable chain to implementation. |
| Connector | In C\&C view: a runtime interaction mechanism (REST call, SQL connection, in-process call, event). |
| JWT | JSON Web Token — compact, URL-safe means of representing claims (RFC 7519). |
| Resource-Level Authorization | Access control evaluated per individual resource instance (deck, card) verifying creator ownership — not only role. |
| SM-2 | SuperMemo 2 — spaced-repetition scheduling algorithm (Wozniak, 1987). |
| Utility Tree | ADD artifact: hierarchical decomposition of 'utility' into QAs, refined into measurable scenarios with BV and TR ratings. |
| View Consistency | Property ensuring all architectural views describe the same system; no contradictions exist between views. |
| software architecture | The structure or structures of a system, comprising software elements, their externally-visible properties, and relationships \[Bass 2003\]. |
| view | A representation of a whole system from the perspective of a related set of concerns \[IEEE 1471\]. |
| view packet | The smallest package of architectural documentation that could usefully be given to a stakeholder. |
| viewpoint | A specification of the conventions for constructing and using a view; a pattern from which to develop individual views \[IEEE 1471\]. |

## **15.3  Acronym List** {#15.3-acronym-list}

| Acronym | Expansion |
| :---- | :---- |
| ADD | Attribute-Driven Design |
| API | Application Programming Interface |
| ASUC | Architecturally Significant Use Case |
| ATAM | Architecture Tradeoff Analysis Method |
| BV | Business Value (in Utility Tree ratings) |
| C\&C | Component-and-Connector |
| CORS | Cross-Origin Resource Sharing |
| CSRF | Cross-Site Request Forgery |
| DB | Database |
| DTO | Data Transfer Object |
| FK | Foreign Key |
| HTTPS | Hypertext Transfer Protocol Secure |
| IEEE | Institute of Electrical and Electronics Engineers |
| JWT | JSON Web Token |
| LB | Load Balancer |
| NFR | Non-Functional Requirement |
| ORM | Object-Relational Mapper |
| QA | Quality Attribute |
| QAW | Quality Attribute Workshop |
| REST | Representational State Transfer |
| RBAC | Role-Based Access Control |
| SAD | Software Architecture Document |
| SEI | Software Engineering Institute |
| SM-2 | SuperMemo 2 (spaced-repetition algorithm) |
| SPA | Single-Page Application |
| SQL | Structured Query Language |
| SRS | Software Requirements Specification |
| SSL | Secure Sockets Layer |
| TCP | Transmission Control Protocol |
| TLS | Transport Layer Security |
| TR | Technical Risk (in Utility Tree ratings) |
| UML | Unified Modeling Language |
| UUID | Universally Unique Identifier |
| VM | Virtual Machine |
| XSS | Cross-Site Scripting |

[image1]: <data:image/png;base64,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>

[image2]: <data:image/png;base64,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>

[image3]: <data:image/png;base64,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>