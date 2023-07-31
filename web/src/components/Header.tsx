import { TextField } from "@suid/material";
import type { Component, Setter } from "solid-js";
import { Show } from "solid-js";
import { A } from "solid-start";
import { useEditToggle, setTheme, theme } from "~/layouts/Providers";

type HeaderType = {
    topic?: string;
    username?: string;
    pageName?: string;
    setPageName?: Setter<string>;
    saveChanges?: { when: boolean; callback: () => void; };
}

const Header: Component<HeaderType> = (props) => {
    const editToggle = useEditToggle();

    return (
        <div
            class="flex justify-between items-center h-16 w-full px-4"
        >
            <A href="/" class="m-2">
                <div class="flex items-center h-16">
                    <img
                        src="/images/scnm-logo.jpg"
                        alt="Logo šolskega centra Novo mesto"
                        class="h-3/4 mr-4"
                    />
                    <span>Fizika</span>
                </div>
            </A>
            <Show when={props.topic}>
                <A href={encodeURI("/" + props.topic)}>{props.topic}</A>
            </Show>
            <Show when={typeof props.pageName == "string" && props.setPageName}>
                <TextField
                    label="Ime strani"
                    size="small"
                    value={props.pageName}
                    onChange={(event) => {
                        props.setPageName!(event.target.value)
                    }}
                />
            </Show>
            <div class="flex">
                <div class="mx-3">
                    <label><input
                        type="checkbox"
                        class="mr-2"
                        checked={theme() == "dark"}
                        onChange={() => {
                            if (theme() == "dark")
                                setTheme("dark")
                            else
                                setTheme("light")
                        }}
                    />
                        Temna tema</label>
                </div>
                <div class="mx-3">
                    <Show when={props.username && props.saveChanges?.when}>
                        <button
                            onClick={() => props.saveChanges?.callback()}
                        >
                            Shrani spremembe
                        </button>
                    </Show>
                </div>
                <div class="mx-3">
                    <Show when={props.username}>
                        <label class="mr-2"><input
                            type="checkbox"
                            class="mr-2"
                            checked={editToggle?.edit()}
                            onChange={() => editToggle?.change(!editToggle.edit())}
                        />
                            Uredi</label>
                        <A href="/account">{props.username}</A>
                    </Show>
                </div>
            </div>
        </div>
    )
}

export default Header;