import { TextField } from "@suid/material";
import type { Component } from "solid-js";
import { Show, createEffect } from "solid-js";
import { A } from "solid-start";
import { useEditToggle, useThemeToggle } from "~/layouts/Providers";

type HeaderType = {
    topic?: string;
    username?: string;
    pageName?: string;
    saveChanges?: { when: boolean; callback: () => void; };
}

const Header: Component<HeaderType> = (props) => {
    const editToggle = useEditToggle();
    const darkToggle = useThemeToggle();

    createEffect(() => console.warn(props.pageName))

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
            <Show when={props.pageName}>
                <TextField
                    label="Ime strani"
                    size="small"
                    defaultValue={props.pageName}
                />
            </Show>
            <div class="flex">
                <div class="mx-3">
                    <label><input
                        type="checkbox"
                        class="mr-2"
                        checked={darkToggle?.dark()}
                        onChange={() => darkToggle?.setDark(!darkToggle.dark())}
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