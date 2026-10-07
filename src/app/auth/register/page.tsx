"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { TextField } from "@/components/ui/Fields";
import { useAuth } from "@/lib/client/auth";
import { showError, showSucces } from "@/utils/notify";
import { handleError } from "@/utils/errorsHandle";

type Field = "name" | "email" | "password";

export default function RegisterPage() {
  const router = useRouter();
  const auth = useAuth();

  const [isRegistering, setRegistering] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const validate = () => {
    const next: Partial<Record<Field, string>> = {};
    if (formData.name.trim().length < 2) next.name = "Name must be at least 2 characters";
    if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) next.email = "Enter a valid email address";
    if (formData.password.length < 8) next.password = "Password must be at least 8 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setRegistering(true);
    try {
      await axios.post("/api/auth/register", formData);
    } catch (err) {
      showError(handleError(err));
      setRegistering(false);
      return;
    }

    // sign in right away with the credentials just registered
    const res = await auth.signIn(formData.email.trim().toLowerCase(), formData.password);
    setRegistering(false);
    if (res.ok) {
      showSucces("Account created");
      router.push("/admin/dashboard");
      router.refresh();
    } else {
      showSucces("Account created. Please sign in.");
      router.push("/auth/login");
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <TextField label="Name" name="name" autoComplete="name" placeholder="Your name" value={formData.name} onChange={handleChange} error={errors.name} required />
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        required
      />
      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        hint="8 to 72 characters."
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        required
      />

      <button disabled={isRegistering} type="submit" className="btn btn-primary w-full">
        {isRegistering ? (
          <>
            <span className="loading loading-spinner loading-sm" aria-hidden />
            Creating account
          </>
        ) : (
          "Create account"
        )}
      </button>

      <p className="muted text-center text-sm">
        Already have an account?{" "}
        <Link href="/auth/login" className="link link-primary font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}
