"use client";
import { Session } from "next-auth";
import React, { useEffect, useState } from "react";
import { Project } from "@/lib/models/project";
import { useRouter } from "next/navigation";
import { ContainerApplication } from "@/lib/models/containers/container-application";
import { toastEventEmitter } from "@/lib/event-emitter/toast-event-emitter";
import { LoadingSpinner } from "@/components/shared/icons";
import { ContainerNamespace } from "@/lib/models/containers/container-namespace";
import Image from "next/image";
import ContainerCard from "@/components/services/containers/container-card";

export default function ContainerList({
    session,
    projectId,
}: {
    session: Session | null;
    projectId: string;
}) {
    const user = session?.user;
    const router = useRouter();
    const [project, setProject] = useState<Project | null>(null);
    const [namespace, setNamespace] = useState<ContainerNamespace | null>(null);
    const [containers, setContainers] = useState<ContainerApplication[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const getProject = async (projectId: string) => {
        try {
            const res = await fetch(`/api/projects/${projectId}`);
            return await res.json();
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (!projectId) return;
        setLoading(true);
        getProject(projectId)
            .then((foundProject) => {
                setProject(foundProject);
                setLoading(false);
            })
            .catch((error) => {
                toastEventEmitter.emit("pop", {
                    type: "danger",
                    message:
                        "error when try to get project in containers list page",
                    duration: 2000,
                });
                console.error(
                    "error when try to get project in containers list page",
                    error,
                );
                setLoading(false);
            });
    }, [projectId]);

    const getContainers = async (projectId: string) => {
        try {
            const res = await fetch(
                `/api/projects/${projectId}/services/containers/namespace`,
            );
            return await res.json();
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        setLoading(true);
        getContainers(projectId)
            .then((foundContainerNamespace) => {
                setNamespace(foundContainerNamespace);
                setContainers(foundContainerNamespace.applications);
                setLoading(false);
            })
            .catch((error) => {
                toastEventEmitter.emit("pop", {
                    type: "danger",
                    message:
                        "error when try to get container namespace in containers list page",
                    duration: 2000,
                });
                console.error(
                    "error when try to get container namespace in containers list page",
                    error,
                );
                setLoading(false);
            });
    }, []);

    return (
        <div className="z-10 flex w-full flex-col items-center justify-center">
            <div className=" w-4/5">
                {loading && (
                    <div className="flex flex-col items-center justify-center">
                        <LoadingSpinner />
                    </div>
                )}
                {!loading && project && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h6 className="my-4 text-4xl font-bold text-gray-700 md:text-4xl">
                                {project.name}
                            </h6>
                        </div>
                        <a
                            // onClick={() =>
                            //     router.push(
                            //         `/projects/${project.id}/services/containers/new`,
                            //     )
                            // }
                            href={`/projects/${project.id}/services/containers/new`}
                            className="Button stuga-primary-color"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 4v16m8-8H4"
                                ></path>
                            </svg>
                            New Container
                        </a>
                    </div>
                )}
                {!loading && (!containers || containers.length == 0) && (
                    <div className="flex h-[50vh] w-full items-center justify-center gap-2 border-2  border-dashed">
                        <Image
                            src="/stuga-logo.png"
                            alt="Description de l'image"
                            width="60"
                            height="60"
                        ></Image>
                        <div className="flex h-16 flex-col justify-center overflow-hidden text-sm">
                            <h5 className="text-2xl font-bold text-gray-500 md:text-2xl">
                                Create a new containerized application
                            </h5>
                            <p className="text-gray-500">
                                Deploy API, web apps, and databases and more
                            </p>
                        </div>
                    </div>
                )}
                {!loading && containers && containers.length > 0 && (
                    <div className="flex flex-col items-start justify-start">
                        {containers.map((container: ContainerApplication) => (
                            <div key={container.id} className="w-2/5">
                                <ContainerCard
                                    projectId={projectId}
                                    key={container.id}
                                    application={container}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
