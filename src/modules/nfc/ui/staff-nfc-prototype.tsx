"use client";

import { useEffect, useRef, useState } from "react";
import { isMomentusInvitationUrl } from "../url";
import "../web-nfc";

type ScanState = "idle" | "scanning" | "recognized" | "invalid" | "error";

export function StaffNfcPrototype() {
  const [origin, setOrigin] = useState("");
  const [manualValue, setManualValue] = useState("");
  const [state, setState] = useState<ScanState>("idle");
  const [message, setMessage] = useState("");
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    return () => controller.current?.abort();
  }, []);

  function inspectUrl(value: string) {
    if (origin && isMomentusInvitationUrl(value, origin)) {
      setState("recognized");
      setMessage("MOMENTUS test invitation URL recognized on this device.");
      return;
    }
    setState("invalid");
    setMessage(
      "This tag does not contain a valid invitation URL for this app.",
    );
  }

  async function startScan() {
    const Reader = window.NDEFReader;
    if (!Reader) {
      setState("error");
      setMessage(
        "Web NFC is unavailable here. Use an Android phone with Chrome, or enter a test URL below.",
      );
      return;
    }
    if (!window.isSecureContext) {
      setState("error");
      setMessage("Web NFC needs localhost or a trusted HTTPS test origin.");
      return;
    }

    controller.current?.abort();
    const nextController = new AbortController();
    controller.current = nextController;
    setState("scanning");
    setMessage(
      "Keep this page open and the phone unlocked. Hold a test card near the phone.",
    );

    try {
      const reader = new Reader();
      reader.addEventListener("reading", (event) => {
        const urlRecord = event.message.records.find(
          (record) => record.recordType === "url",
        );
        if (!urlRecord) {
          setState("invalid");
          setMessage("The tag has no URL record. Try a MOMENTUS test card.");
          return;
        }
        inspectUrl(new TextDecoder().decode(urlRecord.data));
        nextController.abort();
      });
      reader.addEventListener("readingerror", () => {
        setState("error");
        setMessage(
          "This tag could not be read. Check that it contains a supported NDEF record.",
        );
      });
      await reader.scan({ signal: nextController.signal });
    } catch {
      if (!nextController.signal.aborted) {
        setState("error");
        setMessage(
          "NFC could not start. Check device NFC, browser permission, and that this page stays visible.",
        );
      }
    }
  }

  function stopScan() {
    controller.current?.abort();
    controller.current = null;
    if (state === "scanning") {
      setState("idle");
      setMessage("NFC scan stopped.");
    }
  }

  return (
    <section className="staff-prototype-card">
      <div className="staff-prototype-kicker">DEVICE FEASIBILITY PROTOTYPE</div>
      <h1>Read a MOMENTUS test card</h1>
      <p>
        This checks whether the browser can read the invitation URL from a tag.
        It does not look up guests or check anyone in.
      </p>
      <div className="staff-prototype-controls">
        {state === "scanning" ? (
          <button
            className="button button-secondary"
            onClick={stopScan}
            type="button"
          >
            Stop NFC scan
          </button>
        ) : (
          <button
            className="button button-primary"
            onClick={startScan}
            type="button"
          >
            Start NFC scan
          </button>
        )}
        <span>
          For NFC testing, open this page on the Android phone itself.
        </span>
      </div>
      <form
        className="staff-prototype-manual"
        onSubmit={(event) => {
          event.preventDefault();
          inspectUrl(manualValue);
        }}
      >
        <label className="field-label" htmlFor="prototype-invitation-url">
          QR fallback or test URL
        </label>
        <div className="staff-prototype-input-row">
          <input
            autoComplete="off"
            className="text-field"
            id="prototype-invitation-url"
            inputMode="url"
            onChange={(event) => setManualValue(event.target.value)}
            placeholder={origin ? `${origin}/invite#…` : "https://…/invite#…"}
            value={manualValue}
          />
          <button className="button button-secondary" type="submit">
            Check URL
          </button>
        </div>
      </form>
      {message && (
        <p
          aria-live="polite"
          className={`staff-prototype-status ${state}`}
          role="status"
        >
          {message}
        </p>
      )}
      <p className="staff-prototype-footnote">
        Use synthetic invitations and disposable tags. The URL stays in the
        browser and is not sent to the server by this prototype.
      </p>
    </section>
  );
}
