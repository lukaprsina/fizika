import type { VoidComponent } from "solid-js";
import { For, Show } from "solid-js";
import { useRouteData } from "solid-start";
import { createServerData$ } from "solid-start/server";
import Footer from "~/components/Footer";
import Header from "~/components/Header";
import { Navigation, NavigationItem } from "~/components/Navigation";
import Providers, { AppShellContent, AppShellFooter, AppShellHeader } from "~/layouts/Providers";

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

const Home: VoidComponent = () => {
    const topics = useRouteData<typeof routeData>();

    return (
        <Providers>
            <AppShellHeader>
                <Header />
            </AppShellHeader>
            <AppShellContent>
                <Show when={topics()}>
                    <Navigation>
                        <For each={topics()}>{(topic) =>
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