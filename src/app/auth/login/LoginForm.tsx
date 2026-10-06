"use client";

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { showError, showSucces } from "@/utils/notify";

const AUTH_ERRORS: Record<string, string> = {
    OAuthAccountNotLinked:
        "An account with this email already exists and uses a different sign-in method. Sign in with your email and password instead.",
    AccessDenied: "Google sign-in was denied (the Google email must be verified).",
    Callback: "Google sign-in failed. Please try again.",
    OAuthCallback: "Google sign-in failed. Please try again.",
    CredentialsSignin: "Invalid email or password",
};

function safeCallback(cb: string | null): string {
    // only allow same-site relative redirects
    return cb && cb.startsWith('/') && !cb.startsWith('//') ? cb : '/admin/dashboard';
}

export default function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
    const router = useRouter();
    const params = useSearchParams();
    const authError = params.get("error");
    const [isSubmitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [formDataError, setFormDataError] = useState({
        emailError: "",
        passwordError: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({...formData, [e.target.name] : e.target.value })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        setFormDataError({
            emailError: formData.email === '' ? "Email is required field" : "",
            passwordError: formData.password === '' ? "Password is required field" : "",
        });

        if(formData.email !== '' && formData.password !== ''){
            setSubmitting(true);

            signIn("credentials", { email: formData.email, password: formData.password, redirect: false })
                .then((res) => {
                    setSubmitting(false);
                    if (res?.ok) {
                        showSucces('Login Successful!');
                        router.push(safeCallback(params.get('callbackUrl')));
                        router.refresh();
                    } else {
                        showError('Invalid email or password');
                    }
                })
                .catch(() => {
                    setSubmitting(false);
                    showError('Login failed');
                });

        }
    }

  return (
        <form onSubmit={handleSubmit}>
            {authError && (
                <div role="alert" className="alert alert-error mb-[15px]">
                    {AUTH_ERRORS[authError] ?? "Sign-in failed. Please try again."}
                </div>
            )}

            <input
                onChange={handleChange}
                type="text"
                placeholder='Enter your email'
                name="email"
                className='w-full border border-[#9c9b9b] h-[60px] p-[15px] rounded-[5px] text-[18px] mt-[30px]'
            />

            { formDataError.emailError !== '' && <span className="alert alert-error">{formDataError.emailError}</span>}

            <input
                onChange={handleChange}
                type="password"
                name="password"
                placeholder='Enter password'
                className='w-full border border-[#9c9b9b] h-[60px] p-[15px] rounded-[5px] text-[18px] mt-[30px]'    
                />
                { formDataError.passwordError !== '' && <span className="alert alert-error">{formDataError.passwordError}</span>}
            
            <p className="text-[#666] text-[18px] mt-[30px]">Don&apos;t have an account ? <Link href="/auth/register" className="link link-primary">Register</Link></p>
        
            <button disabled={isSubmitting} type="submit" className="btn btn-primary w-full mt-[15px]">
                
                {
                    isSubmitting
                    ? <span className="flex items-center gap-2">
                        <span className="loading loading-bars loading-md"></span>
                        <span>Submitting</span>
                    </span>
                    : <span>Sign In</span>
                    }
            </button>

            {googleEnabled && (
                <>
                    <div className="divider">OR</div>
                    <button
                        type="button"
                        onClick={() => signIn("google", { callbackUrl: safeCallback(params.get('callbackUrl')) })}
                        className="btn btn-outline w-full"
                    >
                        Continue with Google
                    </button>
                </>
            )}
        </form>
  )
}
