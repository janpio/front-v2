import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import NewContainerForm from "@/components/services/containers/create/new-container-form";
import { BreadcrumbItem } from "@/components/shared/breadcrumb";
import Nav from "@/components/layout/nav";
import { Suspense } from "react";
import UnAuthentified from "@/components/home/un-authentified";

export default async function ContainerNewNamespacePage({
    params,
}: {
    params: { project: string };
}) {
    const session = await getServerSession(authOptions);
    const projectId = params.project;

    const breadcrumbItems: BreadcrumbItem[] = [
        { text: "project", slug: `/projects/${projectId}` },
        {
            text: "containers",
            slug: `/projects/${projectId}/services/containers/`,
        },
        {
            text: "namespaces",
            slug: `/projects/${projectId}/services/containers/namespaces`,
        },
        {
            text: "new",
            slug: `/projects/${projectId}/services/containers/new`,
        },
    ];

    return (
        <>
            <Suspense fallback="...">
                <Nav session={session} breadcrumbItems={breadcrumbItems} />
            </Suspense>
            {session ? (
                <>
                    <div className="z-10 flex flex w-full flex-col">
                        <NewContainerForm
                            session={session}
                            projectId={projectId}
                        />
                    </div>
                </>
            ) : (
                <>
                    <UnAuthentified />
                </>
            )}
        </>
    );
}
