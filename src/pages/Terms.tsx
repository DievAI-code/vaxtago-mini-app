import { PageLayout } from "@/components/PageLayout";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export default function Terms() {
  const { t } = useTranslation();
  return (
    <PageLayout title={t("terms")}>
      <Card variant="default">
        <p className="text-slate-300 leading-relaxed">{t("terms_text")}</p>
      </Card>
    </PageLayout>
  );
}