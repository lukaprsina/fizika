import type { Component, ParentComponent } from "solid-js";
import { A } from "solid-start";
import { For, type VoidComponent } from "solid-js"
import { createStore } from "solid-js/store";
import { createSpring, animated } from 'solid-spring'
import { useDrag } from 'solid-gesture'


export type NavigationType = {
    text: string;
    href: string;
}

export const Navigation: ParentComponent = (props) => {
    const [titles, setTitles] = createStore<NavigationItemType[]>([]);

    return (
        <div>
            <For each={titles}>{(title) =>
                <animated.div tabIndex={-1} class="drag" {...bind()} style={styles()}>
                    {title}
                </animated.div>
            }</For>
        </div>
    )
}

export const NavigationItem: Component<NavigationItemType> = (props) => {
    return (
        <A
            class="block p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md"
            href={props.href ?? props.text}>
            {props.text}
        </A>
    )
}