import { getSession } from "@solid-auth/base";
import type { Component } from "solid-js";
import { createEffect, createSignal } from "solid-js";
import type { RouteDataArgs } from "solid-start";
import { useParams, useRouteData } from "solid-start";
import { createServerAction$, createServerData$ } from "solid-start/server";
import Footer from "~/components/Footer";
import Header from "~/components/Header";
import type { TitleType } from "~/components/Navigation";
import { Navigation } from "~/components/Navigation";
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

        const topic = await prisma.topic.findUnique({
            where: {
                title: topic_name
            }
        });

        if (!topic) return result;

        const pages = await prisma.page.findMany({
            where: {
                topicId: topic.id,
                active: true,
            },
            select: {
                title: true,
                id: true
            }
        });

        result.pages = pages
        return result;
    }, {
        key: () => ["topic", decodeURIComponent(params.topic)]
    })
}

type ParamsType = {
    topic: string;
}

const TopicNavbar: Component = () => {
    const topic_data = useRouteData<typeof routeData>();
    const [pages, setPages] = createSignal<TitleType[]>([]);
    const params = useParams<ParamsType>();

    const [, movePageToTrash] = createServerAction$(async ({ id, topic: topic_url }: {
        id: string,
        topic: string
    }) => {
        const parsed_name = parseInt(id);
        if (isNaN(parsed_name)) return;

        const decoded_topic = decodeURIComponent(topic_url)

        const topic = await prisma?.topic.findUnique({
            where: {
                title: decoded_topic
            }
        });

        if (!topic) return;

        await prisma.page.update({
            where: {
                topicId_id: { id: parsed_name, topicId: topic?.id }
            },
            data: { active: false }
        })
    });

    createEffect(() => {
        const page_data = topic_data()?.pages
        if (!page_data) return;

        // TODO: page title
        const parsed_pages = page_data.map((page) => ({
            text: page.title ?? "",
            href: page.id.toString()
        }))
        setPages(parsed_pages)
    })

    return (
        <Providers>
            <AppShellHeader>
                <Header topic={decodeURIComponent(params.topic)} name={topic_data()?.session?.user?.name} />
            </AppShellHeader>
            <AppShellContent>
                <Navigation titles={pages()} delete={(id: string) => {
                    movePageToTrash({
                        id,
                        topic: params.topic
                    });
                    return new Promise(() => { return; })
                }} />
            </AppShellContent>
            <AppShellFooter>
                <Footer />
            </AppShellFooter>
        </Providers>
    )
}

export default TopicNavbar