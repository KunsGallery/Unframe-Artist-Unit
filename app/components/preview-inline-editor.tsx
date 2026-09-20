"use client";

import { useEffect } from "react";
import { getSitePageId } from "../site-pages";

type EditableElement = HTMLElement & { dataset: DOMStringMap };
type ActiveEdit = { element: EditableElement; original: string };

function placeCaretFromPoint(event: MouseEvent, element: HTMLElement) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.caretRangeFromPoint?.(event.clientX, event.clientY);
  if (range && element.contains(range.startContainer)) {
    selection.removeAllRanges();
    selection.addRange(range);
    return;
  }
  const fallback = document.createRange();
  fallback.selectNodeContents(element);
  fallback.collapse(false);
  selection.removeAllRanges();
  selection.addRange(fallback);
}

function buttonFor(label: string, command: string, title: string) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.setAttribute("aria-label", title);
  button.dataset.uauFormatCommand = command;
  return button;
}

export function PreviewInlineEditor() {
  useEffect(() => {
    const isPreview = window.parent !== window && new URLSearchParams(window.location.search).get("uauSitePreview") === "1";
    if (!isPreview) return;
    document.documentElement.dataset.uauPreview = "true";

    let active: ActiveEdit | null = null;
    let toolbar: HTMLDivElement | null = null;

    const postValue = (commit: boolean) => {
      if (!active) return;
      const { element, original } = active;
      const value = element.innerHTML;
      if (!commit && value === original) return;
      window.parent.postMessage({
        type: "uau-editor-inline-text",
        pageId: element.dataset.uauEditPageId || getSitePageId(window.location.pathname),
        scope: element.dataset.uauEditScope,
        key: element.dataset.uauEditKey,
        language: element.dataset.uauEditLanguage,
        value,
        commit,
      }, window.location.origin);
    };

    const positionToolbar = () => {
      if (!toolbar || !active) return;
      const rect = active.element.getBoundingClientRect();
      const width = toolbar.offsetWidth || 188;
      toolbar.style.left = String(Math.max(8, Math.min(window.innerWidth - width - 8, rect.left))) + "px";
      toolbar.style.top = String(Math.max(8, Math.min(window.innerHeight - 52, rect.bottom + 10))) + "px";
    };

    const removeToolbar = () => {
      toolbar?.remove();
      toolbar = null;
    };

    const createToolbar = () => {
      removeToolbar();
      toolbar = document.createElement("div");
      toolbar.dataset.uauInlineToolbar = "true";
      toolbar.setAttribute("role", "toolbar");
      toolbar.setAttribute("aria-label", "텍스트 서식");
      const label = document.createElement("span");
      label.textContent = "텍스트 편집";
      toolbar.append(label, buttonFor("B", "bold", "굵게"), buttonFor("I", "italic", "기울임"), buttonFor("U", "underline", "밑줄"));
      toolbar.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
        button.addEventListener("mousedown", (event) => event.preventDefault());
        button.addEventListener("click", () => {
          if (!active) return;
          const command = button.dataset.uauFormatCommand || "";
          (document as Document & { execCommand?: (command: string, showUI?: boolean, value?: string) => boolean }).execCommand?.(command, false);
          active.element.focus();
          postValue(false);
          positionToolbar();
        });
      });
      document.body.appendChild(toolbar);
      positionToolbar();
    };

    const finish = (commit: boolean) => {
      if (!active) return;
      const { element, original } = active;
      if (!commit) element.innerHTML = original;
      if (commit && element.innerHTML !== original) postValue(true);
      element.contentEditable = "false";
      delete element.dataset.uauEditing;
      active = null;
      removeToolbar();
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-uau-inline-toolbar]")) return;

      const image = target?.closest<HTMLImageElement>("[data-uau-image-key]");
      if (image) {
        event.preventDefault();
        event.stopPropagation();
        finish(true);
        window.parent.postMessage({ type: "uau-editor-inline-image", pageId: getSitePageId(window.location.pathname), key: image.dataset.uauImageKey, label: image.alt || "이미지" }, window.location.origin);
        return;
      }

      const element = target?.closest<EditableElement>("[data-uau-editable]");
      if (!element) {
        finish(true);
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (active?.element === element) {
        placeCaretFromPoint(event, element);
        positionToolbar();
        return;
      }
      finish(true);
      active = { element, original: element.innerHTML };
      element.contentEditable = "true";
      element.dataset.uauEditing = "true";
      element.spellcheck = true;
      element.focus();
      placeCaretFromPoint(event, element);
      createToolbar();
    };

    const handleInput = (event: Event) => {
      if (active?.element === event.target) postValue(false);
    };

    const handleBlur = (event: FocusEvent) => {
      if (!active || active.element !== event.target) return;
      if (event.relatedTarget instanceof Node && toolbar?.contains(event.relatedTarget)) return;
      window.setTimeout(() => {
        if (active && document.activeElement !== active.element && !toolbar?.contains(document.activeElement)) finish(true);
      }, 0);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!active || event.target !== active.element) return;
      if (event.key === "Escape") {
        event.preventDefault();
        finish(false);
      } else if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        active.element.blur();
      }
    };

    document.addEventListener("click", handleClick, true);
    document.addEventListener("input", handleInput, true);
    document.addEventListener("blur", handleBlur, true);
    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("scroll", positionToolbar, true);
    window.addEventListener("resize", positionToolbar);
    return () => {
      finish(false);
      document.documentElement.removeAttribute("data-uau-preview");
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("input", handleInput, true);
      document.removeEventListener("blur", handleBlur, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("scroll", positionToolbar, true);
      window.removeEventListener("resize", positionToolbar);
    };
  }, []);

  return null;
}
