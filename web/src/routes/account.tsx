import { getSession } from "@solid-auth/base";
import { signIn, signOut } from "@solid-auth/base/client";
import type { VoidComponent } from "solid-js";
import { Show, Suspense } from "solid-js";
import { useRouteData } from "solid-start";
import { createServerData$ } from "solid-start/server";
import Header from "~/components/Header";
import Providers, { AppShellHeader, AppShellContent } from "~/layouts/Providers";
import { authOptions } from "~/server/auth";

export const routeData = () => {
    return createServerData$(
        async (_, { request }) => {
            return await getSession(request, authOptions);
        },
        { key: () => ["auth_user"] }
    );
};

const Account: VoidComponent = () => {
    const user = useRouteData<typeof routeData>();

    return (
        <Providers>
            <AppShellHeader>
                <Header />
            </AppShellHeader>
            <AppShellContent>
                <Suspense fallback={<p>Waiting...</p>}>
                    <Show
                        when={user()}
                        fallback={<div>
                            <p>
                                <button
                                    onClick={async () => {
                                        await signIn("google", { redirect: true, redirectTo: "/" })
                                    }}
                                >
                                    Prijava
                                </button>
                            </p>
                        </div>}
                    >
                        <div class="flex flex-col items-start">
                            <span>{user()?.user?.name}</span>
                            <button
                                onClick={async () =>
                                    await signOut({ redirect: true, redirectTo: "/" })
                                }
                            >
                                Odjava
                            </button>
                        </div>
                    </Show>
                </Suspense>
            </AppShellContent>
        </Providers>
    )


}

export default Account;