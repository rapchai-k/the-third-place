import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface WhatsAppCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  eventType?: "free" | "paid";
}

export const WhatsAppCollectionModal = ({
  isOpen,
  onClose,
  onSuccess,
  userId,
  eventType = "free"
}: WhatsAppCollectionModalProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Validate Indian phone number format
  const validatePhoneNumber = (phone: string): boolean => {
    const regex = /^[6-9]\d{9}$/;
    return regex.test(phone.replace(/\s/g, ""));
  };

  // Normalize phone number to store without +91 prefix
  const normalizePhoneNumber = (phone: string): string => {
    return phone.replace(/\s/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!phoneNumber.trim()) {
      setError("Please enter your WhatsApp number");
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError("Please enter a valid Indian phone number (10 digits)");
      return;
    }

    setIsLoading(true);

    try {
      const normalizedPhone = normalizePhoneNumber(phoneNumber);

      // Update user profile with WhatsApp number
      const { error: updateError } = await supabase
        .from("users")
        .update({ whatsapp_number: normalizedPhone })
        .eq("id", userId);

      if (updateError) throw updateError;

      // Invalidate user profile query to refresh data
      queryClient.invalidateQueries({ queryKey: ["user-profile", userId] });

      toast({
        title: "Success!",
        description: "WhatsApp number saved successfully!",
      });

      setPhoneNumber("");
      onSuccess();
      onClose();
    } catch (err) {
      // Error logging removed for security
      setError("Failed to save WhatsApp number. Please try again.");
      toast({
        title: "Error",
        description: "Failed to save WhatsApp number",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const title = eventType === "paid" ? "Interest Noted!" : "Stay Updated!";
  const description = eventType === "paid" 
    ? "Enter your WhatsApp number to receive the payment link"
    : "Enter your WhatsApp number to receive event updates";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp Number</Label>
            <Input
              id="whatsapp"
              type="tel"
              placeholder="XXXXX XXXXX"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                setError("");
              }}
              disabled={isLoading}
              className="text-base"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

