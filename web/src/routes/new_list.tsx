// @refresh reload
import type { ParentComponent } from "solid-js";
import { For, createEffect, type JSX, type VoidComponent, createSignal, Show, createMemo } from "solid-js";
import { useDrag, useGesture } from 'solid-gesture'
import { Checkbox } from "@suid/material";
import { createSpring, animated } from "solid-spring";
import { createStore } from "solid-js/store";

const IMMEDIATE = true;

const App: VoidComponent = () => {
    return (
        <div class="w-screen h-screen flex justify-center">
            <div class="w-1/2  h-full">
                <ListGroup>
                    <For each={"abc".split("")}>{(letter) => {
                        const [items, setItems] = createSignal<ListItemProps[]>([])

                        createEffect(() => {
                            const my_items: ListItemProps[] = [...Array(5).keys()].map((num) => ({
                                id: num,
                                component: (
                                    <span>{letter}{num}</span>
                                )
                            }))

                            setItems(() => my_items)
                        })

                        return (
                            <div class="my-5">
                                <List
                                    items={items()}
                                    selectable
                                    name={letter}
                                />
                            </div>
                        )
                    }}</For>
                </ListGroup>
            </div>
        </div>
    )
}

const ListGroup: ParentComponent = (props) => {
    return <>
        {props.children}
    </>
}

type ListItemProps = {
    id: number;
    component: JSX.Element;
}

type ListProps = {
    items: ListItemProps[];
    selectable?: boolean;
    name: string;
}

type ListItemState = "dragged" | "retreating" | "stationary"

const ITEM_HEIGHT = 52;

const List: VoidComponent<ListProps> = (props) => {
    const [itemsState, setItemsState] = createSignal<ListItemState>("stationary");
    const [mouseNumber, setMouseNumber] = createSignal<number | undefined>();
    const [selectedCoords, setSelectedCoords] = createSignal<{ x: number, y: number, item_id: number | undefined }>({
        x: 0,
        y: 0,
        item_id: undefined
    })

    const [selectedIds, setSelectedIds] = createStore<boolean[]>([]);

    createEffect(() => {
        const func = () => Array(props.items.length).fill(false);
        setSelectedIds(func)
    })

    createEffect(() => {
        console.log(mouseNumber())
    })

    let element: HTMLDivElement | undefined;
    const bind = useGesture({
        onMove: (state) => {
            if (!element) return;
            const bounds = element.getBoundingClientRect()
            // const left = state.xy[0] - bounds.x;
            const top = state.xy[1] - bounds.y;
            setMouseNumber(Math.floor(top / ITEM_HEIGHT))

            // console.log(props.name, )
        },
        onHover: (state) => {
            // console.log(state.type)
            if (state.type == "pointerleave")
                setMouseNumber(undefined)

        }
    })

    return (
        <div class="w-full" {...bind()} ref={element}>
            <For each={props.items}>{(item) => {
                const [coords, setCoords] = createSignal({
                    x: 0,
                    y: 0
                })

                const checked = createMemo(() => selectedIds[item.id])

                const bind = useDrag(({ down, movement: [mx, my], last, target }) => {
                    const new_coords = { x: down ? mx : 0, y: down ? my : 0, item_id: item.id };

                    if (down) {
                        const correct_element = (target as Element).classList.contains("animated-div");
                        if (!correct_element) return;
                        const first_check = selectedIds.find((value) => value == true);
                        if (first_check == undefined) setSelectedIds([item.id], true)
                        if (!checked()) return;

                        setItemsState("dragged")
                    }
                    else if (last)
                        setItemsState("retreating")

                    setSelectedCoords(() => new_coords)
                })

                const zIndex = createMemo(() => {
                    if (!checked()) return 1;

                    if (itemsState() == "dragged")
                        return 3;
                    else if (itemsState() == "retreating")
                        return 2;
                    else if (itemsState() == "stationary")
                        return 1;
                })

                const style = createSpring(() => {
                    return {
                        to: {
                            x: coords().x,
                            y: coords().y,
                            zIndex: zIndex()
                        },
                        onRest: () => itemsState() != "dragged" ? setItemsState("stationary") : null,
                        immediate: IMMEDIATE ? true : (key: string) => key === "zIndex",
                    }
                })

                createEffect(() => {
                    const dragged_id = selectedCoords().item_id;
                    if (typeof dragged_id !== "number") return

                    let new_y = 0
                    let new_x = 0
                    if (checked()) {
                        new_y = selectedCoords().y
                        new_x = selectedCoords().x
                        let row_count = 0;
                        if (item.id < dragged_id) {
                            for (let i = dragged_id; i > item.id; i--) {
                                if (!selectedIds[i])
                                    row_count++;
                            }
                        } else {
                            for (let i = dragged_id; i < item.id; i++) {
                                if (!selectedIds[i])
                                    row_count--;
                            }
                        }

                        if (itemsState() == "dragged" && selectedCoords().item_id !== item.id) {
                            const height_diff = row_count * ITEM_HEIGHT
                            new_y += height_diff
                        }
                    } else if (itemsState() == "dragged") {
                        let row_count = 0;
                        for (let i = item.id; i >= 0; i--) {
                            if (selectedIds[i])
                                row_count--;
                        }

                        const height_diff = (row_count + (mouseNumber() ?? 0)) * ITEM_HEIGHT
                        new_y += height_diff
                    }

                    setCoords({
                        x: new_x,
                        y: new_y
                    })
                })

                return (
                    <AnimatedDiv
                        style={style()}
                        {...bind()}
                        class="animated-div select-none touch-none w-full bg-slate-300 rounded-md my-2 py-2 h-11 flex items-center relative"
                        tabIndex={-1} >
                        <Show when={props.selectable}>
                            <Checkbox
                                checked={checked()}
                                onChange={(_, checked) => {
                                    setSelectedIds([item.id], checked);
                                }}
                            />
                        </Show>
                        {item.component}
                    </AnimatedDiv>
                )
            }}</For>
        </div>
    )
}

const AnimatedDiv = animated("div")

export default App;
