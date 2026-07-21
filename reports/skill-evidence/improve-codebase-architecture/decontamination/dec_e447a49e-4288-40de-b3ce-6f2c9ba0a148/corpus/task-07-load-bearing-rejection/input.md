# Prior-turn artifact

The report's top recommendation was to merge duplicate normalization code from
the offline importer and server into one server-owned module. The report is a
local scratch file under `/tmp` and the repository currently has no ADR stating
why the duplication exists.

The user has supplied a durable ownership and release constraint that future
architecture explorers would not infer from call sites alone. The companion
domain-modeling and grilling workflows are available. Creating an ADR would be
a repository mutation and the user has not explicitly approved that mutation.
