import { SignUpForm } from "@/components/sign-up-form";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-linear-to-b from-lime-50 to-lime-100">
      <div className="w-full max-w-sm">
        <SignUpForm />
      </div>
    </div>
  );
}
