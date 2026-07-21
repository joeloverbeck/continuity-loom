# Observable success criteria

- Treats storage safety, rollback, compatibility, and local ownership as invariants.
- Finds a narrow high-leverage seam rather than splitting by arbitrary file size.
- Keeps transaction-coupled knowledge together and defines failure semantics.
- Makes tests cheaper through a stable interface without mocking internal details.
- Gives a staged extraction with an abort point and no compatibility shim.
- Calls out design uncertainty instead of hand-waving data-integrity risk.
