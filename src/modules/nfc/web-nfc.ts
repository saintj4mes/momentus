export type NdefRecord = { recordType: string; data: DataView };
export type NdefReadingEvent = { message: { records: NdefRecord[] } };
export type NdefReader = {
  write(
    message: { records: Array<{ recordType: "url"; data: string }> },
    options?: { overwrite?: boolean },
  ): Promise<void>;
  scan(options?: { signal?: AbortSignal }): Promise<void>;
  addEventListener(
    type: "reading",
    listener: (event: NdefReadingEvent) => void,
  ): void;
  addEventListener(type: "readingerror", listener: () => void): void;
};
export type NdefReaderConstructor = new () => NdefReader;

declare global {
  interface Window {
    NDEFReader?: NdefReaderConstructor;
  }
}
