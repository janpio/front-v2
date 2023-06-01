"use client";
import { Session } from "next-auth";
import { Project } from "@/lib/models/project";
import "../../shared/css/dialog.css";
import { useState } from "react";
import AddUserToProject from "@/components/project/settings/add-user-to-project";
import LoadingSpinner from "../../shared/icons/loading-spinner";

export default function ProjectMembersSettings({
    session,
    project,
}: {
    session: Session | null;
    project: Project;
}) {
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState(project.members);

    const reloadMembers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/projects/${project.id}`);
            const projectResponse = await response.json();
            setMembers(projectResponse.members);
            setLoading(false);
        } catch (error) {
            setLoading(false);
        }
    };

    const removeMember = async (memberId: string, projectId: string) => {
        try {
            setLoading(true);
            const response = await fetch(
                `/api/projects/${project.id}/users/${memberId}`,
                {
                    method: "DELETE",
                },
            );
            const data = await response.json();
            reloadMembers();
            setLoading(false);
        } catch (error) {
            setLoading(false);
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
                        session={session}
                        project={project}
                        afterCreate={() => {
                            reloadMembers();
                        }}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <tbody>
                            {members.length > 0 &&
                                members.map((member) => {
                                    return (
                                        <tr
                                            className="bg-white dark:bg-gray-800"
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
                                                            <img
                                                                className="h-10 w-10 rounded-full"
                                                                src={
                                                                    member.image
                                                                }
                                                                alt=""
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                            ) : (
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 flex-shrink-0">
                                                            <img
                                                                className="h-10 w-10 rounded-full"
                                                                src={
                                                                    "/stuga-logo.png"
                                                                }
                                                                alt=""
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                            )}
                                            <th
                                                scope="row"
                                                className="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-white"
                                            >
                                                {member.name}
                                            </th>
                                            <td className="px-6 py-4">
                                                {member.email}
                                            </td>
                                            <td className="px-6 py-4">
                                                {member.id ===
                                                project.createdBy ? (
                                                    <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                                                        Crgiteator 💮
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800">
                                                        Collaborator
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center rounded-md border border-transparent bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                                    onClick={async () => {
                                                        removeMember(
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
            </div>
        </>
    );
}
