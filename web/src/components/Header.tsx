import type { User } from "@prisma/client";
import type { Component } from "solid-js";
import { Show } from "solid-js";
import { A } from "solid-start";
import { useEditToggle, useThemeToggle } from "~/layouts/Providers";

type HeaderType = {
    topic?: string;
    user?: User | null;
}

const Header: Component<HeaderType> = (props) => {
    const editToggle = useEditToggle();
    const darkToggle = useThemeToggle();

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
            <div class="flex">
                <div class="mx-3">
                    <label><input
                        type="checkbox"
                        class="mr-2"
                        checked={darkToggle?.dark()}
                        onChange={() => darkToggle?.setDark(!darkToggle.dark())}
                    />
                        Dark</label>
                </div>
                <div class="mx-3">
                    <Show when={props.user}>
                        <label class="mr-2"><input
                            type="checkbox"
                            class="mr-2"
                            checked={editToggle?.edit()}
                            onChange={() => editToggle?.change(!editToggle.edit())}
                        />
                            Edit</label>
                        <span>{props.user?.displayName}</span>
                    </Show>
                </div>
            </div>
        </div>
    )
}

export default Header;