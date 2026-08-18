"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { readImageDimensions } from "@/lib/image-dimensions";
import { useRoundImage } from "@/lib/stores/round-image";

type ImageUploadScreenProps = {
  onImageSelected?: (file: File) => void;
};

/** Reads a File into a data URL so the preview survives the client-side hop to /feedback. */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

/** The first Coquí screen: one quiet place to bring a reference into a round. */
export function ImageUploadScreen({ onImageSelected }: ImageUploadScreenProps) {
  const router = useRouter();
  const beginTransition = useRoundImage((state) => state.beginTransition);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLImageElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProceeding, setIsProceeding] = useState(false);

  const acceptFile = useCallback(
    (file: File | undefined) => {
      if (!file || !file.type.startsWith("image/")) return;
      setFile(file);
      setPreviewUrl((previousUrl) => {
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        return URL.createObjectURL(file);
      });
      setFileName(file.name);
      onImageSelected?.(file);
    },
    [onImageSelected],
  );

  const proceedToFeedback = useCallback(async () => {
    if (!file || isProceeding) return;
    setIsProceeding(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const dimensions = await readImageDimensions(dataUrl);
      const rect = previewRef.current?.getBoundingClientRect();
      const origin = rect
        ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
        : { top: 0, left: 0, width: 0, height: 0 };
      beginTransition({ dataUrl, fileName: file.name, dimensions }, origin);
      router.push("/feedback");
    } catch {
      setIsProceeding(false);
    }
  }, [beginTransition, file, isProceeding, router]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const pastedFile = Array.from(event.clipboardData?.files ?? []).find((file) =>
        file.type.startsWith("image/"),
      );
      if (pastedFile) acceptFile(pastedFile);
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [acceptFile]);

  return (
    <main className="upload-page">
      <div className="upload-dot-grid" aria-hidden="true" />
      <div className="upload-page-atmosphere" aria-hidden="true" />

      <header className="upload-header">
        <Link className="upload-wordmark" href="/" aria-label="Coquí home">
          <Image src="/brand/coqui-wordmark.svg" alt="Coquí" width={56} height={26} priority />
        </Link>
        <div className="upload-header-actions">
          <a className="upload-help-link" href="mailto:bryan@bryanlew.is">
            Need help? <span className="upload-help-link-cta">Get in touch</span>
          </a>
          <button className="upload-sound-button" type="button" aria-label="Sound is muted" disabled>
            <Image src="/brand/icon-volume-cross.svg" alt="" width={20} height={20} />
          </button>
        </div>
      </header>

      <section className="upload-stage" aria-labelledby="upload-title">
        <div className={`upload-card ${isDragging ? "is-dragging" : ""}`}>
          {previewUrl ? (
            <div className="upload-preview-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
              <img
                ref={previewRef}
                className="upload-preview"
                src={previewUrl}
                alt={`Selected ${fileName ?? "screen"}`}
              />
            </div>
          ) : (
            <Image
              className="upload-illustration"
              src="/brand/coqui-illustration.svg"
              alt="A frog carrying a framed picture"
              width={150}
              height={178}
              priority
            />
          )}

          <div className="upload-content">
            <h1 id="upload-title">{previewUrl ? "Screen ready to improve" : "Add the screen you want to improve"}</h1>
            <button
              className="upload-dropzone"
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                acceptFile(event.dataTransfer.files[0]);
              }}
              aria-label={previewUrl ? "Choose a different image" : "Select image to upload"}
            >
              <span className="upload-dropzone-action">{previewUrl ? "Choose a different image" : "Select image to upload"}</span>
              {!previewUrl && (
                <span className="upload-dropzone-hint">
                  also you can drop your image or <kbd>⌘</kbd><kbd>V</kbd> to paste
                </span>
              )}
            </button>
            <input
              ref={inputRef}
              className="upload-file-input"
              type="file"
              accept="image/*"
              onChange={(event) => acceptFile(event.target.files?.[0])}
            />
            {previewUrl && (
              <button
                className="upload-proceed"
                type="button"
                onClick={proceedToFeedback}
                disabled={isProceeding}
              >
                {isProceeding ? "Opening brief\u2026" : "Continue to feedback"}
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
