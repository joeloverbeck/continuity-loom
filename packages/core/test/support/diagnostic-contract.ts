import {
  DIAGNOSTIC_CODES,
  type AffectedReference,
  type BuildValidationSnapshotInput,
  type Severity
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

const coveredContracts = [
  covered({
    code: DIAGNOSTIC_CODES.missingStoryConfig,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      delete input.storyConfig.storyContract;
    },
    repairDefect: (input) => {
      input.storyConfig.storyContract = cleanValidationInput().storyConfig.storyContract!;
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
    repairDefect: (input) => {
      input.generationSession.current_authoritative_state = cleanValidationInput().generationSession.current_authoritative_state!;
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
    repairDefect: (input) => {
      input.generationSession.manual_moment_directive = cleanValidationInput().generationSession.manual_moment_directive!;
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
    repairDefect: (input) => {
      input.generationSession.immediate_handoff = cleanValidationInput().generationSession.immediate_handoff!;
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
    repairDefect: (input) => {
      input.versions.template = cleanValidationInput().versions.template;
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
    repairDefect: (input) => {
      input.records = cleanValidationInput().records;
    },
    expectedAffected: [{ field: "generationSession.active_working_set.selected_pov" }]
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
  contract: Omit<RunnableDiagnosticContract, "status" | "buildValidBaseline"> & {
    readonly buildValidBaseline?: () => BuildValidationSnapshotInput;
  }
): RunnableDiagnosticContract {
  return {
    status: "covered",
    buildValidBaseline: cleanValidationInput,
    ...contract
  };
}
