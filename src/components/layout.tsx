
import { ReactNode, useEffect, useState } from "react";

import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/app-sidebar";
import { SubjectLoader } from "@/utils/loader";
import { LoadingSpinner } from "./ui/LoadingSpinner";

export default function Layout({ children }: { children: ReactNode }) {
    const [name, setName] = useState<string>("");

    useEffect(() => {
        const loader = SubjectLoader.getInstance();
        loader.registerPrimaryChangeCallback(() => {
            loader.getPrimary().then((subject) => {
                setName(subject.getName());
            })
        });
    }, []);

    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <SidebarProvider>
                <AppSidebar />
                <main className="w-screen">
                    <div className="flex text-center">
                        <SidebarTrigger />
                        <h1 className="text-2xl font-bold ubuntu-bold text-center self-center mx-auto mt-4">{name == "" ? <LoadingSpinner /> : name}</h1>
                    </div>
                    {children}
                </main>
                <Toaster />
            </SidebarProvider>
        </ThemeProvider>
    );
}