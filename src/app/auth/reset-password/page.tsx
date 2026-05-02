import { AuthForm } from "@/components/forms/auth-form";

export default function ResetPasswordPage({ searchParams }: { searchParams?: { email?: string } }) {
    return <div className="px-4 py-10 sm:px-6 lg:px-8"><AuthForm mode="reset" defaultEmail={searchParams?.email ?? ""} /></div>;
}
