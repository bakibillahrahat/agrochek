"use client"

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DynamicBreadcrumb } from "@/components/dashboard/dynamicBreadCrumb";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@radix-ui/react-separator";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";

function DashboardLayoutContent({ children }: { children: React.ReactNode; }) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/sign-in");
        }
    }, [status, router]);

    if (status === "loading") {
        return <div>Loading...</div>;
    }

    if (!session) {
        return null;
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4 flex-1">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <DynamicBreadcrumb/>
                    </div>
                    <div className="flex items-center gap-2 px-4">
                        <ThemeToggle />
                    </div>
                </header>
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}

export default function DashboardLayout({ children }: { children: React.ReactNode; }) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </Suspense>
    )
}