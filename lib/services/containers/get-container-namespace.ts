import { ContainerNamespace } from "@/lib/models/containers/container-namespace";
import axios from "axios";
import { FindContainerNamespaceError } from "@/lib/services/containers/errors/get-container-namespace.error";
import { GetContainersAPIInfo } from "@/lib/services/containers/get-containers-api-info";

export const FindContainerNamespaceByName = async (
    name: string,
    userId: string,
): Promise<ContainerNamespace | null> => {
    const containerAPIInfo = GetContainersAPIInfo();
    try {
        const namespace = await axios.get<{ namespaces: ContainerNamespace[] }>(
            `${containerAPIInfo.url}/namespaces?name=${name}&userId=${userId}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${containerAPIInfo.authToken}`,
                },
            },
        );
        return namespace.data.namespaces.length > 0
            ? namespace.data.namespaces[0]
            : null;
    } catch (e: any) {
        if (e.response.status === 404) {
            throw new FindContainerNamespaceError(
                `Namespace '${name}' not found`,
            );
        }
        if (e.response.status === 500) {
            throw new FindContainerNamespaceError(
                `Error getting namespace '${name}' : ${e.response.data.message}`,
            );
        }
        if (e.response.status === 403) {
            throw new FindContainerNamespaceError(
                `User with id '${userId}' is not authorized to get namespace '${name}'`,
            );
        }
        if (e.response.status === 401) {
            throw new FindContainerNamespaceError(
                `Not authorized to get namespace '${name}'`,
            );
        }

        throw new FindContainerNamespaceError(
            `Error getting namespace '${name}' : ${e}`,
        );
    }
};
