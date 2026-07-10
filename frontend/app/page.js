"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/app/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getUser() ? "/dashboard" : "/login");
  }, [router]);

  return null;
}
