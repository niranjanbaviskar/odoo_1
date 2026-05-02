import { cn } from "@/lib/utils";

const variants = {
    default: "bg-white/10 text-white border-white/10",
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
    warning: "bg-amber-500/15 text-amber-300 border-amber-400/20",
    danger: "bg-rose-500/15 text-rose-300 border-rose-400/20",
    accent: "bg-cyan-500/15 text-cyan-300 border-cyan-400/20",
} as const;

export function Badge({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
    return <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium", variants[variant], className)} {...props} />;
}
