import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export function SectionPlaceholder({
  title,
  description,
  cta,
  ctaHref,
  icon = "box",
}: {
  title: string;
  description: string;
  cta?: string;
  ctaHref?: string;
  icon?: string;
}) {
  return (
    <>
      <div className="pageHead">
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      <EmptyState
        icon={icon}
        title="Module en cours de développement"
        action={
          cta && ctaHref ? <Button href={ctaHref}>{cta}</Button> : undefined
        }
      >
        {description}
      </EmptyState>
    </>
  );
}
