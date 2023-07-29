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

const List: VoidComponent<ListProps> = (props) => {
    const [selectedCoords, setSelectedCoords] = createSignal({
        x: 0,
        y: 0
    })

    // TODO: use selected ids for controlling zIndex
    const [selectedIds, setSelectedIds] = createStore<number[]>([]);

    return (
        <div class="w-full flex justify-center">
            <div class="w-1/2">
                <For each={props.items}>{(item) => {
                    const [checked, setChecked] = createSignal(false);
                    const [itemState, setItemState] = createSignal<ListItemState>("stationary");
                    const [coords, setCoords] = createSignal({
                        x: 0,
                        y: 0
                    })

                    const bind = useDrag(({ down, movement: [mx, my], last, target }) => {
                        const new_coords = { x: down ? mx : 0, y: down ? my : 0 };

                        if (down) {
                            setItemState("dragged")
                            const correct_drag = target.classList.contains("animated-div");
                            if (!correct_drag) return;
                            if (selectedIds.length == 0) setChecked(true)
                            else return;
                        }
                        else if (last)
                            setItemState("retreating")
                        setSelectedCoords(new_coords)
                    })

                    const zIndex = createMemo(() => {
                        if (itemState() == "dragged")
                            return 5;
                        else if (itemState() == "retreating")
                            return 4;
                        else if (itemState() == "stationary")
                            return 1;
                    })

                    const style = createSpring(() => ({
                        to: {
                            x: coords().x,
                            y: coords().y,
                            zIndex: zIndex()
                        },
                        onRest: () => itemState() != "dragged" ? setItemState("stationary") : null,
                        immediate: (key) => key === "zIndex",
                    }))

                    createEffect(() => {
                        if (!checked()) return;
                        setCoords(() => selectedCoords())
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
                                        setChecked(checked);
                                    }}
                                />
                            </Show>
                            {item.component}
                        </AnimatedDiv>
                    )
                }}</For>
            </div>
        </div>
    )
}

const AnimatedDiv = animated("div")

export default App;
