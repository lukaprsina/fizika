// @refresh reload
import { For, createEffect, type JSX, type VoidComponent, createSignal, Show, createMemo } from "solid-js";
import { useDrag, useGesture } from 'solid-gesture'
import { Checkbox } from "@suid/material";
import { createSpring, animated } from "solid-spring";
import { createStore } from "solid-js/store";
import { createContextProvider } from "@solid-primitives/context";
import { createEventBus } from "@solid-primitives/event-bus"
import type { UpdateGuard } from "@solid-primitives/bounds";
import { createElementBounds } from "@solid-primitives/bounds"
import { throttle } from "@solid-primitives/scheduled";

const IMMEDIATE = true;

const App: VoidComponent = () => {
    return (
        <div class="w-screen h-screen flex justify-center">
            <div class="w-1/2  h-full">
                <ListGroup>
                    <For each={"ab".split("")}>{(letter) => {
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
                            <div class="my-16">
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

// TODO: fix mobile

type InputEventBusType = {
    name: string;
    bounds_top: number | undefined;
    bounds_bottom: number | undefined;
};

type OutputEventBusType = {
    name: string;
};

const [ListGroup, useListGroup] = createContextProvider(() => {
    const input_bus = createEventBus<InputEventBusType>();
    const output_bus = createEventBus<OutputEventBusType>();
    return { input_bus, output_bus }
})

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

type SelectedCoordsType = {
    x: number;
    y: number;
    name: string;
    item_id: number;
    numberOfSelected: number;
    mouseX: number;
    mouseY: number;
    last: boolean
};

const [selectedInfo, setSelectedInfo] = createSignal<SelectedCoordsType>()

const List: VoidComponent<ListProps> = (props) => {
    const [itemsState, setItemsState] = createSignal<ListItemState>("stationary");
    const [offsetNumber, setOffsetNumber] = createSignal<number | undefined>();
    const [mouseNumber, setMouseNumber] = createSignal<number | undefined>();

    const [selectedIds, setSelectedIds] = createStore<boolean[]>([]);
    const numberOfSelected = createMemo(() => {
        let count = 0;

        for (const id of selectedIds) {
            if (id) count++;
        }

        return count;
    })

    const event_bus = useListGroup()
    if (!event_bus) throw new Error("No event bus");

    createEffect(() => {
        const fn = (payload: InputEventBusType) => {
            if (selectedInfo() && itemsState() == "dragged") {
                const clientY = selectedInfo()!.mouseY

                if (typeof clientY !== "number" ||
                    typeof payload.bounds_top !== "number" ||
                    typeof payload.bounds_bottom !== "number") return;

                if (clientY > (payload.bounds_top) && clientY < (payload.bounds_bottom)) {
                    event_bus.output_bus.emit({
                        name: payload.name
                    })
                }
            }
        };

        event_bus.input_bus.listen(fn)
    })

    createEffect(() => {
        const fn = (payload: OutputEventBusType) => {
            if (itemsState() == "stationary" && payload.name == props.name) {
                const bounds = element!.getBoundingClientRect()
                const diff = selectedInfo()!.mouseY - bounds.top;
                const pos = Math.floor(diff / ITEM_HEIGHT);
                setOffsetNumber(pos)
            }
        };

        event_bus.output_bus.listen(fn)
    })

    createEffect(() => {
        const func = () => Array(props.items.length).fill(false);
        setSelectedIds(func)
    })

    let element: HTMLDivElement | undefined;
    const throttleUpdate: UpdateGuard = (fn) => throttle(fn, 10)
    const bounds = createElementBounds(() => element, {
        trackMutation: throttleUpdate,
        trackScroll: throttleUpdate,
    })

    createEffect(() => {
        if (itemsState() == "stationary")
            event_bus.input_bus.emit({
                name: props.name,
                bounds_top: bounds.top ?? undefined,
                bounds_bottom: bounds.bottom ?? undefined,
            })
    })

    createEffect(() => {
        if (selectedInfo()) {
            if (selectedInfo()!.last || selectedInfo()!.mouseY < bounds.top!
                || selectedInfo()!.mouseY > bounds.bottom!) {
                setOffsetNumber()
            }
        }
    })

    const bind = useGesture({
        onMove: (state) => {
            if (!element) return;
            const bounds = element.getBoundingClientRect()
            const top = state.xy[1] - bounds.y;
            setMouseNumber(Math.floor(top / ITEM_HEIGHT))
        },
    })

    return (
        <div
            class="w-full"
            {...bind()}
            ref={element}
        >
            <For each={props.items}>{(item) => {
                const [coords, setCoords] = createSignal({
                    x: 0,
                    y: 0
                })

                const checked = createMemo(() => selectedIds[item.id])

                const bind = useDrag(({ down, movement: [mx, my], last, target, event }) => {
                    const new_coords = {
                        x: down ? mx : 0,
                        y: down ? my : 0,
                        name: props.name,
                        item_id: item.id,
                        numberOfSelected: numberOfSelected(),
                        mouseX: (event as MouseEvent).clientX,
                        mouseY: (event as MouseEvent).clientY,
                        last
                    };

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

                    setSelectedInfo(() => new_coords)
                }, {
                    filterTaps: true,
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
                    if (typeof selectedInfo() == "undefined") return
                    const dragged_id = selectedInfo()!.item_id;
                    if (typeof dragged_id !== "number") return

                    let new_y = 0;
                    let new_x = 0;

                    if (checked() && selectedInfo()!.name == props.name) {
                        new_y = selectedInfo()!.y
                        new_x = selectedInfo()!.x
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

                        if (itemsState() == "dragged" && selectedInfo()!.item_id !== item.id) {
                            const height_diff = row_count * ITEM_HEIGHT
                            new_y += height_diff
                        }
                    } else if (itemsState() == "dragged" && typeof mouseNumber() !== "undefined") {
                        let row_count = 0;

                        for (let i = item.id; i >= 0; i--) {
                            if (selectedIds[i])
                                row_count--;
                        }

                        if (item.id > mouseNumber()!) {
                            row_count += numberOfSelected();
                        }

                        const height_diff = row_count * ITEM_HEIGHT
                        new_y += height_diff
                    } else if (itemsState() == "stationary") {
                        if (typeof offsetNumber() == "number" && item.id >= offsetNumber()!) {
                            const height_diff = (selectedInfo()!.numberOfSelected) * ITEM_HEIGHT
                            new_y += height_diff
                        }
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
