"use client";

export const dynamic = "force-dynamic";

/**
 * Admin — Staff Management
 * Create accounts for doctors, nurses, pharmacists.
 */

import React, { useState } from "react";
import toast from "react-hot-toast";
import { UserPlus, ShieldCheck } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { signUp } from "@/lib/auth";
import type { UserRole } from "@/types";

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "doctor",     label: "Dokter" },
  { value: "nurse",      label: "Perawat" },
  { value: "pharmacist", label: "Apoteker" },
  { value: "admin",      label: "Admin" },
];

export default function AdminStaffPage() {
  const [modal, setModal]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState({ name: "", email: "", password: "", role: "doctor" });

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(form.email, form.password, form.name, form.role as UserRole);
      toast.success(`Akun ${form.name} berhasil dibuat sebagai ${form.role}.`);
      setModal(false);
      setForm({ name: "", email: "", password: "", role: "doctor" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat akun");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Manajemen Staff" subtitle="Buat akun untuk tenaga medis" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <Button icon={<UserPlus className="w-4 h-4" />} onClick={() => setModal(true)}>
            Tambah Staff Baru
          </Button>
        </div>

        <Card>
          <div className="flex flex-col items-center py-12 text-center gap-3">
            <ShieldCheck className="w-12 h-12 text-slate-200" />
            <p className="text-slate-500 font-medium">Daftar staff akan muncul di sini.</p>
            <p className="text-xs text-slate-400 max-w-sm">
              Buat akun untuk dokter, perawat, dan apoteker menggunakan tombol di atas.
              Akun yang dibuat dapat langsung login ke sistem.
            </p>
          </div>
        </Card>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Tambah Staff Baru"
        footer={
          <>
            <Button variant="outline" onClick={() => setModal(false)}>Batal</Button>
            <Button form="staff-form" type="submit" loading={loading}>Buat Akun</Button>
          </>
        }
      >
        <form id="staff-form" onSubmit={submit} className="space-y-4">
          <Input label="Nama Lengkap" name="name" value={form.name} onChange={handle} required />
          <Input label="Email" name="email" type="email" value={form.email} onChange={handle} required />
          <Input label="Password Awal" name="password" type="password" value={form.password}
            onChange={handle} required hint="Minimal 6 karakter" />
          <Select label="Role / Jabatan" name="role" value={form.role}
            onChange={handle as (e: React.ChangeEvent<HTMLSelectElement>) => void}
            options={ROLE_OPTIONS} required />
        </form>
      </Modal>
    </div>
  );
}
