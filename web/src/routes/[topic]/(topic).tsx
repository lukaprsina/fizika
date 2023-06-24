import type { Component } from "solid-js";
import { For, Show } from "solid-js";
import type { RouteDataArgs } from "solid-start";
import { useRouteData } from "solid-start";
import { createServerData$ } from "solid-start/server";
import Footer from "~/components/Footer";
import Header from "~/components/Header";
import { Navigation, NavigationItem } from "~/components/Navigation";
import Providers, { AppShellContent, AppShellFooter, AppShellHeader } from "~/layouts/Providers";

export function routeData({ params }: RouteDataArgs) {
    return createServerData$(async ([, topic_name]) => {
        const topic = await prisma?.topic.findUnique({
            where: {
                title: topic_name
            }
        });

        // console.log(topic?.id, topic_name);
        if (!topic) return null;

        const pages = await prisma?.page.findMany({
            where: {
                topicId: topic.id
            },
            select: {
                title: true,
                id: true
            }
        });

        console.log(pages?.length, "pages");

        return pages;
    }, {
        key: () => ["topic", decodeURI(params.topic)]
    })
}

const TopicNavbar: Component = () => {
    const topics = useRouteData<typeof routeData>();

    return (
        <Providers>
            <AppShellHeader>
                <Header />
            </AppShellHeader>
            <AppShellContent>
                <Navigation>
                    <Show when={topics()}>
                        <For each={topics()}>{(topic) =>
                            <NavigationItem text={topic.title ?? ""} href={topic.id.toString()} />
                        }
                        </For>
                    </Show>
                </Navigation>
            </AppShellContent>
            <AppShellFooter>
                <Footer />
            </AppShellFooter>
        </Providers>
    )
}

export default TopicNavbar