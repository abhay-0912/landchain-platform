"use client";

import { useState } from "react";
import axios from "axios";

const navLinks = ["Home", "Register", "Dashboard", "Verify"];

const indianStates = [
  "Select State",
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Puducherry",
];

const propertyTypes = ["Select Type", "Agricultural", "Residential", "Commercial", "Industrial"];

type FormState = {
  ownerName: string;
  aadhaar: string;
  propertyId: string;
  state: string;
  district: string;
  village: string;
  area: string;
  propertyType: string;
  surveyNumber: string;
  document: File | null;
};

type SuccessData = {
  txHash: string;
  propertyId: string;
};

function randomHex(len: number) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

function SuccessModal({ data, onClose }: { data: SuccessData; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="rounded-t-2xl bg-[#0A1628] px-6 py-5 text-center">
          <p className="text-3xl">✅</p>
          <h2 className="mt-2 text-xl font-extrabold text-white">Registration Successful</h2>
          <p className="mt-1 text-sm text-[#FF6B00]">पंजीकरण सफल रहा</p>
        </div>
        <div className="space-y-4 px-6 py-6">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Property ID</p>
            <p className="mt-1 text-lg font-extrabold text-[#0A1628]">{data.propertyId}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Blockchain Transaction Hash</p>
            <p className="mt-1 break-all font-mono text-xs text-[#0A1628]">{data.txHash}</p>
          </div>
          <p className="text-center text-xs text-slate-500">
            Your property has been immutably recorded on the LandChain blockchain network. Keep the transaction hash for future verification.
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button className="flex-1 rounded-md bg-[#FF6B00] py-2.5 text-sm font-bold text-white transition hover:bg-[#e86200]">
              Download Certificate
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-md border border-[#0A1628] py-2.5 text-sm font-bold text-[#0A1628] transition hover:bg-[#0A1628] hover:text-white"
            >
              Register Another
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-[#0A1628]">
        {label}
        {required && <span className="ml-1 text-[#FF6B00]">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-[#0A1628] outline-none transition placeholder:text-slate-400 focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20";

export default function Register() {
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  const [form, setForm] = useState<FormState>({
    ownerName: "",
    aadhaar: "",
    propertyId: "",
    state: "Select State",
    district: "",
    village: "",
    area: "",
    propertyType: "Select Type",
    surveyNumber: "",
    document: null,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [error, setError] = useState("");

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (form.state === "Select State" || form.propertyType === "Select Type") {
      setError("Please select a valid State and Property Type.");
      return;
    }
    setLoading(true);
    try {
      const location = [form.village, form.district, form.state].filter(Boolean).join(", ");
      await axios.post("https://landchain-platform.onrender.com/api/property", {
        owner: form.ownerName,
        aadhaar: form.aadhaar,
        property_id: form.propertyId,
        state: form.state,
        district: form.district,
        village: form.village,
        location,
        area: parseFloat(form.area),
        property_type: form.propertyType,
        survey_number: form.surveyNumber
      });
      setSuccess({
        txHash: "0x" + randomHex(64),
        propertyId: "LC-" + Date.now().toString(36).toUpperCase(),
      });
      setForm({
        ownerName: "", aadhaar: "", propertyId: "",
        state: "Select State", district: "", village: "",
        area: "", propertyType: "Select Type", surveyNumber: "", document: null,
      });
    } catch {
      setError("Submission failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full overflow-x-hidden bg-[#F5F7FB] text-[#0A1628] [font-family:'Poppins',sans-serif]">
      {success && <SuccessModal data={success} onClose={() => setSuccess(null)} />}

      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-3xl leading-none">🏛️</span>
            <div className="min-w-0">
              <p className="truncate text-2xl font-extrabold text-[#0A1628]">LandChain</p>
              <p className="truncate text-xs font-semibold tracking-wide text-[#FF6B00]">भूमि रजिस्ट्री</p>
            </div>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link}
                href={link === "Home" ? "/" : `/${link.toLowerCase()}`}
                className={`text-sm font-semibold transition ${
                  link === "Register" ? "text-[#FF6B00]" : "text-[#0A1628] hover:text-[#FF6B00]"
                }`}
              >
                {link}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <section className="w-full bg-[#0A1628] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">Register Property</h1>
          <p className="mt-2 text-lg font-semibold text-[#FF6B00]">संपत्ति पंजीकरण</p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            All fields marked with <span className="text-[#FF6B00]">*</span> are mandatory as per the Land Records Digitisation Act. Submitted data is cryptographically secured on the LandChain blockchain network.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div className="flex flex-col items-center gap-3 border-b border-slate-200 bg-[#F0F4FA] px-6 py-6 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🏛️</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Government of India</p>
                <p className="text-lg font-extrabold text-[#0A1628]">Land Registration Form</p>
                <p className="text-xs text-slate-500">भूमि पंजीकरण प्रपत्र</p>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-xs font-semibold text-slate-500">Form No.</p>
              <p className="font-mono text-sm font-bold text-[#0A1628]">LC-2024-REG</p>
              <p className="mt-1 text-xs text-slate-500">Date: {today}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-6 sm:p-8">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div>
              <p className="mb-4 border-l-4 border-[#FF6B00] pl-3 text-sm font-bold uppercase tracking-widest text-slate-600">
                Owner Information
              </p>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Owner Full Name" required>
                  <input type="text" value={form.ownerName} onChange={set("ownerName")} required placeholder="As per government records" className={inputClass} />
                </Field>
                <Field label="Aadhaar Number" required>
                  <input type="text" value={form.aadhaar} onChange={set("aadhaar")} required placeholder="XXXX XXXX XXXX" maxLength={14} className={inputClass} />
                </Field>
              </div>
            </div>

            <div>
              <p className="mb-4 border-l-4 border-[#FF6B00] pl-3 text-sm font-bold uppercase tracking-widest text-slate-600">
                Property Location
              </p>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="State" required>
                  <select value={form.state} onChange={set("state")} required className={inputClass}>
                    {indianStates.map((s) => (
                      <option key={s} disabled={s === "Select State"}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="District" required>
                  <input type="text" value={form.district} onChange={set("district")} required placeholder="Enter district" className={inputClass} />
                </Field>
                <Field label="Village / Area" required>
                  <input type="text" value={form.village} onChange={set("village")} required placeholder="Village or locality name" className={inputClass} />
                </Field>
                <Field label="Survey Number" required>
                  <input type="text" value={form.surveyNumber} onChange={set("surveyNumber")} required placeholder="e.g. 245/3A" className={inputClass} />
                </Field>
              </div>
            </div>

            <div>
              <p className="mb-4 border-l-4 border-[#FF6B00] pl-3 text-sm font-bold uppercase tracking-widest text-slate-600">
                Property Details
              </p>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Property ID" required>
                  <input type="text" value={form.propertyId} onChange={set("propertyId")} required placeholder="e.g. MH-2024-00421" className={inputClass} />
                </Field>
                <Field label="Property Type" required>
                  <select value={form.propertyType} onChange={set("propertyType")} required className={inputClass}>
                    {propertyTypes.map((t) => (
                      <option key={t} disabled={t === "Select Type"}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Total Area (sq ft)" required>
                  <input type="number" value={form.area} onChange={set("area")} required min="1" placeholder="e.g. 2400" className={inputClass} />
                </Field>
                <Field label="Upload Document">
                  <label className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500 transition hover:border-[#FF6B00] hover:bg-orange-50">
                    <span className="text-lg">📎</span>
                    <span className="truncate">
                      {form.document ? form.document.name : "Click to upload PDF or image"}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, document: e.target.files?.[0] ?? null }))
                      }
                    />
                  </label>
                </Field>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-between">
              <p className="text-center text-xs text-slate-500 sm:text-left">
                By submitting, you certify that all information is accurate and you are the lawful owner of the property.
              </p>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#FF6B00] px-10 py-3 text-sm font-extrabold text-white shadow transition hover:bg-[#e86200] disabled:cursor-not-allowed disabled:bg-orange-300 sm:w-auto"
              >
                {loading ? "Submitting..." : "Submit Registration"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="w-full bg-[#0A1628] px-4 py-10 text-slate-200 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl space-y-2 text-center md:text-left">
          <p className="text-sm leading-7">
            Government of India digital land registry services are provided for lawful use and official verification purposes only.
          </p>
          <p className="text-sm leading-7">
            भारत सरकार की डिजिटल भूमि रजिस्ट्री सेवाएं केवल विधिक उपयोग और आधिकारिक सत्यापन हेतु उपलब्ध हैं।
          </p>
          <p className="pt-2 text-xs text-slate-400">© 2026 LandChain. Government of India.</p>
        </div>
      </footer>
    </div>
  );
}
