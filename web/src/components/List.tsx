import { DragGesture } from "@use-gesture/vanilla";
import type { Accessor, JSX, Setter } from "solid-js";
import { For, createSignal, type VoidComponent, createEffect, batch, Show, Match, Switch } from "solid-js";
import { createStore } from "solid-js/store";
import { animated, config, createSprings } from "solid-spring";
import { A } from "solid-start";
import { Menu, MenuItem, TextField } from "@suid/material"
import { HiOutlineEllipsisVertical, HiOutlineBars3, HiOutlineCheck } from "solid-icons/hi"
import { useEditToggle } from "~/layouts/Providers";

const TITLE_HEIGHT = 52;

export type ItemType = {
    id: string;
    content: string | JSX.Element;
    href?: string;
    ref?: HTMLDivElement
};

export type ListType = {
    titles: ItemType[];
    delete?: (title: string) => Promise<void>;
    rename?: (old_title: string, new_title: string) => Promise<void>;
}

export const List: VoidComponent<ListType> = (props) => {
    const [order, setOrder] = createSignal<number[]>([]);
    const [titles, setTitles] = createStore<ItemType[]>([]);
    const edit = useEditToggle();
    const [springs, setSprings] = createSignal<{
        springs: Accessor<SpringType[]> & {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref: any;
        }
    }>();

    createEffect(() => {
        const initial_order = props.titles.map((_, index) => index);
        const styles = createSprings(props.titles.length, getSpringsProps(initial_order));
        batch(() => {
            setTitles(props.titles)
            setSprings({ springs: styles })
        })
    })

    createEffect(() => {
        const indices = titles.map((_, index) => index);
        const spr = springs()
        if (!spr) return;

        titles.forEach((title, originalIndex) => {
            if (!title.ref || !edit?.edit()) return;

            const targets = title.ref.getElementsByClassName("grab-bars")
            if (targets.length != 1) return;

            // eslint-disable-next-line solid/reactivity
            new DragGesture(targets[0], ({ active, movement: [, y], }) => {
                const is_svg = true;

                const curIndex = order().indexOf(originalIndex);

                const curRow = clamp(
                    Math.round((curIndex * TITLE_HEIGHT + y) / TITLE_HEIGHT),
                    0,
                    titles.length - 1
                );

                const newOrder = swap(order(), curIndex, curRow);
                spr.springs.ref.start(getSpringsProps(newOrder, active && is_svg, originalIndex, curIndex, y)); // Feed springs new style data, they'll animate the view without causing a single render
                if (!active) setOrder(newOrder);
            })
        });

        setOrder(indices);
    })

    return (
        <div class="w-full flex justify-center" style={{
            "height": (titles.length * TITLE_HEIGHT).toString() + "px",
        }}>
            <For each={springs()?.springs()}>{({ zIndex, shadow, y, scale }, i) => {
                const [anchorElement, setAnchorElement] = createSignal<HTMLElement>();
                const [openRename, setOpenRename] = createSignal(false);
                const [newName, setNewName] = createSignal("");
                const [href, setHref] = createSignal<string | undefined>();

                createEffect(() => {
                    setHref(() => titles[i()].href);
                })

                const handleClose = () => {
                    setAnchorElement();
                };

                return (
                    <AnimatedDiv
                        class="w-4/5 max-w-md absolute flex justify-between origin-[50% 50% 0px] p-3 bg-slate-100 hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-800 rounded-md"
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
                        <Switch>
                            <Match when={href()}>
                                <A
                                    class="grow"
                                    href={href()!}
                                    onClick={(event: MouseEvent) => {
                                        if (openRename()) event.preventDefault()
                                    }}
                                >
                                    <Content
                                        rename={props.rename}
                                        newName={newName}
                                        setNewName={setNewName}
                                        openRename={openRename}
                                        setOpenRename={setOpenRename}
                                        title={titles[i()]}
                                    />
                                </A>
                            </Match>
                            <Match when={!href()}>
                                <div
                                    class="grow"
                                    onClick={(event: MouseEvent) => {
                                        if (openRename()) event.preventDefault()
                                    }}
                                >
                                    <Content
                                        rename={props.rename}
                                        newName={newName}
                                        setNewName={setNewName}
                                        openRename={openRename}
                                        setOpenRename={setOpenRename}
                                        title={titles[i()]}
                                    />
                                </div>
                            </Match>
                        </Switch>

                        <Show
                            when={edit?.edit()}
                        >
                            <div class="flex flex-row">
                                <span class="flex select-none touch-none items-center grab-bars"><HiOutlineBars3 class="grab-bars-svg" /></span>
                                <button
                                    onClick={(event) => setAnchorElement(event.currentTarget)}
                                >
                                    <HiOutlineEllipsisVertical />
                                </button>
                                <Menu
                                    anchorEl={anchorElement()}
                                    open={Boolean(anchorElement())}
                                    onClose={handleClose}
                                >
                                    <MenuItem onClick={() => {
                                        handleClose();
                                        if (props.delete)
                                            props.delete(titles[i()].href ?? titles[i()].id)
                                    }}>Zbriši</MenuItem>
                                    <MenuItem onClick={() => {
                                        handleClose();
                                        if (props.rename) {
                                            setOpenRename(true)
                                            setNewName(titles[i()].id)
                                        }
                                    }}>Preimenuj</MenuItem>
                                </Menu>
                            </div>
                        </Show>
                    </AnimatedDiv>
                )
            }}</For>
        </div >
    )
}

type ContentType = {
    rename?: (old_title: string, new_title: string) => Promise<void>;
    newName: Accessor<string>;
    setNewName: Setter<string>;
    openRename: Accessor<boolean>;
    setOpenRename: Setter<boolean>;
    title: ItemType;
};

const Content: VoidComponent<ContentType> = (props) => {
    const editToggle = useEditToggle();

    const renameTitle = () => {
        if (props.rename)
            props.rename(props.title.id, props.newName())
        props.setOpenRename(false)
    }

    return (
        <Show
            when={editToggle?.edit() && props.openRename()}
            fallback={props.title.content}
        >
            <div class="flex flex-row">
                <TextField
                    inputProps={{
                        "onClick": (event: MouseEvent) => event.preventDefault(),
                        "onKeyUp": (event: KeyboardEvent) => {
                            if (event.key == "Enter") {
                                event.preventDefault();
                                renameTitle()
                                event.preventDefault();
                            }
                        }
                    }}
                    onChange={(name) => props.setNewName(name.target.value)}
                    label="New title"
                    size="small"
                    defaultValue={props.title.content}
                />
                <button
                    onClick={(event: MouseEvent) => {
                        event.preventDefault();
                        renameTitle();
                    }}
                    class="px-2">
                    <HiOutlineCheck size="20px" />
                </button>
            </div>
        </Show>
    )
}

function getSpringsProps(
    order: number[],
    active = false,
    originalIndex = 0,
    curIndex = 0,
    y = 0
) {
    const func = (index: number) => {
        let props;

        if (active && index === originalIndex) {
            props = {
                y: curIndex * TITLE_HEIGHT + y,
                scale: 1.1,
                zIndex: 1,
                shadow: 15,
                immediate: (key: string) => key === "zIndex",
                config: (key: string) => (key === "y" ? config.stiff : config.default)
            }
        }
        else {
            props = {
                y: order.indexOf(index) * TITLE_HEIGHT,
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

const AnimatedDiv = animated("div")

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

type SpringType = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scale: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    zIndex: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    shadow: any;
}