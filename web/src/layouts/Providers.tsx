// @refresh reload
import { createContextProvider } from "@solid-primitives/context";
import { usePrefersDark } from "@solid-primitives/media";
import type { CookieOptions, StorageSetter } from "@solid-primitives/storage";
import { cookieStorage, createStorage } from "@solid-primitives/storage";
import type { ParentComponent } from "solid-js";
import { createEffect, createSignal } from "solid-js";
import { EditorInitializedProvider } from "~/components/TinyMCE";

export const AppShellHeader: ParentComponent = (props) => {
    return (
        <header
            class="w-full"
        >
            {props.children}
        </header>
    )
}

type ContentType = {
    fullWidth?: boolean;
}

export const AppShellContent: ParentComponent<ContentType> = (props) => {
    return (
        <div class="z-30 bg-inherit flex justify-center flex-grow h-full w-full px-6 relative">
            {props.children}
        </div>
    )
}

export const AppShellFooter: ParentComponent = (props) => {
    {/* <footer
            class="w-full"
        >
            {props.children}
        </footer> */}
    return (
        <>
            {props.children}
        </>
    )
}

export const [EditToggleProvider, useEditToggle] = createContextProvider(
    (props: { initial: boolean }) => {
        // eslint-disable-next-line solid/reactivity
        const [edit, setEdit] = createSignal(props.initial);

        return {
            edit,
            change: setEdit
        };
    }
);

type ThemeType = {
    dark: boolean;
    setCookies: StorageSetter<string, CookieOptions>
}

export const [ThemeToggleProvider, useThemeToggle] = createContextProvider(
    (props: ThemeType) => {
        // eslint-disable-next-line solid/reactivity
        const [dark, setDark] = createSignal(props.dark);

        createEffect(() => {
            if (dark()) {
                document.documentElement.classList.add('dark')
                props.setCookies("theme", "dark")
            }
            else {
                document.documentElement.classList.remove('dark')
                props.setCookies("theme", "light")
            }
        });

        // eslint-disable-next-line solid/reactivity
        setDark(props.dark)

        return {
            dark,
            setDark
        };
    }
);

const Providers: ParentComponent = (props) => {
    const [cookies, setCookies] = createStorage({
        api: cookieStorage,
        prefix: "fizika-scnm",
        options: {
            sameSite: "Lax",
        }
    })

    if (!cookies.theme) {
        const prefersDark = usePrefersDark();
        setCookies("theme", prefersDark() ? "dark" : "light");
    }

    return (
        <EditorInitializedProvider>
            <ThemeToggleProvider dark={cookies.theme == "dark"} setCookies={setCookies}>
                <EditToggleProvider initial={false}>
                    <div class="flex min-h-screen flex-col dark:text-white dark:bg-neutral-900">
                        {props.children}
                    </div>
                </EditToggleProvider>
            </ThemeToggleProvider>
        </EditorInitializedProvider>
    )
}

export default Providers