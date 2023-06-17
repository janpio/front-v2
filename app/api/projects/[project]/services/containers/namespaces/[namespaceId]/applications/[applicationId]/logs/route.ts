import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { isConnected } from "@/lib/utils";
import ResponseService from "@/lib/next-response";
import { GetContainerApplicationByID } from "@/lib/services/containers/namespaces/find-container-application-by-id";
import { GetContainerApplicationLogsByID } from "@/lib/services/containers/namespaces/get-container-application-logs-by-id";

export async function GET(
    _req: NextRequest,
    {
        params,
    }: {
        params: { project: string; namespaceId: string; applicationId: string };
    },
) {
    const session = await getServerSession(authOptions);

    if (!isConnected(session)) {
        return ResponseService.unauthorized();
    }
    try {
        const projectId = params!.project;
        const namespaceId = params.namespaceId;
        const applicationId = params.applicationId;
        const userId = (session!.user! as any).id;

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                members: true,
                containerNamespaces: {
                    include: {
                        containers: {
                            include: {
                                namespace: true,
                            },
                        },
                    },
                },
            },
        });
        if (!project) {
            return ResponseService.notFound(
                `Project ${projectId} not found while getting application ${applicationId} logs`,
            );
        }

        if (!project.members.find((member) => member.userId === userId)) {
            return ResponseService.unauthorized(
                `User ${userId} is not a member of project ${projectId}`,
            );
        }

        const namespace = project.containerNamespaces.find(
            (namespace) => namespace.id === namespaceId,
        );
        if (!namespace) {
            return ResponseService.notFound(
                `Container namespace ${namespaceId} not found while getting application ${applicationId} logs in project ${projectId}`,
            );
        }

        const container = namespace.containers.find(
            (container) => container.id === applicationId,
        );
        if (!container) {
            return ResponseService.notFound(
                `Container ${applicationId} not found in namespace ${namespaceId} while getting application logs ${applicationId} in project ${projectId}`,
            );
        }

        const containerIdInAPI = container.idInAPI;
        const containerInAPI = await GetContainerApplicationByID(
            containerIdInAPI,
            userId,
        );
        if (!containerInAPI) {
            return ResponseService.notFound(
                `Container ${applicationId} not found in API while getting application ${applicationId} logs in project ${projectId}`,
            );
        }

        // Get logs
        const logs = await GetContainerApplicationLogsByID(
            containerIdInAPI,
            userId,
        );
        if (!logs) {
            return ResponseService.notFound(
                `Logs not found for container ${applicationId} in API while getting application ${applicationId} logs in project ${projectId}`,
            );
        }

        return ResponseService.success({
            logs: logs,
        });
    } catch (error) {
        console.error(
            `Error getting container logs of ${params.applicationId} in namespace ${params.namespaceId} in project ${params.project}:`,
            error,
        );
        return ResponseService.internalServerError();
    }
}
