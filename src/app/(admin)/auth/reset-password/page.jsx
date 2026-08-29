"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPassword, verifyResetToken } from "@/features/auth/passwordReset";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tokenValid, setTokenValid] = useState(null);

  // Verify token on mount
  useState(() => {
    if (!token) {
      setError("Invalid reset link");
      setTokenValid(false);
      return;
    }

    (async () => {
      const result = await verifyResetToken(token);
      if (!result.valid) {
        setError(result.expired ? "This reset link has expired" : "Invalid reset link");
        setTokenValid(false);
      } else {
        setTokenValid(true);
      }
    })();
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword(token, password);

      if (result.success) {
        setMessage(result.message);
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (tokenValid === null) {
    return (
      <section className="bg-dark">
        <div className="flex flex-col items-center justify-center px-6 py-24 h-screen mx-auto">
          <div className="text-white">Loading...</div>
        </div>
      </section>
    );
  }

  if (!tokenValid) {
    return (
      <section className="bg-dark">
        <div className="flex flex-col items-center justify-center px-6 py-24 h-screen mx-auto">
          <Link href="/" className="flex items-center mb-6 text-2xl font-semibold text-gray-900">
            <Image className="mr-2 h-auto" src="/logo.svg" width={212} height={35} alt="Logo" />
          </Link>

          <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md">
            <div className="p-6 space-y-4 sm:p-8 md:space-y-6">
              <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                {error}
              </div>

              <p className="text-sm text-gray-600">
                This reset link is invalid or has expired.
              </p>

              <Link
                href="/auth/forgot-password"
                className="block text-center w-full bg-primary hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-white"
              >
                Request New Link
              </Link>

              <Link href="/auth/login" className="block text-center text-sm text-primary hover:underline">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-dark">
      <div className="flex flex-col items-center justify-center px-6 py-24 h-screen mx-auto">
        <Link href="/" className="flex items-center mb-6 text-2xl font-semibold text-gray-900">
          <Image className="mr-2 h-auto" src="/logo.svg" width={212} height={35} alt="Logo" />
        </Link>

        <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md">
          <div className="p-6 space-y-4 sm:p-8 md:space-y-6">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
              Create new password
            </h1>

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

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900">
                  New Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-500 block w-full p-2.5"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-gray-900">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-500 block w-full p-2.5"
                  placeholder="Confirm password"
                />
              </div>

              <p className="text-xs text-gray-600">
                Password must be at least 8 characters long.
              </p>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
            </form>

            <Link href="/auth/login" className="block text-center text-sm text-primary hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
