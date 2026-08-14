type ErrorLike = {
  cause?: unknown;
  code?: unknown;
  message?: unknown;
  name?: unknown;
};

export function isAbortError(cause: unknown): boolean {
  if (!cause || typeof cause !== "object") return false;

  const error = cause as ErrorLike;
  if (error.name === "AbortError" || error.code === "ABORT_ERR") return true;

  const message = typeof error.message === "string" ? error.message.toLowerCase() : "";
  if (
    message.includes("aborterror") ||
    message.includes("signal is aborted") ||
    message.includes("request was aborted")
  ) {
    return true;
  }

  return error.cause !== cause && isAbortError(error.cause);
}

export function createAbortError(): Error {
  const error = new Error("The request was aborted.");
  error.name = "AbortError";
  return error;
}
