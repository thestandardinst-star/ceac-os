export const PRODUCT_TERMS = Object.freeze({
  assigned: "Assigned",
  agreed: "Agreed",
  private: "Private",
  not_started: "Not started",
  in_progress: "In progress",
  waiting_on: "Waiting on",
  in_review: "In review",
  returned: "Sent back",
  completed: "Completed",
  self_certified: "Self-certified",
  room: "Room",
  meeting: "Meeting",
  decision: "Decision",
  request: "Request",
  deliverable: "Deliverable",
  routine: "Routine",
  case: "Case",
  meeting_outcome: "Meeting outcome",
});

const TECHNICAL_ERROR = /\b(PGRST|PostgREST|JWT|SQLSTATE|duplicate key|foreign key|violates|permission denied|relation .* does not exist|column .* does not exist|schema cache|networkerror|failed to fetch)\b/i;

export function humanError(error, fallback = "CEAC could not complete that action.") {
  const message = String(error?.message || error || "").trim();
  if (!message || TECHNICAL_ERROR.test(message)) return fallback;
  return message;
}
