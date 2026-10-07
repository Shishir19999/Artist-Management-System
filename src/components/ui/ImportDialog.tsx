"use client";
import { useRef, useState } from "react";
import { LuDownload, LuUpload } from "react-icons/lu";
import { csvToObjects, parseCsv, toCsv, type CsvColumn } from "@/lib/domain/csv";
import { handleError } from "@/utils/errorsHandle";
import Modal from "./Modal";

type Mapped<P> = { payload: P } | { error: string };

interface Props<P> {
    open: boolean;
    onClose: () => void;
    title: string;
    columns: CsvColumn<Record<string, string>>[];
    example: Record<string, string>;
    templateName: string;
    mapRow: (raw: Record<string, string>) => Mapped<P>;
    send: (payload: P) => Promise<unknown>;
    onDone: () => void;
    hint: string;
}

interface Result {
    total: number;
    ok: number;
    failures: string[];
}

const MAX_ROWS = 500;

export default function ImportDialog<P>({ open, onClose, title, columns, example, templateName, mapRow, send, onDone, hint }: Props<P>) {
    const fileInput = useRef<HTMLInputElement>(null);
    const [rows, setRows] = useState<Record<string, string>[] | null>(null);
    const [fileName, setFileName] = useState("");
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<Result | null>(null);
    const [readError, setReadError] = useState("");

    const reset = () => {
        setRows(null);
        setResult(null);
        setReadError("");
        setFileName("");
        if (fileInput.current) fileInput.current.value = "";
    };

    const close = () => {
        reset();
        onClose();
    };

    const readFile = async (file: File | undefined) => {
        setResult(null);
        setReadError("");
        if (!file) return;
        setFileName(file.name);
        try {
            const objects = csvToObjects(parseCsv(await file.text()), columns);
            if (objects.length === 0) setReadError("No data rows found. Check that the first row contains the column headers.");
            else if (objects.length > MAX_ROWS) setReadError(`Please import at most ${MAX_ROWS} rows at a time.`);
            else setRows(objects);
        } catch {
            setReadError("That file could not be read.");
        }
    };

    const downloadTemplate = () => {
        const csv = toCsv([example], columns);
        const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = `${templateName}-template.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const run = async () => {
        if (!rows) return;
        setBusy(true);
        const failures: string[] = [];
        let ok = 0;
        for (let i = 0; i < rows.length; i++) {
            const mapped = mapRow(rows[i]);
            if ("error" in mapped) {
                failures.push(`Row ${i + 2}: ${mapped.error}`);
                continue;
            }
            try {
                await send(mapped.payload);
                ok++;
            } catch (e) {
                failures.push(`Row ${i + 2}: ${handleError(e)}`);
            }
        }
        setBusy(false);
        setResult({ total: rows.length, ok, failures });
        onDone();
    };

    return (
        <Modal
            open={open}
            onClose={close}
            title={title}
            footer={
                result ? (
                    <button type="button" className="btn btn-primary" onClick={close}>
                        Close
                    </button>
                ) : (
                    <>
                        <button type="button" className="btn btn-ghost" onClick={close} disabled={busy}>
                            Cancel
                        </button>
                        <button type="button" className="btn btn-primary" disabled={!rows || busy} onClick={() => void run()}>
                            {busy ? (
                                <>
                                    <span className="loading loading-spinner loading-sm" aria-hidden /> Importing
                                </>
                            ) : (
                                `Import ${rows ? rows.length : ""} rows`.replace("  ", " ")
                            )}
                        </button>
                    </>
                )
            }
        >
            <div className="flex flex-col gap-4 text-sm">
                <p className="muted">{hint}</p>
                <button type="button" className="btn btn-sm btn-ghost w-fit gap-1.5" onClick={downloadTemplate}>
                    <LuDownload aria-hidden /> Download CSV template
                </button>
                <div>
                    <label htmlFor="csv-file" className="mb-1.5 block font-medium">
                        CSV file
                    </label>
                    <input
                        ref={fileInput}
                        id="csv-file"
                        type="file"
                        accept=".csv,text/csv"
                        className="file-input file-input-sm w-full"
                        onChange={(e) => void readFile(e.target.files?.[0])}
                    />
                </div>
                {readError && (
                    <p role="alert" className="text-error font-medium">
                        {readError}
                    </p>
                )}
                {rows && !result && (
                    <p role="status" className="bg-base-200 flex items-center gap-2 rounded-lg p-3">
                        <LuUpload aria-hidden /> {fileName}: {rows.length} data rows ready to import.
                    </p>
                )}
                {result && (
                    <div role="status" className="flex flex-col gap-2">
                        <p className="font-medium">
                            Imported {result.ok} of {result.total} rows.
                        </p>
                        {result.failures.length > 0 && (
                            <ul className="text-error max-h-40 list-disc overflow-y-auto pl-5">
                                {result.failures.slice(0, 50).map((f) => (
                                    <li key={f}>{f}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}
