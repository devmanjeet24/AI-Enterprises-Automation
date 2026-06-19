"use client";

import { Loader2, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugifyOmnichannelName } from "@/config/omnichannel";
import { useEmployees } from "@/hooks/use-ai-employees";
import { useCreateOmnichannelChannel } from "@/hooks/use-omnichannel";
import { runMutationWithFeedback } from "@/lib/mutation-feedback";
import type { OmnichannelChannelType } from "@/lib/omnichannel/types";
import { useToast } from "@/providers/toast-provider";

const channelTypes: { value: OmnichannelChannelType; label: string }[] = [
  { value: "website_chat", label: "Website Chat" },
  { value: "telegram", label: "Telegram" },
  { value: "slack", label: "Slack" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "linkedin", label: "LinkedIn" },
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
  const [botToken, setBotToken] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [whatsappToken, setWhatsappToken] = useState("");
  const [whatsappPhoneId, setWhatsappPhoneId] = useState("");
  const [whatsappVerifyToken, setWhatsappVerifyToken] = useState("");

  const resetForm = useCallback(() => {
    setName("");
    setDescription("");
    setChannelType("website_chat");
    setAiEmployeeId("");
    setBotToken("");
    setSmtpHost("");
    setSmtpUser("");
    setSmtpPassword("");
    setFromAddress("");
    setWhatsappToken("");
    setWhatsappPhoneId("");
    setWhatsappVerifyToken("");
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

  const buildConfig = () => {
    if (channelType === "telegram" && botToken) return { bot_token: botToken };
    if (channelType === "email") {
      return {
        provider: "smtp",
        smtp_host: smtpHost || undefined,
        smtp_user: smtpUser || undefined,
        smtp_password: smtpPassword || undefined,
        from_address: fromAddress || undefined,
      };
    }
    if (channelType === "whatsapp") {
      return {
        access_token: whatsappToken || undefined,
        phone_number_id: whatsappPhoneId || undefined,
        verify_token: whatsappVerifyToken || undefined,
      };
    }
    return undefined;
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    const config = buildConfig();
    await runMutationWithFeedback({
      action: () =>
        createMutation.mutateAsync({
          name: name.trim(),
          slug: slugifyOmnichannelName(name),
          description: description.trim() || undefined,
          channel_type: channelType,
          ai_employee_id: aiEmployeeId || undefined,
          config,
        }),
      toast,
      successMessage: "Channel created successfully.",
      errorFallback: "Failed to create channel.",
      onSuccess: () => {
        resetForm();
        onClose();
      },
    });
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
          {channelType === "telegram" && (
            <div>
              <Label htmlFor="telegram-token">Bot token</Label>
              <Input id="telegram-token" value={botToken} onChange={(e) => setBotToken(e.target.value)} className="mt-1.5" placeholder="123456:ABC-DEF..." />
            </div>
          )}
          {channelType === "slack" && (
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3 text-[12px] text-muted-foreground">
              Slack credentials are configured in backend environment variables
              (SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_SIGNING_SECRET, SLACK_BOT_TOKEN).
              After creating this channel, open its detail page for Event Subscriptions and OAuth setup.
            </div>
          )}
          {channelType === "linkedin" && (
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3 text-[12px] text-muted-foreground">
              LinkedIn credentials are configured in backend environment variables
              (LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, API_PUBLIC_URL).
              Requires Community Management API approval. After creating this channel, open its
              detail page to connect your Company Page via OAuth.
            </div>
          )}
          {channelType === "email" && (
            <>
              <div>
                <Label htmlFor="smtp-host">SMTP host</Label>
                <Input id="smtp-host" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className="mt-1.5" placeholder="smtp.gmail.com" />
              </div>
              <div>
                <Label htmlFor="smtp-user">SMTP user</Label>
                <Input id="smtp-user" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="smtp-password">SMTP password</Label>
                <Input id="smtp-password" type="password" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="from-address">From address</Label>
                <Input id="from-address" value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} className="mt-1.5" />
              </div>
            </>
          )}
          {channelType === "whatsapp" && (
            <>
              <div>
                <Label htmlFor="wa-token">Access token</Label>
                <Input id="wa-token" value={whatsappToken} onChange={(e) => setWhatsappToken(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="wa-phone-id">Phone number ID</Label>
                <Input id="wa-phone-id" value={whatsappPhoneId} onChange={(e) => setWhatsappPhoneId(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="wa-verify">Webhook verify token</Label>
                <Input id="wa-verify" value={whatsappVerifyToken} onChange={(e) => setWhatsappVerifyToken(e.target.value)} className="mt-1.5" />
              </div>
            </>
          )}
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
