// @refresh reload
import { createContextProvider } from "@solid-primitives/context";
import { usePrefersDark } from "@solid-primitives/media";
import { makePersisted } from "@solid-primitives/storage";
import type { ParentComponent, Setter } from "solid-js";
import { createEffect, createSignal } from "solid-js";

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
    setTheme: Setter<string>
}

export const [ThemeToggleProvider, useThemeToggle] = createContextProvider(
    (props: ThemeType) => {
        // eslint-disable-next-line solid/reactivity
        const [dark, setDark] = createSignal(props.dark);

        createEffect(() => {
            if (dark()) {
                document.documentElement.classList.add('dark')
                props.setTheme("dark")
            }
            else {
                document.documentElement.classList.remove('dark')
                props.setTheme("light")
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
    const prefersDark = usePrefersDark();
    // eslint-disable-next-line solid/reactivity
    const [theme, setTheme] = makePersisted(createSignal(
        prefersDark() ? "dark" : "light"
    ), { name: "theme" });

    /*     if (!cookies.theme) {
            const prefersDark = usePrefersDark();
            setCookies("theme", prefersDark() ? "dark" : "light");
        } */

    return (
        <ThemeToggleProvider dark={theme() == "dark"} setTheme={setTheme}>
            <EditToggleProvider initial={false}>
                <div class="flex min-h-screen flex-col bg-white dark:text-white dark:bg-neutral-900">
                    {props.children}
                </div>
            </EditToggleProvider>
        </ThemeToggleProvider>
    )
}

export default Providers