import type { Component } from "solid-js";
import { For, Show } from "solid-js";
import { useRouteData } from "solid-start";
import { createServerData$ } from "solid-start/server";
import Footer from "~/components/Footer";
import Header from "~/components/Header";
import { Sidebar, SidebarItem } from "~/components/Sidebar";
import { AppShellContent, AppShellFooter, AppShellHeader } from "~/layouts/Providers";

export function routeData() {
    return createServerData$(async () => {
        const topics = await prisma?.topic.findMany({
            where: {
                course: { title: "Fizika" }
            },
            include: {
                authors: {}
            },
            orderBy: { year: "asc" },
        });

        return topics;
    })
}

const Home: Component = () => {
    const topics = useRouteData<typeof routeData>();

    return <>
        <AppShellHeader>
            <Header />
        </AppShellHeader>
        <AppShellContent>
            <Show when={topics()}>
                <Sidebar>
                    <For each={topics()}>{(topic) =>
                        <SidebarItem
                            text={topic.title}
                        />
                    }
                    </For>
                </Sidebar>
            </Show>
        </AppShellContent>
        <AppShellFooter>
            <Footer />
        </AppShellFooter>
    </>
}

export default Home