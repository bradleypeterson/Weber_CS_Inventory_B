# Sprint 4 asset search verification

Asset search remembers text, page, row count, applied filters, and pending filter selections within the current browser tab. Logout clears this state. Asset selection checkboxes and dialogs are not saved.

## Automated checks

From `web`, run `npm ci`, `npm test`, and `npm run build`. The regression suite exercises the real search dashboard, authentication provider, filter provider, and router lifecycle with a simulated asset-details destination and mocked API data. It also verifies delayed department permissions, storage failures, migration, and logout isolation.

## Manual checks with the running application

1. Log in with enough visible assets for several pages. Search for a matching term, apply Department and Asset Class filters, choose 25 rows, and advance to page 2 or later. Record the first visible asset.
2. Inspect an asset and return with browser Back. Confirm the same search text, filters, row count, page, and first visible asset. Repeat using the sidebar Search link.
3. Refresh the tab and repeat the checks. Change a filter without applying it, visit details, and return. The draft selection should remain pending; results should still use the applied filters.
4. Change the search text, apply different filters, reset filters, or change the row count. Each actual search-condition change should return to page 1.
5. With slow networking, revisit search and verify its saved page survives loading. A background refresh should retain the page; fewer available results should move to the last valid page. Empty results should show page 1 of 1.
6. Log out, then log in as another user and as the original user. Confirm empty search text, no asset filters, page 1, and 10 rows. Repeat with a user whose department permissions restrict available options.
7. Open the application independently in a new tab. It should start without the first tab's search state. Browser Duplicate Tab and restored-tab features may copy session storage; this implementation follows normal browser session-storage behavior.
8. Check an unrelated dashboard's filters before and after returning to asset search. Its previous persistence behavior should remain intact.

These manual checks require a running API and representative data. The automated suite does not claim to replace live database verification.
