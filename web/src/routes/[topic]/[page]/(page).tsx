import { createShortcut } from "@solid-primitives/keyboard";
import { Button } from "solid-headless";
import { AiOutlineArrowLeft, AiOutlineArrowRight } from 'solid-icons/ai';
import type { VoidComponent, ParentComponent } from "solid-js";
import { mergeProps } from "solid-js";
import { createEffect, createSignal, Show } from "solid-js";
import type { RouteDataArgs } from "solid-start";
import { A, useNavigate, useParams, useRouteData } from "solid-start";
import { createServerData$ } from "solid-start/server";
import Header from "~/components/Header";
import { Tab, TabButton, TabButtonsContainer, TabsContext } from "~/components/Tabs";
import Providers, { AppShellContent, AppShellHeader, useEditToggle } from "~/layouts/Providers";
import styles from "./page.module.scss"
import MonacoEditor from "~/components/MonacoEditor";
import { prisma } from "~/server/db"

export function routeData({ params }: RouteDataArgs) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return createServerData$(async ([_, topicArg, pageArg], { request }) => {
        const topic = await prisma?.topic.findUnique({
            where: {
                title: topicArg
            }
        });

        const page_id = parseInt(pageArg);

        if (isNaN(page_id)) return null;
        if (!topic) return null;

        const page = await prisma?.page.findUnique({
            where: {
                topicId_id: {
                    id: page_id,
                    topicId: topic.id,
                }
            }
        });

        const page_count = await prisma?.page.count({
            where: {
                topicId: topic.id,
            }
        })

        // const user = await authenticator.isAuthenticated(request);

        return { page, user: null, page_count };
    }, {
        key: () => ["page", decodeURI(params.topic), decodeURI(params.page)]
    })
}

type ParamsType = {
    topic: string;
    page: string;
}

const PageNavbar: VoidComponent = () => {
    const page_data = useRouteData<typeof routeData>();
    const params = useParams<ParamsType>();
    const editToggle = useEditToggle();
    const [showEditor, setShowEditor] = createSignal(false);

    createEffect(() => {
        if (editToggle?.edit()) {
            setShowEditor(true)
        } else {
            setShowEditor(false)
        }
    })

    return (
        <Providers>
            <TabsContext defaultIndex={1}>{({ activeTab, setActiveTab }) => <>
                <TabButtonsContainer>
                    <TabButton
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        index={0}
                    >
                        Navbar
                    </TabButton>
                    <TabButton
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        index={1}
                    >
                        Page
                    </TabButton>
                    <TabButton
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        index={2}
                    >
                        Explanation
                    </TabButton>
                </TabButtonsContainer>
                <AppShellHeader>
                    <Header topic={decodeURI(params.topic)} user={page_data()?.user} />
                </AppShellHeader>
                <AppShellContent>
                    <Tab
                        activeTab={activeTab}
                        index={0}
                    >
                        Navbar
                    </Tab>
                    <Tab
                        activeTab={activeTab}
                        index={1}
                        hidden={showEditor()}
                    >
                        <Show when={page_data()?.page?.html}>
                            <div
                                class="flex justify-center"
                            >
                                <div
                                    class={styles.page_content}
                                    // eslint-disable-next-line solid/no-innerhtml
                                    innerHTML={page_data()?.page?.html}
                                />
                            </div>
                        </Show>
                        {/* <FileManager page={page_data()?.page ?? undefined} /> */}
                        <NavButtons
                            keyboard={false}
                            page_count={page_data()?.page_count ?? 0}
                        />
                    </Tab>
                    <Tab
                        activeTab={activeTab}
                        index={1}
                        hidden={!showEditor()}
                    >
                        <MonacoEditor
                            active={activeTab() == 1 && showEditor()}
                            user={page_data()?.user ?? undefined}
                        />
                        <NavButtons page_count={page_data()?.page_count ?? 0} />
                    </Tab>
                    <Tab
                        activeTab={activeTab}
                        index={2}
                    >
                        Explanation
                    </Tab>
                </AppShellContent>
            </>}</TabsContext>
        </Providers>
    )
}

type NavButtonsType = {
    page_count: number;
    keyboard?: boolean;
}

const NavButtons: VoidComponent<NavButtonsType> = (props) => {
    const merged = mergeProps({ keyboard: true }, props)
    const params = useParams<ParamsType>();
    const [pageId, setPageId] = createSignal(NaN);
    const [baseURL, setBaseURL] = createSignal("");
    const icon_size = "25px";
    const navigate = useNavigate();

    createEffect(() => {
        setBaseURL("/" + params.topic + "/")
        setPageId(parseInt(params.page));
    })

    createShortcut(
        ["ARROWLEFT"],
        () => {
            // TODO: doesn't work
            if (merged.keyboard && pageId() > 0) {
                navigate(baseURL() + (pageId() - 1))
            }
        },
        { preventDefault: true, requireReset: false }
    )

    createShortcut(
        ["ARROWRIGHT"],
        () => {
            if (merged.keyboard && pageId() < merged.page_count - 1) {
                navigate(baseURL() + (pageId() + 1))
            }
        },
        { preventDefault: true, requireReset: false }
    )

    return (
        <div
            class="w-full flex my-10 justify-items-end"
            classList={{
                "justify-end": pageId() <= 0,
                "justify-around": pageId() > 0,
            }}
        >
            <Show when={pageId() > 0}>
                <IconButton>
                    <A href={baseURL() + (pageId() - 1)}>
                        <AiOutlineArrowLeft size={icon_size} />
                    </A>
                </IconButton>
            </Show>
            <Show when={pageId() < merged.page_count - 1}>
                <IconButton>
                    <A href={baseURL() + (pageId() + 1)}>
                        <AiOutlineArrowRight size={icon_size} />
                    </A>
                </IconButton>
            </Show>
        </div>
    )
}

const IconButton: ParentComponent = (props) => {
    return (
        <Button
            class="text-slate-600 hover:bg-slate-50 rounded-md"
        >
            {props.children}
        </Button>
    )
}

export default PageNavbar