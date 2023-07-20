import { createShortcut } from "@solid-primitives/keyboard";
import { Button } from "solid-headless";
import { HiOutlineArrowLeft, HiOutlineArrowRight } from 'solid-icons/hi';
import type { VoidComponent, ParentComponent } from "solid-js";
import { createResource, lazy, mergeProps, onCleanup } from "solid-js";
import { createEffect, createSignal, Show } from "solid-js";
import type { RouteDataArgs } from "solid-start";
import { A, useNavigate, useParams, useRouteData } from "solid-start";
import { createServerAction$, createServerData$ } from "solid-start/server";
import Header from "~/components/Header";
import { Tab, TabButton, TabButtonsContainer, TabsContext } from "~/components/Tabs";
import Providers, { AppShellContent, AppShellHeader, useEditToggle } from "~/layouts/Providers";
import styles from "./page.module.scss"
import { prisma } from "~/server/db"
import { authOptions } from "~/server/auth";
import { getSession } from "@solid-auth/base";
import type { PreloadedPageType } from "~/components/Markdown";
import Markdown from "~/components/Markdown";
import type { Page as PageType } from "@prisma/client";

const MonacoEditor = lazy(() => import("~/components/MonacoEditor"));

export function routeData({ params }: RouteDataArgs) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return createServerData$(async ([_, topicArg, pageArg], { request }) => {
        const session = await getSession(request, authOptions);
        const result: {
            session: typeof session,
            page_count?: number,
            page?: PageType | null
        } = { session }

        const topic = await prisma.topic.findUnique({
            where: {
                title: topicArg
            }
        });

        const page_id = parseInt(pageArg);

        if (isNaN(page_id)) return result;
        if (!topic) return result;

        const page = await prisma.page.findUnique({
            where: {
                topicId_id: {
                    id: page_id,
                    topicId: topic.id,
                }
            }
        });

        const page_count = await prisma.page.count({
            where: {
                topicId: topic.id,
            }
        })

        result.page_count = page_count
        result.page = page

        return result;
    }, {
        key: () => ["page", decodeURIComponent(params.topic), decodeURIComponent(params.page)]
    })
}

type ParamsType = {
    topic: string;
    page: string;
}

const Page: VoidComponent = () => {
    return (
        <Providers>
            <PageTab />
        </Providers>
    )
}

const PageTab = () => {
    const page_data = useRouteData<typeof routeData>();
    const params = useParams<ParamsType>();
    const editToggle = useEditToggle();
    const [showEditor, setShowEditor] = createSignal(false);
    const [pageId, setPageId] = createSignal<number | undefined>(undefined);

    /* createEffect(() => {
        const handleBeforeUnload: (this: Window, ev: BeforeUnloadEvent) => boolean = e => {
            e.preventDefault();
            return true
        }

        addEventListener("beforeunload", handleBeforeUnload, { capture: true })

        onCleanup(() => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        });
    }) */

    createEffect(() => {
        setPageId(parseInt(params.page));
    })

    createEffect(() => {
        const edit_bool = editToggle?.edit()
        setShowEditor(Boolean(edit_bool))
    })

    const [, preload_pages] = createServerAction$(async ({ topic_title, page_ids }:
        { topic_title: string, page_ids: number[] }) => {
        const result: (PageType | null)[] = [];

        const topic = await prisma.topic.findUnique({
            where: {
                title: topic_title
            }
        });

        if (!topic) return result;

        const futures = [];
        for (const page_id of page_ids) {
            if (isNaN(page_id)) return result;

            const page_future = prisma.page.findUnique({
                where: {
                    topicId_id: {
                        id: page_id,
                        topicId: topic.id,
                    }
                },
                select: {
                    id: true,
                    title: true,
                    markdown: true,
                }
            });

            futures.push(page_future)
        }

        return await Promise.all(futures);
    });

    const [preloadedPages] = createResource<PreloadedPageType | undefined, number>(
        pageId,
        async (page_id) => {
            if (isNaN(page_id)) return;

            const pages = await preload_pages({
                topic_title: params.topic,
                page_ids: [page_id - 1, page_id + 1]
            })

            if (pages.length != 2) return;

            return {
                previous: pages[0] ?? undefined,
                next: pages[1] ?? undefined
            }
        }
    );

    const [, save_page] = createServerAction$(async ({ topic_title, page_id, new_markdown }:
        { topic_title: string, page_id: number, new_markdown: string }) => {
        const topic = await prisma.topic.findUnique({
            where: {
                title: topic_title
            }
        });

        if (!topic) return;

        prisma.page.update({
            data: {
                markdown: new_markdown
            },
            where: {
                topicId_id: {
                    topicId: topic.id,
                    id: page_id
                }
            }
        })
    });

    const getMarkdown: () => string = () => {

    }

    return (
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
                <Header
                    topic={decodeURIComponent(params.topic)}
                    name={page_data()?.session?.user?.name ?? undefined}
                    saveChanges={{
                        when: activeTab() == 1 && showEditor(),
                        callback: () => {
                            save_page({
                                topic_title: decodeURIComponent(params.topic),
                                page_id: parseInt(params.page),
                                new_markdown: getMarkdown()
                            })
                        }
                    }}
                />
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
                    <Show when={page_data()?.page?.markdown}>
                        <div
                            class="w-full h-full flex justify-center"
                        >
                            <div class={`overflow-scroll w-full flex justify-center ${styles.page_content}`}>
                                <Markdown
                                    current={{
                                        id: pageId()!,
                                        markdown: page_data()?.page?.markdown,
                                        title: page_data()?.page?.title ?? undefined
                                    }}
                                    preloaded={preloadedPages()}
                                />
                            </div>
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
                        initial={page_data()?.page?.markdown}
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
    )
}

type NavButtonsType = {
    page_count: number;
    keyboard?: boolean;
}

const NavButtons: VoidComponent<NavButtonsType> = (props) => {
    const [pageId, setPageId] = createSignal(NaN);
    const merged = mergeProps({ keyboard: true }, props)
    const params = useParams<ParamsType>();
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
                        <HiOutlineArrowLeft size={icon_size} />
                    </A>
                </IconButton>
            </Show>
            <Show when={pageId() < merged.page_count - 1}>
                <IconButton>
                    <A href={baseURL() + (pageId() + 1)}>
                        <HiOutlineArrowRight size={icon_size} />
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

export default Page