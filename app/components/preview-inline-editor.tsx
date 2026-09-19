"use client";

import { useEffect } from "react";
import { getSitePageId } from "../site-pages";

type EditableElement = HTMLElement & { dataset: DOMStringMap };

function placeCaretAtEnd(element: HTMLElement) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

export function PreviewInlineEditor() {
  useEffect(() => {
    const isPreview = window.parent !== window && new URLSearchParams(window.location.search).get("uauSitePreview") === "1";
    if (!isPreview) return;
    document.documentElement.dataset.uauPreview = "true";

    let active: { element: EditableElement; original: string } | null = null;

    const finish = (commit: boolean) => {
      if (!active) return;
      const { element, original } = active;
      if (!commit) element.innerText = original;
      element.contentEditable = "false";
      delete element.dataset.uauEditing;
      if (commit && element.innerText !== original) {
        window.parent.postMessage({
          type: "uau-editor-inline-text",
          pageId: element.dataset.uauEditPageId || getSitePageId(window.location.pathname),
          scope: element.dataset.uauEditScope,
          key: element.dataset.uauEditKey,
          language: element.dataset.uauEditLanguage,
          value: element.innerText,
        }, window.location.origin);
      }
      active = null;
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const element = target?.closest<EditableElement>("[data-uau-editable]");
      if (!element) {
        finish(true);
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (active?.element === element) return;
      finish(true);
      active = { element, original: element.innerText };
      element.contentEditable = "true";
      element.dataset.uauEditing = "true";
      element.spellcheck = true;
      element.focus();
      placeCaretAtEnd(element);
    };

    const handleBlur = (event: FocusEvent) => {
      if (active?.element === event.target) finish(true);
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
    document.addEventListener("blur", handleBlur, true);
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      finish(false);
      document.documentElement.removeAttribute("data-uau-preview");
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("blur", handleBlur, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  return null;
}
