import { PageLayout } from "@/components/PageLayout";
import { Card } from "@/components/ui/Card";
import { Mail, Send } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Contacts() {
  const { t } = useTranslation();
  return (
    <PageLayout title={t("contacts")}>
      <div className="space-y-3">
        <a href="mailto:hello@vaxtago.app" className="block">
          <Card variant="default" className="flex items-center gap-3">
            <Mail className="text-[#06B6D4]" size={20} />
            <span className="font-medium">{t("contacts_email")}</span>
          </Card>
        </a>
        <a href="https://t.me/VaxtaGO_bot" className="block">
          <Card variant="default" className="flex items-center gap-3">
            <Send className="text-[#06B6D4]" size={20} />
            <span className="font-medium">{t("contacts_bot")}</span>
          </Card>
        </a>
      </div>
    </PageLayout>
  );
}