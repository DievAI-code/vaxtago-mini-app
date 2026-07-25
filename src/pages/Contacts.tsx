import { PageLayout } from "@/components/PageLayout";
import { Card } from "@/components/ui/card";
import { Mail, Send } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Contacts() {
  const { t } = useTranslation();
  return (
    <PageLayout title={t("contacts")}>
      <div className="space-y-3">
        <a href="mailto:support@vaqta-ai.app" className="block">
          <Card variant="default" className="flex items-center gap-3">
            <Mail className="text-[#06B6D4]" size={20} />
            <span className="font-medium">support@vaqta-ai.app</span>
          </Card>
        </a>
        <a href="https://t.me/vaqta_ai_bot" className="block">
          <Card variant="default" className="flex items-center gap-3">
            <Send className="text-[#06B6D4]" size={20} />
            <span className="font-medium">@vaqta_ai_bot</span>
          </Card>
        </a>
      </div>
      <Card variant="default" className="mt-4">
        <p className="text-slate-400 text-sm">© 2026 VAQTA AI. All rights reserved.</p>
      </Card>
    </PageLayout>
  );
}