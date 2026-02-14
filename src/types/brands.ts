/**
 * Branded types for type-safe IDs and strings
 * Following CLAUDE.md C-5 (MUST): Prefer branded types for IDs
 */

declare const brand: unique symbol;

export type Brand<T, TBrand extends string> = T & { readonly [brand]: TBrand };

// ID Branded Types
export type TestimonialId = Brand<string, "TestimonialId">;
export type AccordionItemId = Brand<string, "AccordionItemId">;
export type BenefitId = Brand<string, "BenefitId">;
export type NavLinkHref = Brand<string, "NavLinkHref">;

// Helper functions to create branded values
export function createTestimonialId(id: string): TestimonialId {
  return id as TestimonialId;
}

export function createAccordionItemId(id: string): AccordionItemId {
  return id as AccordionItemId;
}

export function createBenefitId(id: string): BenefitId {
  return id as BenefitId;
}

export function createNavLinkHref(href: string): NavLinkHref {
  return href as NavLinkHref;
}
