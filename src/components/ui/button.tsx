import { cn } from "@/lib/utils";

const variants = {
    default: "bg-white text-slate-950 hover:bg-slate-200 shadow-lg shadow-cyan-500/10",
    ghost: "bg-transparent text-slate-200 hover:bg-white/10",
    outline: "border border-white/10 bg-white/5 text-white hover:bg-white/10",
    accent: "bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-lg shadow-cyan-500/20",
    destructive: "bg-rose-500 text-white hover:bg-rose-400",
} as const;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: keyof typeof variants;
    size?: "sm" | "default" | "lg";
};

export function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
    return (
        <button
            className={cn(
                "inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 disabled:pointer-events-none disabled:opacity-50",
                variants[variant],
                size === "sm" && "h-9 px-4 text-sm",
                size === "default" && "h-11 px-5 text-sm",
                size === "lg" && "h-12 px-6 text-base",
                className,
            )}
            {...props}
        />
    );
}
