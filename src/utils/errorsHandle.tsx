interface ApiIssue {
    path?: (string | number)[];
    message?: string;
}

interface ApiErrorLike {
    message?: string;
    response?: { data?: { error?: unknown } };
}

// Turns an axios error (or API payload) into a message safe to show in a toast.
export const handleError = (error: unknown): string => {
    if (!error) return "Something went wrong!";

    const err = error as ApiErrorLike;
    const apiError = err.response?.data?.error;
    if (typeof apiError === "string") return apiError;
    // zod issues: [{ path: [...], message: "..." }]
    if (Array.isArray(apiError)) {
        return (apiError as ApiIssue[])
            .map((i) => (i?.path?.length ? `${i.path.join(".")}: ${i.message}` : i?.message))
            .filter(Boolean)
            .join(", ") || "Validation failed";
    }
    return err.message || "Something went wrong!";
};
