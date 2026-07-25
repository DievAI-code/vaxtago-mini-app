import { PageLayout } from "@/components/PageLayout";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export default function Privacy() {
  const { t } = useTranslation();
  return (
    <PageLayout title={t("privacy")}>
      <Card variant="default">
        <p className="text-slate-300 leading-relaxed">{t("privacy_text")}</p>
      </Card>
      <Card variant="default" className="mt-4">
        <p className="text-slate-400 text-sm">© 2026 VAQTA AI. All rights reserved.</p>
      </Card>
    </PageLayout>
  );
}