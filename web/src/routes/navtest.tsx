import { getSession } from "@solid-auth/base";
import type { VoidComponent } from "solid-js";
import { createEffect, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { useRouteData } from "solid-start";
import { createServerData$ } from "solid-start/server";
import Footer from "~/components/Footer";
import Header from "~/components/Header";
import { Navigation } from "~/components/NavigationNew";
import Providers, { AppShellContent, AppShellFooter, AppShellHeader } from "~/layouts/Providers";

const Home: VoidComponent = () => {

    return (
        <Providers>
            <AppShellHeader>
                <Header />
            </AppShellHeader>
            <AppShellContent>
                <Navigation titles={[{ text: "A" }, { text: "B" }, { text: "C" }, { text: "D" }]} />
            </AppShellContent>
            <AppShellFooter>
                <Footer />
            </AppShellFooter>
        </Providers>
    )
}

export default Home