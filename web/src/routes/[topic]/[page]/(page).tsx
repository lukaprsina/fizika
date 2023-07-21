import { createShortcut } from "@solid-primitives/keyboard";
import { Button } from "solid-headless";
import { HiOutlineArrowLeft, HiOutlineArrowRight } from 'solid-icons/hi';
import type { VoidComponent, ParentComponent } from "solid-js";
import { createResource, lazy, mergeProps } from "solid-js";
import { createEffect, createSignal, Show } from "solid-js";
import { A, useNavigate, useParams } from "solid-start";
import { createServerAction$ } from "solid-start/server";
import Header from "~/components/Header";
import { Tab, TabButton, TabButtonsContainer, TabsContext } from "~/components/Tabs";
import Providers, { AppShellContent, AppShellHeader, useEditToggle } from "~/layouts/Providers";
import styles from "./page.module.scss"
import { prisma } from "~/server/db"
import type { PreloadedPageType } from "~/components/Markdown";
import Markdown from "~/components/Markdown";
import type { Page as PageType } from "@prisma/client";

const MonacoEditor = lazy(() => import("~/components/MonacoEditor"));

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

    /*
    const [, get_page] = createServerAction$<(
        { topic_title, page_id }: { topic_title: string, page_id: number }
    ) => [string, number]> */

    /* {
            id: number,
            title: string | null,
            markdown: string,
        } | undefined */

    // Promise<(number | { id: number; title: string | null; markdown: string; } | null)[]>
    const [, get_page] = createServerAction$<{
        topic_title: string, page_id: number
    }, {
        page: string,
        page_count: number
    }>(
        async (properties) => {
            const topic = await prisma.topic.findUnique({
                where: {
                    title: properties.topic_title
                }
            });

            if (!topic) throw new Error("No topic")

            const page_count = await prisma.page.count({
                where: {
                    topicId: topic.id,
                }
            })

            const page = await prisma.page.findUnique({
                where: {
                    topicId_id: {
                        id: properties.page_id,
                        topicId: topic.id,
                    }
                },
                select: {
                    id: true,
                    title: true,
                    markdown: true,
                }
            });

            return {
                page: page ?? undefined,
                page_count
            }
        });

    // <{ id: number, markdown: string, title: string } | undefined, number>
    const [page_resource] = createResource(
        pageId,
        async (page_id) => {
            const res = await get_page({
                topic_title: decodeURIComponent(params.topic),
                page_id
            })

            return res
        }
    );

    createEffect(() => {
        console.log(page_resource())
    })

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

    const [content, setContent] = createSignal("");

    /* createResource
    get_page({
        topic_title: decodeURIComponent(params.topic),
        page_id: parseInt(params.page)
    }) */

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
                    name={"a"}
                    saveChanges={{
                        when: activeTab() == 1 && showEditor(),
                        callback: () => {
                            save_page({
                                topic_title: decodeURIComponent(params.topic),
                                page_id: parseInt(params.page),
                                new_markdown: content()
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
                    <Show when={page_resource()?.page?.id}>
                        <div
                            class="w-full h-full flex justify-center"
                        >
                            <div class={`overflow-scroll w-full flex justify-center ${styles.page_content}`}>
                                <Markdown
                                    current={{
                                        id: pageId()!,
                                        markdown: page_resource()?.page?.markdown,
                                        title: page_resource()?.page?.title ?? undefined
                                    }}
                                    preloaded={preloadedPages()}
                                />
                            </div>
                        </div>
                    </Show>
                    {/* <FileManager page={page_data()?.page ?? undefined} /> */}
                    <NavButtons
                        keyboard={false}
                        page_count={page_resource()?.page_count}
                    />
                </Tab>
                <Tab
                    activeTab={activeTab}
                    index={1}
                    hidden={!showEditor()}
                >
                    <MonacoEditor
                        active={activeTab() == 1 && showEditor()}
                        /* initial={page_data()?.page?.markdown}
                        title={page_data()?.page?.title ?? undefined}
                        id={page_data()!.page!.id} */
                        id={pageId()!}
                        initial={page_resource()?.page?.markdown}
                        title={page_resource()?.page?.title ?? undefined}
                        content={content}
                        setContent={setContent}
                    />
                    <NavButtons page_count={page_resource()?.page_count!} />
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