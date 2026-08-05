export type PublicStatusKind = "available" | "default" | "soon";

export function getPublicStatus(status: string): {
  kind: PublicStatusKind;
  label: string;
} {
  if (status === "Куплено") {
    return { kind: "soon", label: "Coming soon" };
  }
  if (status === "Выставлено") {
    return { kind: "available", label: "Available" };
  }
  return { kind: "default", label: status || "Status unavailable" };
}
