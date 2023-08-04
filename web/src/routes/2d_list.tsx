import type { UpdateGuard } from "@solid-primitives/bounds";
import { createElementBounds } from "@solid-primitives/bounds";
import { createContextProvider } from "@solid-primitives/context";
import { createEventBus } from "@solid-primitives/event-bus";
import { throttle } from "@solid-primitives/scheduled";
import { Checkbox } from "@suid/material";
import { useDrag } from "solid-gesture";
import type { JSX, ParentComponent, Setter, VoidComponent } from "solid-js";
import { For, Show, createEffect, createMemo, createSignal } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import { createStore } from "solid-js/store";
import { animated, createSpring } from "solid-spring";

const MARGIN_IN_PIXELS = 8;

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
                            <div class="my-16">
                                <List
                                    items={items()}
                                    selectable
                                    name={letter}
                                    itemWidth={150}
                                    itemHeight={120}
                                />
                            </div>
                        )
                    }}</For>
                </ListGroup>
            </div>
        </div>
    )
}

type ListItemProps = {
    id: number | undefined;
    component: JSX.Element;
}

type ListProps = {
    items: ListItemProps[];
    selectable?: boolean;
    name: string;
    itemWidth: number;
    itemHeight: number;
}

type ListItemState = "dragged" | "retreating" | "stationary"

type SelectedItemInfoType = {
    x: number;
    y: number;
    listName: string;
    itemId: number;
    numberOfSelected: number;
    mouseX: number;
    mouseY: number;
    last: boolean;
    itemState: ListItemState;
};

const [info, setInfo] = createStore<SelectedItemInfoType>({
    x: 0,
    y: 0,
    listName: "",
    itemId: 0,
    numberOfSelected: 0,
    mouseX: 0,
    mouseY: 0,
    last: false,
    itemState: "stationary",
})

type MovementEventBusType = {
    name: string;
    bounds_top: number | undefined;
    bounds_bottom: number | undefined;
};

type NotifyEventBusType = {
    name: string;
};

const [ListGroup, useListGroup] = createContextProvider(() => {
    const movement_bus = createEventBus<MovementEventBusType>();
    const notify_bus = createEventBus<NotifyEventBusType>();
    return { movement_bus, notify_bus };
})

const List: VoidComponent<ListProps> = (props) => {
    let element: HTMLDivElement | undefined;
    const bus = useListGroup();
    if (!bus) throw new Error("No event bus")

    const [itemState, setItemState] = createSignal<ListItemState>("stationary");
    const [selectedIds, setSelectedIds] = createStore<boolean[]>([]);
    const [items, setItems] = createSignal<ListItemProps[]>([]);
    const [fakeItems, setFakeItems] = createSignal<ListItemProps[]>([]);

    createEffect(() => {
        const func = () => Array(props.items.length).fill(false);
        setSelectedIds(func)
    })

    createEffect(() => {
        if (info.itemState == "dragged") {
            const copied_items = [...props.items];
            copied_items.splice(2, 0, ...fakeItems())
            setItems(copied_items);
            console.log(props.name, copied_items.length)
        } else
            setItems(props.items)
    })

    createEffect(() => {
        const fn = (payload: MovementEventBusType) => {
            if (info.itemState == "dragged") {
                const clientY = info.mouseY

                if (typeof clientY !== "number" ||
                    typeof payload.bounds_top !== "number" ||
                    typeof payload.bounds_bottom !== "number") return;

                if (clientY > (payload.bounds_top) && clientY < (payload.bounds_bottom)) {
                    bus.notify_bus.emit({
                        name: payload.name
                    })
                }
            }
        };

        bus.movement_bus.listen(fn)
    })

    createEffect(() => {
        const fn = (payload: NotifyEventBusType) => {
            if (itemState() == "stationary" && payload.name == props.name) {
                const bounds = element!.getBoundingClientRect();

                const diffX = info.mouseX - bounds.left;
                const diffY = info.mouseY - bounds.top;

                const posX = Math.floor(diffX / (props.itemWidth + 2 * MARGIN_IN_PIXELS));
                const posY = Math.floor(diffY / (props.itemHeight + 2 * MARGIN_IN_PIXELS));


                const fake_items: ListItemProps[] = Array.from({ length: info.numberOfSelected }, () => ({
                    id: undefined,
                    component: <p>Fake</p>
                }))

                // console.log(props.name, posX, posY, fake_items.length)

                setFakeItems(fake_items)
            }
        };

        bus.notify_bus.listen(fn)
    })

    const throttleUpdate: UpdateGuard = (fn) => throttle(fn, 10)
    const bounds = createElementBounds(() => element, {
        trackMutation: throttleUpdate,
        trackScroll: throttleUpdate,
    })

    createEffect(() => {
        if (itemState() == "stationary")
            bus.movement_bus.emit({
                name: props.name,
                bounds_top: bounds.top ?? undefined,
                bounds_bottom: bounds.bottom ?? undefined,
            })
    })

    const numberOfSelected = createMemo(() => {
        let count = 0;

        for (const id of selectedIds) {
            if (id) count++;
        }

        return count;
    })

    return (
        <div
            class="w-full flex flex-wrap justify-start box-border"
            ref={element}
        >
            <For each={items()}>{(item) => (
                <Show
                    when={typeof item.id != "undefined"}
                    fallback={
                        <div
                            class="bg-red-200 rounded-md m-2 py-2"
                            style={{
                                width: `${props.itemWidth}px`,
                                height: `${props.itemHeight}px`,
                            }}
                        />
                    }
                >
                    <ListItem
                        listName={props.name}
                        id={item.id!}
                        selectable={props.selectable}
                        checked={selectedIds[item.id!]}
                        setChecked={setSelectedIds/* (value) => setSelectedIds([item.id!], value) */}
                        itemsState={itemState()}
                        setItemsState={setItemState}
                        numberOfSelected={numberOfSelected()}
                        width={props.itemWidth}
                        height={props.itemHeight}
                    >
                        {item.component}
                    </ListItem>
                </Show>
            )}</For>
        </div>
    )
}

type ListItemType = {
    listName: string;
    id: number;
    selectable?: boolean;
    checked: boolean;
    itemsState: ListItemState;
    numberOfSelected: number;
    width: number;
    height: number;
    setItemsState: Setter<ListItemState>;
    setChecked: SetStoreFunction<boolean[]>;
}

const ListItem: ParentComponent<ListItemType> = (props) => {
    let element: HTMLDivElement | undefined;
    const [coords, setCoords] = createSignal({
        x: 0,
        y: 0
    })

    const bind = useDrag((state) => {
        let newX = 0;
        let newY = 0;

        if (props.numberOfSelected == 0 || props.checked) {

            if (state.last)
                props.setItemsState("retreating")
            else if (state.down) {
                const correct_element = (state.target as Element).classList.contains("animated-div");
                if (!correct_element) return;
                props.setChecked(props.id, true);
                newX = state.movement[0]
                newY = state.movement[1]
                props.setItemsState("dragged")
            }

            const event = state.event as MouseEvent;

            setInfo(() => ({
                x: newX,
                y: newY,
                listName: props.listName,
                itemId: props.id,
                itemState: props.itemsState,
                last: state.last,
                numberOfSelected: props.numberOfSelected,
                mouseX: event.clientX,
                mouseY: event.clientY,
            }))
        }
    }, {
        filterTaps: true
    })

    const zIndex = createMemo(() => {
        if (!props.checked) return 1;

        if (props.itemsState == "dragged")
            return 3;
        else if (props.itemsState == "retreating")
            return 2;
        else if (props.itemsState == "stationary")
            return 1;
    })

    const isListDragged = createMemo(() => {
        return (
            info.listName == props.listName &&
            props.checked &&
            props.itemsState === "dragged"
        )
    })

    const style = createSpring(() => {
        return {
            to: {
                x: coords().x,
                y: coords().y,
                zIndex: zIndex(),
                width: props.width,
                height: props.height,
                order: isListDragged() ? 1 : 0,
            },
            onRest: () => props.itemsState != "dragged" ? props.setItemsState("stationary") : null,
            immediate: (key: string) => ["zIndex", "order"].indexOf(key) !== -1
        }
    })

    createEffect(() => {
        if (!info) return;

        if (props.checked && info.listName == props.listName) {
            setCoords(() => ({
                x: info.x,
                y: info.y,
            }))
        }
    })

    return (
        <AnimatedDiv
            style={style()}
            {...bind()}
            ref={element}
            tabIndex={-1}
            class="animated-div select-none touch-none rounded-md m-2 py-2 flex items-center bg-slate-300 relative"
        >
            <Show when={props.selectable}>
                <Checkbox
                    value={props.checked}
                    onChange={(_, checked) => props.setChecked(props.id, checked)}
                />
            </Show>
            {props.children}
        </AnimatedDiv>
    )
}


const AnimatedDiv = animated("div")

export default App;