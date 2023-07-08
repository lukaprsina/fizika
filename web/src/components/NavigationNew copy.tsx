import { DragGesture, ScrollGesture, WheelGesture } from "@use-gesture/vanilla";
import type { Accessor } from "solid-js";
import { For, createSignal, type VoidComponent, createEffect } from "solid-js";
import { createStore } from "solid-js/store";
import { animated, config, createSprings } from "solid-spring";
import { A } from "solid-start";

const TITLE_HEIGHT = 52;

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function swap<T>(array: T[], moveIndex: number, toIndex: number) {
    const item = array[moveIndex];
    const length = array.length;
    const diff = moveIndex - toIndex;

    if (diff > 0) {
        // move left
        return [
            ...array.slice(0, toIndex),
            item,
            ...array.slice(toIndex, moveIndex),
            ...array.slice(moveIndex + 1, length)
        ];
    } else if (diff < 0) {
        // move right
        const targetIndex = toIndex + 1;
        return [
            ...array.slice(0, moveIndex),
            ...array.slice(moveIndex + 1, targetIndex),
            item,
            ...array.slice(targetIndex, length)
        ];
    }
    return array;
}

function getSpringsProps(
    order: number[],
    scroll: number,
    active = false,
    originalIndex = 0,
    curIndex = 0,
    y = 0
) {
    const func = (index: number) => {
        let props;

        // console.log(y)
        if (active && index === originalIndex) {
            props = {
                y: curIndex * TITLE_HEIGHT + y + scroll,
                scale: 1.1,
                zIndex: 1,
                shadow: 15,
                immediate: (key: string) => key === "zIndex",
                config: (key: string) => (key === "y" ? config.stiff : config.default)
            }
        }
        else {
            props = {
                y: order.indexOf(index) * TITLE_HEIGHT + scroll,
                scale: 1,
                zIndex: 0,
                shadow: 1,
                immediate: false
            }
        }

        return props;
    }

    return func;
}

export type TitleType = {
    text: string;
    href?: string;
    ref?: HTMLDivElement
};

export type NavigationType = {
    titles: TitleType[];
}

type SpringType = {
    y: any;
    scale: any;
    zIndex: any;
    shadow: any;
}

export const Navigation: VoidComponent<NavigationType> = (props) => {
    const [order, setOrder] = createSignal<number[]>([]);
    const [titles, setTitles] = createStore<TitleType[]>([]);
    const [springs, setSprings] = createSignal<{ springs: Accessor<SpringType[]> }>();
    let scroll_distance = 0;
    let old_scroll_distance = 0;
    let old_active = false;

    createEffect(() => {
        const initial_order = props.titles.map((_, index) => index);
        const styles = createSprings(props.titles.length, getSpringsProps(initial_order, scroll_distance - old_scroll_distance));
        setTitles(props.titles)
        setSprings({ springs: styles })
    })

    createEffect(() => {
        const indices = titles.map((_, index) => index);
        const spr = springs()
        if (!spr) return;

        titles.forEach((title, originalIndex) => {
            if (!title.ref) return;

            new ScrollGesture(window, ({ xy }) => {
                scroll_distance = xy[1]
            })

            new DragGesture(title.ref, ({ active, movement: [, y] }) => {
                if (active && !old_active) {
                    old_scroll_distance = scroll_distance;
                    old_active = active;
                    console.error("setting old active", { old_scroll_distance, scroll_distance })
                }
                console.log(scroll_distance - old_scroll_distance)

                const curIndex = indices.indexOf(originalIndex);
                const curRow = clamp(
                    Math.round((curIndex * TITLE_HEIGHT + y + scroll_distance - old_scroll_distance) / TITLE_HEIGHT),
                    0,
                    titles.length - 1
                );
                const newOrder = swap(order(), curIndex, curRow);
                spr.springs.ref.start(getSpringsProps(newOrder, scroll_distance - old_scroll_distance, active, originalIndex, curIndex, y)); // Feed springs new style data, they'll animate the view without causing a single render
                if (!active) setOrder(newOrder);
            })
        });

        setOrder(indices);
    })

    return (
        <div class="w-full flex justify-center" style={{
            "height": (titles.length * TITLE_HEIGHT).toString() + "px",
        }}>
            <For each={springs()?.springs()}>{({ zIndex, shadow, y, scale }, i) => (
                <AnimatedDiv
                    class="w-96 absolute flex justify-between origin-[50% 50% 0px] touch-none p-3 bg-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md"
                    style={{
                        "z-index": zIndex.to((z: number) => z.toString()),
                        "box-shadow": shadow.to(
                            (s: number) => `rgba(0, 0, 0, 0.15) 0px ${s}px ${2 * s}px 0px`
                        ),
                        y,
                        scale
                    }}
                    tabIndex={-1}
                    ref={(ref: HTMLDivElement) => setTitles([i()], "ref", ref)}
                >
                    <A
                        class="grow"
                        href={titles[i()].href ?? titles[i()].text}
                    >
                        {titles[i()].text}
                    </A>
                    <div>
                        <span class="select-none touch-none">Grip</span>
                        {' '}
                        <button
                            onClick={() => {
                                console.log("delete")
                            }}>
                            Delete
                        </button>
                    </div>
                </AnimatedDiv>
            )}</For>
        </div>
    )
}

const AnimatedDiv = animated("div")