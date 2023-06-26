import { getSession } from "@solid-auth/base";
import type { VoidComponent } from "solid-js";
import { For, Show } from "solid-js";
import { useRouteData } from "solid-start";
import { createServerData$ } from "solid-start/server";
import Footer from "~/components/Footer";
import Header from "~/components/Header";
import { Navigation, NavigationItem } from "~/components/Navigation";
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

    return (
        <Providers>
            <AppShellHeader>
                <Header name={data()?.session?.user?.name} />
            </AppShellHeader>
            <AppShellContent>
                <Show when={data()?.topics}>
                    <Navigation>
                        <For each={data()?.topics}>{(topic) =>
                            <NavigationItem
                                text={topic.title}
                            />
                        }
                        </For>
                    </Navigation>
                </Show>
            </AppShellContent>
            <AppShellFooter>
                <Footer />
            </AppShellFooter>
        </Providers>
    )
}

export default Home