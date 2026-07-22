import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  acknowledgeDurableChangeReminder,
  getDurableChangeReminder,
  type DurableChangeReminder as DurableChangeReminderState
} from "../api.js";
import { useProjectOpen } from "./project-open.js";
import { useReminderRefresh } from "./reminder-refresh.js";

const checklistQuestions = [
  "Did a secret become known?",
  "Did a character move?",
  "Did an object change hands?",
  "Did a relationship or emotion change?",
  "Did a promise, obligation, clock, consequence, injury, or open thread change?",
  "Does current authoritative state need updating?"
] as const;

const quickLinkTypes = [
  "EVENT",
  "FACT",
  "RELATIONSHIP",
  "EMOTION",
  "OBJECT",
  "LOCATION",
  "ENTITY STATUS",
  "CLOCK",
  "OBLIGATION",
  "CONSEQUENCE",
  "OPEN THREAD",
  "CAST MEMBER"
] as const;

function createRecordPath(recordType: string): string {
  return `/records?create=${encodeURIComponent(recordType)}`;
}

export function DurableChangeReminder(): React.JSX.Element | null {
  const [reminder, setReminder] = useState<DurableChangeReminderState | null>(null);
  const [snoozed, setSnoozed] = useState(false);
  const { isProjectOpen } = useProjectOpen();
  const { refreshSignal } = useReminderRefresh();

  useEffect(() => {
    let active = true;

    if (!isProjectOpen) {
      setReminder(null);
      return () => {
        active = false;
      };
    }

    void getDurableChangeReminder()
      .then((response) => {
        if (!active) {
          return;
        }

        setReminder(response.ok ? response.reminder : null);
      })
      .catch(() => {
        if (active) {
          setReminder(null);
        }
      });

    return () => {
      active = false;
    };
  }, [isProjectOpen, refreshSignal]);

  async function acknowledge(): Promise<void> {
    const response = await acknowledgeDurableChangeReminder();
    if (response.ok) {
      setReminder(response.reminder);
      setSnoozed(false);
    }
  }

  if (!reminder?.active || snoozed) {
    return null;
  }

  return (
    <section className="durableReminder" aria-labelledby="durable-reminder-title">
      <div className="durableReminderHeader">
        <div>
          <p className="eyebrow">Durable-change reminder</p>
          <h2 id="durable-reminder-title">Segment {reminder.latestSegment?.sequence} was accepted</h2>
        </div>
        <div className="durableReminderActions">
          <button type="button" onClick={() => void acknowledge()}>
            Acknowledge
          </button>
          <button type="button" className="secondaryButton" onClick={() => setSnoozed(true)}>
            Snooze
          </button>
        </div>
      </div>

      <p>
        Accepted prose may have created durable continuity changes. Update records manually before the next
        generation.
      </p>
      <p className="muted">Accepted at {reminder.latestSegment?.createdAt}</p>

      <ul className="durableReminderChecklist" aria-label="Manual continuity checklist">
        {checklistQuestions.map((question) => (
          <li key={question}>{question}</li>
        ))}
      </ul>

      <div className="durableReminderLinks" aria-label="Record creation quick links">
        {reminder.latestSegment ? <Link to="/accepted-segment-change-review">Review latest segment</Link> : null}
        {quickLinkTypes.map((recordType) => (
          <Link key={recordType} to={createRecordPath(recordType)}>
            Create {recordType}
          </Link>
        ))}
        <Link to="/generation-brief">Update Generation Brief</Link>
      </div>
    </section>
  );
}
