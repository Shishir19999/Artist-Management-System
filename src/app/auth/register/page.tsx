"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { SelectField, TextField } from "@/components/ui/Fields";
import { useAuth } from "@/lib/client/auth";
import { SELF_REGISTER_ROLES } from "@/lib/client/role-policy";
import { GENDERS, ROLE_LABEL } from "@/lib/domain/constants";
import { showError, showSucces } from "@/utils/notify";
import { handleError } from "@/utils/errorsHandle";

type Field = "name" | "email" | "password" | "phone" | "address" | "birthDate";

const initial = { name: "", email: "", password: "", phone: "", address: "", gender: "MALE", birthDate: "", role: "USER" };

export default function RegisterPage() {
  const router = useRouter();
  const auth = useAuth();

  const [isRegistering, setRegistering] = useState(false);
  const [formData, setFormData] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const validate = () => {
    const next: Partial<Record<Field, string>> = {};
    if (formData.name.trim().length < 2) next.name = "Name must be at least 2 characters";
    if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) next.email = "Enter a valid email address";
    if (formData.password.length < 8) next.password = "Password must be at least 8 characters";
    if (formData.phone.trim() && !/^[+\d][\d\s()-]{5,}$/.test(formData.phone.trim())) next.phone = "Enter a valid phone number";
    if (formData.birthDate && (Number.isNaN(Date.parse(formData.birthDate)) || Date.parse(formData.birthDate) > Date.now())) next.birthDate = "Enter a valid date of birth";
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

  const count = Object.values(errors).filter(Boolean).length;

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <div role="alert" aria-live="assertive">
        {count > 0 && <p className="alert alert-error alert-soft text-sm">Please fix {count} field{count === 1 ? "" : "s"} below.</p>}
      </div>
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
      <TextField label="Phone" name="phone" type="tel" autoComplete="tel" placeholder="+1 555 0100" value={formData.phone} onChange={handleChange} error={errors.phone} />
      <TextField label="Address" name="address" autoComplete="street-address" placeholder="City, country" value={formData.address} onChange={handleChange} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Gender" name="gender" value={formData.gender} onChange={handleChange}>
          {GENDERS.map((g) => (
            <option key={g} value={g}>
              {g.charAt(0) + g.slice(1).toLowerCase()}
            </option>
          ))}
        </SelectField>
        <TextField label="Date of birth" name="birthDate" type="date" autoComplete="bday" value={formData.birthDate} onChange={handleChange} error={errors.birthDate} />
      </div>
      <SelectField label="I am joining as" name="role" value={formData.role} onChange={handleChange} hint="Choose Artist to get a profile and publish your own music.">
        {SELF_REGISTER_ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABEL[r]}
          </option>
        ))}
      </SelectField>

      <button disabled={isRegistering} type="submit" className="btn btn-primary min-h-11 w-full">
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
