"use client";

import { Loader2, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugifyOmnichannelName } from "@/config/omnichannel";
import { useEmployees } from "@/hooks/use-ai-employees";
import { useCreateOmnichannelChannel } from "@/hooks/use-omnichannel";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { OmnichannelChannelType } from "@/lib/omnichannel/types";
import { useToast } from "@/providers/toast-provider";

const channelTypes: { value: OmnichannelChannelType; label: string }[] = [
  { value: "website_chat", label: "Website Chat" },
  { value: "telegram", label: "Telegram (simulated)" },
  { value: "slack", label: "Slack (simulated)" },
  { value: "internal", label: "Internal Messaging" },
];

export function CreateOmnichannelChannelModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const createMutation = useCreateOmnichannelChannel();
  const { data: employees = [] } = useEmployees("active");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [channelType, setChannelType] = useState<OmnichannelChannelType>("website_chat");
  const [aiEmployeeId, setAiEmployeeId] = useState("");

  const resetForm = useCallback(() => {
    setName("");
    setDescription("");
    setChannelType("website_chat");
    setAiEmployeeId("");
  }, []);

  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !createMutation.isPending) onClose();
    };
    document.addEventListener("keydown", onEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose, createMutation.isPending]);

  if (!open) return null;

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        slug: slugifyOmnichannelName(name),
        description: description.trim() || undefined,
        channel_type: channelType,
        ai_employee_id: aiEmployeeId || undefined,
      });
      toast.success("Channel created");
      resetForm();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to create channel."));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="relative w-full max-w-lg rounded-xl border border-white/[0.08] bg-background p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-medium text-foreground">Add channel</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-white/[0.06]">
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="channel-name">Name</Label>
            <Input id="channel-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" placeholder="Website Support Chat" />
          </div>
          <div>
            <Label htmlFor="channel-type">Channel type</Label>
            <select
              id="channel-type"
              value={channelType}
              onChange={(e) => setChannelType(e.target.value as OmnichannelChannelType)}
              className="mt-1.5 flex h-10 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-[13px]"
            >
              {channelTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="channel-desc">Description</Label>
            <Input id="channel-desc" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="channel-employee">AI employee (optional)</Label>
            <select
              id="channel-employee"
              value={aiEmployeeId}
              onChange={(e) => setAiEmployeeId(e.target.value)}
              className="mt-1.5 flex h-10 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-[13px]"
            >
              <option value="">None</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="brand" size="sm" onClick={() => void handleCreate()} disabled={!name.trim() || createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            Add channel
          </Button>
        </div>
      </div>
    </div>
  );
}
