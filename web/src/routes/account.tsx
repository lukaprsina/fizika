import { Match, Switch } from "solid-js";
import { useRouteData } from "solid-start";
import { createServerData$ } from "solid-start/server";
import Header from "~/components/Header";
import { AppShellHeader, AppShellContent } from "~/layouts/Providers";

import { authenticator } from "~/server/auth";
import { authClient } from "~/utils/auth";

export const routeData = () => {
    return {
        user: createServerData$(async (_, { request }) => {
            const user = await authenticator.isAuthenticated(request);
            console.log("User from routeData", user)
            return user;
        }),
    };
};

export default function Account() {
    const { user } = useRouteData<typeof routeData>();

    return <>
        <AppShellHeader>
            <Header />
        </AppShellHeader>
        <AppShellContent>
            <Switch
                fallback={<>
                    <div>
                        <p>
                            <button
                                onClick={() => {
                                    authClient.login("github", {
                                        successRedirect: "/account",
                                        failureRedirect: "/",
                                    })
                                }}
                            >
                                Login with Github
                            </button>
                        </p>
                        <p>
                            <button
                                onClick={() => {
                                    authClient.login("microsoft", {
                                        successRedirect: "/account",
                                        failureRedirect: "/",
                                    })
                                }}
                            >
                                Login with Microsoft
                            </button>
                        </p>
                        <p>
                            <button
                                onClick={() => {
                                    authClient.login("google", {
                                        successRedirect: "/account",
                                        failureRedirect: "/",
                                        throwOnError: true,
                                    })
                                }}
                            >
                                Login with Google
                            </button>
                        </p>
                    </div>
                </>}
            >
                <Match when={user()}>
                    <div class="flex flex-col items-start">
                        <span>Hi {user()?.displayName}!</span>
                        <button
                            onClick={() =>
                                authClient.logout({
                                    redirectTo: "/account",
                                })
                            }
                        >
                            Log Out
                        </button>
                    </div>
                </Match>
            </Switch>
        </AppShellContent>
    </>

}
