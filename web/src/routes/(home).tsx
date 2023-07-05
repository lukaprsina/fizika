import { getSession } from "@solid-auth/base";
import type { VoidComponent } from "solid-js";
import { createEffect, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { useRouteData } from "solid-start";
import { createServerData$ } from "solid-start/server";
import Footer from "~/components/Footer";
import Header from "~/components/Header";
import type { TitleType } from "~/components/NavigationNew";
import { Navigation } from "~/components/NavigationNew";
import Providers, { AppShellContent, AppShellFooter, AppShellHeader } from "~/layouts/Providers";
import { authOptions } from "~/server/auth";
import { prisma } from "~/server/db"

export function routeData() {
    return createServerData$(async (_, { request }) => {
        const topics = await prisma?.topic.findMany({
            where: {
                course: { title: "Fizika" }
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
    const [titles, setTitles] = createSignal<TitleType[]>([])

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
                <Navigation titles={titles()} />
            </AppShellContent>
            <AppShellFooter>
                <Footer />
            </AppShellFooter>
        </Providers>
    )
}

export default Home