import {
  DIAGNOSTIC_CODES,
  type AffectedReference,
  type BuildValidationSnapshotInput,
  type Severity,
  type ValidationRecord
} from "../../src/index.js";
import { cleanValidationInput, validationIds } from "./arbitraries/validation-snapshots.js";

export type PromptApplicability = "applies" | "prose-only";

export type RunnableDiagnosticContract = {
  readonly status: "covered";
  readonly code: string;
  readonly severity: Severity;
  readonly promptKinds: PromptApplicability;
  readonly buildValidBaseline: () => BuildValidationSnapshotInput;
  readonly introduceMinimalDefect: (input: BuildValidationSnapshotInput) => void;
  readonly repairDefect: (input: BuildValidationSnapshotInput) => void;
  readonly expectedAffected: readonly AffectedReference[];
};

export type DeferredDiagnosticContract = {
  readonly status: "deferred";
  readonly code: string;
  readonly reason: string;
};

export type DiagnosticContract = RunnableDiagnosticContract | DeferredDiagnosticContract;

const auxIds = Object.freeze({
  actor: "019b0298-5c00-7000-8000-000000000101",
  actorStatusA: "019b0298-5c00-7000-8000-000000000102",
  actorStatusB: "019b0298-5c00-7000-8000-000000000103",
  object: "019b0298-5c00-7000-8000-000000000104",
  plan: "019b0298-5c00-7000-8000-000000000105",
  secret: "019b0298-5c00-7000-8000-000000000106",
  location: "019b0298-5c00-7000-8000-000000000107",
  otherLocation: "019b0298-5c00-7000-8000-000000000108",
  relationship: "019b0298-5c00-7000-8000-000000000109",
  fact: "019b0298-5c00-7000-8000-000000000110",
  dangling: "019b0298-5c00-7000-8000-000000000111",
  unselectedEntity: "019b0298-5c00-7000-8000-000000000112",
  unselectedStatus: "019b0298-5c00-7000-8000-000000000113",
  unselectedLocation: "019b0298-5c00-7000-8000-000000000114"
});

export const expectedRunnableDiagnosticCodes = [
  DIAGNOSTIC_CODES.activeCastIncomplete,
  DIAGNOSTIC_CODES.activePhysicalContextIncomplete,
  DIAGNOSTIC_CODES.activeSecretIncomplete,
  DIAGNOSTIC_CODES.contentEnvelopeContradiction,
  DIAGNOSTIC_CODES.currentLocationReferenceInvalid,
  DIAGNOSTIC_CODES.directiveStopGuidanceDisagreement,
  DIAGNOSTIC_CODES.entityCurrentLocationContradiction,
  DIAGNOSTIC_CODES.entityStatusesReferenceInvalid,
  DIAGNOSTIC_CODES.focusTagCountInvalid,
  DIAGNOSTIC_CODES.handoffCurrentStateContradiction,
  DIAGNOSTIC_CODES.hiddenTruthInPovKnowledge,
  DIAGNOSTIC_CODES.impossibleActionPhysicalContext,
  DIAGNOSTIC_CODES.inactivePlanHolder,
  DIAGNOSTIC_CODES.localProseScopeViolation,
  DIAGNOSTIC_CODES.missingConstitutionalSection,
  DIAGNOSTIC_CODES.missingCurrentAuthoritativeState,
  DIAGNOSTIC_CODES.missingImmediateHandoff,
  DIAGNOSTIC_CODES.missingManualDirective,
  DIAGNOSTIC_CODES.missingStoryConfig,
  DIAGNOSTIC_CODES.objectCurrentHolderContradiction,
  DIAGNOSTIC_CODES.objectLocationHolderIncoherence,
  DIAGNOSTIC_CODES.offstageEntityReferenceInvalid,
  DIAGNOSTIC_CODES.offstageInterruptionMissingRoute,
  DIAGNOSTIC_CODES.onstageEntityReferenceInvalid,
  DIAGNOSTIC_CODES.onstageEntityStatusContradiction,
  DIAGNOSTIC_CODES.onstageOffstageEntityOverlap,
  DIAGNOSTIC_CODES.povKnowledgeMissing,
  DIAGNOSTIC_CODES.promptFacingProseContamination,
  DIAGNOSTIC_CODES.recordReferenceDangling,
  DIAGNOSTIC_CODES.recordReferenceTypeMismatch,
  DIAGNOSTIC_CODES.recordReferenceUnselectedRequired,
  DIAGNOSTIC_CODES.relationshipSelfReference,
  DIAGNOSTIC_CODES.secretRevealContradiction
] as const;

const coveredContracts = [
  covered({
    code: DIAGNOSTIC_CODES.missingStoryConfig,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      delete input.storyConfig.storyContract;
    },
    expectedAffected: [{ field: "storyConfig.storyContract" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.missingCurrentAuthoritativeState,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      delete input.generationSession.current_authoritative_state;
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.missingManualDirective,
    severity: "blocker",
    promptKinds: "prose-only",
    introduceMinimalDefect: (input) => {
      input.generationSession.manual_moment_directive = {
        must_render: [],
        may_render_if_naturally_caused: [],
        do_not_force: []
      };
    },
    expectedAffected: [{ field: "generationSession.manual_moment_directive.must_render" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.missingImmediateHandoff,
    severity: "blocker",
    promptKinds: "prose-only",
    buildValidBaseline: () => {
      const input = cleanValidationInput();
      input.generationSession.generation_validation_focus!.validation_focus_tags.generation_context = [
        "continuation_after_accepted_segment"
      ];
      return input;
    },
    introduceMinimalDefect: (input) => {
      input.generationSession.immediate_handoff = {
        recent_causal_context: "",
        last_visible_moment: "",
        begin_after: ""
      };
    },
    expectedAffected: [{ field: "generationSession.immediate_handoff" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.missingConstitutionalSection,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      input.versions.template = "";
    },
    expectedAffected: [{ field: "versions" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.povKnowledgeMissing,
    severity: "blocker",
    promptKinds: "prose-only",
    introduceMinimalDefect: (input) => {
      input.records = input.records.filter((record) => record.id !== validationIds.fact);
    },
    expectedAffected: [{ field: "generationSession.active_working_set.selected_pov" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.localProseScopeViolation,
    severity: "blocker",
    promptKinds: "prose-only",
    introduceMinimalDefect: (input) => {
      input.generationSession.manual_moment_directive!.must_render = ["Write the whole chapter outline."];
    },
    expectedAffected: [{ field: "generationSession.manual_moment_directive.must_render[0]" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.directiveStopGuidanceDisagreement,
    severity: "blocker",
    promptKinds: "prose-only",
    introduceMinimalDefect: (input) => {
      input.generationSession.manual_moment_directive!.must_render = ["Continue through the later consequence."];
      input.generationSession.stop_guidance!.soft_unit_guidance = "Stop after the first response point.";
    },
    expectedAffected: [{ field: "generationSession.manual_moment_directive" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.handoffCurrentStateContradiction,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      input.generationSession.immediate_handoff!.last_visible_moment = "This contradicts current state.";
    },
    expectedAffected: [{ field: "generationSession.immediate_handoff" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.entityCurrentLocationContradiction,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      input.records = [
        ...input.records,
        entityStatus(auxIds.actorStatusA, auxIds.actor, auxIds.location),
        entityStatus(auxIds.actorStatusB, auxIds.actor, auxIds.otherLocation)
      ];
    },
    expectedAffected: [{ recordId: auxIds.actor, field: "ENTITY STATUS.location" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.objectCurrentHolderContradiction,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      input.records = [...input.records, objectRecord({ owner: validationIds.entity, carried_by: auxIds.actor })];
    },
    expectedAffected: [{ recordId: auxIds.object, field: "OBJECT.owner/carried_by" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.inactivePlanHolder,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      input.records = [
        ...input.records,
        entityStatus(auxIds.actorStatusA, auxIds.actor, auxIds.location, { agency: "unconscious" }),
        planRecord({ holder: auxIds.actor })
      ];
    },
    expectedAffected: [{ recordId: auxIds.plan, field: "PLAN.holder" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.secretRevealContradiction,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      input.records = [...input.records, hiddenKnownSecret({ pov_access: "knows" })];
    },
    expectedAffected: [{ recordId: auxIds.secret, field: "SECRET.holders/non_holders_to_protect" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.hiddenTruthInPovKnowledge,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      input.records = [...input.records, hiddenKnownSecret({ pov_access: "hidden" })];
    },
    expectedAffected: [{ recordId: auxIds.secret, field: "SECRET.pov_access" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.offstageInterruptionMissingRoute,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
        "offstage_interruption_possible"
      ];
      input.generationSession.current_authoritative_state!.routes_and_exits = [];
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.impossibleActionPhysicalContext,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
        "physical_interaction_expected"
      ];
      input.generationSession.current_authoritative_state!.consent_or_force_conditions = "";
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.contentEnvelopeContradiction,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      input.storyConfig.universalContentPolicy!.allowed_content_scope = "No explicit sex or non-graphic violence.";
      input.generationSession.manual_moment_directive!.must_render = ["Render explicit sex."];
    },
    expectedAffected: [{ field: "storyConfig.universalContentPolicy.allowed_content_scope" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.promptFacingProseContamination,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      input.generationSession.immediate_handoff!.recent_causal_context = "This is copied accepted prose from the last scene.";
    },
    expectedAffected: [{ field: "generationSession.immediate_handoff.recent_causal_context" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.activeSecretIncomplete,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      input.records = [
        ...input.records,
        secretRecord({
          holders: [],
          non_holders_to_protect: "none",
          forbidden_reveals: [],
          reveal_permission: "locked"
        })
      ];
    },
    expectedAffected: [{ recordId: auxIds.secret, field: "holders" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.activePhysicalContextIncomplete,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      input.records = [...input.records, objectRecord()];
      input.generationSession.generation_validation_focus!.validation_focus_tags.possible_durable_changes = [
        "object_use_possible"
      ];
      input.generationSession.current_authoritative_state!.possessions = [];
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.activeCastIncomplete,
    severity: "blocker",
    promptKinds: "prose-only",
    buildValidBaseline: completeCastBaseline,
    introduceMinimalDefect: (input) => {
      input.records = input.records.map((record) =>
        record.id === validationIds.cast
          ? {
              ...recordWithoutLocalFunction(record),
              payload: { entity_id: validationIds.entity, identity: { one_line: "A witness." } }
            }
          : record
      );
    },
    expectedAffected: [{ recordId: validationIds.cast, field: "CAST MEMBER" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.focusTagCountInvalid,
    severity: "blocker",
    promptKinds: "prose-only",
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.generation_context = [
        "first_segment",
        "continuation_after_accepted_segment"
      ];
    },
    expectedAffected: [{ field: "generationSession.generation_validation_focus.validation_focus_tags.generation_context" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.onstageEntityReferenceInvalid,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: referenceBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.current_authoritative_state!.onstage_entities = [auxIds.unselectedEntity];
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state.onstage_entities" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.offstageEntityReferenceInvalid,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: referenceBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.current_authoritative_state!.offstage_pressuring_entities = [auxIds.unselectedEntity];
      input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
        "offstage_interruption_possible"
      ];
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state.offstage_pressuring_entities" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.entityStatusesReferenceInvalid,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: referenceBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.current_authoritative_state!.entity_statuses = [auxIds.unselectedStatus];
      input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
        "physical_interaction_expected"
      ];
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state.entity_statuses" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.currentLocationReferenceInvalid,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: referenceBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.current_authoritative_state!.current_location = auxIds.unselectedLocation;
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state.current_location" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.recordReferenceDangling,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: referenceBaseline,
    introduceMinimalDefect: (input) => {
      input.records = [...input.records, beliefRecord(auxIds.dangling)];
    },
    expectedAffected: [{ recordId: auxIds.fact, field: "BELIEF.holder" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.recordReferenceTypeMismatch,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: referenceBaseline,
    introduceMinimalDefect: (input) => {
      input.records = [...input.records, objectRecord({ current_location: auxIds.fact })];
    },
    expectedAffected: [{ recordId: auxIds.object, field: "OBJECT.current_location" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.recordReferenceUnselectedRequired,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: referenceBaseline,
    introduceMinimalDefect: (input) => {
      input.records = [...input.records, secretRecord({ holders: [auxIds.unselectedEntity] })];
    },
    expectedAffected: [{ recordId: auxIds.secret, field: "SECRET.secret_holder" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.onstageOffstageEntityOverlap,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: structuralBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.current_authoritative_state!.offstage_pressuring_entities = [auxIds.actor];
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state.onstage_entities/offstage_pressuring_entities" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.onstageEntityStatusContradiction,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: structuralBaseline,
    introduceMinimalDefect: (input) => {
      input.records = [...input.records, entityStatus(auxIds.actorStatusA, auxIds.actor, "offstage")];
    },
    expectedAffected: [{ recordId: auxIds.actorStatusA, field: "ENTITY STATUS.location" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.objectLocationHolderIncoherence,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: structuralBaseline,
    introduceMinimalDefect: (input) => {
      input.records = [
        ...input.records,
        objectRecord({ current_location: "carried_by_holder", carried_by: "none" })
      ];
    },
    expectedAffected: [{ recordId: auxIds.object, field: "OBJECT.current_location/carried_by" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.relationshipSelfReference,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: structuralBaseline,
    introduceMinimalDefect: (input) => {
      input.records = [...input.records, relationshipRecord({ from: auxIds.actor, to: auxIds.actor })];
    },
    expectedAffected: [{ recordId: auxIds.relationship, field: "RELATIONSHIP.from/to" }]
  })
] as const satisfies readonly RunnableDiagnosticContract[];

export const diagnosticContractRegistry: ReadonlyMap<string, DiagnosticContract> = new Map(
  Object.values(DIAGNOSTIC_CODES).map((code) => {
    const covered = coveredContracts.find((contract) => contract.code === code);
    return [
      code,
      covered ?? {
        status: "deferred",
        code,
        reason: "Deferred to later SPEC026MUTDRIROB P3 family contract ticket."
      }
    ];
  })
);

export const runnableDiagnosticContracts = coveredContracts;

function covered(
  contract: Omit<RunnableDiagnosticContract, "status" | "buildValidBaseline" | "repairDefect"> & {
    readonly buildValidBaseline?: () => BuildValidationSnapshotInput;
    readonly repairDefect?: (input: BuildValidationSnapshotInput) => void;
  }
): RunnableDiagnosticContract {
  const buildValidBaseline = contract.buildValidBaseline ?? cleanValidationInput;

  return {
    status: "covered",
    buildValidBaseline,
    repairDefect: contract.repairDefect ?? restoreFrom(buildValidBaseline),
    ...contract
  };
}

function restoreFrom(buildValidBaseline: () => BuildValidationSnapshotInput): (input: BuildValidationSnapshotInput) => void {
  return (input) => {
    Object.assign(input, buildValidBaseline());
  };
}

function referenceBaseline(): BuildValidationSnapshotInput {
  const input = cleanValidationInput();
  input.records = [
    ...input.records,
    entityRecord(validationIds.pov),
    entityRecord(auxIds.actor),
    entityStatus(auxIds.actorStatusA, auxIds.actor, auxIds.location),
    locationRecord(auxIds.location),
    factRecord(auxIds.fact)
  ];
  input.generationSession.active_working_set!.selected_records = [
    ...input.generationSession.active_working_set!.selected_records,
    auxIds.actor,
    auxIds.actorStatusA,
    auxIds.location,
    auxIds.fact
  ];
  input.generationSession.current_authoritative_state!.current_location = auxIds.location;
  input.generationSession.current_authoritative_state!.onstage_entities = [auxIds.actor];
  input.generationSession.current_authoritative_state!.entity_statuses = [auxIds.actorStatusA];
  input.projectRecordIndex = {
    [auxIds.actor]: "ENTITY",
    [auxIds.actorStatusA]: "ENTITY STATUS",
    [auxIds.unselectedEntity]: "ENTITY",
    [auxIds.unselectedStatus]: "ENTITY STATUS",
    [auxIds.location]: "LOCATION",
    [auxIds.unselectedLocation]: "LOCATION",
    [auxIds.fact]: "FACT",
    [validationIds.pov]: "ENTITY"
  };
  return input;
}

function completeCastBaseline(): BuildValidationSnapshotInput {
  const input = cleanValidationInput();
  input.records = input.records.map((record) =>
    record.id === validationIds.cast
      ? {
          ...record,
          payload: {
            ...completeCastPayload(validationIds.entity)
          }
        }
      : record
  );
  return input;
}

function structuralBaseline(): BuildValidationSnapshotInput {
  const input = cleanValidationInput();
  input.records = [
    ...input.records,
    entityRecord(auxIds.actor),
    locationRecord(auxIds.location),
    locationRecord(auxIds.otherLocation)
  ];
  input.generationSession.current_authoritative_state!.current_location = auxIds.location;
  input.generationSession.current_authoritative_state!.onstage_entities = [auxIds.actor];
  input.generationSession.current_authoritative_state!.offstage_pressuring_entities = [];
  return input;
}

function entityRecord(id: string): ValidationRecord {
  return {
    id,
    type: "ENTITY",
    payload: { id, entity_kind: "person" }
  };
}

function locationRecord(id: string): ValidationRecord {
  return {
    id,
    type: "LOCATION",
    payload: { id, status: "active", name: "Warehouse" }
  };
}

function factRecord(id: string): ValidationRecord {
  return {
    id,
    type: "FACT",
    payload: { id, statement: "The hatch is locked.", known_by: "public" }
  };
}

function entityStatus(
  id: string,
  entityId: string,
  location: string,
  overrides: Partial<{ life: string; agency: string }> = {}
): ValidationRecord {
  return {
    id,
    type: "ENTITY STATUS",
    payload: {
      id,
      entity_id: entityId,
      life: "alive",
      agency: "free",
      location,
      visibility_to_pov: "visible",
      current_activity: "Listening.",
      ...overrides
    }
  };
}

function objectRecord(overrides: Partial<{
  owner: string;
  carried_by: string;
  current_location: string;
}> = {}): ValidationRecord {
  return {
    id: auxIds.object,
    type: "OBJECT",
    payload: {
      id: auxIds.object,
      status: "active",
      label: "Key",
      description: "A brass key.",
      owner: "none",
      carried_by: "none",
      current_location: auxIds.location,
      visibility_to_pov: "visible",
      usable_affordances: [],
      constraints: [],
      durability: "continuity_relevant",
      ...overrides
    }
  };
}

function planRecord(overrides: Partial<{ holder: string }> = {}): ValidationRecord {
  return {
    id: auxIds.plan,
    type: "PLAN",
    payload: {
      id: auxIds.plan,
      plan_status: "active",
      holder: validationIds.entity,
      objective: "Reach the door.",
      resources: [],
      blockers: [],
      current_step: "Act now.",
      fallback_steps: [],
      visibility_to_pov: "hidden",
      salience: "high",
      ...overrides
    }
  };
}

function secretRecord(overrides: Partial<{
  holders: string[];
  non_holders_to_protect: string | string[];
  forbidden_reveals: string[];
  reveal_permission: string;
}> = {}): ValidationRecord {
  return {
    id: auxIds.secret,
    type: "SECRET",
    payload: {
      id: auxIds.secret,
      status: "hidden",
      secret_kind: "identity",
      secret_claim: "The witness is using an alias.",
      holders: [validationIds.entity],
      non_holders_to_protect: "none",
      audience_visibility: "hidden",
      pov_access: "hidden",
      salience: "critical",
      allowed_surface_cues: ["A pause at the old name."],
      forbidden_reveals: ["Do not state the alias."],
      reveal_permission: "locked",
      reveal_triggers: [],
      clue_carriers: [],
      ...overrides
    }
  };
}

function hiddenKnownSecret(overrides: Partial<{ pov_access: string }> = {}): ValidationRecord {
  return secretRecord({
    holders: [validationIds.pov],
    non_holders_to_protect: [validationIds.pov],
    forbidden_reveals: ["Do not state the alias."],
    reveal_permission: "locked",
    ...overrides
  });
}

function beliefRecord(holder: string): ValidationRecord {
  return {
    id: auxIds.fact,
    type: "BELIEF",
    payload: {
      id: auxIds.fact,
      status: "active",
      holder,
      claim: "The door is watched.",
      belief_mode: "believes",
      truth_relation: "unknown",
      confidence: "medium",
      visibility: "private",
      access_route: "inference",
      behavioral_effect: "They hesitate.",
      salience: "medium"
    }
  };
}

function relationshipRecord(overrides: Partial<{ from: string; to: string }> = {}): ValidationRecord {
  return {
    id: auxIds.relationship,
    type: "RELATIONSHIP",
    payload: {
      id: auxIds.relationship,
      status: "active",
      axis: "trust",
      direction_kind: "directed",
      from: auxIds.actor,
      to: validationIds.entity,
      value: "medium",
      valence: "asymmetric",
      visibility: "private",
      description: "A guarded alliance.",
      pressure_text: "Trust is conditional.",
      current_expression: "Careful cooperation.",
      ...overrides
    }
  };
}

function completeCastPayload(entityId: string): Record<string, unknown> {
  return {
    entity_id: entityId,
    identity: {
      one_line: "A careful witness.",
      public_face: "Composed.",
      private_pressure: "Afraid."
    },
    voice_anchor: {
      core_voice: "formal",
      rhythm_and_syntax: "measured",
      register_and_diction: "precise",
      vocabulary_and_metaphor_pools: "weather",
      profanity_and_intensity: "low",
      taboo_and_avoidance_patterns: "home",
      dialogue_tactics_and_speech_functions: "deflects",
      address_terms_and_naming: "titles",
      silence_interruption_and_turntaking: "strategic",
      under_pressure_voice: "clipped",
      suppression_or_evasion_rule: "redirects",
      must_preserve: ["precision"],
      must_avoid: ["rambling"],
      anti_repetition_warnings: ["do not repeat weather metaphors"]
    },
    pressure_behavior_core: {
      cornered: "narrows choices",
      tempted_or_offered_power: "bargains",
      protecting_attachment: "deflects"
    },
    body_presence_core: {
      posture: "still",
      movement_style: "precise",
      tactile_details: "cold fingers",
      physicality: "still hands"
    },
    agency_core: {
      default_agency_level: "active",
      initiative_pattern: "waits for openings",
      constraint_response: "works around locks"
    },
    status: "active"
  };
}

function recordWithoutLocalFunction(record: ValidationRecord): ValidationRecord {
  const copy = { ...record };
  delete copy.localFunction;
  return copy;
}
