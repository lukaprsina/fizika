// @refresh reload
import { For, createEffect, type JSX, type VoidComponent, createSignal, Show, createMemo } from "solid-js";
import { useDrag } from 'solid-gesture'
import { Checkbox } from "@suid/material";
import { createSpring, animated } from "solid-spring";
import { createStore } from "solid-js/store";

const App: VoidComponent = () => {
    const [items, setItems] = createSignal<ListItemProps[]>([])

    createEffect(() => {
        const my_items: ListItemProps[] = [...Array(5).keys()].map((num) => ({
            id: num,
            component: (
                <span>item {num}</span>
            )
        }))

        setItems(() => my_items)
    })

    return (
        <List
            items={items()}
            selectable
        />
    )
}

type ListItemProps = {
    id: number;
    component: JSX.Element;
}

type ListProps = {
    items: ListItemProps[];
    selectable?: boolean;
}

type ListItemState = "dragged" | "retreating" | "stationary"

const ITEM_HEIGHT = 52;

const List: VoidComponent<ListProps> = (props) => {
    const [itemsState, setItemsState] = createSignal<ListItemState>("stationary");
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

    return (
        <div class="w-full flex justify-center">
            <div class="w-1/2">
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
                            immediate: true//(key: string) => key === "zIndex",
                        }
                    })

                    createEffect(() => {
                        const dragged_id = selectedCoords().item_id;
                        if (typeof dragged_id !== "number" || !checked()) return

                        let new_y = selectedCoords().y
                        if (itemsState() == "dragged" && selectedCoords().item_id !== item.id) {
                            const height_diff = (dragged_id - item.id - 1) * ITEM_HEIGHT
                            new_y += height_diff
                            console.log(dragged_id, item.id, height_diff)
                        }

                        setCoords({
                            x: selectedCoords().x,
                            y: new_y
                        })
                    })

                    return (
                        <AnimatedDiv
                            style={style()}
                            {...bind()}
                            class="animated-div select-none touch-none w-full bg-slate-300 rounded-md m-2 p-2 h-11 flex items-center relative"
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
                <button
                    onClick={() => {
                        console.info("Logging ids", [...selectedIds])
                    }}
                >Log state</button>
            </div>
        </div>
    )
}

const AnimatedDiv = animated("div")

export default App;
