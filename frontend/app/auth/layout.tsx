import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — LumiVue",
  description:
    "Authenticate to access LumiVue's evidence-grounded medical image intelligence workstation.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
