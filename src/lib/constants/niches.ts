// ─── Niche Template System ────────────────────────────────────────────────────
// The core differentiator for LeadBotStudio. Each niche template provides
// industry-specific defaults for system prompts, lead forms, qualification
// questions, trigger signals, booking categories, and branding.

export type NicheType =
  | "LAW_FIRM"
  | "BUSINESS_COACH"
  | "THERAPIST"
  | "REAL_ESTATE"
  | "FINANCIAL_ADVISOR"
  | "CUSTOM";

export type TonePreset =
  | "professional"
  | "friendly"
  | "compassionate"
  | "authoritative"
  | "warm"
  | "consultative";

export type LeadFormFieldType =
  | "text"
  | "email"
  | "phone"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "date";

export type TriggerUrgency = "high" | "medium" | "low";

export interface LeadFormFieldOption {
  label: string;
  value: string;
}

export interface LeadFormField {
  id: string;
  type: LeadFormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  order: number;
  options?: LeadFormFieldOption[];
  aiExtractable?: boolean;
  aiExtractionKey?: string;
}

export interface QualificationQuestion {
  id: string;
  question: string;
  aiExtractionKey: string;
  options?: string[];
}

export interface TriggerSignal {
  description: string;
  examples: string[];
  urgency: TriggerUrgency;
}

export interface BookingCategory {
  id: string;
  name: string;
  subCategories?: { id: string; name: string }[];
}

export interface NicheTemplate {
  id: NicheType;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  color: string;
  tonePreset: TonePreset;
  systemPromptTemplate: string;
  qualificationQuestions: QualificationQuestion[];
  defaultLeadFormFields: LeadFormField[];
  triggerSignals: TriggerSignal[];
  suggestedQuestions: string[];
  successMessage: string;
  bookingCategories: BookingCategory[];
  boundaries: string[];
  defaultWelcomeMessage: string;
  defaultChatGreeting: string;
  defaultAppearance: { primaryColor: string; accentColor: string };
}

// ─── LAW FIRM ────────────────────────────────────────────────────────────────

const lawFirmTemplate: NicheTemplate = {
  id: "LAW_FIRM",
  name: "Law Firm",
  tagline: "Convert website visitors into qualified legal leads",
  description:
    "AI assistant for law firms that answers legal questions, qualifies potential clients, and captures leads for attorney follow-up.",
  icon: "Scale",
  color: "#1E40AF",
  tonePreset: "professional",
  systemPromptTemplate: `You are {{businessName}}, a knowledgeable legal assistant designed to help answer questions and connect potential clients with qualified attorneys.

## Your Primary Goals:
1. Answer questions accurately using the knowledge base provided
2. Build trust by being empathetic and professional
3. Identify and qualify potential leads through natural conversation
4. Capture contact information from interested visitors

## Conversation Guidelines:
- Be empathetic — legal issues are often stressful for people
- Provide helpful information FIRST before asking for contact details
- Use clear, jargon-free language that anyone can understand
- Never provide specific legal advice — always recommend consulting with a qualified attorney
- Be warm but professional in tone

{{customInstructions}}`,

  qualificationQuestions: [
    {
      id: "case_type",
      question: "What type of legal matter brings you here today?",
      aiExtractionKey: "caseType",
    },
    {
      id: "urgency",
      question: "How soon do you need assistance?",
      aiExtractionKey: "urgency",
      options: ["Immediate", "This Week", "This Month", "Just Exploring"],
    },
    {
      id: "budget",
      question: "Do you have a budget range in mind for legal services?",
      aiExtractionKey: "budget",
    },
  ],

  defaultLeadFormFields: [
    {
      id: "field_name",
      type: "text",
      label: "Full Name",
      placeholder: "John Smith",
      required: true,
      order: 1,
      aiExtractable: true,
      aiExtractionKey: "name",
    },
    {
      id: "field_email",
      type: "email",
      label: "Email",
      placeholder: "john@example.com",
      required: true,
      order: 2,
      aiExtractable: true,
      aiExtractionKey: "email",
    },
    {
      id: "field_phone",
      type: "phone",
      label: "Phone",
      placeholder: "(555) 123-4567",
      required: true,
      order: 3,
      aiExtractable: true,
      aiExtractionKey: "phone",
    },
    {
      id: "field_case_type",
      type: "select",
      label: "Type of Legal Matter",
      required: false,
      order: 4,
      options: [
        { label: "Family Law", value: "family_law" },
        { label: "Personal Injury", value: "personal_injury" },
        { label: "Criminal Defense", value: "criminal_defense" },
        { label: "Immigration", value: "immigration" },
        { label: "Estate Planning", value: "estate_planning" },
        { label: "Business Law", value: "business_law" },
        { label: "Other", value: "other" },
      ],
      aiExtractable: true,
      aiExtractionKey: "caseType",
    },
  ],

  triggerSignals: [
    {
      description: "User states they need an attorney or legal help",
      examples: [
        "I need a lawyer",
        "How do I find an attorney?",
        "Can you recommend an attorney?",
        "I need legal help",
      ],
      urgency: "high",
    },
    {
      description: "User expresses urgency with deadlines or time pressure",
      examples: [
        "This is urgent",
        "I have a hearing in 3 days",
        "deadline approaching",
        "I need help immediately",
      ],
      urgency: "high",
    },
    {
      description: "User shares specific case details or situation",
      examples: [
        "I was in an accident",
        "My spouse filed for divorce",
        "I was arrested last week",
        "I received a lawsuit",
      ],
      urgency: "medium",
    },
    {
      description: "User asks about consultations, pricing, or next steps",
      examples: [
        "Do you offer consultations?",
        "How much does this cost?",
        "What should I do next?",
        "Can I schedule a meeting?",
      ],
      urgency: "medium",
    },
  ],

  suggestedQuestions: [
    "What types of cases do you handle?",
    "How much does a consultation cost?",
    "What should I bring to my first meeting?",
    "How long does a typical case take?",
  ],

  successMessage:
    "Thank you for providing your information! An attorney will be in touch with you shortly.",

  bookingCategories: [
    {
      id: "consultation",
      name: "Legal Consultation",
      subCategories: [
        { id: "family", name: "Family Law" },
        { id: "personal_injury", name: "Personal Injury" },
        { id: "criminal", name: "Criminal Defense" },
        { id: "immigration", name: "Immigration" },
        { id: "estate", name: "Estate Planning" },
        { id: "business", name: "Business Law" },
      ],
    },
  ],

  boundaries: [
    "Never provide specific legal advice or opinions on case outcomes",
    "Never predict case outcomes or guarantee results",
    "Never discuss other attorneys or firms negatively",
    "Always recommend consulting with a qualified attorney for specific legal questions",
  ],

  defaultWelcomeMessage: "Hi! How can I help you today?",
  defaultChatGreeting:
    "Have a legal question? I'm here to help you find the right attorney.",
  defaultAppearance: { primaryColor: "#001F54", accentColor: "#3B82F6" },
};

// ─── BUSINESS COACH ──────────────────────────────────────────────────────────

const businessCoachTemplate: NicheTemplate = {
  id: "BUSINESS_COACH",
  name: "Business Coach",
  tagline: "Turn curious visitors into coaching clients",
  description:
    "AI assistant for business coaches that engages prospects, showcases expertise, and books discovery calls with qualified leads.",
  icon: "Target",
  color: "#7C3AED",
  tonePreset: "friendly",
  systemPromptTemplate: `You are {{businessName}}, a helpful business growth assistant. You help entrepreneurs and business owners understand how coaching can transform their business.

## Your Primary Goals:
1. Understand the visitor's business challenges and goals
2. Share relevant insights and frameworks from the knowledge base
3. Demonstrate expertise and build trust through helpful advice
4. Guide interested visitors to book a discovery call

## Conversation Guidelines:
- Be encouraging and positive about their business journey
- Ask thoughtful questions to understand their unique situation
- Share actionable tips (from the knowledge base) to demonstrate value upfront
- Position coaching as an investment in growth, not an expense
- Be conversational and approachable, not salesy

{{customInstructions}}`,

  qualificationQuestions: [
    {
      id: "business_stage",
      question: "What stage is your business in?",
      aiExtractionKey: "businessStage",
      options: [
        "Startup / Idea Stage",
        "Early Stage (0-2 years)",
        "Growth Stage (2-5 years)",
        "Established (5+ years)",
      ],
    },
    {
      id: "challenge",
      question: "What's your biggest business challenge right now?",
      aiExtractionKey: "challenge",
    },
    {
      id: "revenue",
      question: "What's your approximate annual revenue?",
      aiExtractionKey: "revenue",
    },
  ],

  defaultLeadFormFields: [
    {
      id: "field_name",
      type: "text",
      label: "Name",
      placeholder: "Jane Doe",
      required: true,
      order: 1,
      aiExtractable: true,
      aiExtractionKey: "name",
    },
    {
      id: "field_email",
      type: "email",
      label: "Email",
      placeholder: "jane@company.com",
      required: true,
      order: 2,
      aiExtractable: true,
      aiExtractionKey: "email",
    },
    {
      id: "field_phone",
      type: "phone",
      label: "Phone",
      placeholder: "(555) 123-4567",
      required: false,
      order: 3,
      aiExtractable: true,
      aiExtractionKey: "phone",
    },
    {
      id: "field_business",
      type: "text",
      label: "Business Name / Type",
      placeholder: "Acme Corp / E-commerce",
      required: false,
      order: 4,
    },
    {
      id: "field_challenge",
      type: "textarea",
      label: "What's your biggest challenge?",
      placeholder: "Tell us what you're working through...",
      required: false,
      order: 5,
      aiExtractable: true,
      aiExtractionKey: "challenge",
    },
  ],

  triggerSignals: [
    {
      description: "User expresses desire for business growth or help scaling",
      examples: [
        "I want to grow my business",
        "I'm stuck at this revenue level",
        "I need help scaling",
        "How do I get to the next level?",
      ],
      urgency: "high",
    },
    {
      description: "User asks about coaching services or pricing",
      examples: [
        "How does coaching work?",
        "What results can I expect?",
        "How much does coaching cost?",
        "What's included in your program?",
      ],
      urgency: "medium",
    },
    {
      description: "User shares a specific business challenge or pain point",
      examples: [
        "I can't find good employees",
        "My sales are declining",
        "I'm working 80 hours a week",
        "I don't know how to delegate",
      ],
      urgency: "medium",
    },
  ],

  suggestedQuestions: [
    "What types of businesses do you coach?",
    "How does a coaching engagement work?",
    "What results have your clients achieved?",
    "Can you help me create a growth plan?",
  ],

  successMessage:
    "Thank you! Our coaching team will reach out to schedule your free discovery call.",

  bookingCategories: [
    { id: "discovery", name: "Discovery Call" },
    { id: "strategy", name: "Strategy Session" },
    { id: "workshop", name: "Group Workshop" },
  ],

  boundaries: [
    "Never guarantee specific financial results or revenue targets",
    "Never disparage other coaches, programs, or competitors",
    "Be transparent about the difference between coaching and consulting",
  ],

  defaultWelcomeMessage:
    "Hey there! Ready to take your business to the next level?",
  defaultChatGreeting:
    "Welcome! What business challenge can I help you with today?",
  defaultAppearance: { primaryColor: "#4C1D95", accentColor: "#8B5CF6" },
};

// ─── THERAPIST ───────────────────────────────────────────────────────────────

const therapistTemplate: NicheTemplate = {
  id: "THERAPIST",
  name: "Therapist / Counselor",
  tagline: "Help people take the first step toward mental wellness",
  description:
    "Compassionate AI assistant for therapy practices that answers questions about services, reduces stigma, and encourages booking an initial session.",
  icon: "Heart",
  color: "#059669",
  tonePreset: "compassionate",
  systemPromptTemplate: `You are {{businessName}}, a warm and supportive assistant for a therapy practice. You help visitors learn about therapy services and feel comfortable taking the first step.

## Your Primary Goals:
1. Create a safe, non-judgmental space for visitors to ask questions
2. Answer questions about therapy services, approaches, and logistics
3. Reduce stigma and normalize seeking professional help
4. Gently encourage scheduling an initial consultation when appropriate

## Conversation Guidelines:
- Be warm, validating, and non-judgmental in every response
- Use person-first, destigmatizing language at all times
- NEVER provide therapy, clinical diagnoses, or treatment advice
- Acknowledge the courage it takes to reach out for help
- If someone expresses immediate danger or suicidal ideation, immediately provide crisis resources: 988 Suicide & Crisis Lifeline (call or text 988)
- Be patient — visitors may need time to open up

{{customInstructions}}`,

  qualificationQuestions: [
    {
      id: "concern",
      question: "What brings you to consider therapy?",
      aiExtractionKey: "concern",
    },
    {
      id: "therapy_experience",
      question: "Have you been to therapy before?",
      aiExtractionKey: "therapyExperience",
      options: [
        "Yes, currently in therapy",
        "Yes, in the past",
        "No, this would be my first time",
      ],
    },
    {
      id: "preference",
      question: "Do you have a preference for session format?",
      aiExtractionKey: "sessionPreference",
      options: ["In-person", "Virtual / Telehealth", "Either works"],
    },
  ],

  defaultLeadFormFields: [
    {
      id: "field_name",
      type: "text",
      label: "Preferred Name",
      placeholder: "How would you like to be called?",
      required: true,
      order: 1,
      aiExtractable: true,
      aiExtractionKey: "name",
    },
    {
      id: "field_email",
      type: "email",
      label: "Email",
      placeholder: "your@email.com",
      required: true,
      order: 2,
      aiExtractable: true,
      aiExtractionKey: "email",
    },
    {
      id: "field_phone",
      type: "phone",
      label: "Phone",
      placeholder: "(555) 123-4567",
      required: false,
      order: 3,
      aiExtractable: true,
      aiExtractionKey: "phone",
    },
    {
      id: "field_concern",
      type: "select",
      label: "What brings you in?",
      required: false,
      order: 4,
      options: [
        { label: "Anxiety", value: "anxiety" },
        { label: "Depression", value: "depression" },
        { label: "Relationship Issues", value: "relationships" },
        { label: "Trauma / PTSD", value: "trauma" },
        { label: "Life Transitions", value: "transitions" },
        { label: "Grief / Loss", value: "grief" },
        { label: "Other", value: "other" },
      ],
    },
    {
      id: "field_insurance",
      type: "text",
      label: "Insurance Provider (optional)",
      placeholder: "e.g., Blue Cross, Aetna, self-pay",
      required: false,
      order: 5,
    },
  ],

  triggerSignals: [
    {
      description: "User expresses readiness to start therapy",
      examples: [
        "I think I'm ready to talk to someone",
        "How do I get started?",
        "I want to make an appointment",
        "Can I schedule a session?",
      ],
      urgency: "high",
    },
    {
      description: "User shares personal struggles or concerns",
      examples: [
        "I've been feeling really anxious",
        "My relationship is falling apart",
        "I can't sleep at night",
        "I've been going through a hard time",
      ],
      urgency: "medium",
    },
    {
      description: "User asks about logistics (insurance, cost, hours)",
      examples: [
        "Do you take my insurance?",
        "How much does a session cost?",
        "What are your hours?",
        "Do you have availability?",
      ],
      urgency: "medium",
    },
  ],

  suggestedQuestions: [
    "What types of therapy do you offer?",
    "Do you accept my insurance?",
    "What should I expect in a first session?",
    "Do you offer virtual sessions?",
  ],

  successMessage:
    "Thank you for reaching out. Taking this step is brave. We'll contact you soon to schedule your initial consultation.",

  bookingCategories: [
    { id: "initial", name: "Initial Consultation" },
    { id: "individual", name: "Individual Therapy" },
    { id: "couples", name: "Couples Therapy" },
    { id: "family", name: "Family Therapy" },
  ],

  boundaries: [
    "NEVER provide therapy, clinical diagnoses, or treatment recommendations",
    "If someone expresses suicidal ideation or immediate danger, immediately provide 988 Suicide & Crisis Lifeline info (call or text 988)",
    "Never minimize or dismiss someone's feelings or experiences",
    "Do not share personal opinions on medications or treatment approaches",
    "Do not ask overly probing clinical questions — keep it conversational",
  ],

  defaultWelcomeMessage:
    "Welcome. I'm here to help you learn about our therapy services.",
  defaultChatGreeting:
    "Taking the first step is the hardest part. How can I help you today?",
  defaultAppearance: { primaryColor: "#065F46", accentColor: "#10B981" },
};

// ─── REAL ESTATE ─────────────────────────────────────────────────────────────

const realEstateTemplate: NicheTemplate = {
  id: "REAL_ESTATE",
  name: "Real Estate Agent",
  tagline: "Capture buyer and seller leads around the clock",
  description:
    "AI assistant for real estate agents that answers property questions, qualifies buyers and sellers, and schedules showings or listing appointments.",
  icon: "Home",
  color: "#DC2626",
  tonePreset: "warm",
  systemPromptTemplate: `You are {{businessName}}, a knowledgeable real estate assistant. You help potential buyers and sellers with property questions and connect them with the right agent.

## Your Primary Goals:
1. Answer questions about the local market, buying process, and selling process
2. Qualify leads as buyers, sellers, or investors
3. Capture contact information for follow-up
4. Schedule property showings or listing consultations

## Conversation Guidelines:
- Be enthusiastic and helpful but never pushy
- Provide useful market insights from the knowledge base
- Ask about timeline, budget range, and preferences naturally in conversation
- Position the agent as a trusted local expert
- Encourage next steps (showings, consultations) when there's interest

{{customInstructions}}`,

  qualificationQuestions: [
    {
      id: "intent",
      question: "Are you looking to buy, sell, or both?",
      aiExtractionKey: "intent",
      options: ["Buying", "Selling", "Both", "Just Browsing"],
    },
    {
      id: "timeline",
      question: "What's your timeline?",
      aiExtractionKey: "timeline",
      options: [
        "ASAP",
        "1-3 months",
        "3-6 months",
        "6+ months",
        "Just exploring",
      ],
    },
    {
      id: "budget",
      question: "What's your budget range?",
      aiExtractionKey: "budget",
    },
    {
      id: "location",
      question: "What area or neighborhood are you interested in?",
      aiExtractionKey: "location",
    },
  ],

  defaultLeadFormFields: [
    {
      id: "field_name",
      type: "text",
      label: "Name",
      placeholder: "John Smith",
      required: true,
      order: 1,
      aiExtractable: true,
      aiExtractionKey: "name",
    },
    {
      id: "field_email",
      type: "email",
      label: "Email",
      placeholder: "john@example.com",
      required: true,
      order: 2,
      aiExtractable: true,
      aiExtractionKey: "email",
    },
    {
      id: "field_phone",
      type: "phone",
      label: "Phone",
      placeholder: "(555) 123-4567",
      required: true,
      order: 3,
      aiExtractable: true,
      aiExtractionKey: "phone",
    },
    {
      id: "field_intent",
      type: "select",
      label: "I'm interested in...",
      required: true,
      order: 4,
      options: [
        { label: "Buying a home", value: "buying" },
        { label: "Selling my home", value: "selling" },
        { label: "Both buying and selling", value: "both" },
        { label: "Investing in property", value: "investing" },
      ],
    },
    {
      id: "field_area",
      type: "text",
      label: "Preferred Area / Neighborhood",
      placeholder: "e.g., Downtown, Suburbs, etc.",
      required: false,
      order: 5,
    },
  ],

  triggerSignals: [
    {
      description: "User expresses buying or selling intent",
      examples: [
        "I want to buy a house",
        "I'm thinking of selling",
        "What's my home worth?",
        "I want to list my property",
      ],
      urgency: "high",
    },
    {
      description: "User asks about specific properties or showings",
      examples: [
        "Is that listing still available?",
        "Can I see the house on Main St?",
        "What's the price on that property?",
        "Can I schedule a showing?",
      ],
      urgency: "high",
    },
    {
      description: "User asks about the market or process",
      examples: [
        "Is it a good time to buy?",
        "How's the market in this area?",
        "What are homes going for?",
        "How does the buying process work?",
      ],
      urgency: "medium",
    },
  ],

  suggestedQuestions: [
    "What's the market like in my area?",
    "How much is my home worth?",
    "What should I know about buying my first home?",
    "Can you help me find a home in my budget?",
  ],

  successMessage:
    "Thanks! Your agent will reach out shortly to discuss your real estate goals.",

  bookingCategories: [
    { id: "showing", name: "Property Showing" },
    { id: "listing", name: "Listing Consultation" },
    { id: "buyer", name: "Buyer Consultation" },
    { id: "market", name: "Market Analysis" },
  ],

  boundaries: [
    "Never guarantee property values, appreciation, or investment returns",
    "Never provide mortgage or financial advice — refer to a qualified lender",
    "Never disparage specific properties, neighborhoods, or competitors",
    "Always recommend a professional home inspection before purchase",
  ],

  defaultWelcomeMessage:
    "Hi! Looking to buy, sell, or learn about the market?",
  defaultChatGreeting:
    "Welcome! Whether you're buying or selling, I'm here to help.",
  defaultAppearance: { primaryColor: "#991B1B", accentColor: "#EF4444" },
};

// ─── FINANCIAL ADVISOR ───────────────────────────────────────────────────────

const financialAdvisorTemplate: NicheTemplate = {
  id: "FINANCIAL_ADVISOR",
  name: "Financial Advisor",
  tagline: "Build trust and capture high-value financial planning leads",
  description:
    "AI assistant for financial advisors that educates prospects on financial planning, qualifies leads based on goals and assets, and schedules consultations.",
  icon: "TrendingUp",
  color: "#0369A1",
  tonePreset: "authoritative",
  systemPromptTemplate: `You are {{businessName}}, a knowledgeable financial education assistant. You help visitors understand financial planning concepts and connect them with qualified advisors.

## Your Primary Goals:
1. Educate visitors on financial planning topics using the knowledge base
2. Build trust through thoughtful, unbiased information
3. Qualify leads based on their financial goals and situation
4. Encourage scheduling a personalized financial planning consultation

## Conversation Guidelines:
- Be educational and objective — never salesy or pushy
- NEVER provide specific investment recommendations or personalized financial advice
- Always include appropriate disclaimers when discussing financial topics
- Position consultations as personalized planning sessions, not sales pitches
- Be sensitive about financial stress and money anxiety — these are personal topics
- Use clear language and avoid unnecessary jargon

{{customInstructions}}`,

  qualificationQuestions: [
    {
      id: "goal",
      question: "What financial goals are you working toward?",
      aiExtractionKey: "financialGoal",
      options: [
        "Retirement Planning",
        "Investment Management",
        "Tax Planning",
        "Estate Planning",
        "Insurance Review",
        "General Financial Plan",
      ],
    },
    {
      id: "assets",
      question: "What's your approximate investable assets range?",
      aiExtractionKey: "assetsRange",
      options: [
        "Under $100K",
        "$100K - $500K",
        "$500K - $1M",
        "$1M - $5M",
        "Over $5M",
      ],
    },
    {
      id: "timeline",
      question: "When are you looking to get started with financial planning?",
      aiExtractionKey: "timeline",
    },
  ],

  defaultLeadFormFields: [
    {
      id: "field_name",
      type: "text",
      label: "Name",
      placeholder: "John Smith",
      required: true,
      order: 1,
      aiExtractable: true,
      aiExtractionKey: "name",
    },
    {
      id: "field_email",
      type: "email",
      label: "Email",
      placeholder: "john@example.com",
      required: true,
      order: 2,
      aiExtractable: true,
      aiExtractionKey: "email",
    },
    {
      id: "field_phone",
      type: "phone",
      label: "Phone",
      placeholder: "(555) 123-4567",
      required: true,
      order: 3,
      aiExtractable: true,
      aiExtractionKey: "phone",
    },
    {
      id: "field_goal",
      type: "select",
      label: "Primary Financial Goal",
      required: false,
      order: 4,
      options: [
        { label: "Retirement Planning", value: "retirement" },
        { label: "Investment Management", value: "investments" },
        { label: "Tax Optimization", value: "tax" },
        { label: "Estate Planning", value: "estate" },
        { label: "Comprehensive Financial Plan", value: "comprehensive" },
      ],
    },
  ],

  triggerSignals: [
    {
      description: "User expresses desire for professional financial help",
      examples: [
        "I need a financial advisor",
        "Can someone help me with my investments?",
        "I want professional help with retirement planning",
        "How do I find a good financial planner?",
      ],
      urgency: "high",
    },
    {
      description: "User asks about their specific financial situation",
      examples: [
        "Should I roll over my 401k?",
        "How much do I need to retire?",
        "What should I do with an inheritance?",
        "Am I saving enough for retirement?",
      ],
      urgency: "medium",
    },
    {
      description: "User asks about services, pricing, or how to get started",
      examples: [
        "What do you charge?",
        "How does financial planning work?",
        "What services do you offer?",
        "How do I get started?",
      ],
      urgency: "medium",
    },
  ],

  suggestedQuestions: [
    "How much do I need to save for retirement?",
    "What does a financial advisor do?",
    "How do I get started with investing?",
    "What should I look for in a financial advisor?",
  ],

  successMessage:
    "Thank you! A financial advisor will reach out to schedule your complimentary consultation.",

  bookingCategories: [
    { id: "discovery", name: "Discovery Meeting" },
    { id: "retirement", name: "Retirement Planning Review" },
    { id: "portfolio", name: "Portfolio Review" },
    { id: "comprehensive", name: "Comprehensive Financial Plan" },
  ],

  boundaries: [
    "NEVER provide specific investment advice, recommendations, or portfolio suggestions",
    "NEVER guarantee investment returns, performance, or specific financial outcomes",
    "Always include appropriate disclaimers when discussing financial topics",
    "Never recommend or discuss specific securities, funds, or financial products",
    "Refer users to a qualified advisor for personalized advice",
  ],

  defaultWelcomeMessage:
    "Welcome! How can I help with your financial questions today?",
  defaultChatGreeting:
    "I'm here to help you understand your financial options. What questions do you have?",
  defaultAppearance: { primaryColor: "#0C4A6E", accentColor: "#0EA5E9" },
};

// ─── CUSTOM ──────────────────────────────────────────────────────────────────

const customTemplate: NicheTemplate = {
  id: "CUSTOM",
  name: "Custom",
  tagline: "Build a chatbot for any business or use case",
  description:
    "Start from scratch with a fully customizable AI chatbot. Define your own persona, lead capture strategy, and conversation flow for any industry.",
  icon: "Sparkles",
  color: "#6B7280",
  tonePreset: "professional",
  systemPromptTemplate: `You are {{businessName}}, a helpful AI assistant designed to assist visitors and answer their questions.

## Your Primary Goals:
1. Answer visitor questions accurately using the knowledge base provided
2. Be helpful, professional, and responsive
3. Capture contact information from interested visitors
4. Guide visitors toward taking the next step

## Conversation Guidelines:
- Be professional and friendly
- Answer questions based on the knowledge base
- When you don't know something, say so honestly
- Encourage visitors to get in touch for more detailed help

{{customInstructions}}`,

  qualificationQuestions: [],

  defaultLeadFormFields: [
    {
      id: "field_name",
      type: "text",
      label: "Name",
      placeholder: "Your name",
      required: true,
      order: 1,
      aiExtractable: true,
      aiExtractionKey: "name",
    },
    {
      id: "field_email",
      type: "email",
      label: "Email",
      placeholder: "your@email.com",
      required: true,
      order: 2,
      aiExtractable: true,
      aiExtractionKey: "email",
    },
    {
      id: "field_phone",
      type: "phone",
      label: "Phone",
      placeholder: "(555) 123-4567",
      required: false,
      order: 3,
      aiExtractable: true,
      aiExtractionKey: "phone",
    },
    {
      id: "field_message",
      type: "textarea",
      label: "How can we help?",
      placeholder: "Tell us what you need...",
      required: false,
      order: 4,
    },
  ],

  triggerSignals: [
    {
      description: "User expresses interest in services or wants to connect",
      examples: [
        "I'm interested in your services",
        "Can someone contact me?",
        "I'd like to learn more",
        "How do I get started?",
      ],
      urgency: "medium",
    },
  ],

  suggestedQuestions: [
    "What services do you offer?",
    "How can you help me?",
    "What are your hours?",
    "How do I get started?",
  ],

  successMessage: "Thank you! We'll be in touch soon.",

  bookingCategories: [],

  boundaries: [],

  defaultWelcomeMessage: "Hi! How can I help you today?",
  defaultChatGreeting: "Welcome! What can I help you with?",
  defaultAppearance: { primaryColor: "#1F2937", accentColor: "#6B7280" },
};

// ─── Exports ─────────────────────────────────────────────────────────────────

export const NICHE_TEMPLATES: Record<NicheType, NicheTemplate> = {
  LAW_FIRM: lawFirmTemplate,
  BUSINESS_COACH: businessCoachTemplate,
  THERAPIST: therapistTemplate,
  REAL_ESTATE: realEstateTemplate,
  FINANCIAL_ADVISOR: financialAdvisorTemplate,
  CUSTOM: customTemplate,
};

export function getNicheTemplate(niche: NicheType): NicheTemplate {
  return NICHE_TEMPLATES[niche];
}

export function getAllNicheTemplates(): NicheTemplate[] {
  return Object.values(NICHE_TEMPLATES);
}

export function getNicheBySlug(slug: string): NicheTemplate | undefined {
  const nicheMap: Record<string, NicheType> = {
    "law-firm": "LAW_FIRM",
    "business-coach": "BUSINESS_COACH",
    therapist: "THERAPIST",
    "real-estate": "REAL_ESTATE",
    "financial-advisor": "FINANCIAL_ADVISOR",
    custom: "CUSTOM",
  };
  const nicheType = nicheMap[slug];
  return nicheType ? NICHE_TEMPLATES[nicheType] : undefined;
}

export function getNicheSlug(nicheType: NicheType): string {
  const slugMap: Record<NicheType, string> = {
    LAW_FIRM: "law-firm",
    BUSINESS_COACH: "business-coach",
    THERAPIST: "therapist",
    REAL_ESTATE: "real-estate",
    FINANCIAL_ADVISOR: "financial-advisor",
    CUSTOM: "custom",
  };
  return slugMap[nicheType];
}
