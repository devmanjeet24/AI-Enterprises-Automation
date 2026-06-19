"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getCustomSecrets,
  getStandardSecrets,
  mergeSecrets,
  type BrowserTaskSecrets,
} from "@/lib/browser-automation/secrets";

interface BrowserTaskSecretsEditorProps {
  secrets: BrowserTaskSecrets;
  onChange: (secrets: BrowserTaskSecrets) => void;
  disabled?: boolean;
}

export function BrowserTaskSecretsEditor({
  secrets,
  onChange,
  disabled = false,
}: BrowserTaskSecretsEditorProps) {
  const standard = useMemo(() => getStandardSecrets(secrets), [secrets]);
  const customSecrets = useMemo(() => getCustomSecrets(secrets), [secrets]);
  const [customEntries, setCustomEntries] = useState(() =>
    Object.entries(customSecrets).map(([key, value]) => ({ key, value })),
  );

  const publish = (
    nextStandard: { username: string; email: string; password: string },
    nextCustomEntries: Array<{ key: string; value: string }>,
  ) => {
    const custom = Object.fromEntries(
      nextCustomEntries
        .filter((entry) => entry.key.trim() && entry.value.trim())
        .map((entry) => [entry.key.trim(), entry.value]),
    );
    onChange(mergeSecrets(nextStandard, custom));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Task secrets</Label>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Use <code className="text-foreground">{"{{secrets.username}}"}</code>,{" "}
          <code className="text-foreground">{"{{secrets.password}}"}</code>, or custom keys in
          fill/goto step values.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="secret-username">Username</Label>
          <Input
            id="secret-username"
            value={standard.username}
            disabled={disabled}
            autoComplete="off"
            onChange={(event) =>
              publish({ ...standard, username: event.target.value }, customEntries)
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="secret-email">Email</Label>
          <Input
            id="secret-email"
            type="email"
            value={standard.email}
            disabled={disabled}
            autoComplete="off"
            onChange={(event) =>
              publish({ ...standard, email: event.target.value }, customEntries)
            }
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="secret-password">Password</Label>
          <Input
            id="secret-password"
            type="password"
            value={standard.password}
            disabled={disabled}
            autoComplete="new-password"
            onChange={(event) =>
              publish({ ...standard, password: event.target.value }, customEntries)
            }
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Label>Custom secrets</Label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled}
            onClick={() =>
              setCustomEntries((entries) => {
                const next = [...entries, { key: "", value: "" }];
                publish(standard, next);
                return next;
              })
            }
          >
            <Plus className="size-3.5" />
            Add secret
          </Button>
        </div>

        {customEntries.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">
            No custom secrets. Add keys like <code className="text-foreground">api_token</code>.
          </p>
        ) : (
          customEntries.map((entry, index) => (
            <div key={index} className="grid gap-3 rounded-lg border border-white/[0.06] p-3 sm:grid-cols-[1fr_1fr_auto]">
              <Input
                value={entry.key}
                disabled={disabled}
                placeholder="secret_key"
                onChange={(event) =>
                  setCustomEntries((entries) => {
                    const next = entries.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, key: event.target.value } : item,
                    );
                    publish(standard, next);
                    return next;
                  })
                }
              />
              <Input
                value={entry.value}
                disabled={disabled}
                placeholder="secret value"
                type="password"
                autoComplete="new-password"
                onChange={(event) =>
                  setCustomEntries((entries) => {
                    const next = entries.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, value: event.target.value } : item,
                    );
                    publish(standard, next);
                    return next;
                  })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-destructive"
                disabled={disabled}
                onClick={() =>
                  setCustomEntries((entries) => {
                    const next = entries.filter((_, itemIndex) => itemIndex !== index);
                    publish(standard, next);
                    return next;
                  })
                }
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
