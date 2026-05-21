# Delta Spec: Scavenger Hunts

Updates to evergreen specs when shipped.

## New spec: `specs/scavenger-hunts.md`
Create with: overview, data model (ScavengerHunt, HuntItem, HuntProgress), API routes, completion logic, access rules, key files.

## `specs/passport.md` additions
- Scavenger hunt completion triggers a passport stamp with `minerals_found` set to the found item labels
- `HuntProgress.stamp_awarded` prevents duplicate stamps per booking

## `specs/sites.md` additions
- Sites can have an active scavenger hunt (`ScavengerHunt` linked by `site_id`)
- Visitors with a confirmed booking can access the hunt page
