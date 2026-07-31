export type PublicStatusKind = "available" | "default" | "soon";

export function getPublicStatus(status: string): {
  kind: PublicStatusKind;
  label: string;
} {
  if (status === "Куплено") {
    return { kind: "soon", label: "Скоро в продаже" };
  }
  if (status === "Выставлено") {
    return { kind: "available", label: "Доступно" };
  }
  return { kind: "default", label: status || "Статус не указан" };
}
