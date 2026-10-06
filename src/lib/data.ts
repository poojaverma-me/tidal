import type { Channel, Department, Ticket } from "./types";

export const COMPANY = "Northwind Labs";

export const DEFAULT_DEPARTMENTS: Department[] = [
  { id: "service-desk", name: "IT Service Desk", description: "Password resets, software installs and licences, email and calendar problems, general how-do-I IT questions", color: "#007AFF", available: true, lead: "Hannah Price" },
  { id: "identity", name: "Identity & Access", description: "SSO, permissions, account provisioning, MFA, onboarding and offboarding access", color: "#5856D6", available: true, lead: "Oliver Shaw" },
  { id: "network", name: "Network & Infrastructure", description: "VPN, Wi-Fi, internet outages, servers, DNS, cloud infrastructure", color: "#32ADE6", available: true, lead: "Rachel Moore" },
  { id: "hardware", name: "Hardware & Devices", description: "Laptops, monitors, printers, phones, peripherals, repairs and replacements", color: "#FF9500", available: true, lead: "George Ellis" },
  { id: "security", name: "Security", description: "Phishing, suspicious logins, malware, data leaks, lost devices containing sensitive data", color: "#FF3B30", available: true, lead: "Nina Clarke" },
  { id: "billing", name: "Billing & Payments", description: "Customer invoices, refunds, double charges, failed payments, plan and seat changes", color: "#34C759", available: true, lead: "Peter Walsh" },
  { id: "product", name: "Product Support", description: "Customer-facing bugs, error messages and how-to questions about the Northwind app", color: "#AF52DE", available: true, lead: "Chloe Bennett" },
  { id: "facilities", name: "Facilities", description: "Office badges, desks, meeting rooms, heating and cooling, building maintenance", color: "#A2845E", available: true, lead: "Sam Turner" },
];

type Seed = [subject: string, body: string];

const POOLS: Record<string, Seed[]> = {
  "service-desk": [
    ["Locked out after password change", "I changed my password this morning and now Outlook keeps asking for it and then locks me out. Can someone reset it?"],
    ["Need Adobe Acrobat Pro licence", "I need to edit and sign PDFs for the contracts team. Could I get an Acrobat Pro licence installed on my laptop?"],
    ["Calendar invites not showing up", "Meeting invites from external clients aren't appearing in my calendar, though I can see them in my inbox."],
    ["How do I set up an email signature?", "New starter here. How do I add the company signature to my email in Outlook and on my phone?"],
    ["Excel keeps crashing on large files", "Excel crashes every time I open the quarterly forecast spreadsheet. It's about 40MB. Other files are fine."],
    ["Shared mailbox missing from Outlook", "The support@ shared mailbox disappeared from my Outlook folder list after the update yesterday."],
    ["Request: install Figma desktop app", "Could you install the Figma desktop app for me? The browser version is too slow for the files we're working on."],
    ["Teams notifications not working", "I'm not getting any Teams notifications on my Mac, so I keep missing messages from my manager."],
    ["Out-of-office reply won't turn off", "I'm back from leave but my automatic out-of-office reply is still being sent to everyone."],
    ["Zoom says my account is not licensed", "When I try to schedule a webinar Zoom says I need a licensed account. Can I be upgraded?"],
    ["Printer driver install for Mac", "How do I install the driver for the third-floor printer on macOS? The instructions on the wiki are for Windows."],
    ["Recover a deleted folder in OneDrive", "I accidentally deleted the Q3 Proposals folder from OneDrive yesterday. Is there a way to restore it?"],
    ["Password expired while travelling", "My password expired and I'm abroad without access to the office. How can I reset it remotely?"],
    ["Slack app asks to sign in every day", "Slack on my laptop logs me out every single morning. It's getting really annoying."],
  ],
  identity: [
    ["New hire needs access to GitHub and Jira", "Ella Murphy starts on Monday in the data team. Please set up GitHub, Jira and the analytics Snowflake role for her."],
    ["Remove access for departing contractor", "Our contractor Mark Fisher's engagement ended on Friday. Please revoke all of his accounts and SSO access."],
    ["MFA codes not arriving on new phone", "I switched phones and now I can't receive MFA codes. I'm locked out of Okta completely."],
    ["Need admin rights to the finance SharePoint", "As the new finance lead I need owner permissions on the Finance SharePoint site to manage who can see what."],
    ["SSO login loop on Salesforce", "Clicking the Salesforce tile in Okta sends me in a loop back to the login page."],
    ["Request read access to production logs", "I'm on-call next week and need read-only access to production logs in Datadog."],
    ["Change of role: need marketing tools access", "I've moved from sales to marketing. Please add HubSpot and Canva access and remove the sales tools I no longer need."],
    ["Okta says my account is suspended", "I came back from parental leave and Okta says my account is suspended."],
    ["Grant temporary access to payroll system", "Our auditor needs read-only access to the payroll system for two weeks starting tomorrow."],
    ["Group membership for engineering channel", "Please add me to the engineering-all Google group so I get the release emails."],
    ["Offboarding checklist for Laura Hayes", "Laura Hayes leaves on the 30th. Can Identity schedule the access removal and mailbox handover to her manager?"],
    ["Cannot approve access requests in Okta", "I'm a manager but the approve button for my team's access requests is greyed out."],
    ["Service account for the CI pipeline", "We need a non-human service account with deploy permissions for the new CI pipeline."],
    ["Lost access to AWS console after reorg", "Since the reorg I can't log into the AWS console. My role seems to have been removed."],
  ],
  network: [
    ["VPN disconnects every 10 minutes", "The VPN drops roughly every ten minutes when I work from home. My home internet is fine otherwise."],
    ["Wi-Fi down on the 4th floor", "Nobody on the fourth floor can connect to Wi-Fi this morning. The whole product team is affected."],
    ["Internal wiki not loading", "The internal wiki times out for everyone in the London office. Other sites load fine."],
    ["Slow internet in Manchester office", "Video calls keep freezing in the Manchester office. Speed tests show under 5 Mbps."],
    ["DNS for staging environment broken", "staging.northwind.internal doesn't resolve anymore. Our deploys to staging are all failing."],
    ["Need firewall rule for new vendor API", "We're integrating with a logistics vendor. Please open outbound HTTPS to their API endpoint."],
    ["Build server out of disk space", "The Jenkins build server has run out of disk space and all builds are failing with write errors."],
    ["Guest Wi-Fi password not working", "The guest Wi-Fi password on the reception sign doesn't work, and we have clients arriving at 2pm."],
    ["Latency spikes on the database cluster", "We're seeing latency spikes on the primary Postgres cluster every evening around 7pm."],
    ["Cannot reach file server over VPN", "When connected to VPN I can't map the \\\\files share. It worked last week."],
    ["Office internet outage", "The whole Bristol office has no internet. Router lights are flashing orange."],
    ["Request new subnet for lab devices", "The hardware lab needs an isolated subnet for test devices that shouldn't touch the corporate network."],
    ["Kubernetes nodes not ready", "Two nodes in the analytics Kubernetes cluster are stuck in NotReady and pods are being evicted."],
    ["Video calls choppy on wired network", "Even on a wired connection at my desk, Zoom calls are choppy and my audio cuts out."],
  ],
  hardware: [
    ["Laptop battery swelling", "My MacBook trackpad is being pushed up and the battery seems swollen. Is it safe to keep using it?"],
    ["Second monitor not detected", "My second monitor stopped being detected after I moved desks. The cable looks fine."],
    ["Printer on 2nd floor jamming", "The second-floor printer jams on every job and shows a paper feed error."],
    ["Request a new keyboard and mouse", "My keyboard has several sticky keys. Could I get a replacement keyboard and mouse?"],
    ["Laptop won't turn on", "My laptop won't power on at all, not even with the charger plugged in. I have a client demo this afternoon."],
    ["Need a headset for call-centre role", "I've joined the support team and need a noise-cancelling headset for calls."],
    ["Cracked phone screen", "I dropped my work iPhone and the screen is cracked. It still works but the touch is unreliable."],
    ["Docking station keeps disconnecting", "My USB-C dock disconnects all peripherals every few minutes."],
    ["Laptop very slow and overheating", "My laptop is three years old and fans are constantly loud. Apps take ages to open. Is it due for replacement?"],
    ["Webcam not working in any app", "My built-in webcam shows a black screen in Zoom, Teams and Photo Booth."],
    ["Standing desk motor broken", "The motor on my standing desk stopped working and it's stuck at standing height."],
    ["Request laptop for new starter", "We have a new designer starting next week who needs a 16-inch MacBook Pro."],
    ["Conference room screen flickering", "The big screen in the Lisbon meeting room flickers constantly when we connect a laptop."],
    ["Return equipment after leaving", "I'm leaving the company at the end of the month. How do I return my laptop and monitor?"],
  ],
  security: [
    ["Suspicious email asking for gift cards", "I got an email that looks like it's from our CEO asking me to buy gift cards urgently. It seems off."],
    ["Clicked a link in a phishing email", "I clicked a link in an email about a shared invoice and entered my password before realising it was fake."],
    ["Login alert from unknown country", "I received an alert about a successful login to my account from Brazil. I've never been there."],
    ["Lost laptop with customer data", "I left my work laptop on the train last night. It has customer exports on it."],
    ["Antivirus flagged a file", "CrowdStrike flagged a file I downloaded from a supplier as malware and quarantined it."],
    ["Shared credentials in a public repo", "I think I accidentally pushed an API key to a public GitHub repo an hour ago."],
    ["Strange pop-ups on my computer", "I keep getting pop-ups saying my computer is infected and asking me to call a number."],
    ["Request for penetration test", "We're launching a new customer portal next month. Can Security schedule a pen test?"],
    ["Vendor asking for our SOC 2 report", "A prospective customer wants our SOC 2 report and security questionnaire answered."],
    ["Someone tailgated into the server room", "I saw someone without a badge follow a colleague into the server room this morning."],
    ["USB stick found in car park", "A USB stick labelled 'Payroll 2026' was found in the car park and handed to reception."],
    ["Multiple failed login attempts on my account", "I've received five MFA push requests I didn't initiate in the last hour."],
    ["Customer reports account takeover", "A customer says someone changed the email on their account and they can't log in anymore."],
    ["Report: phishing text messages", "Several people in sales got SMS messages pretending to be from IT asking them to verify their account."],
  ],
  billing: [
    ["Charged twice for annual plan", "Our company card was charged twice for the annual Business plan on the 1st. Please refund the duplicate."],
    ["Need a VAT invoice", "Can you send a VAT-compliant invoice for last month's payment? Our finance team needs our VAT number on it."],
    ["Payment failed, account suspended", "Our payment failed because the card expired and now our workspace is suspended. We've updated the card."],
    ["Downgrade from Business to Team plan", "We'd like to downgrade from Business to Team at the next renewal. What do we need to do?"],
    ["Refund for unused seats", "We removed 15 seats mid-cycle. Are we entitled to a prorated refund?"],
    ["Invoice shows wrong company address", "Our invoices still show our old office address. Please update it to our new registered address."],
    ["Can we pay by bank transfer?", "Our procurement policy requires paying by bank transfer instead of card. Is that possible for the annual plan?"],
    ["Unexpected price increase", "Our renewal quote is 20% higher than last year. Why did the price go up?"],
    ["Cancel subscription", "We've decided to move to another tool. Please cancel our subscription at the end of the term."],
    ["Add 25 seats for the support team", "We're expanding the support team. Please add 25 seats and tell us the prorated cost."],
    ["Credit note for outage", "Your service was down for six hours last week. Are we eligible for a service credit?"],
    ["Receipt for card payment", "I need a receipt for the payment made on 14 September for expense reporting."],
    ["Billing contact change", "Please change our billing contact from James Hill to accounts@ourcompany.com."],
    ["Charged after cancellation", "We cancelled in August but were charged again in September. Please refund."],
  ],
  product: [
    ["Dashboard shows 'Something went wrong'", "Since this morning the analytics dashboard in the Northwind app shows 'Something went wrong' for all our users."],
    ["How do I export reports to CSV?", "Is there a way to export the weekly report to CSV? I can only find PDF."],
    ["Mobile app crashes on login", "The Northwind iOS app crashes immediately after I enter my credentials. Android works fine."],
    ["Notifications sent twice", "Our customers are receiving every notification email twice since yesterday's release."],
    ["Feature request: dark mode", "Our team would love a dark mode in the web app. Is that on the roadmap?"],
    ["Search returns no results", "Searching for projects in the app returns nothing, even for project names I can see in the list."],
    ["API returns 500 on /orders endpoint", "Our integration gets HTTP 500 errors from the /orders API endpoint about half the time."],
    ["Can't upload files larger than 10MB", "Uploading attachments over 10MB fails silently in the web app. Is there a limit?"],
    ["Webhook events delayed by hours", "Webhook events for new orders are arriving 2-3 hours late, which breaks our fulfilment process."],
    ["How to set up user roles", "How do I give some users view-only access in our Northwind workspace?"],
    ["Data missing after import", "We imported 5,000 contacts from a CSV but only 3,200 show up in the app."],
    ["Timezone wrong in scheduled reports", "Scheduled reports arrive at 3am instead of 9am. It looks like they're using UTC."],
    ["Integration with Slack stopped working", "The Northwind Slack integration stopped posting updates to our channel on Tuesday."],
    ["Charts not rendering in Safari", "Charts in the reporting tab are blank in Safari but fine in Chrome."],
  ],
  facilities: [
    ["Badge not opening the main door", "My access badge stopped working on the main entrance this morning. Other doors are fine."],
    ["Meeting room double-booked", "The Atlas meeting room shows two bookings at 10am every Tuesday and teams keep clashing."],
    ["Office too cold on 3rd floor", "The third floor is freezing again. People are wearing coats at their desks."],
    ["Request a desk near the window", "Could I be moved to a desk near a window? I'm in the internal room with no natural light."],
    ["Leaking tap in kitchen", "The tap in the second-floor kitchen is leaking constantly."],
    ["Need extra chairs for all-hands", "We need 40 extra chairs in the atrium for the all-hands on Friday."],
    ["Car park access for visitor", "We have a board member visiting on Thursday who needs car park access."],
    ["Lights flickering in corridor", "The lights in the east corridor on the ground floor have been flickering for days."],
    ["Lost property: left my jacket", "I left a black jacket in meeting room Orion on Monday. Has anyone handed it in?"],
    ["Bike storage full", "The bike storage is always full by 8:30. Can we get more racks?"],
    ["Replace broken office chair", "My office chair's gas lift is broken and it sinks to the lowest height."],
    ["Fire alarm test scheduling", "When is the next fire alarm test? We have a customer workshop planned on Wednesday."],
    ["Locker key lost", "I've lost the key to my locker on the fourth floor."],
    ["Noise from construction next door", "The construction next door is extremely loud. Can we get quiet rooms or headphones?"],
  ],
};

/** Deliberately ambiguous tickets: the probability spread is the interesting part. */
const AMBIGUOUS: { subject: string; body: string; truth: string }[] = [
  { subject: "Lost my work phone in a taxi", body: "I lost my work phone in a taxi. It has my email and the authenticator app on it.", truth: "security" },
  { subject: "Can't log in to the Northwind app as an admin", body: "Our customer admin can't log into the Northwind web app. It says invalid SSO configuration.", truth: "product" },
  { subject: "Refund request because of bug", body: "A bug in your export feature corrupted our data and cost us a day. We want a refund for this month.", truth: "billing" },
  { subject: "New starter has no laptop or accounts", body: "Our new hire arrived today and has neither a laptop nor any logins. Please help urgently.", truth: "identity" },
  { subject: "VPN asks for MFA every time", body: "The VPN now asks for an MFA code on every single connection, sometimes ten times a day.", truth: "identity" },
  { subject: "Printer asking for admin password", body: "The printer driver install asks for an administrator password I don't have.", truth: "service-desk" },
];

const NAMES = [
  "Amelia Hart", "James Cooper", "Sophie Turner", "Oliver Grant", "Emily Shaw", "Harry Wells", "Grace Palmer", "Thomas Reed", "Lucy Ward",
  "Daniel Price", "Charlotte Hayes", "William Ford", "Megan Lewis", "Jack Barnes", "Isabel Hunt", "Samuel Cole", "Hannah Stone", "Ryan Mills",
  "Zoe Parker", "Adam Fletcher", "Natalie Ross", "Luke Spencer", "Holly Graham", "Edward Lane", "Abigail Knight", "Nathan Brooks",
];
const CHANNELS: Channel[] = ["Email", "Slack", "Portal", "Chat", "Email", "Portal"];

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function build() {
  const r = rng(42);
  const all: Ticket[] = [];
  const seeds: { s: Seed; truth: string }[] = [];
  for (const [truth, pool] of Object.entries(POOLS)) pool.forEach((s) => seeds.push({ s, truth }));
  AMBIGUOUS.forEach((a) => seeds.push({ s: [a.subject, a.body], truth: a.truth }));
  // Shuffle deterministically so departments interleave in the inbox.
  for (let i = seeds.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [seeds[i], seeds[j]] = [seeds[j], seeds[i]];
  }
  seeds.forEach(({ s, truth }, i) => {
    const name = NAMES[Math.floor(r() * NAMES.length)];
    all.push({
      id: `TCK-${2400 + i}`,
      subject: s[0],
      body: s[1],
      requester: name,
      email: `${name.toLowerCase().replace(" ", ".")}@${truth === "billing" || truth === "product" ? "customer.example" : "northwind.example"}`,
      channel: CHANNELS[Math.floor(r() * CHANNELS.length)],
      ageMin: Math.floor(Math.pow(r(), 1.6) * 60 * 48) + 3,
      truth,
    });
  });
  // The newest 26 tickets are held back to arrive live in the intake stream.
  return { backlog: all.slice(0, all.length - 26), intake: all.slice(all.length - 26).map((t) => ({ ...t, ageMin: 0 })) };
}

const built = build();
export const BACKLOG: Ticket[] = built.backlog;
export const INTAKE: Ticket[] = built.intake;
export const ALL_TICKETS: Ticket[] = [...built.backlog, ...built.intake];

export const MACROS: Record<string, string> = {
  "Password reset steps": "Self-service reset link and what to do if MFA is unavailable",
  "VPN troubleshooting guide": "Reconnect steps, client version check, home network tips",
  "Access request form": "Ask for manager approval and the exact systems/roles needed",
  "Hardware replacement form": "Collect model, serial number and shipping address",
  "Refund & billing policy": "Explain proration, refunds and how invoices are issued",
  "Bug report template": "Ask for steps to reproduce, screenshots, browser/app version",
  "Escalate to on-call": "Page the on-call engineer for a widespread outage",
  "Security incident protocol": "Contain first: reset credentials, isolate device, preserve evidence",
  "Facilities request": "Log the location, urgency and best time for a visit",
  "Ask for more details": "Request missing information before routing further",
};

/** Ready-made restructures for the Departments page. */
export const SCENARIOS: { id: string; title: string; detail: string; apply: (d: Department[]) => Department[] }[] = [
  {
    id: "security-offsite",
    title: "Security team is offsite today",
    detail: "Mark Security unavailable. Their tickets need a temporary home.",
    apply: (d) => d.map((x) => (x.id === "security" ? { ...x, available: false } : x)),
  },
  {
    id: "merge-infra",
    title: "Merge Network + Hardware into Infrastructure Ops",
    detail: "Two teams become one. Every network and device ticket moves.",
    apply: (d) => [
      ...d.filter((x) => x.id !== "network" && x.id !== "hardware"),
      { id: "infra-ops", name: "Infrastructure Ops", description: "Networks, VPN, Wi-Fi, servers and cloud, plus laptops, monitors, printers and all physical devices", color: "#00C7BE", available: true, lead: "Rachel Moore" },
    ],
  },
  {
    id: "split-product",
    title: "Split Product Support into Bugs and Customer Success",
    detail: "Engineering takes defects; Customer Success takes how-to questions and feature requests.",
    apply: (d) => [
      ...d.filter((x) => x.id !== "product"),
      { id: "bugs", name: "Product Bugs & Engineering", description: "Errors, crashes, outages, API failures, data problems and anything broken in the Northwind app", color: "#AF52DE", available: true, lead: "Chloe Bennett" },
      { id: "success", name: "Customer Success", description: "How-to questions, setup help, feature requests and best practices for Northwind app customers", color: "#FF2D55", available: true, lead: "Lucy Ward" },
    ],
  },
  {
    id: "dev-platform",
    title: "New team: Developer Platform",
    detail: "Takes CI/CD, build servers, Kubernetes, service accounts and cloud console access.",
    apply: (d) => [
      ...d,
      { id: "dev-platform", name: "Developer Platform", description: "CI/CD pipelines, build servers, Kubernetes clusters, service accounts, cloud consoles and developer tooling", color: "#FFCC00", available: true, lead: "Adam Fletcher" },
    ],
  },
];
