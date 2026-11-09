import { createEvent } from "../actions";

export function CreateEventForm({
  organizationId,
}: {
  organizationId: string;
}) {
  return (
    <details className="form-disclosure">
      <summary className="button button-secondary">Create an event</summary>
      <form action={createEvent} className="form-stack event-form">
        <input name="organizationId" type="hidden" value={organizationId} />
        <label className="field-label">
          Event name
          <input className="text-field" maxLength={140} name="name" required />
        </label>
        <div className="field-row">
          <label className="field-label">
            Event date
            <input
              className="text-field"
              name="eventDate"
              required
              type="date"
            />
          </label>
          <label className="field-label">
            Start time
            <input
              className="text-field"
              name="eventTime"
              required
              type="time"
            />
          </label>
        </div>
        <label className="field-label">
          Time zone
          <select
            className="text-field"
            defaultValue="Asia/Manila"
            name="timezone"
          >
            <option value="Asia/Manila">Philippines (Asia/Manila)</option>
            <option value="Asia/Singapore">Singapore</option>
            <option value="UTC">UTC</option>
          </select>
        </label>
        <label className="field-label">
          Venue <span className="field-hint">Optional</span>
          <input className="text-field" maxLength={240} name="venue" />
        </label>
        <label className="field-label">
          Guest capacity
          <input
            className="text-field"
            defaultValue={100}
            max={100000}
            min={1}
            name="capacity"
            required
            type="number"
          />
          <span className="field-hint">
            Each issued invitation reserves its primary place and all configured
            companions.
          </span>
        </label>
        <label className="field-label">
          RSVP deadline <span className="field-hint">Optional</span>
          <input
            className="text-field"
            name="rsvpDeadline"
            type="datetime-local"
          />
        </label>
        <button className="button button-primary" type="submit">
          Save draft event
        </button>
      </form>
    </details>
  );
}
