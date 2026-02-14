import type { NicheType } from "./niches";
import { NICHE_TEMPLATES } from "./niches";

// ─── Quick Contact Form (generic, works for any niche) ──────────────────────

export const CONTACT_CAPTURE_FORM = {
  name: "Quick Contact Form",
  description: "Simple contact capture form with name, email, and phone",
  isDefault: false,
  isActive: true,
  fields: [
    {
      id: "field_name",
      type: "text" as const,
      label: "Name",
      placeholder: "Your name",
      required: true,
      order: 1,
      aiExtractable: true,
      aiExtractionKey: "name",
    },
    {
      id: "field_email",
      type: "email" as const,
      label: "Email",
      placeholder: "your@email.com",
      required: true,
      order: 2,
      aiExtractable: true,
      aiExtractionKey: "email",
    },
    {
      id: "field_phone",
      type: "phone" as const,
      label: "Phone",
      placeholder: "(555) 123-4567",
      required: false,
      order: 3,
      aiExtractable: true,
      aiExtractionKey: "phone",
    },
  ],
  appearance: {
    primaryColor: "#001F54",
    accentColor: "#3B82F6",
    buttonText: "Submit",
  },
  behavior: {
    showSuccessMessage: true,
    successMessage: "Thank you! We'll be in touch soon.",
  },
};

// ─── Default form template (generic) ─────────────────────────────────────────

export const DEFAULT_FORM_TEMPLATE = {
  name: "Contact Form",
  description: "Default contact capture form",
  isDefault: true,
  isActive: true,
  fields: [
    {
      id: "field_name",
      type: "text" as const,
      label: "Full Name",
      placeholder: "John Smith",
      required: true,
      order: 1,
      aiExtractable: true,
      aiExtractionKey: "name",
    },
    {
      id: "field_email",
      type: "email" as const,
      label: "Email Address",
      placeholder: "john@example.com",
      required: true,
      order: 2,
      aiExtractable: true,
      aiExtractionKey: "email",
    },
    {
      id: "field_phone",
      type: "phone" as const,
      label: "Phone Number",
      placeholder: "(555) 123-4567",
      required: true,
      order: 3,
      aiExtractable: true,
      aiExtractionKey: "phone",
    },
    {
      id: "field_message",
      type: "textarea" as const,
      label: "How can we help?",
      placeholder: "Tell us about your needs...",
      required: false,
      order: 4,
    },
  ],
  appearance: {
    primaryColor: "#001F54",
    accentColor: "#3B82F6",
    buttonText: "Submit",
  },
  behavior: {
    showSuccessMessage: true,
    successMessage: "Thank you for your information! We'll be in touch shortly.",
  },
};

// ─── Niche-aware default form generator ──────────────────────────────────────

export function getDefaultLeadFormForNiche(nicheType: NicheType) {
  const template = NICHE_TEMPLATES[nicheType];

  return {
    name: `${template.name} Contact Form`,
    description: `Default lead capture form for ${template.name.toLowerCase()} chatbots`,
    isDefault: true,
    isActive: true,
    fields: template.defaultLeadFormFields,
    appearance: {
      primaryColor: template.defaultAppearance.primaryColor,
      accentColor: template.defaultAppearance.accentColor,
      buttonText: "Submit",
    },
    behavior: {
      showSuccessMessage: true,
      successMessage: template.successMessage,
    },
  };
}

// ─── All niche form templates (for template picker UI) ───────────────────────

export function getAllLeadFormTemplates() {
  return Object.entries(NICHE_TEMPLATES).map(([key, template]) => ({
    id: key,
    name: `${template.name} Contact Form`,
    description: template.description,
    nicheType: key as NicheType,
    fields: template.defaultLeadFormFields,
    appearance: {
      primaryColor: template.defaultAppearance.primaryColor,
      accentColor: template.defaultAppearance.accentColor,
      buttonText: "Submit",
    },
    behavior: {
      showSuccessMessage: true,
      successMessage: template.successMessage,
    },
  }));
}
