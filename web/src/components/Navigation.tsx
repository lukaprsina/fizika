import type { Accessor, Component, Owner, ParentComponent, Setter } from "solid-js";
import { A } from "solid-start";
import { createEffect, createSignal, For, getOwner, useContext, type VoidComponent } from "solid-js"
import { createStore } from "solid-js/store";
import { createSpring, animated } from 'solid-spring'
import { useDrag } from 'solid-gesture'
import { createContext } from "solid-js";

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

const NavigationContext = createContext<{
    add_navigation_title: (nav: NavType) => void,
    update_navigation_title: (nav: NavType) => void,
    delete_title: (owner: Owner) => void
}>();

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
                },
                update_navigation_title: (nav: NavType) => {
                    // a
                },
                delete_title: (owner: Owner) => {
                    console.log("Owner", owner)
                    setTitles((prev) => {
                        console.log(prev)
                        return [...prev]
                    })
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
        <AnimatedDiv
            class="flex justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md"
            tabIndex={-1}
        >
            <A
                class="grow"
                href={props.href ?? props.text}
            >
                {props.text}
            </A>
            <button
                onClick={() => {
                    navigation.delete_title(owner);
                }}>
                Delete
            </button>
        </AnimatedDiv>
    )
}

const AnimatedDiv = animated("div")

/* 
<div>
            <For each={titles}>{(title) =>
                <animated.div tabIndex={-1} class="drag" {...bind()} style={styles()}>
                    {title}
                </animated.div>
            }</For>
        </div> */