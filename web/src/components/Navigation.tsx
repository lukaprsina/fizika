import type { Accessor, Component, Owner, ParentComponent, Setter } from "solid-js";
import { A } from "solid-start";
import { createEffect, createSignal, For, getOwner, useContext, type VoidComponent } from "solid-js"
import { createStore } from "solid-js/store";
import { createSpring, animated } from 'solid-spring'
import { useDrag } from 'solid-gesture'
import { createContext } from "solid-js";

const AnimatedLink = animated(A)

export type NavType = {
    text: string;
    href?: string;
    owner: Owner;
    coords: Accessor<NavAnimation>
    setCoords: Setter<NavAnimation>
}

type NavAnimation = {
    y: number;
    scale: number;
}

const NavigationContext = createContext<{ add_navigation_title: (title: NavType) => void; }>();
export function useNavigation() { return useContext(NavigationContext); }

export const Navigation: ParentComponent = (props) => {
    const [titles, setTitles] = createStore<NavType[]>([]);

    return <div>
        <NavigationContext.Provider value={
            {
                add_navigation_title: (nav: NavType) => {
                    for (const title of titles) {
                        // TODO: learn updating stores
                        if (title.owner == nav.owner) return;
                    }

                    setTitles([...titles, nav])
                }
            }
        }>
            {props.children}
        </NavigationContext.Provider>
    </div>
}

export type NavigationItemType = {
    text: string;
    href?: string;
}

export const NavigationItem: Component<NavigationItemType> = (props) => {
    const navigation = useNavigation();
    const owner = getOwner();
    let added_nav = false;
    const [coords, setCoords] = createSignal({
        y: 0,
        scale: 1
    })

    const styles = createSpring(() => ({
        y: coords().y,
        scale: coords().scale
    }))

    const bind = useDrag(({ active, movement: [my] }) => {
        setCoords({
            y: active ? my : 0,
            scale: active ? 1.2 : 1
        })
    })

    if (!navigation || !owner) throw new Error("No navigation or navigation")

    createEffect(() => {
        if (!added_nav) {
            navigation.add_navigation_title({
                owner,
                text: props.text,
                href: props.href,
                coords,
                setCoords
            })
        }

        added_nav = true;
    })

    return (
        <animated.div
            class="block p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md"
            tabIndex={-1}
            {...bind()}
            style={styles()}
        // href={props.href ?? props.text}
        >
            {props.text}
        </animated.div>
    )
}

/* 
<div>
            <For each={titles}>{(title) =>
                <animated.div tabIndex={-1} class="drag" {...bind()} style={styles()}>
                    {title}
                </animated.div>
            }</For>
        </div> */