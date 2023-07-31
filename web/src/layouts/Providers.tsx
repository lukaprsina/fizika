// @refresh reload
import { createContextProvider } from "@solid-primitives/context";
import { usePrefersDark } from "@solid-primitives/media";
import type { ParentComponent } from "solid-js";
import { createSignal } from "solid-js";
// import { createUserTheme } from "@solid-primitives/start"

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

export const [theme, setTheme] = createSignal<string | undefined>()/* createUserTheme("user-theme", {
    defaultValue: "light",
}); */

const Providers: ParentComponent = (props) => {
    const prefersDark = usePrefersDark();
    setTheme(prefersDark() ? "dark" : "light");

    return (
        <EditToggleProvider initial={false}>
            <div class="flex min-h-screen flex-col bg-white dark:text-white dark:bg-neutral-900">
                {props.children}
            </div>
        </EditToggleProvider>
    )
}

export default Providers