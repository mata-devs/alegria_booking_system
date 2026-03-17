"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { CompleteForm } from "@/app/(client)/complete/_components/complete-form";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-[#74C00F]" /></div>}>
      <CompleteForm />
    </Suspense>
  );
}