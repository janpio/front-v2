"use client";
import { Session } from "next-auth";
import React, { useEffect, useState } from "react";
import LoadingSpinner from "@/components/shared/icons/loading-spinner";
import { toastEventEmitter } from "@/lib/event-emitter/toast-event-emitter";
import { useRouter } from "next/navigation";
import { Project } from "@/lib/models/project";
import * as process from "process";
import { ContainerApplicationType } from "@/lib/models/containers/container-application-type";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { ScalingOptions } from "@/lib/models/containers/scaling-specifications";
import axios from "axios";
import { CreateContainerApplicationBody } from "@/lib/services/containers/create-container-application.body";
import { ContainerEnvironmentVariable } from "@/lib/models/containers/container-application-environment-variables";
import { ContainerApplicationSecret } from "@/lib/models/containers/container-application-secrets";
import { ContainerLimitUnit } from "@/lib/models/containers/container-application-specifications";
import { StugaError } from "@/lib/services/error/error";

interface Step {
    name: string;
    description: string;
    svgPath: any;
}

type AvailableRegistriesName = "Docker hub" | "Our private registry";

interface AvailableRegistriesInformation {
    name: AvailableRegistriesName;
    url: string;
}

const availableRegistries: AvailableRegistriesInformation[] = [
    {
        name: "Docker hub",
        url:
            process.env.NEXT_PUBLIC_DOCKER_HUB_URL || "missing docker hub url!",
    },
    {
        name: "Our private registry",
        url:
            process.env.NEXT_PUBLIC_PRIVATE_REGISTRY_URL ||
            "missing private registry url!",
    },
];

const findRegistryByName = (
    name: AvailableRegistriesName,
): AvailableRegistriesInformation => {
    if (availableRegistries.find((registry) => registry.name === name)) {
        return availableRegistries.find((registry) => registry.name === name)!;
    }
    toastEventEmitter.emit("pop", {
        type: "danger",
        message: `Registry ${name} not found`,
        duration: 5000,
    });
    return availableRegistries[0];
};

interface ApplicationCPULimit {
    value: number;
    unit: "mCPU" | "CPU";
}

interface ApplicationMemoryLimit {
    value: number;
    unit: "MB" | "GB";
}

export default function NewContainerForm({
    session,
    projectId,
}: {
    session: Session | null;
    projectId: string;
}) {
    const user = session?.user;
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [project, setProject] = useState({} as Project);
    // const [applicationNamespace, setApplicationNamespace] = useState<
    //     string | undefined
    // >(undefined);
    const [applicationName, setApplicationName] = useState<string | undefined>(
        undefined,
    );
    const [registry, setRegistry] = useState<AvailableRegistriesInformation>(
        findRegistryByName("Docker hub"),
    );
    const [applicationImage, setApplicationImage] = useState<string>("");
    const [applicationPort, setApplicationPort] = useState<number | undefined>(
        undefined,
    );
    const [applicationType, setApplicationType] =
        useState<ContainerApplicationType>("LOAD_BALANCED");
    const [
        applicationEnvironmentVariables,
        setApplicationEnvironmentVariables,
    ] = useState<ContainerEnvironmentVariable[]>([]);
    const [applicationSecrets, setApplicationSecrets] = useState<
        ContainerApplicationSecret[]
    >([]);

    const cpuLimitsChoices: ApplicationCPULimit[] = [
        { value: 70, unit: "mCPU" },
        { value: 140, unit: "mCPU" },
        { value: 280, unit: "mCPU" },
        { value: 560, unit: "mCPU" },
        { value: 1120, unit: "mCPU" },
        { value: 1680, unit: "mCPU" },
        { value: 2240, unit: "mCPU" },
    ];
    const memoryLimitsChoices: ApplicationMemoryLimit[] = [
        { value: 128, unit: "MB" },
        { value: 256, unit: "MB" },
        { value: 512, unit: "MB" },
        { value: 1024, unit: "MB" },
        { value: 2048, unit: "MB" },
        { value: 4096, unit: "MB" },
        { value: 8192, unit: "MB" },
    ];

    const [applicationCpuLimit, setApplicationCpuLimit] = useState<string>(
        cpuLimitsChoices[0].value.toString(),
    );
    useState<string>("");
    const [applicationMemoryLimit, setApplicationMemoryLimit] =
        useState<string>(memoryLimitsChoices[0].value.toString());

    const [isAutoscalingEnabled, setIsAutoscalingEnabled] =
        useState<boolean>(false);
    const [scalingSpecifications, setScalingSpecifications] =
        useState<ScalingOptions>("Manual");
    const [cpuUsageThreshold, setCpuUsageThreshold] = useState<number>(80);
    const [memoryUsageThreshold, setMemoryUsageThreshold] =
        useState<number>(80);
    const [replicas, setReplicas] = useState<number>(1);

    const [administratorEmail, setAdministratorEmail] = useState<
        string | undefined
    >(undefined);

    const router = useRouter();

    const handleNext = () => {
        setStep((prevStep) => prevStep + 1);
    };

    const handlePrevious = () => {
        setStep((prevStep) => prevStep - 1);
    };

    const stepsBase: Step[] = [
        {
            name: "Application name",
            description: "Enter your application name",
            svgPath: (
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
                ></path>
            ),
        },
        {
            name: "Image",
            description: "Set application image to deploy",
            svgPath: (
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                ></path>
            ),
        },
        {
            name: "Application port",
            description: "Enter port used by your application",
            svgPath: (
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                ></path>
            ),
        },
        {
            name: "Should your application be scalable ?",
            description: "Select your application type",
            svgPath: (
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
            ),
        },
        {
            name: "Container(s) specifications",
            description: "Set container(s) specifications (CPU & Memory)",
            svgPath: (
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 13.5V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 9.75V10.5"
                ></path>
            ),
        },
        {
            name: "Scalability Configuration",
            description: "Choose your application scalability configuration",
            svgPath: (
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z"
                ></path>
            ),
        },
        {
            name: "Environment variables",
            description: "Set environment variables",
            svgPath: (
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.745 3A23.933 23.933 0 003 12c0 3.183.62 6.22 1.745 9M19.5 3c.967 2.78 1.5 5.817 1.5 9s-.533 6.22-1.5 9M8.25 8.885l1.444-.89a.75.75 0 011.105.402l2.402 7.206a.75.75 0 001.104.401l1.445-.889m-8.25.75l.213.09a1.687 1.687 0 002.062-.617l4.45-6.676a1.688 1.688 0 012.062-.618l.213.09"
                ></path>
            ),
        },
        {
            name: "Secrets",
            description: "Set secrets",
            svgPath: (
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                ></path>
            ),
        },
        {
            name: "Administrator",
            description:
                "Set administrator email for scalability notifications",
            svgPath: (
                <path
                    strokeLinecap="round"
                    d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25"
                ></path>
            ),
        },
    ];

    const [steps, setSteps] = useState<Step[]>(stepsBase);

    useEffect(() => {
        if (applicationType === "SINGLE_INSTANCE") {
            setSteps(stepsBase.slice(0, 7).concat(stepsBase.slice(8)));
        } else {
            setSteps(stepsBase);
        }
    }, [applicationType]);

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
            .then((project) => {
                setProject(project);
                setLoading(false);
            })
            .catch((error) => {
                toastEventEmitter.emit("pop", {
                    type: "danger",
                    message:
                        "error when try to get project in new containerized application form",
                    duration: 2000,
                });
                console.error(
                    "error when try to get project in new containerized application form",
                    error,
                );
                setLoading(false);
                router.push(`/`);
            });
    }, [projectId]);

    const isApplicationNameAvailableInNamespace = () => {
        console.log(
            "TODO : Check if application name is available in applicationNamespace",
        );
    };
    const isNamespaceAvailable = () => {
        console.log(
            "TODO : Check if applicationNamespace is available or is user's one",
        );
    };

    const applicationNameUpdated = (e: any) => {
        setApplicationName(e.target.value);
        isApplicationNameAvailableInNamespace();
    };

    const stringInSubdomainRegex = new RegExp(
        "^[a-z0-9]([-a-z0-9]*[a-z0-9])?$",
    );

    const isApplicationNameValid = (
        applicationName: string | undefined,
    ): boolean => {
        return (
            applicationName == undefined ||
            (applicationName.length > 0 &&
                stringInSubdomainRegex.test(applicationName))
        );
    };

    const isPortValid = (port: number | undefined) => {
        return port == undefined || (port >= 1 && port <= 65535);
    };

    const validateEmail = (email: string): boolean => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    };

    const isEmailValid = (email: string | undefined) => {
        return email == undefined || (email.length > 0 && validateEmail(email));
    };

    const applicationImageUpdated = (e: any) => {
        setApplicationImage(e.target.value);
    };

    const handleEnvironmentVariableChange = (
        index: number,
        whereToChange: "name" | "value",
        value: string,
    ) => {
        const newEnvironmentVariables = [...applicationEnvironmentVariables];
        newEnvironmentVariables[index][whereToChange] = value;
        setApplicationEnvironmentVariables(newEnvironmentVariables);
    };
    const handleRemoveEnvironmentVariable = (index: number) => {
        const newEnvironmentVariables = [...applicationEnvironmentVariables];
        newEnvironmentVariables.splice(index, 1);
        setApplicationEnvironmentVariables(newEnvironmentVariables);
    };
    const handleAddEnvironmentVariable = () => {
        const newEnvironmentVariables = [...applicationEnvironmentVariables];
        newEnvironmentVariables.push({ name: "", value: "" });
        setApplicationEnvironmentVariables(newEnvironmentVariables);
    };

    const handleSecretChange = (
        index: number,
        whereToChange: "name" | "value",
        value: string,
    ) => {
        const newSecrets = [...applicationSecrets];
        newSecrets[index][whereToChange] = value;
        setApplicationSecrets(newSecrets);
    };
    const handleRemoveSecret = (index: number) => {
        const newSecrets = [...applicationSecrets];
        newSecrets.splice(index, 1);
        setApplicationSecrets(newSecrets);
    };
    const handleAddSecret = () => {
        const newSecrets = [...applicationSecrets];
        newSecrets.push({ name: "", value: "" });
        setApplicationSecrets(newSecrets);
    };

    const updateReplicas = (e: any) => {
        const removeFirstZeros = e.target.value.replace(/^0+/, "");
        const numberOfReplicas = parseInt(removeFirstZeros);
        setReplicas(numberOfReplicas);
    };

    const updateCpuUsageThreshold = (e: any) => {
        const removeFirstZeros = e.target.value.replace(/^0+/, "");
        const cpuUsageThreshold = parseInt(removeFirstZeros);
        setCpuUsageThreshold(cpuUsageThreshold);
    };

    const updateMemoryUsageThreshold = (e: any) => {
        const removeFirstZeros = e.target.value.replace(/^0+/, "");
        const memoryUsageThreshold = parseInt(removeFirstZeros);
        setMemoryUsageThreshold(memoryUsageThreshold);
    };

    const isReplicasValid = (replicas: number | undefined) => {
        return replicas == undefined || (replicas >= 1 && replicas <= 10);
    };

    const isCpuUsageThresholdValid = (
        cpuUsageThreshold: number | undefined,
    ): boolean => {
        return cpuUsageThreshold == undefined || cpuUsageThreshold >= 0;
    };

    const isMemoryUsageThresholdValid = (
        memoryUsageThreshold: number | undefined,
    ): boolean => {
        return memoryUsageThreshold == undefined || memoryUsageThreshold >= 0;
    };

    const handleKeyDown = (event: any) => {
        if (event.key === "Enter") {
            event.preventDefault();
        }
    };
    const handleSubmit = async (event: { preventDefault: () => void }) => {
        event.preventDefault();
        try {
            setLoading(true);
            // Query back to verify that the application and namespace are available
            console.log("Application CPU Limit : ", applicationCpuLimit);
            const createContainerApplicationBody: CreateContainerApplicationBody =
                {
                    name: applicationName!,
                    description: "",
                    zone: "",
                    image: applicationImage!,
                    port: applicationPort!,
                    applicationType: applicationType!,
                    environmentVariables: applicationEnvironmentVariables,
                    secrets: applicationSecrets,
                    containerSpecifications: {
                        cpuLimit: {
                            value: parseInt(applicationCpuLimit!),
                            unit: "mCPU",
                        }!,
                        memoryLimit: {
                            value: parseInt(applicationMemoryLimit!),
                            unit: ContainerLimitUnit.MB,
                        },
                    },
                    scalabilitySpecifications: {
                        replicas: replicas!,
                        memoryUsagePercentageThreshold: memoryUsageThreshold!,
                        cpuUsagePercentageThreshold: cpuUsageThreshold!,
                        isAutoScaled: isAutoscalingEnabled!,
                    },
                    administratorEmail: administratorEmail!,
                    userId: "",
                    namespaceId: "",
                };
            const createdContainer = await axios(
                `/api/projects/${projectId}/services/containers`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    data: createContainerApplicationBody,
                },
            );
            console.log("createdContainer", createdContainer);
            toastEventEmitter.emit("pop", {
                type: "success",
                message: "Application created",
                duration: 4000,
            });
            setLoading(false);
            router.push(
                `/projects/${projectId}/services/containers/${createdContainer.data.id}`,
            );
        } catch (error) {
            setLoading(false);
            console.log("Error while creating application", error);
            if (error instanceof StugaError) {
                toastEventEmitter.emit("pop", {
                    type: "danger",
                    message: error.message,
                    duration: 4000,
                });
            }
            toastEventEmitter.emit("pop", {
                type: "danger",
                message:
                    "Couldn't create application and namespace, try again or contact support",
                duration: 4000,
            });
        }
    };

    return (
        <>
            <div className="z-10 flex w-full flex-col items-center justify-center px-5">
                {/* Change interline with more space */}
                <h1 className="mb-2 text-center text-3xl font-extrabold leading-loose leading-relaxed tracking-tight text-gray-900 md:text-4xl lg:text-5xl">
                    Deploy your{" "}
                    <mark className="rounded bg-green-400 px-2 leading-relaxed text-white">
                        application
                    </mark>{" "}
                    in{" "}
                    <mark className="rounded bg-green-400 px-2 leading-relaxed text-white">
                        containers
                    </mark>
                </h1>

                <p
                    className="text-l lg:text-l pb-5 font-normal text-gray-500"
                    id="step-name"
                >
                    Deploy your applications, databases, and services in our
                    cloud in a few clicks.
                </p>
                {loading ? (
                    <div className="flex h-[10vh] items-center justify-center">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <form
                        onSubmit={handleSubmit}
                        onKeyDown={handleKeyDown}
                        className="flex w-11/12 flex-col py-10"
                    >
                        {/* Place stepper information on left side and form on right side */}
                        <div className="flex w-full flex-row items-start align-middle">
                            {/* Stepper information */}
                            <div className="w-3/10 flex flex-col pt-5">
                                <div>
                                    <ol className="relative border-l border-gray-200 text-gray-500 ">
                                        {steps.length <= 0 && (
                                            <div className="flex flex-col items-center justify-center">
                                                <p className="text-gray-500">
                                                    No steps found
                                                </p>
                                                <p className="text-gray-500">
                                                    Please add steps in the
                                                    configuration file
                                                </p>
                                            </div>
                                        )}
                                        {steps.length > 0 &&
                                            steps.map((stepItem, index) => (
                                                <a
                                                    className=""
                                                    key={index}
                                                    onClick={() => {
                                                        setStep(index + 1);
                                                    }}
                                                >
                                                    <li
                                                        key={index}
                                                        className={`mb-10 ml-6 ${
                                                            step === index + 1
                                                                ? "text-green-500"
                                                                : "text-gray-500"
                                                        }`}
                                                    >
                                                        <span
                                                            className={`absolute -left-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 ring-4 ring-white ${
                                                                step ===
                                                                index + 1
                                                                    ? "bg-green-200"
                                                                    : "bg-white"
                                                            }`}
                                                        >
                                                            {/* TODO Maybe display check if fields are validate in steps  ? */}
                                                            {/*{step === index + 1 ? (*/}
                                                            {/*    <svg*/}
                                                            {/*        aria-hidden="true"*/}
                                                            {/*        className="h-5 w-5 text-green-500 dark:text-green-400"*/}
                                                            {/*        fill="currentColor"*/}
                                                            {/*        viewBox="0 0 20 20"*/}
                                                            {/*        xmlns="http://www.w3.org/2000/svg"*/}
                                                            {/*    >*/}
                                                            {/*        <path*/}
                                                            {/*            fillRule="evenodd"*/}
                                                            {/*            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"*/}
                                                            {/*            clipRule="evenodd"*/}
                                                            {/*        />*/}
                                                            {/*    </svg>*/}
                                                            {/*) : (*/}
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                fill="white"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                                className="h-6 w-6 text-gray-500 dark:text-gray-400"
                                                            >
                                                                {
                                                                    stepItem.svgPath
                                                                }
                                                            </svg>
                                                            {/*)}*/}
                                                        </span>
                                                        <h3 className="font-medium leading-tight">
                                                            {index + 1} -{" "}
                                                            {stepItem.name}
                                                        </h3>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {
                                                                stepItem.description
                                                            }
                                                        </p>
                                                    </li>
                                                </a>
                                            ))}
                                    </ol>
                                </div>
                            </div>
                            {/* Form */}
                            <div className="flex w-full flex-col px-5">
                                <h4 className="py-4 text-2xl font-bold dark:text-white">
                                    <label
                                        htmlFor="name"
                                        className="mb-7 text-lg text-gray-700 md:text-3xl"
                                    >
                                        {steps[step - 1].name}
                                    </label>
                                </h4>

                                {step === 1 && (
                                    <div className="mb-10 ms-5 flex h-96 w-full flex-col">
                                        <div className="mb-2 ms-5 flex flex-col">
                                            {/*<div className="mb-2 flex flex-col">*/}
                                            {/*    <label*/}
                                            {/*        htmlFor="namespace"*/}
                                            {/*        className={*/}
                                            {/*            `pb-1 text-sm font-medium text-gray-700 dark:text-white` +*/}
                                            {/*            (!isNamespaceValid(*/}
                                            {/*                applicationNamespace,*/}
                                            {/*            )*/}
                                            {/*                ? "gray-900 dark:text-white"*/}
                                            {/*                : "red-700 dark:text-red-500")*/}
                                            {/*        }*/}
                                            {/*    >*/}
                                            {/*        Namespace*/}
                                            {/*    </label>*/}
                                            {/*    <input*/}
                                            {/*        className={`bg-gray-40 mb-2 block w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-green-500 dark:focus:ring-green-500 ${*/}
                                            {/*            !isNamespaceValid(*/}
                                            {/*                applicationNamespace,*/}
                                            {/*            )*/}
                                            {/*                ? "border-red-500 bg-red-50 p-2.5 text-sm text-red-900 placeholder-red-700 focus:border-red-500 focus:ring-red-500 dark:border-red-500 dark:bg-gray-700 dark:text-red-500 dark:placeholder-red-500"*/}
                                            {/*                : ""*/}
                                            {/*        }`}*/}
                                            {/*        type="text"*/}
                                            {/*        value={applicationNamespace}*/}
                                            {/*        onChange={(e) => {*/}
                                            {/*            namespaceUpdated(e);*/}
                                            {/*        }}*/}
                                            {/*        placeholder="my-first-namespace"*/}
                                            {/*        required*/}
                                            {/*    />*/}
                                            {/*    {!isNamespaceValid(*/}
                                            {/*        applicationNamespace,*/}
                                            {/*    ) && (*/}
                                            {/*        <p className="text-sm text-red-500">*/}
                                            {/*            Please enter a valid*/}
                                            {/*            namespace.*/}
                                            {/*        </p>*/}
                                            {/*    )}*/}
                                            {/*</div>*/}
                                            <div className="mb-1 flex flex-col">
                                                <label
                                                    htmlFor="applicationName"
                                                    className={
                                                        `pb-1 text-sm font-medium text-gray-700 dark:text-white` +
                                                        (!isApplicationNameValid(
                                                            applicationName,
                                                        )
                                                            ? "gray-900 dark:text-white"
                                                            : "red-700 dark:text-red-500")
                                                    }
                                                >
                                                    Application Name
                                                </label>
                                                <input
                                                    className={`bg-gray-40 mb-2 block w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-green-500 dark:focus:ring-green-500 ${
                                                        !isApplicationNameValid(
                                                            applicationName,
                                                        )
                                                            ? "border-red-500 bg-red-50 p-2.5 text-sm text-red-900 placeholder-red-700 focus:border-red-500 focus:ring-red-500 dark:border-red-500 dark:bg-gray-700 dark:text-red-500 dark:placeholder-red-500"
                                                            : ""
                                                    }`}
                                                    type="text"
                                                    value={
                                                        applicationName || ""
                                                    }
                                                    onChange={(e) => {
                                                        applicationNameUpdated(
                                                            e,
                                                        );
                                                    }}
                                                    placeholder="my-first-application"
                                                />
                                                {!isApplicationNameValid(
                                                    applicationName,
                                                ) && (
                                                    <p className="text-sm text-red-500">
                                                        Please enter a valid
                                                        application name.
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-row items-center gap-2">
                                                <InfoCircledIcon />
                                                <p className="text-sm font-semibold text-gray-500">
                                                    The application name can
                                                    only contain alphanumeric
                                                    characters and hyphens.
                                                </p>
                                            </div>
                                            {applicationName &&
                                                // applicationNamespace &&
                                                isApplicationNameValid(
                                                    applicationName,
                                                ) && (
                                                    // isNamespaceValid(
                                                    //     applicationNamespace,
                                                    // ) &&
                                                    <div className="flex flex-col items-center gap-2">
                                                        {/* Recap of the final URL where the application will be available */}
                                                        <h4 className="pt-12 text-2xl font-bold dark:text-white">
                                                            Your application
                                                            will be available
                                                            at:
                                                        </h4>
                                                        <a
                                                            className="text-1xl font-semibold leading-normal text-blue-800 dark:text-white"
                                                            href={`https://${applicationName}.${project.name}.${process.env.NEXT_PUBLIC_BASE_CONTAINER_DOMAIN}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            https://
                                                            {applicationName}.
                                                            {project.name}.
                                                            {
                                                                process.env
                                                                    .NEXT_PUBLIC_BASE_CONTAINER_DOMAIN
                                                            }
                                                        </a>
                                                        <p className="text-sm font-semibold text-gray-500">
                                                            (This URL will be
                                                            available once you
                                                            have completed the
                                                            next steps)
                                                        </p>
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                )}
                                {step === 2 && (
                                    <div className="mb-10 ms-5 flex h-96 w-full flex-col">
                                        {/*    Remember that step 2 is concerning the docker image (or other registry) */}
                                        <div className="mb-2 ms-5 flex flex-col items-start">
                                            {/* Choice between docker and our private registry */}
                                            {/* Replace by using Flowbite Tailwind CSS */}
                                            <label
                                                htmlFor="image-registries"
                                                className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                            >
                                                Select a registry
                                            </label>
                                            <select
                                                id="image-registries"
                                                className="bg-gray-40 mb-2 block w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-green-500 dark:focus:ring-green-500"
                                                onChange={(e) => {
                                                    setRegistry(
                                                        findRegistryByName(
                                                            e.target
                                                                .value as AvailableRegistriesName,
                                                        ),
                                                    );
                                                }}
                                            >
                                                {availableRegistries.map(
                                                    (registry) => {
                                                        return (
                                                            <option
                                                                key={
                                                                    registry.name
                                                                }
                                                                value={
                                                                    registry.name
                                                                }
                                                            >
                                                                {registry.name}{" "}
                                                                ({registry.url})
                                                            </option>
                                                        );
                                                    },
                                                )}
                                            </select>
                                        </div>
                                        <div className="mb-2 ms-5 flex flex-col gap-1">
                                            <label
                                                htmlFor="image-name"
                                                className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                            >
                                                Image from {registry.name}
                                            </label>
                                            <input
                                                id="image-name"
                                                className={`bg-gray-40 mb-2 block w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-green-500 dark:focus:ring-green-500 ${!isApplicationNameValid(
                                                    applicationImage,
                                                )}`}
                                                type="text"
                                                value={applicationImage || ""}
                                                onChange={(e) => {
                                                    applicationImageUpdated(e);
                                                }}
                                                placeholder="organization/my-first-application:latest"
                                            />
                                            <div className="flex flex-row items-center gap-2">
                                                <InfoCircledIcon />
                                                <p className="text-sm font-semibold text-gray-500">
                                                    The image name must be in
                                                    the format{" "}
                                                    <code>
                                                        organization/my-first-application:latest
                                                    </code>
                                                </p>
                                            </div>
                                            {applicationImage &&
                                                applicationImage.length > 0 && (
                                                    <>
                                                        <h4 className="pt-8 text-2xl font-bold dark:text-white">
                                                            The used image is
                                                            at:
                                                        </h4>
                                                        <p className="text-1xl font-semibold leading-normal text-blue-800 dark:text-white">
                                                            <Link
                                                                href={
                                                                    registry.url +
                                                                    "/r/" +
                                                                    applicationImage
                                                                }
                                                                target="_blank"
                                                            >
                                                                {registry.url}
                                                                /r/
                                                                {
                                                                    applicationImage
                                                                }
                                                            </Link>
                                                        </p>
                                                    </>
                                                )}
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="mb-10 ms-5 flex h-96 w-full flex-col">
                                        <div>
                                            <p className="font-semi-bold pb-6 dark:text-white">
                                                We recommend you to define the
                                                port you have defined in the{" "}
                                                <code>$PORT</code> environment
                                                variable of your container.
                                            </p>

                                            <label
                                                htmlFor="port"
                                                // className="mb-2 block text-sm font-medium text-red-700 dark:text-red-500"
                                                className={
                                                    "mb-2 block text-sm font-medium" +
                                                    (isPortValid(
                                                        applicationPort,
                                                    )
                                                        ? "gray-900 dark:text-white"
                                                        : "red-700 dark:text-red-500")
                                                }
                                            >
                                                Port
                                            </label>
                                            <input
                                                id="port"
                                                type="number"
                                                className={`bg-gray-40 mb-2 block w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-green-500 dark:focus:ring-green-500 ${
                                                    !isPortValid(
                                                        applicationPort,
                                                    )
                                                        ? "border-red-500 bg-red-50 p-2.5 text-sm text-red-900 placeholder-red-700 focus:border-red-500 focus:ring-red-500 dark:border-red-500 dark:bg-gray-700 dark:text-red-500 dark:placeholder-red-500"
                                                        : ""
                                                }`}
                                                value={applicationPort || ""}
                                                onChange={(e: {
                                                    target: {
                                                        value: string;
                                                    };
                                                }) =>
                                                    setApplicationPort(
                                                        parseInt(
                                                            e.target.value,
                                                        ),
                                                    )
                                                }
                                                placeholder="3000"
                                                min="1" // Minimum port number
                                                max="65535" // Maximum port number
                                                required // Mark the field as required
                                            />
                                            {!isPortValid(applicationPort) ? (
                                                <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                                                    Please enter a valid port
                                                    number between 1 and 65535.
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                )}
                                {step === 4 && (
                                    <div className="mb-10 ms-5 flex h-96 w-full flex-col">
                                        <label
                                            htmlFor="application-type"
                                            className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                        >
                                            Application Type
                                        </label>
                                        <select
                                            id="application-type"
                                            className="bg-gray-40 mb-2 block w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-green-500 dark:focus:ring-green-500"
                                            value={applicationType}
                                            onChange={(e) =>
                                                setApplicationType(
                                                    e.target
                                                        .value as ContainerApplicationType,
                                                )
                                            }
                                        >
                                            <option value="SINGLE_INSTANCE">
                                                Single Instance
                                            </option>
                                            <option value="LOAD_BALANCED">
                                                Load Balanced
                                            </option>
                                        </select>
                                    </div>
                                )}
                                {step === 5 && (
                                    <div className="mb-10 ms-5 flex h-96 w-full flex-col">
                                        <label
                                            htmlFor="cpu-limit"
                                            className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                        >
                                            CPU Limit (milliCPU)
                                        </label>
                                        <select
                                            className="bg-gray-40 mb-2 block w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-green-500 dark:focus:ring-green-500"
                                            value={applicationCpuLimit}
                                            onChange={(e) =>
                                                setApplicationCpuLimit(
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            {cpuLimitsChoices.map((choice) => (
                                                <option
                                                    key={choice.value}
                                                    value={`${choice.value}${choice.unit}`}
                                                >
                                                    {choice.value} {choice.unit}
                                                </option>
                                            ))}
                                        </select>
                                        <label
                                            htmlFor="memory-limit"
                                            className="mb-2 mt-3 block text-sm font-medium text-gray-900 dark:text-white"
                                        >
                                            Memory Limit (MB)
                                        </label>
                                        <select
                                            className="bg-gray-40 mb-2 block w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-green-500 dark:focus:ring-green-500"
                                            value={applicationMemoryLimit}
                                            onChange={(e) =>
                                                setApplicationMemoryLimit(
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            {memoryLimitsChoices.map(
                                                (choice) => (
                                                    <option
                                                        key={choice.value}
                                                        value={`${choice.value}${choice.unit}`}
                                                    >
                                                        {choice.value}{" "}
                                                        {choice.unit}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </div>
                                )}
                                {step === 6 &&
                                    applicationType === "LOAD_BALANCED" && (
                                        <>
                                            <div className="mb-6 ms-5 flex flex-col">
                                                <label className="relative inline-flex cursor-pointer items-center">
                                                    <input
                                                        type="checkbox"
                                                        onChange={() => {
                                                            setIsAutoscalingEnabled(
                                                                !isAutoscalingEnabled,
                                                            );
                                                        }}
                                                        className="peer sr-only"
                                                    />
                                                    <div className="peer-focus:ring-3 peer h-7 w-14 rounded-full bg-gray-200 after:absolute after:left-[4px] after:top-0.5 after:h-6 after:w-6 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-400 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-green-200 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-green-500"></div>
                                                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                                                        Enable autoscaling
                                                    </span>
                                                </label>
                                                {/* Display a message that explains the autoscaling feature */}
                                                {isAutoscalingEnabled && (
                                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                                        Your application will
                                                        automatically scale up
                                                        or down based on the CPU
                                                        and Memory usage and the
                                                        scaling specifications
                                                        you provide bellow.
                                                    </p>
                                                )}
                                                {!isAutoscalingEnabled && (
                                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                                        You will have to
                                                        manually scale your
                                                        application. We will
                                                        notify you when your
                                                        application is running
                                                        out of resources
                                                        according to the scaling
                                                        specifications you
                                                        provide bellow.
                                                    </p>
                                                )}
                                            </div>
                                            {scalingSpecifications && (
                                                <div className="mb-10 ms-5 flex flex-col">
                                                    <div className="mb-2 flex flex-col">
                                                        <label
                                                            htmlFor="replicas"
                                                            className={
                                                                "mb-2 block text-sm font-medium" +
                                                                (isReplicasValid(
                                                                    replicas,
                                                                )
                                                                    ? "gray-900 dark:text-white"
                                                                    : "red-700 dark:text-red-500")
                                                            }
                                                        >
                                                            Number of Replicas
                                                        </label>
                                                        <input
                                                            id="replicas"
                                                            type="number"
                                                            className={`bg-gray-40 mb-1 block w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-green-500 dark:focus:ring-green-500 ${
                                                                !isReplicasValid(
                                                                    replicas,
                                                                )
                                                                    ? "border-red-500 bg-red-50 p-2.5 text-sm text-red-900 placeholder-red-700 focus:border-red-500 focus:ring-red-500 dark:border-red-500 dark:bg-gray-700 dark:text-red-500 dark:placeholder-red-500"
                                                                    : ""
                                                            }`}
                                                            value={
                                                                replicas || ""
                                                            }
                                                            onChange={(e) => {
                                                                updateReplicas(
                                                                    e,
                                                                );
                                                            }}
                                                            placeholder="Enter Number of Replicas"
                                                            min="0"
                                                            max="10"
                                                            required
                                                        />
                                                        {!isReplicasValid(
                                                            replicas,
                                                        ) ? (
                                                            <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                                                                Please enter a
                                                                valid number
                                                                between 0 and
                                                                10.
                                                            </p>
                                                        ) : null}
                                                    </div>

                                                    <div className="mb-2 flex flex-col">
                                                        <label
                                                            htmlFor="cpuUsage"
                                                            className={
                                                                "mb-2 block text-sm font-medium" +
                                                                (isCpuUsageThresholdValid(
                                                                    cpuUsageThreshold,
                                                                )
                                                                    ? "gray-900 dark:text-white"
                                                                    : "red-700 dark:text-red-500")
                                                            }
                                                        >
                                                            CPU Usage Threshold
                                                            (%)
                                                        </label>
                                                        <input
                                                            id="cpuUsage"
                                                            type="number"
                                                            className={`bg-gray-40 mb-1 block w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-green-500 dark:focus:ring-green-500 ${
                                                                !isCpuUsageThresholdValid(
                                                                    cpuUsageThreshold,
                                                                )
                                                                    ? "border-red-500 bg-red-50 p-2.5 text-sm text-red-900 placeholder-red-700 focus:border-red-500 focus:ring-red-500 dark:border-red-500 dark:bg-gray-700 dark:text-red-500 dark:placeholder-red-500"
                                                                    : ""
                                                            }`}
                                                            value={
                                                                cpuUsageThreshold ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                updateCpuUsageThreshold(
                                                                    e,
                                                                )
                                                            }
                                                            placeholder="Enter CPU Usage Threshold"
                                                            min="0"
                                                            max="100"
                                                            required
                                                        />
                                                        {!isCpuUsageThresholdValid(
                                                            cpuUsageThreshold,
                                                        ) ? (
                                                            <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                                                                Please enter a
                                                                valid number
                                                                between 0 and
                                                                100.
                                                            </p>
                                                        ) : null}
                                                    </div>

                                                    <div className="mb-2 flex flex-col">
                                                        <label
                                                            htmlFor="memoryUsage"
                                                            className={
                                                                "mb-2 block text-sm font-medium" +
                                                                (isMemoryUsageThresholdValid(
                                                                    memoryUsageThreshold,
                                                                )
                                                                    ? "gray-900 dark:text-white"
                                                                    : "red-700 dark:text-red-500")
                                                            }
                                                        >
                                                            Memory Usage
                                                            Threshold (%)
                                                        </label>
                                                        <input
                                                            id="memoryUsage"
                                                            type="number"
                                                            className={`bg-gray-40 mb-1 block w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-green-500 dark:focus:ring-green-500 ${
                                                                !isMemoryUsageThresholdValid(
                                                                    memoryUsageThreshold,
                                                                )
                                                                    ? "border-red-500 bg-red-50 p-2.5 text-sm text-red-900 placeholder-red-700 focus:border-red-500 focus:ring-red-500 dark:border-red-500 dark:bg-gray-700 dark:text-red-500 dark:placeholder-red-500"
                                                                    : ""
                                                            }`}
                                                            value={
                                                                memoryUsageThreshold ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                updateMemoryUsageThreshold(
                                                                    e,
                                                                )
                                                            }
                                                            placeholder="Enter Memory Usage Threshold"
                                                            min="0"
                                                            max="100"
                                                            required
                                                        />
                                                        {!isMemoryUsageThresholdValid(
                                                            memoryUsageThreshold,
                                                        ) ? (
                                                            <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                                                                Please enter a
                                                                valid number
                                                                between 0 and
                                                                100.
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                {step === 7 && (
                                    <div className="mb-10 ms-5 flex min-h-96 w-full flex-col">
                                        <label
                                            htmlFor="environment-variables"
                                            className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                        >
                                            Environment Variables :
                                        </label>
                                        <div>
                                            {applicationEnvironmentVariables.map(
                                                (variable, index) => (
                                                    <div
                                                        key={index}
                                                        className="mb-2 flex items-center"
                                                    >
                                                        <input
                                                            type="text"
                                                            className="bg-gray-40 mb-2 block w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-green-500 dark:focus:ring-green-500"
                                                            placeholder="Key"
                                                            value={
                                                                variable.name ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                handleEnvironmentVariableChange(
                                                                    index,
                                                                    "name",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                        <span className="mx-2">
                                                            →
                                                        </span>
                                                        <input
                                                            type="text"
                                                            className="bg-gray-40 mb-2 block w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-green-500 dark:focus:ring-green-500"
                                                            placeholder="Value"
                                                            value={
                                                                variable.value ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                handleEnvironmentVariableChange(
                                                                    index,
                                                                    "value",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                        <button
                                                            className="Button stuga-red-color mx-3"
                                                            onClick={() =>
                                                                handleRemoveEnvironmentVariable(
                                                                    index,
                                                                )
                                                            }
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            className="Button stuga-primary-color w-fit"
                                            onClick={
                                                handleAddEnvironmentVariable
                                            }
                                        >
                                            Add Environment Variable
                                        </button>
                                    </div>
                                )}
                                {step === 8 && (
                                    <div className="mb-10 ms-5 flex h-96 w-full flex-col">
                                        <label
                                            htmlFor="application-secrets"
                                            className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                                        >
                                            Application Secrets
                                        </label>
                                        <div>
                                            {applicationSecrets.map(
                                                (secret, index) => (
                                                    <div
                                                        key={index}
                                                        className="mb-2 flex items-center"
                                                    >
                                                        <input
                                                            type="text"
                                                            className="bg-gray-40 mb-2 block w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-green-500 dark:focus:ring-green-500"
                                                            placeholder="Key"
                                                            value={
                                                                secret.name ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                handleSecretChange(
                                                                    index,
                                                                    "name",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                        <span className="mx-2">
                                                            →
                                                        </span>
                                                        <input
                                                            type="text"
                                                            className="bg-gray-40 mb-2 block w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-green-500 dark:focus:ring-green-500"
                                                            placeholder="Value"
                                                            value={
                                                                secret.value ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                handleSecretChange(
                                                                    index,
                                                                    "value",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                        <button
                                                            className="Button stuga-red-color mx-3"
                                                            onClick={() =>
                                                                handleRemoveSecret(
                                                                    index,
                                                                )
                                                            }
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            className="Button stuga-primary-color w-fit"
                                            onClick={handleAddSecret}
                                        >
                                            Add Secret
                                        </button>
                                    </div>
                                )}
                                {step === 9 && (
                                    <div className="mb-10 ms-5 flex h-96 w-full flex-col">
                                        <label
                                            htmlFor="admin-email"
                                            className={
                                                "mb-2 block text-sm font-medium" +
                                                (isEmailValid(
                                                    administratorEmail,
                                                )
                                                    ? "gray-900 dark:text-white"
                                                    : "red-700 dark:text-red-500")
                                            }
                                        >
                                            Administrator Email
                                        </label>
                                        <input
                                            type="email"
                                            id="admin-email"
                                            className={`bg-gray-40 mb-1 block w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-green-500 dark:focus:ring-green-500 ${
                                                !isEmailValid(
                                                    administratorEmail,
                                                )
                                                    ? "border-red-500 bg-red-50 p-2.5 text-sm text-red-900 placeholder-red-700 focus:border-red-500 focus:ring-red-500 dark:border-red-500 dark:bg-gray-700 dark:text-red-500 dark:placeholder-red-500"
                                                    : ""
                                            }`}
                                            value={administratorEmail || ""}
                                            onChange={(e) =>
                                                setAdministratorEmail(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="admin@example.com"
                                            required
                                        />

                                        {!isEmailValid(administratorEmail) ? (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                                                Please enter a valid email
                                                address.
                                            </p>
                                        ) : null}
                                    </div>
                                )}

                                <div className="flex justify-between">
                                    {step === 1 && (
                                        <button
                                            type="button"
                                            // onClick={}
                                            className="invisible"
                                        />
                                    )}
                                    {step > 1 && (
                                        <button
                                            type="button"
                                            onClick={handlePrevious}
                                            className="Button stuga-orange-color"
                                        >
                                            Previous
                                        </button>
                                    )}
                                    {step < steps.length && (
                                        <button
                                            type="button"
                                            onClick={handleNext}
                                            className="Button stuga-primary-color"
                                        >
                                            Next
                                        </button>
                                    )}
                                    {step === steps.length && (
                                        <button
                                            type="submit"
                                            className="Button stuga-primary-color"
                                        >
                                            Deploy application
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </>
    );
}