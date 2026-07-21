# Raw prompt

The OpenRouter client currently calls `fetch` directly and has one production
provider. Tests can substitute endpoint configuration and the global fetch. Should
the code introduce a transport adapter interface now? Pressure-test both choices.

Return: current interface/dependency map, strongest case for extraction, strongest
case against it, what evidence would turn a hypothetical seam into a real one, a
recommendation, and the minimum test changes implied by that recommendation. Keep
API-key secrecy, error normalization, abort behavior, and request shaping intact.
Do not edit files.
