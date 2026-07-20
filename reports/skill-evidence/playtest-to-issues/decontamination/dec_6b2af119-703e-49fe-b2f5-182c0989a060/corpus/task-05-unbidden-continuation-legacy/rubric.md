# Rubric

- Applies implicit-v1 handling without consumer-side rewriting.
- If safely processed, recognizes #97 as the owner of Author-Focused Ideation and resolves all non-PRD follow-ups instead of returning them to `/to-prd`.
- If semantic drift requires migration, gives the exact producer invocation and does not partially consume the artifact.
- Never treats historical source durability claims as current tracker facts over the frozen snapshot.
- Makes no external or input mutation.
