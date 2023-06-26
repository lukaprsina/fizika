import { getSession } from "@solid-auth/base";
import type { Component } from "solid-js";
import { For, Show } from "solid-js";
import type { RouteDataArgs } from "solid-start";
import { useRouteData } from "solid-start";
import { createServerData$ } from "solid-start/server";
import Footer from "~/components/Footer";
import Header from "~/components/Header";
import { Navigation, NavigationItem } from "~/components/Navigation";
import Providers, { AppShellContent, AppShellFooter, AppShellHeader } from "~/layouts/Providers";
import { authOptions } from "~/server/auth";
import { prisma } from "~/server/db"

export function routeData({ params }: RouteDataArgs) {
    return createServerData$(async ([, topic_name], { request }) => {
        const session = await getSession(request, authOptions);
        const result: {
            session: typeof session,
            pages?: { title: string | null; id: number; }[]
        } = { session };

        const topic = await prisma?.topic.findUnique({
            where: {
                title: topic_name
            }
        });

        // console.log(topic?.id, topic_name);
        if (!topic) return result;

        const pages = await prisma?.page.findMany({
            where: {
                topicId: topic.id
            },
            select: {
                title: true,
                id: true
            }
        });

        result.pages = pages
        return result;
    }, {
        key: () => ["topic", decodeURI(params.topic)]
    })
}

const TopicNavbar: Component = () => {
    const topic_data = useRouteData<typeof routeData>();

    return (
        <Providers>
            <AppShellHeader>
                <Header name={topic_data()?.session?.user?.name} />
            </AppShellHeader>
            <AppShellContent>
                <Navigation>
                    <Show when={topic_data()?.pages}>
                        <For each={topic_data()?.pages}>{(topic) =>
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