import { describe, expect, it } from "vitest";

import { pruneWorkingSetReferences, type GenerationSession } from "../src/index.js";

const liveA = "019b0298-5c00-7000-8000-000000000001";
const liveB = "019b0298-5c00-7000-8000-000000000002";
const liveC = "019b0298-5c00-7000-8000-000000000003";
const danglingA = "019b0298-5c00-7000-8000-000000000004";
const danglingB = "019b0298-5c00-7000-8000-000000000005";
const danglingC = "019b0298-5c00-7000-8000-000000000006";

function sessionWithWorkingSet(activeWorkingSet: GenerationSession["active_working_set"]): GenerationSession {
  return {
    active_working_set: activeWorkingSet,
    current_cast_voice_pressure: [],
    cast_voice_overrides: []
  };
}

function keepLive(id: string): boolean {
  return id === liveA || id === liveB || id === liveC;
}

describe("pruneWorkingSetReferences", () => {
  it("prunes dangling selected record IDs", () => {
    const session = sessionWithWorkingSet({
      selected_records: [liveA, danglingA, liveB],
      active_onstage_cast_full: [],
      present_minor_cast_compressed: [],
      offstage_relevant_cast: []
    });

    const result = pruneWorkingSetReferences(session, keepLive);

    expect(result.session.active_working_set?.selected_records).toEqual([liveA, liveB]);
    expect(result.removed).toEqual([danglingA]);
  });

  it("prunes dangling cast band IDs", () => {
    const session = sessionWithWorkingSet({
      selected_records: [],
      active_onstage_cast_full: [
        { cast_member_id: liveA, local_function: "active_speaker" },
        { cast_member_id: danglingA, local_function: "active_silent" }
      ],
      present_minor_cast_compressed: [danglingB, liveB],
      offstage_relevant_cast: [liveC, danglingC]
    });

    const result = pruneWorkingSetReferences(session, keepLive);

    expect(result.session.active_working_set).toMatchObject({
      active_onstage_cast_full: [{ cast_member_id: liveA, local_function: "active_speaker" }],
      present_minor_cast_compressed: [liveB],
      offstage_relevant_cast: [liveC]
    });
    expect(result.removed).toEqual([danglingA, danglingB, danglingC]);
  });

  it("clears dangling selected_pov and manual_directive_id", () => {
    const session = sessionWithWorkingSet({
      selected_records: [],
      active_onstage_cast_full: [],
      present_minor_cast_compressed: [],
      offstage_relevant_cast: [],
      selected_pov: danglingA,
      manual_directive_id: danglingB
    });

    const result = pruneWorkingSetReferences(session, keepLive);

    expect(result.session.active_working_set).not.toHaveProperty("selected_pov");
    expect(result.session.active_working_set).not.toHaveProperty("manual_directive_id");
    expect(result.removed).toEqual([danglingA, danglingB]);
  });

  it("preserves omniscient POV", () => {
    const session = sessionWithWorkingSet({
      selected_records: [],
      active_onstage_cast_full: [],
      present_minor_cast_compressed: [],
      offstage_relevant_cast: [],
      selected_pov: "omniscient"
    });

    const result = pruneWorkingSetReferences(session, () => false);

    expect(result.session.active_working_set?.selected_pov).toBe("omniscient");
    expect(result.removed).toEqual([]);
  });

  it("does not change a clean working set", () => {
    const session = sessionWithWorkingSet({
      selected_records: [liveA],
      active_onstage_cast_full: [{ cast_member_id: liveB, local_function: "close_non_pov" }],
      present_minor_cast_compressed: [liveC],
      offstage_relevant_cast: [],
      selected_pov: liveA,
      manual_directive_id: liveB
    });

    const result = pruneWorkingSetReferences(session, keepLive);

    expect(result.session).toEqual(session);
    expect(result.removed).toEqual([]);
  });

  it("does not change a session without an active working set", () => {
    const session: GenerationSession = {
      current_cast_voice_pressure: [],
      cast_voice_overrides: []
    };

    const result = pruneWorkingSetReferences(session, () => false);

    expect(result.session).toBe(session);
    expect(result.removed).toEqual([]);
  });
});
