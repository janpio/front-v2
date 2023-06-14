"use client";
import { Project } from "@/lib/models/project";
import "../../shared/css/dialog.css";
import { useEffect, useState } from "react";
import AddUserToProject from "@/components/project/settings/add-user-to-project";
import LoadingSpinner from "../../shared/icons/loading-spinner";
import Image from "next/image";
import { Member } from "@/lib/models/member";

export default function ProjectMembersSettings({
    project,
}: {
    project: Project;
}) {
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState<Member[]>([]);

    const reloadMembers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/projects/${project.id}`);
            const projectResponse = await response.json();
            console.log("projectResponse", projectResponse);
            setMembers(projectResponse.members);
            setLoading(false);
        } catch (error) {
            setLoading(false);
        }
    };

    useEffect(() => {
        reloadMembers();
    }, []);

    const removeMember = async (memberId: string, projectId: string) => {
        try {
            setLoading(true);
            await fetch(`/api/projects/${projectId}/users/${memberId}`, {
                method: "DELETE",
            });
            await reloadMembers();
            setLoading(false);
        } catch (error) {
            setLoading(false);
        }
    };

    const userRoleInProject = (userId: string) => {
        const foundMember = members.find((member) => member.id === userId);
        if (!foundMember)
            console.log(
                `User ${userId} is not a member of project ${project.id}`,
            );
        console.log(`User ${userId} role in project is ${foundMember?.role}`);
        return foundMember?.role;
    };

    const getUserBadge = (member: Member, project: Project) => {
        if (project.createdBy === member.id) {
            return (
                <span className="inline-flex rounded-full bg-green-100 px-2 text-center text-xs font-semibold leading-5 text-green-800">
                    Creator 💮
                </span>
            );
        } else if (userRoleInProject(member.id) === "ADMIN") {
            return (
                <span className="inline-flex rounded-full bg-yellow-100 px-2 text-center text-xs font-semibold leading-5 text-yellow-800">
                    Admin 🛡️
                </span>
            );
        } else {
            return (
                <span className="inline-flex rounded-full bg-blue-100 px-2 text-center text-xs font-semibold leading-5 text-blue-800">
                    Collaborator 🤝
                </span>
            );
        }
    };

    return (
        <>
            {loading && (
                <div className="fixed inset-0 flex items-center justify-center">
                    <LoadingSpinner />
                </div>
            )}
            <div className="flex w-4/5 flex-col justify-start">
                <div className="flex items-center gap-2 py-4">
                    <AddUserToProject
                        project={project}
                        afterAddedMember={async () => {
                            reloadMembers();
                        }}
                    />
                </div>
                {!loading && (
                    <div className="flex items-center gap-2">
                        <table className="w-full text-left text-sm text-gray-500">
                            <tbody>
                                {members.length > 0 &&
                                    members.map((member) => {
                                        return (
                                            <tr
                                                className="bg-white"
                                                key={member.id}
                                            >
                                                {/* User image */}
                                                {member.image ? (
                                                    <td
                                                        className="px-6 py-4"
                                                        key={member.id}
                                                    >
                                                        <div className="flex items-center">
                                                            <div className="h-10 w-10 flex-shrink-0">
                                                                <Image
                                                                    src={
                                                                        member.image
                                                                    }
                                                                    alt=""
                                                                    width={40}
                                                                    height={40}
                                                                    className="rounded-full"
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                ) : (
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <div className="h-10 w-10 flex-shrink-0">
                                                                <Image
                                                                    src={
                                                                        "/stuga-logo.png"
                                                                    }
                                                                    alt="Stuga logo"
                                                                    width={40}
                                                                    height={40}
                                                                    className="rounded-full"
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                )}
                                                <th
                                                    scope="row"
                                                    className="whitespace-nowrap px-6 py-4 font-medium text-gray-900"
                                                >
                                                    {member.name}
                                                </th>
                                                <td className="px-6 py-4">
                                                    {member.email}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getUserBadge(
                                                        member,
                                                        project,
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center rounded-md border border-transparent bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                                        onClick={async () => {
                                                            await removeMember(
                                                                member.id,
                                                                project.id,
                                                            );
                                                        }}
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
