import { Button } from "solid-headless";
import type { Accessor, Component, JSX, ParentComponent, Setter } from "solid-js";
import { createSignal } from "solid-js";

export type TabsContextType = {
    defaultIndex?: number;
    children?: (properties: {
        activeTab: Accessor<number>,
        setActiveTab: Setter<number>,
    }) => JSX.Element;
}

export const TabsContext: Component<TabsContextType> = (props) => {
    const [activeTab, setActiveTab] = createSignal(props.defaultIndex ?? 0)

    return <>
        {props.children && props.children({
            activeTab,
            setActiveTab,
        })}
    </>
}

export type TabButtonsContainerType = {
    defaultIndex?: number;
}

export const TabButtonsContainer: ParentComponent<TabButtonsContainerType> = (props) => {
    return (
        <div class="bottom-0 bg-inherit text-white left-0 right-0 fixed z-40 flex justify-around">
            {props.children}
        </div>
    )
}

export type TabButtonType = {
    index: number;
    activeTab: Accessor<number>;
    setActiveTab: Setter<number>;
}

export const TabButton: ParentComponent<TabButtonType> = (props) => {
    return (
        <Button
            onClick={() => props.setActiveTab(props.index)}
            class="flex sticky flex-grow mb-[-2px] hover:bg-slate-50 dark:hover:bg-slate-800 items-center justify-center rounded-t-md z-0 box-border border-slate-300 border-b-2 hover:cursor-pointer"
            classList={{
                "border-sky-500": props.activeTab() == props.index,
            }}
        >
            {props.children}
        </Button>
    )
}

export type TabType = {
    activeTab: Accessor<number>;
    index: number;
    hidden?: boolean
};

export const Tab: ParentComponent<TabType> = (props) => {
    return (
        <div
            class="w-full h-full"
            hidden={props.activeTab() !== props.index || props.hidden}
        >
            {props.children}
        </div>
    )
}