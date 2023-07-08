import { getSession } from "@solid-auth/base";
import type { VoidComponent } from "solid-js";
import { createEffect, createSignal } from "solid-js";
import { useRouteData } from "solid-start";
import { createServerData$, createServerAction$ } from "solid-start/server";
import Footer from "~/components/Footer";
import Header from "~/components/Header";
import type { TitleType } from "~/components/Navigation";
import { Navigation } from "~/components/Navigation";
import Providers, { AppShellContent, AppShellFooter, AppShellHeader } from "~/layouts/Providers";
import { authOptions } from "~/server/auth";
import { prisma } from "~/server/db"

// todo: replace page urls with names

export function routeData() {
    return createServerData$(async (_, { request }) => {
        const topics = await prisma?.topic.findMany({
            where: {
                course: { title: "Fizika" },
                active: true,
            },
            include: {
                authors: {}
            },
            orderBy: { year: "asc" },
        });

        const session = await getSession(request, authOptions);

        return { topics, session };
    }, { key: () => ["auth_user"] })
}

const Home: VoidComponent = () => {
    const data = useRouteData<typeof routeData>();
    const [titles, setTitles] = createSignal<TitleType[]>([]);

    const [_, moveTitleToTrash] = createServerAction$(async (name: string) => {
        const result = await prisma.topic.update({ where: { title: name }, data: { active: false } })
        console.log("from server", name, result)
    });

    createEffect(() => {
        const topics = data()?.topics
        if (!topics) return;

        const titles = topics.map((topic) => { return { text: topic.title } })
        setTitles(titles)
    })

    return (
        <Providers>
            <AppShellHeader>
                <Header name={data()?.session?.user?.name} />
            </AppShellHeader>
            <AppShellContent>
                <Navigation titles={titles()} delete={moveTitleToTrash} />
            </AppShellContent>
            <AppShellFooter>
                <Footer />
            </AppShellFooter>
        </Providers>
    )
}

export default Home