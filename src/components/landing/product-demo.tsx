"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  CheckIcon,
  CloudIcon,
  DocumentIcon,
  SparklesIcon,
  UploadIcon,
} from "@/components/ui/icons";

type DemoCopy = Dictionary["demo"];
type DemoStage = "upload" | "analyzing" | "review" | "saving" | "success";

export function ProductDemo({ copy }: { copy: DemoCopy }) {
  const [stage, setStage] = useState<DemoStage>("upload");

  useEffect(() => {
    if (stage !== "analyzing" && stage !== "saving") return;
    const timer = window.setTimeout(
      () => setStage(stage === "analyzing" ? "review" : "success"),
      stage === "analyzing" ? 2200 : 1200,
    );
    return () => window.clearTimeout(timer);
  }, [stage]);

  const activeStep = stage === "upload" ? 0 : stage === "analyzing" ? 1 : stage === "review" ? 2 : 3;

  return (
    <div className="demo-shell" aria-label={copy.eyebrow}>
      <div className="demo-topbar">
        <div className="flex items-center gap-2">
          <span className="status-dot" />
          <span className="text-xs font-semibold tracking-wide text-slate-500">DOCNEO FLOW</span>
        </div>
        <span className="demo-badge">{copy.example}</span>
      </div>

      <ol className="demo-steps" aria-label={copy.eyebrow}>
        {copy.steps.map((step, index) => (
          <li key={step} className={index <= activeStep ? "is-active" : ""}>
            <span>{index < activeStep ? <CheckIcon className="size-3" /> : index + 1}</span>
            <small>{step}</small>
          </li>
        ))}
      </ol>

      <div className="demo-canvas" aria-live="polite">
        {stage === "upload" && (
          <div className="upload-panel">
            <div className="upload-icon"><UploadIcon className="size-6" /></div>
            <h3>{copy.dropTitle}</h3>
            <p>{copy.dropText}</p>
            <button className="button button-primary mt-6" onClick={() => setStage("analyzing")}>
              {copy.choose}<ArrowMini />
            </button>
            <span className="mt-5 text-xs text-slate-400">PDF · JPEG · PNG</span>
          </div>
        )}

        {stage === "analyzing" && (
          <div className="analysis-grid">
            <DocumentPreview copy={copy} scanning />
            <div className="analysis-status">
              <div className="sparkle-orb"><SparklesIcon className="size-6" /></div>
              <h3>{copy.analyzing}</h3>
              <div className="progress-track"><span /></div>
              <ul>
                {copy.signals.map((signal, index) => (
                  <li key={signal} style={{ animationDelay: `${index * 430}ms` }}>
                    <CheckIcon className="size-4" />{signal}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {stage === "review" && (
          <div className="review-grid">
            <DocumentPreview copy={copy} />
            <div className="review-form">
              <div className="flex items-start justify-between gap-3">
                <div><h3>{copy.reviewTitle}</h3><p>{copy.reviewHint}</p></div>
                <span className="confidence"><CheckIcon className="size-3.5" />{copy.confidence}</span>
              </div>
              <div className="field-grid">
                <DemoField label={copy.fields.type} defaultValue={copy.fields.typeValue} />
                <DemoField label={copy.fields.issuer} defaultValue={copy.fields.issuerValue} />
                <DemoField label={copy.fields.date} defaultValue={copy.fields.dateValue} />
                <DemoField label={copy.fields.category} defaultValue={copy.fields.categoryValue} />
                <DemoField wide label={copy.fields.filename} defaultValue={copy.fields.filenameValue} />
                <DemoField wide label={copy.fields.folder} defaultValue={copy.fields.folderValue} icon={<CloudIcon className="size-4" />} />
              </div>
              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button className="button button-ghost" onClick={() => setStage("upload")}>{copy.back}</button>
                <button className="button button-primary" onClick={() => setStage("saving")}>
                  {copy.confirm}<ArrowMini />
                </button>
              </div>
            </div>
          </div>
        )}

        {stage === "saving" && (
          <div className="success-panel">
            <div className="saving-ring"><CloudIcon className="size-7" /></div>
            <h3>{copy.saving}</h3>
            <p>{copy.fields.filenameValue}</p>
          </div>
        )}

        {stage === "success" && (
          <div className="success-panel">
            <div className="success-check"><CheckIcon className="size-7" /></div>
            <h3>{copy.successTitle}</h3>
            <p>{copy.successText}</p>
            <div className="saved-file">
              <DocumentIcon className="size-5 text-blue-600" />
              <div><strong>{copy.fields.filenameValue}</strong><span>{copy.successFolder}</span></div>
            </div>
            <button className="button button-ghost mt-5" onClick={() => setStage("upload")}>{copy.restart}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function DemoField({ label, defaultValue, wide, icon }: { label: string; defaultValue: string; wide?: boolean; icon?: ReactNode }) {
  return (
    <label className={wide ? "sm:col-span-2" : ""}>
      <span>{label}</span>
      <span className="field-input">{icon}<input defaultValue={defaultValue} aria-label={label} /></span>
    </label>
  );
}

function DocumentPreview({ copy, scanning = false }: { copy: DemoCopy; scanning?: boolean }) {
  return (
    <div className="document-wrap">
      <div className="document-paper">
        <div className="document-brand"><span>T</span><div><strong>TELEKOM</strong><small>RECHNUNG</small></div></div>
        <div className="document-lines"><i className="w-2/3" /><i className="w-1/2" /><i className="w-3/4" /></div>
        <div className="document-total"><span>Gesamt</span><strong>49,95 €</strong></div>
        <div className="document-lines"><i className="w-full" /><i className="w-5/6" /><i className="w-2/3" /></div>
        {scanning && <span className="scan-line" />}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <DocumentIcon className="size-4" /><span>{copy.fileName}</span>
      </div>
      <p className="mt-1 text-[11px] text-slate-400">{copy.fileMeta}</p>
    </div>
  );
}

function ArrowMini() {
  return <span aria-hidden="true">→</span>;
}
