"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import axios from "axios";
import { showError, showSucces } from "@/utils/notify";
import { handleError } from "@/utils/errorsHandle";

type Field = "name" | "email" | "password";

export default function RegisterPage() {
  const router = useRouter();

  const [isRegistering, setRegistering] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const next: Partial<Record<Field, string>> = {};
    if (formData.name.trim().length < 2) next.name = "Name must be at least 2 characters";
    if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) next.email = "Enter a valid email";
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
    const res = await signIn("credentials", {
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      redirect: false,
    });
    setRegistering(false);
    if (res?.ok) {
      showSucces("Account created!");
      router.push("/admin/dashboard");
      router.refresh();
    } else {
      showSucces("Account created. Please sign in.");
      router.push("/auth/login");
    }
  };

  return (
    <form className="w-full" onSubmit={handleSubmit} noValidate>
      <input
        onChange={handleChange}
        type="text"
        placeholder="Name"
        name="name"
        autoComplete="name"
        className="block w-full p-3 border mt-5"
      />
      {errors.name && <span className="text-red-500">{errors.name}</span>}

      <input
        onChange={handleChange}
        type="email"
        placeholder="Email"
        name="email"
        autoComplete="email"
        className="block w-full p-3 border mt-5"
      />
      {errors.email && <span className="text-red-500">{errors.email}</span>}

      <input
        onChange={handleChange}
        type="password"
        placeholder="Password (min 8 characters)"
        name="password"
        autoComplete="new-password"
        className="block w-full p-3 border mt-5"
      />
      {errors.password && <span className="text-red-500">{errors.password}</span>}

      <p className="text-[#666] text-[18px] mt-[30px]">
        Already have an account? <Link href="/auth/login" className="link link-primary">Login</Link>
      </p>

      <button disabled={isRegistering} type="submit" className="btn btn-primary w-full mt-[15px]">
        {isRegistering ? (
          <span className="flex items-center gap-2">
            <span className="loading loading-bars loading-sm"></span>
            <span>Signing Up</span>
          </span>
        ) : (
          <span>Sign Up</span>
        )}
      </button>
    </form>
  );
}
