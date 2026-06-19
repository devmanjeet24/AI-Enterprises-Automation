"use client";

import { Loader2, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugifyTicketSubject } from "@/config/customer-support";
import { useEmployees } from "@/hooks/use-ai-employees";
import {
  useCreateSupportTicket,
  useSupportCategories,
} from "@/hooks/use-support-tickets";
import { useUsers } from "@/hooks/use-users";
import { runMutationWithFeedback } from "@/lib/mutation-feedback";
import type { SupportTicketPriority } from "@/lib/customer-support/types";
import { useToast } from "@/providers/toast-provider";

interface CreateTicketModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateTicketModal({ open, onClose }: CreateTicketModalProps) {
  const router = useRouter();
  const toast = useToast();
  const createMutation = useCreateSupportTicket();
  const { data: categories = [] } = useSupportCategories(true);
  const { data: users = [] } = useUsers();
  const { data: employees = [] } = useEmployees("active");

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState<SupportTicketPriority>("normal");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [assignedEmployeeId, setAssignedEmployeeId] = useState("");
  const [initialMessage, setInitialMessage] = useState("");

  const resetForm = useCallback(() => {
    setSubject("");
    setDescription("");
    setCustomerName("");
    setCustomerEmail("");
    setCategoryId("");
    setPriority("normal");
    setAssignedUserId("");
    setAssignedEmployeeId("");
    setInitialMessage("");
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
    if (!subject.trim()) return;

    await runMutationWithFeedback({
      action: () =>
        createMutation.mutateAsync({
          subject: subject.trim(),
          slug: slugifyTicketSubject(subject),
          description: description.trim() || undefined,
          customer_name: customerName.trim() || undefined,
          customer_email: customerEmail.trim() || undefined,
          category_id: categoryId || undefined,
          priority,
          assigned_user_id: assignedUserId || undefined,
          assigned_ai_employee_id: assignedEmployeeId || undefined,
          initial_message: initialMessage.trim() || undefined,
        }),
      toast,
      successMessage: "Ticket created successfully.",
      errorFallback: "Failed to create ticket.",
      onSuccess: (ticket) => {
        resetForm();
        onClose();
        router.push(`/customer-support/${ticket.id}`);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-label="Close modal"
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0f0f12] p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-medium text-foreground">Create support ticket</h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="ticket-subject">Subject</Label>
            <Input
              id="ticket-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Brief summary of the issue"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="ticket-description">Description</Label>
            <textarea
              id="ticket-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Detailed description of the customer issue"
              rows={3}
              className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-foreground outline-none focus:border-brand/50"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="customer-name">Customer name</Label>
              <Input
                id="customer-name"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Optional"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="customer-email">Customer email</Label>
              <Input
                id="customer-email"
                type="email"
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
                placeholder="Optional"
                className="mt-1.5"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="ticket-category">Category</Label>
              <select
                id="ticket-category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-foreground outline-none"
              >
                <option value="">Uncategorized</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="ticket-priority">Priority</Label>
              <select
                id="ticket-priority"
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as SupportTicketPriority)
                }
                className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-foreground outline-none"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="assigned-user">Assign user</Label>
              <select
                id="assigned-user"
                value={assignedUserId}
                onChange={(event) => setAssignedUserId(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-foreground outline-none"
              >
                <option value="">Unassigned</option>
                {users
                  .filter((user) => user.is_active)
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <Label htmlFor="assigned-employee">Assign AI employee</Label>
              <select
                id="assigned-employee"
                value={assignedEmployeeId}
                onChange={(event) => setAssignedEmployeeId(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-foreground outline-none"
              >
                <option value="">Unassigned</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="initial-message">Initial reply (optional)</Label>
            <textarea
              id="initial-message"
              value={initialMessage}
              onChange={(event) => setInitialMessage(event.target.value)}
              placeholder="First response to the customer"
              rows={2}
              className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-foreground outline-none focus:border-brand/50"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="brand"
            size="sm"
            onClick={() => void handleCreate()}
            disabled={!subject.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
            Create ticket
          </Button>
        </div>
      </div>
    </div>
  );
}
