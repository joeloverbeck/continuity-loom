# Blind paired evaluation: Trial 03

## Variant A

1. **Dirty authority adoption — Pass.** Step 1 says to match the issue-named dirty ADR and untracked context document, classify both as “in-scope pending authority,” preserve them, and list all other dirty paths as excluded. Steps 7 and 11 repeat the narrow staging and untouched-unrelated-dirt checks.
2. **Test-first public seams — Pass.** Steps 3–5 explicitly use red-green-refactor at the shared `Glyph` public contract and at the game UI render/interaction seam. The plan requires intended behavioral reds for runtime validation, market cards, player mat, legend, and enabled action anchors.
3. **Focused, parity, and root verification — Pass.** Steps 4–5 require focused component and parity checks; step 7 names the root gates `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`, with exact results recorded.
4. **Real interactive browser proof — Pass.** Step 6 requires the real routed game screen, navigation through the user decision/action path, glyph assertions, activation of action-sensitive anchors, and observed outcomes. It also requires recording exact commands, URLs, ports, owners, PIDs/sessions, and backend behavior rather than assuming a default port.
5. **Screenshot/trace disposition — Pass.** Step 6 identifies the screenshot as acceptance evidence, requires a stable identity and SHA-256, retains it through closeout, and distinguishes tracked evidence from an approved durable/local evidence disposition. This is not treated as an ephemeral preview.
6. **Process/browser cleanup and port proof — Pass.** Steps 6, 8, and 11 require port-owner inspection, isolated proof-owned ports when needed, currentness probes, clean-session reruns, cleanup of only proof-owned server/browser processes, and recorded cleanup.
7. **Child-first closeout with final-SHA evidence — Pass.** Steps 8–10 establish and verify the final SHA, post and byte-verify parent evidence, close #70 and then #71 with exact final-SHA/rollup comments and readbacks, and close #69 only after both children and any other true children are verified closed or non-blocking. Step 11 requires a final exact readback of all three issues.

Material regressions: none.

Severe regressions: none.

## Variant B

1. **Dirty authority adoption — Pass.** Step 1 explicitly matches the dirty ADR and untracked context document to the issue paths, adopts those two files into scope, and excludes every other dirty path from editing, staging, and reversion. Later staging and handoff steps preserve that boundary.
2. **Test-first public seams — Pass.** Steps 2–3 require intended behavioral reds through the shared consumer-facing `Glyph` boundary and the existing game UI/parity seams, including explicit enabled-state and action-identity assertions.
3. **Focused, parity, and root verification — Pass.** Steps 2–3 run focused and parity checks; step 5 requires lint, typecheck, full tests, and build, with exact commands, counts, run counts, and represented trees.
4. **Real interactive browser proof — Pass.** Step 4 records the actual loopback URL, ports, owners, processes, and loaded revision, then navigates through the real production route to the market decision state. It inspects glyph-bearing surfaces and exercises every issue-named enabled action anchor through its expected behavior; previews and nearby states are explicitly rejected as proof.
5. **Screenshot/trace disposition — Pass.** Steps 1 and 4 explicitly designate the screenshot as durable acceptance evidence at a repository-authorized path, with logical ID, path, hash, viewport, route, and represented tree. The tracked-versus-authorized evidence handling is stated clearly.
6. **Process/browser cleanup and port proof — Pass.** Steps 1 and 4 inspect actual port owners, use isolated proof-owned loopback ports if defaults are occupied, align proxy/API configuration, probe backend behavior, record PIDs/sessions, and stop only proof-owned processes. Step 9 reports cleanup.
7. **Child-first closeout with final-SHA evidence — Pass.** Steps 5–8 establish final-tree and remote-reachability evidence, post and byte-verify shared parent evidence, close #70 and #71 separately with the verified final SHA and exact readbacks, incorporate those readbacks into revalidated final parent evidence, then close and exact-read #69. Step 9 repeats the final readback.

Material regressions: none.

Severe regressions: none.

## Overall decision

**B wins narrowly.** Both variants satisfy all seven deterministic requirements and neither contains a material or severe regression. B is slightly stronger and easier to audit because it states the screenshot disposition as durable acceptance evidence without qualification, explicitly rejects preview/nearby-state browser proof, names the actual loaded revision for each proof process, and gives a particularly crisp sequence for rebuilding and revalidating final parent evidence after exact child-state readbacks. A is also fully acceptable, but its substantially longer closeout machinery makes the same guarantees less direct.
