/**
 * The clinic's display name, in one place.
 *
 * The Mini App had it typed out in each screen's header, which is how a rename
 * ends up half-done. The site keeps the same value in `site/src/lib/content.ts`
 * — these two are separate builds, so they cannot share a module, but they must
 * not disagree.
 */
export const CLINIC_NAME = 'GalaClinic';
