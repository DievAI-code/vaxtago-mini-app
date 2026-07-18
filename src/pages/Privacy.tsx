import { PageLayout } from "@/components/PageLayout";
import { Card } from "@/components/ui/Card";
import { useTranslation } from "react-i18next";

export default function Privacy() {
  const { t } = useTranslation();
  return (
    <PageLayout title={t("privacy")}>
      <Card variant="default">
        <p className="text-slate-300 leading-relaxed">{t("privacy_text")}</p>
      </Card>
    </PageLayout>
  );
}