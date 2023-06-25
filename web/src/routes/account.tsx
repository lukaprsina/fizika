import { createSession, signIn, signOut } from "@solid-auth/base/client";
import { Show } from "solid-js";
import Header from "~/components/Header";
import Providers, { AppShellHeader, AppShellContent } from "~/layouts/Providers";

export default function Account() {
    const session = createSession();

    return (
        <Providers>
            <AppShellHeader>
                <Header />
            </AppShellHeader>
            <AppShellContent>
                <Show
                    when={session()}
                    fallback={<div>
                        <p>
                            <button
                                onClick={() => {
                                    signIn(undefined, { redirectTo: "/" })
                                }}
                            >
                                Login
                            </button>
                        </p>
                        <p>
                            <button
                                onClick={() => {
                                    signIn("google", { redirectTo: "/" })
                                }}
                            >
                                Login with Google
                            </button>
                        </p>
                        <p>
                            <button
                                onClick={() => {
                                    signIn("azure-ad-b2c", { redirectTo: "/" })
                                }}
                            >
                                Login with Microsoft
                            </button>
                        </p>
                        <p>
                            <button
                                onClick={() => {
                                    signIn("github", { redirectTo: "/" })
                                }}
                            >
                                Login with Github
                            </button>
                        </p>
                    </div>}
                >
                    <div class="flex flex-col items-start">
                        <span>Hi {session()?.user?.name}!</span>
                        <button
                            onClick={() =>
                                signOut({ redirectTo: "/" })
                            }
                        >
                            Log Out
                        </button>
                    </div>
                </Show>
            </AppShellContent>
        </Providers>
    )
}
