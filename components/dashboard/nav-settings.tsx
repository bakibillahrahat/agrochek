import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Collapsible } from "@radix-ui/react-collapsible";
import { Settings2 } from "lucide-react";

export function NavSettings () {
    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Settings</SidebarGroupLabel>
            <SidebarMenu>
                <Collapsible asChild
            className="group/collapsible">
                <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                        <a href="/settings">
                            <Settings2 />
                            <span>Settings</span>
                        </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                </Collapsible>
            </SidebarMenu>
        </SidebarGroup>
    )
}