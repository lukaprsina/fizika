import { createShortcut } from "@solid-primitives/keyboard";
import { Button } from "solid-headless";
import { HiOutlineArrowLeft, HiOutlineArrowRight } from 'solid-icons/hi';
import type { VoidComponent, ParentComponent } from "solid-js";
import { createResource, lazy } from "solid-js";
import { createEffect, createSignal, Show } from "solid-js";
import type { RouteDataArgs } from "solid-start";
import { A, useNavigate, useParams, useRouteData } from "solid-start";
import { createServerAction$, createServerData$ } from "solid-start/server";
import Header from "~/components/Header";
import { Tab, TabButton, TabButtonsContainer, TabsContext } from "~/components/Tabs";
import Providers, { AppShellContent, AppShellHeader, useEditToggle } from "~/layouts/Providers";
import styles from "./page.module.scss"
import { prisma } from "~/server/db"
import type { PreloadedPageType } from "~/components/Markdown";
import Markdown from "~/components/Markdown";
import type { Page as PageType } from "@prisma/client";
import { getSession } from "@solid-auth/base";
import { authOptions } from "~/server/auth";

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


export function routeData({ params }: RouteDataArgs) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return createServerData$(async ([_, topicArg, pageArg], { request }) => {
        const session = await getSession(request, authOptions);

        const topic = await prisma.topic.findUnique({
            where: {
                title: topicArg
            }
        });

        const page_id = parseInt(pageArg);

        if (isNaN(page_id)) throw new Error("No page id");
        if (!topic) throw new Error("No topic");

        const page_count = await prisma.page.count({
            where: {
                topicId: topic.id,
            }
        })

        // move this to resource shit
        const path = await prisma.topic.findUnique({
            where: {
                id: topic.id,
            },
            select: {
                path: true
            }
        })

        return { page_count, session }
    }, {
        key: () => ["page", decodeURIComponent(params.topic), decodeURIComponent(params.page)]
    })
}

type PageMarkdownType = {
    id: number,
    title: string | null,
    markdown: string,
} | undefined;

const [showEditor, setShowEditor] = createSignal(false);
const PageTab = () => {
    const navigate = useNavigate();
    const page_data = useRouteData<typeof routeData>();
    const params = useParams<ParamsType>();
    const editToggle = useEditToggle();

    createEffect(() => {
        const a = () => {
            if (!showEditor() && pageId() > 0) {
                navigate(baseURL() + (pageId() - 1))
            }
        }

        createShortcut(
            ["ARROWLEFT"],
            a,
            { preventDefault: true, requireReset: false }
        )
    })

    createEffect(() => {
        const a = () => {
            // props.page_count
            if (!showEditor() && pageId() < 99 - 1) {
                navigate(baseURL() + (pageId() + 1))
            }
        };

        createShortcut(
            ["ARROWRIGHT"],
            a,
            { preventDefault: true, requireReset: false }
        )
    })

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

    const [, get_page] = createServerAction$<{
        topic_title: string, page_id: number
    }, {
        page: PageMarkdownType,
        page_count: number,
        topic_uuid: string
    }>(
        async ({ topic_title, page_id }) => {
            const topic = await prisma.topic.findUnique({
                where: {
                    title: topic_title
                },
                select: {
                    id: true,
                    path: true,
                }
            });

            if (!topic) throw new Error("No topic")

            const page_count = await prisma.page.count({
                where: {
                    topicId: topic.id,
                }
            })

            if (typeof page_id != "number" || isNaN(page_id)) {
                return { page_count }
            }

            const page = await prisma.page.findUnique({
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

            return {
                page: page ?? undefined,
                page_count,
                topic_uuid: topic.path
            }
        });

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

            if (!pages) throw new Error("No pages")

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
    const [title, setTitle] = createSignal<string | undefined>();

    createEffect(() => {
        setTitle(page_resource()?.page?.title ?? undefined)
    })

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
                    username={page_data()?.session?.user?.name ?? undefined}
                    pageName={showEditor() ? title() : undefined}
                    setPageName={setTitle}
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
                    <div
                        class="w-full h-full flex justify-center"
                    >
                        <div class={`w-full flex justify-center ${styles.page_content}`}>
                            <Markdown
                                current={{
                                    id: pageId()!,
                                    markdown: page_resource()?.page?.markdown,
                                    title: title()
                                }}
                                preloaded={preloadedPages()}
                                topic_uuid={page_resource()?.topic_uuid}
                            />
                        </div>
                    </div>
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
                        id={pageId()!}
                        initial={page_resource()?.page?.markdown}
                        title={title()}
                        content={content}
                        setContent={setContent}
                        topic_uuid={page_resource()?.topic_uuid}
                    />
                    <NavButtons
                        keyboard={true}
                        page_count={page_data()?.page_count ?? 0}
                    />
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
    keyboard: boolean;
}

const [pageId, setPageId] = createSignal(NaN);
const [baseURL, setBaseURL] = createSignal("");
const NavButtons: VoidComponent<NavButtonsType> = (props) => {
    const params = useParams<ParamsType>();
    const icon_size = "25px";

    createEffect(() => {
        setBaseURL("/" + params.topic + "/")
        setPageId(parseInt(params.page));
    })

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
            <Show when={pageId() < props.page_count - 1}>
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