type StatusBadgeProps = {
  status: string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const presentation = getPublicStatus(status);
  const modifier =
    presentation.kind === "default"
      ? ""
      : ` status-badge--${presentation.kind}`;
  return (
    <span className={`status-badge${modifier}`}>{presentation.label}</span>
  );
}
import { getPublicStatus } from "@/utils/status";
