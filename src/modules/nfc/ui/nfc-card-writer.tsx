"use client";

import { useState } from "react";
import "../web-nfc";

export function NfcCardWriter({ url }: { url: string }) {
  const [status, setStatus] = useState("");
  const [writing, setWriting] = useState(false);

  async function writeTag() {
    const Reader = window.NDEFReader;
    if (!Reader) {
      setStatus(
        "Web NFC is unavailable in this browser. Use the QR or copy the URL.",
      );
      return;
    }
    if (!window.isSecureContext) {
      setStatus("NFC writing needs a trusted HTTPS page or localhost.");
      return;
    }
    setWriting(true);
    setStatus("Hold a blank test card near your phone.");
    try {
      const reader = new Reader();
      await reader.write(
        { records: [{ recordType: "url", data: url }] },
        { overwrite: false },
      );
      setStatus(
        "Test card written. Tap it with a phone to check the invitation link.",
      );
    } catch {
      setStatus(
        "NFC write did not complete. Check permission, NFC, and that the card is blank.",
      );
    } finally {
      setWriting(false);
    }
  }

  return (
    <div className="nfc-writer">
      <button
        className="button button-secondary"
        disabled={writing || !url}
        onClick={writeTag}
        type="button"
      >
        {writing ? "Waiting for card…" : "Write to a blank NFC test card"}
      </button>
      {status && (
        <p aria-live="polite" className="field-hint">
          {status}
        </p>
      )}
    </div>
  );
}
