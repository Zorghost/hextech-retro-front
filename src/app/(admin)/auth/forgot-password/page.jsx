import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { requestPasswordReset } from "@/features/auth/passwordReset";

export const metadata = {
  title: "Forgot Password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage({ searchParams }) {
  const message = searchParams?.message || null;
  const error = searchParams?.error || null;

  return (
    <section className="bg-dark">
      <div className="flex flex-col items-center justify-center px-6 py-24 h-screen mx-auto">
        <Link href="/" className="flex items-center mb-6 text-2xl font-semibold text-gray-900">
          <Image className="mr-2 h-auto" src="/logo.svg" width={212} height={35} alt="Logo" />
        </Link>

        <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md">
          <div className="p-6 space-y-4 sm:p-8 md:space-y-6">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
              Reset your password
            </h1>

            <p className="text-sm text-gray-600">
              Enter your email address and we will send you a link to reset your password.
            </p>

            {message && (
              <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700 border border-green-200">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <form
              className="flex flex-col gap-4"
              action={async (formData) => {
                "use server";
                const email = formData.get("email");
                const result = await requestPasswordReset(email);

                const searchParams = new URLSearchParams(
                  result.success
                    ? { message: result.message }
                    : { error: result.message }
                ).toString();
                redirect(`/auth/forgot-password?${searchParams}`);
              }}
            >
              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900">
                  Your email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-500 block w-full p-2.5"
                  placeholder="your.email@example.com"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center text-white"
              >
                Send Reset Link
              </button>
            </form>

            <p className="text-sm font-light text-gray-500">
              Remember your password?{" "}
              <Link href="/auth/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
