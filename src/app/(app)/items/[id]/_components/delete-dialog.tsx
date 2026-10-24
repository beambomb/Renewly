"use client";

import { Trash2 } from "lucide-react";
import { useRef } from "react";
import { DANGER_BUTTON, SECONDARY_BUTTON } from "@/components/form/fields";
import { strings } from "@/lib/strings";

/**
 * Confirmation before deleting. Uses the native <dialog>, which traps focus,
 * closes on Escape and returns focus to the button that opened it.
 */
export function DeleteDialog({ name, action }: { name: string; action: () => Promise<void> }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const t = strings.detail;

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()} className={SECONDARY_BUTTON}>
        <Trash2 aria-hidden="true" size={18} />
        {t.actions.delete}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="delete-title"
        aria-describedby="delete-body"
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-card p-6 text-card-foreground shadow-md backdrop:bg-primary/60"
      >
        <h2 id="delete-title" className="text-xl font-semibold">
          {t.delete.title(name)}
        </h2>
        <p id="delete-body" className="mt-2 text-muted-foreground">
          {t.delete.body}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          <form action={action}>
            <button type="submit" className={`${DANGER_BUTTON} w-full`}>
              {t.delete.confirm}
            </button>
          </form>
          <button type="button" autoFocus onClick={() => dialogRef.current?.close()} className={SECONDARY_BUTTON}>
            {t.delete.cancel}
          </button>
        </div>
      </dialog>
    </>
  );
}
