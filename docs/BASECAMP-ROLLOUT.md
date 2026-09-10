# Basecamp rollout

This is a redesign of the existing Next.js application. There is no replacement identity provider, browser database, or new data model. All account, submission, rating, comment, admin, profile and portfolio actions continue to use the existing PostgreSQL backend.

## Adoption

1. Record the current deployment revision and take the normal PostgreSQL and `/data/uploads` backups. Verify that those backups can be restored to staging.
2. Deploy this branch to staging with the same environment variable names and a restored database and uploads volume. Keep the production hostname, cookie name, and storage paths unchanged at cutover.
3. Run `node scripts/basecamp-preflight.mjs` with staging `DATABASE_URL`. It opens a read-only, repeatable-read transaction, reports aggregate counts, and checks build/rating relationships. It prints no user records or credentials.
4. Check existing-account login/logout/reset, signup, build create/edit, four-category rating/edit window, comments, profile/portfolio, judge access, and admin authorization. Compare preflight counts with the backup. Confirm existing `/u/:handle`, `/builds/:id`, and upload links resolve.
5. Review uploaded HTML compatibility: sandboxed documents now get an opaque origin on every serving hostname. Scripts and popups still work, but origin-bound storage and some network requests may need adaptation. Test important existing submissions before promotion.
6. Deploy the app revision to the existing service. **Do not run the schema initialization script just for this UI rollout.** No DDL, record rewrite, account export, password rehash, role remap, session rotation, or episode-code conversion is required.
7. Monitor server errors and critical paths. Roll back the application revision if needed; the schema and data remain compatible with the previous app. Preserve the stronger upload sandbox when preparing a long-lived rollback branch.

## Security changes

- Uploaded HTML is given an opaque sandbox origin on both the canonical and upload host, without relying only on link construction. Documents receive a no-referrer policy.
- Site responses set `nosniff`, a conservative referrer policy, and disable camera, microphone, and geolocation by default. Review these permissions if future first-party features need them.
- Login failures use one message for unknown email and incorrect password. This normalizes displayed errors; it is not a complete timing-resistant anti-enumeration or rate-limiting solution.
- Existing server-side access control and session handling remain in place. This PR does not claim an exhaustive security audit.

## ChatGPT Sites preview

`node scripts/render-sites.mjs /absolute/output/directory` renders the same `BasecampHome` component and CSS using a dated snapshot of public CampAI pages, recorded in `docs/sites-public-snapshot.json`. There are no invented people, builds, ratings, or browser-persisted actions. Links go to real CampAI routes. The preview is a static design preview, not a separately connected deployment of the PostgreSQL application. Production reads fresh records directly from PostgreSQL.

Validation completed locally: TypeScript check and Next.js production build. Live authenticated workflows and staging preflight require operator-provided database access and remain rollout checks.

## Design references

The direction combines readable, task-first navigation with forest green, warm paper, editorial serif headings, and restrained contour geometry. Research references: [Play in the Woods](https://bachoodesign.com/portfolio/play-in-the-woods/) and [San Rita topographic web experience](https://tympanus.net/codrops/2026/03/24/digital-craft-wild-soul-building-san-ritas-topographic-web-experience/). The implementation uses original CSS, system fonts, and the existing component stack.
