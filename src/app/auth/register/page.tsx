"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();

  const [isRegistering, setRegistering] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    gender: "",
    birthDate: "",
    role: "",
  });

  const [formErrors, setFormErrors] = useState({
    nameError: "",
    emailError: "",
    passwordError: "",
    phoneError: "",
    addressError: "",
    genderError: "",
    birthDateError: "",
    roleError: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let isValid = true;
    const errors = {
      nameError: "",
      emailError: "",
      passwordError: "",
      phoneError: "",
      addressError: "",
      genderError: "",
      birthDateError: "",
      roleError: "",
    };

    Object.keys(formData).forEach((key) => {
      if (!formData[key as keyof typeof formData]) {
        errors[`${key}Error` as keyof typeof errors] = "This field is required";
        isValid = false;
      }
    });

    setFormErrors(errors);

    if (isValid) {
      setRegistering(true);

      setTimeout(() => {
        setRegistering(false);
        setFormData({
          name: "",
          email: "",
          password: "",
          phone: "",
          address: "",
          gender: "",
          birthDate: "",
          role: "",
        });
        setFormErrors({
          nameError: "",
          emailError: "",
          passwordError: "",
          phoneError: "",
          addressError: "",
          genderError: "",
          birthDateError: "",
          roleError: "",
        });
        router.push('/admin/login');

      }, 2000);
    }
  };

  return (
    <form className="w-full" onSubmit={handleSubmit}>
      <input
        onChange={handleChange}
        type="text"
        placeholder="Name"
        name="name"
        className="block w-full p-3 border mt-5"
      />
      {formErrors.nameError && <span className="text-red-500">{formErrors.nameError}</span>}

      <input
        onChange={handleChange}
        type="email"
        placeholder="Email"
        name="email"
        className="block w-full p-3 border mt-5"
      />
      {formErrors.emailError && <span className="text-red-500">{formErrors.emailError}</span>}

      <input
        onChange={handleChange}
        type="password"
        placeholder="Password"
        name="password"
        className="block w-full p-3 border mt-5"
      />
      {formErrors.passwordError && <span className="text-red-500">{formErrors.passwordError}</span>}

      <input
        onChange={handleChange}
        type="tel"
        placeholder="Phone"
        name="phone"
        className="block w-full p-3 border mt-5"
      />
      {formErrors.phoneError && <span className="text-red-500">{formErrors.phoneError}</span>}

      <input
        onChange={handleChange}
        type="date"
        name="birthDate"
        className="block w-full p-3 border mt-5"
      />
      {formErrors.birthDateError && <span className="text-red-500">{formErrors.birthDateError}</span>}

      <select
        onChange={handleChange}
        name="gender"
        className="block w-full p-3 border mt-5"
      >
        <option value="">Select Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>
      {formErrors.genderError && <span className="text-red-500">{formErrors.genderError}</span>}

      <select
        onChange={handleChange}
        name="role"
        className="block w-full p-3 border mt-5"
      >
        <option value="">Select Role</option>
        <option value="artist">Artist</option>
        <option value="artistmanager">Artist Manager</option>
        <option value="superadmin">Super Admin</option>
      </select>
      {formErrors.roleError && <span className="text-red-500">{formErrors.roleError}</span>}

      <input
        onChange={handleChange}
        type="text"
        placeholder="Address"
        name="address"
        className="block w-full p-3 border mt-5"
      />
      {formErrors.addressError && <span className="text-red-500">{formErrors.addressError}</span>}

      <p className="text-[#666] text-[18px] mt-[30px]">
        Already have an account? <Link href="/auth/login">Login</Link>
      </p>

      <button
        disabled={isRegistering}
        type="submit"
        className="btn btn-primary w-full mt-[15px]"
      >
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
