"use client";

import { Loader2, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugifyVoiceAgentName } from "@/config/voice-ai";
import { useEmployees } from "@/hooks/use-ai-employees";
import { useCreateVoiceAgent } from "@/hooks/use-voice-ai";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useToast } from "@/providers/toast-provider";

interface CreateVoiceAgentModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateVoiceAgentModal({ open, onClose }: CreateVoiceAgentModalProps) {
  const router = useRouter();
  const toast = useToast();
  const createMutation = useCreateVoiceAgent();
  const { data: employees = [] } = useEmployees("active");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [aiEmployeeId, setAiEmployeeId] = useState("");

  const resetForm = useCallback(() => {
    setName("");
    setDescription("");
    setAiEmployeeId("");
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !createMutation.isPending) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose, createMutation.isPending]);

  if (!open) return null;

  const handleClose = () => {
    if (createMutation.isPending) return;
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    if (!name.trim() || !aiEmployeeId) return;

    try {
      const agent = await createMutation.mutateAsync({
        name: name.trim(),
        slug: slugifyVoiceAgentName(name),
        description: description.trim() || undefined,
        ai_employee_id: aiEmployeeId,
      });
      toast.success("Voice agent created.");
      resetForm();
      onClose();
      router.push(`/voice-ai/${agent.id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to create voice agent."));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-label="Close modal"
      />
      <div className="relative w-full max-w-lg rounded-xl border border-white/[0.08] bg-background p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-medium text-foreground">Create voice agent</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Link an active AI employee to power voice transcription and responses.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="voice-agent-name">Name</Label>
            <Input
              id="voice-agent-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Support Voice Agent"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="voice-agent-description">Description</Label>
            <Input
              id="voice-agent-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Handles uploaded customer voice messages"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="voice-agent-employee">AI employee</Label>
            <select
              id="voice-agent-employee"
              value={aiEmployeeId}
              onChange={(event) => setAiEmployeeId(event.target.value)}
              className="mt-1.5 flex h-10 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-[13px] text-foreground"
            >
              <option value="">Select an AI employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} ({employee.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={handleClose} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="brand"
            size="sm"
            onClick={() => void handleCreate()}
            disabled={!name.trim() || !aiEmployeeId || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
            Create agent
          </Button>
        </div>
      </div>
    </div>
  );
}
