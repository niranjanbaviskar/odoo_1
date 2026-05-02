import { AuthForm } from "@/components/forms/auth-form";

export default function VerifyPage({ searchParams }: { searchParams?: { email?: string } }) {
    return <div className="px-4 py-10 sm:px-6 lg:px-8"><AuthForm mode="verify" defaultEmail={searchParams?.email ?? ""} /></div>;
}
