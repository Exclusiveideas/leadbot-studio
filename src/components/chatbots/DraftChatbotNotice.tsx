"use client";

import { useEffect } from "react";
import { Toaster, toast } from "sonner";

type DraftChatbotNoticeProps = {
  chatbotName: string;
};

export function DraftChatbotNotice({ chatbotName }: DraftChatbotNoticeProps) {
  useEffect(() => {
    toast.error(`${chatbotName} chatbot not published`, {
      duration: 20000,
    });
  }, [chatbotName]);

  return <Toaster position="bottom-right" richColors />;
}
