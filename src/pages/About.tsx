import { PageLayout } from "@/components/PageLayout";
import { Card } from "@/components/ui/Card";
import { VaxtaGoLogo } from "@/components/VaxtaGoLogo";
import { useTranslation } from "react-i18next";

export default function About() {
  const { t } = useTranslation();
  return (
    <PageLayout title={t("about")}>
      <div className="flex items-center gap-3 mb-6">
        <VaxtaGoLogo size={48} />
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-[#2563EB] to-[#14B8A6] bg-clip-text text-transparent">VaxtaGo</h1>
          <p className="text-sm text-[#06B6D4]">AI Assistant</p>
        </div>
      </div>
      <Card variant="gradient" className="mb-4">
        <p className="text-slate-300 leading-relaxed">{t("about_text")}</p>
      </Card>
      <Card variant="default">
        <p className="text-slate-400 text-sm">{t("about_founder")}</p>
        <p className="text-slate-500 text-xs mt-2">© 2026 VaxtaGo</p>
      </Card>
    </PageLayout>
  );
}